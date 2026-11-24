"""时家奇门 v2.6 web adapter; the local user-supplied engine is authoritative."""
import json, math, os, re, sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'qimen_engine'))
from calendar_util import auto_pan
from workflow import event, lifetime, chart_header
from analyze import CATEGORY_SHEN, format_package, analyze, detect, gate_palace_relation
from pan_engine import pan
from event_scope import resolve_scope
from chart_review import compare_chart, snapshot
from original_cases import retrieve, safe_title, safe_point, safe_note

MAX_BYTES = 32768

def _text(data, name, required=False, maximum=200):
    value = data.get(name, '')
    if not isinstance(value, str) or len(value) > maximum: raise ValueError(f'{name}格式不正确或过长。')
    value = value.strip()
    if required and not value: raise ValueError('请填写所问事项和可观察结果。')
    return value

def _stamp(value, date_only=False):
    pattern = r'\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?' if date_only else r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}'
    if not isinstance(value, str) or not re.fullmatch(pattern, value): raise ValueError('时间格式不正确。')
    parsed = datetime.strptime(value, '%Y-%m-%d' if len(value)==10 else '%Y-%m-%d %H:%M')
    if not 1901 <= parsed.year <= 2099: raise ValueError('请输入 1901 至 2099 年的时间。')
    return value

def _calendar(data):
    solar = data.get('trueSolar', False)
    if not isinstance(solar, bool): raise ValueError('真太阳时选项无效。')
    lon = data.get('longitude')
    if solar:
        if isinstance(lon, bool) or not isinstance(lon, (int, float)) or not math.isfinite(lon) or not -180 <= lon <= 180:
            raise ValueError('启用真太阳时须提供 -180 至 180 的出生地或起局地经度。')
    else: lon = None
    zi = data.get('ziMode', 'change')
    if zi not in ('change', 'keep'): raise ValueError('子时换日选项无效。')
    ju = _text(data, 'manualJu', maximum=12) or None
    if ju and not re.fullmatch(r'[阴阳](?:遁)?[一二三四五六七八九1-9]局', ju): raise ValueError('手工局式格式示例：阴遁二局。')
    return dict(use_true_solar=solar, longitude=lon, zi_mode=zi, ju=ju)

def _cells(chart):
    snap = snapshot(chart, chart_header(chart, {'ju_name': ''}))['九宫']
    name_by_id = {1:'坎1',2:'坤2',3:'震3',4:'巽4',5:'中5',6:'乾6',7:'兑7',8:'艮8',9:'离9'}
    keying = detect(chart)['keying']
    return [dict(palace=p, star=snap[name_by_id[p]]['星'], gate=snap[name_by_id[p]]['门'],
                 god=snap[name_by_id[p]]['神'], heaven=snap[name_by_id[p]]['天盘'],
                 earth=snap[name_by_id[p]]['地盘'], void=snap[name_by_id[p]]['空'],
                 horse=snap[name_by_id[p]]['马'],
                 gateRelation=gate_palace_relation(snap[name_by_id[p]]['门'], p) if snap[name_by_id[p]]['门'] else None,
                 patterns=keying.get(name_by_id[p], {}).get('逐干', [])) for p in (4,9,2,3,5,7,8,1,6)]

def _time_note(opts):
    return ('北京时间，已按输入经度校正真太阳时' if opts['use_true_solar'] else '北京时间，未做真太阳时校正') + ('；23点换日' if opts['zi_mode']=='change' else '；0点换日')

def run_analysis(data):
    if not isinstance(data, dict): raise ValueError('请输入有效的分析资料。')
    mode = data.get('mode', 'event')
    if mode == 'cases':
        category = _text(data, 'category', maximum=20) or None
        technique = _text(data, 'technique', maximum=40) or None
        if category and category not in CATEGORY_SHEN: raise ValueError('案例类别无效。')
        symbols = data.get('symbols', [])
        if not isinstance(symbols, list) or len(symbols)>15 or any(not isinstance(x,str) or len(x)>30 for x in symbols): raise ValueError('案例符号格式无效。')
        got = retrieve(predict_cat=category, technique=technique, symbols=symbols)
        return {'mode':'cases', 'status':got.get('状态'), 'basis':got.get('检索依据',''), 'items':[
            {'id':r['id'],'title':safe_title(r),'point':safe_point(r),'note':safe_note(r),'basis':r.get('检索依据',''),'tags':r.get('tech',[])} for r in got.get('书例',[])]}
    opts = _calendar(data)
    if mode == 'chart':
        stamp = _stamp(data.get('time', ''))
        chart, info = auto_pan(stamp, **opts)
        if chart is None: raise ValueError('无法生成有效盘面。')
        return {'mode':'chart', 'version':'时家奇门 v2.6', 'header':chart_header(chart,info), 'cells':_cells(chart), 'timeConvention':_time_note(opts)}
    if mode == 'compare':
        stamp = _stamp(data.get('time',''))
        source = data.get('sourcePalace'); targets = data.get('targetPalaces')
        if source not in (1,2,3,4,6,7,8,9) or not isinstance(targets,list) or not 1 <= len(targets) <= 8 or any(p not in (1,2,3,4,6,7,8,9) for p in targets):
            raise ValueError('请选择有效的用神原宫和目标宫。')
        chart, info = auto_pan(stamp, **opts)
        if chart is None: raise ValueError('无法生成比较盘。')
        cells = {row['palace']: row for row in _cells(chart)}
        return {'mode':'compare','header':chart_header(chart,info),'timeConvention':_time_note(opts),'source':cells[source],
                'targets':[cells[p] for p in dict.fromkeys(targets)],
                'note':'按提供的原宫与目标宫并列星、门、神、干；转宫取象及生克裁决需结合事实人工复核。'}
    if mode == 'review':
        stamp = _stamp(data.get('time',''))
        transcription = data.get('transcription')
        if not isinstance(transcription, dict): raise ValueError('请先提供人工转录的盘面。')
        chart, info = auto_pan(stamp, **opts)
        if chart is None: raise ValueError('无法生成核对盘。')
        return {'mode':'review','review':compare_chart(transcription, snapshot(chart, chart_header(chart,info))), 'timeConvention':_time_note(opts)}
    if mode == 'lifetime':
        birth = _stamp(data.get('birth',''), True)
        order = data.get('order','九宫数序')
        if order not in ('九宫数序','地理顺时针'): raise ValueError('宫序无效。')
        compare = data.get('compareOrder', False)
        if not isinstance(compare,bool): raise ValueError('宫序比较选项无效。')
        gender = data.get('gender') or None
        if gender not in (None,'男','女'): raise ValueError('性别选项无效。')
        alt = ('地理顺时针' if order == '九宫数序' else '九宫数序') if compare else None
        result = lifetime(birth, order=order, compare_order=alt, gender=gender, **opts)
        if '分析' not in result: return {'mode':'lifetime','status':result}
        chart, _ = auto_pan(birth, **opts)
        focus = data.get('focus') or ''
        if focus and focus not in ('事业官运','求财','婚姻','健康'): raise ValueError('专项类别无效。')
        focus_report = format_package(analyze(chart, focus, gender=gender, year_life=chart['ygz'])) if focus else ''
        return {'mode':'lifetime','header':result['盘头'],'cells':_cells(chart),'timeConvention':_time_note(opts),
                'status':result['状态'], 'yearLife':result['出生年命'], 'order':result['宫序'], 'ageNote':result['年龄口径'],
                'stages':result['大运'],'orderComparison':result.get('宫序比较'), 'report':format_package(result['分析']),
                'focus':focus, 'focusReport':focus_report}
    if mode not in ('event', 'manual'): raise ValueError('分析模式无效。')
    stamp = _stamp(data.get('time','')) if mode == 'event' else None
    category = data.get('category')
    if not isinstance(category,str) or category not in CATEGORY_SHEN or category=='终身局': raise ValueError('请选择支持的事件类别。')
    question, outcome = _text(data,'question',True), _text(data,'outcome') or '未提供，待核'
    horizon, urgency, mover = _text(data,'horizon',maximum=80), data.get('urgency','待核'), data.get('firstMover','待核')
    if urgency not in ('急','缓','待核') or mover not in ('本人','对方','双方未动','同动','待核'): raise ValueError('急缓或行动顺序无效。')
    gender = data.get('gender') or None
    if gender not in (None,'男','女'): raise ValueError('性别选项无效。')
    year_life = _text(data,'yearLife',maximum=2) or None
    topic = _text(data,'topic',maximum=30) or None
    primary = _text(data,'primary',maximum=30) or None
    stage = _text(data,'stage',maximum=80) or None
    asker, subject = _text(data,'asker',maximum=30), _text(data,'subject',maximum=30)
    roles = {'问者':asker, '所测人':subject} if asker and subject else None
    kwargs = dict(**opts, urgency=urgency, first_mover=mover, horizon=horizon or None, gender=gender, year_life=year_life,
                  topic=topic, primary=primary, stage=stage, roles=roles, case_refs=True)
    if mode == 'manual':
        ganzhi = _text(data,'manualGanzhi',True,maximum=40)
        ju = opts.get('ju')
        if not ju: raise ValueError('手工起局需要明确阴阳遁和局数。')
        chart = pan(ganzhi, ju)
        if chart is None: raise ValueError('四柱格式无效，请按「丙午年 甲午月 丁卯日 丙午时」填写。')
        scope = resolve_scope(category,question,outcome,topic=topic,primary=primary,stage=stage,roles=roles,
                              urgency=urgency,first_mover=mover,horizon=horizon or None)
        analysis = analyze(chart,category,gender=gender,year_life=year_life,scope=scope)
        got = retrieve(predict_cat=category,symbols=list(analysis.get('locate',{}).get('shen',{}).keys()))
        case_info = {'说明':'同类书例仅供断法参照，不得套用结局','检索状态':got.get('状态','未知'),
                     '书例':[{'编号':r['id'],'标题':safe_title(r),'断法要点':safe_point(r),'检索依据':r.get('检索依据','')} for r in got.get('书例',[])]}
        package={'盘头':chart_header(chart,{'ganzhi':ganzhi,'ju_name':ju,'term':None}), '问项资料':scope,
                 '分析':analysis, '书例参照':case_info, '期限提示': '' if horizon else '未提供观察期限，应期只给候选线索。'}
        time_note = '手工四柱和局式；节气、真太阳时与换日须由输入者核对'
    else:
        package = event(stamp,category,question,outcome,**kwargs)
        chart, _ = auto_pan(stamp, **opts)
        if chart is None: raise ValueError('无法生成有效盘面。')
        time_note = _time_note(opts)
    return {'mode':mode,'version':'时家奇门 v2.6','timeConvention':time_note, 'header':package['盘头'],
            'scope':package['问项资料'],'timingNote':package.get('期限提示',''),'cells':_cells(chart),
            'cases':package.get('书例参照'), 'tendency':package['分析'].get('tendency'), 'report':format_package(package['分析'])}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length=int(self.headers.get('Content-Length','0'))
            if length<=0 or length>MAX_BYTES: raise ValueError('请求内容为空或过长。')
            data=json.loads(self.rfile.read(length).decode('utf-8'))
            if isinstance(data, dict) and data.get('mode') == 'interpret':
                from interpretation import interpret
                body=interpret(data.get('input'), run_analysis, os.environ.get('DEEPSEEK_API_KEY'))
            else:
                body=run_analysis(data)
            status=200
        except (ValueError, TypeError, UnicodeError, json.JSONDecodeError) as exc: status,body=400,{'error':str(exc) or '请求格式有误。'}
        except RuntimeError as exc: status,body=503,{'error':str(exc)}
        except Exception: status,body=500,{'error':'分析暂时不可用，请稍后重试。'}
        encoded=json.dumps(body,ensure_ascii=False).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(encoded)
