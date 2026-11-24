"""时家阳盘事件与出生盘入口，返回可复核的数据包。"""
from analyze import CATEGORY_SHEN, PALACE_NAME, analyze
from calendar_util import auto_pan
from event_scope import resolve_scope
from pan_engine import branch_palace, get_xun_head, void_map

PALACE_ORDERS = {
    '九宫数序': (1, 2, 3, 4, 6, 7, 8, 9),
    '地理顺时针': (1, 8, 3, 4, 9, 2, 7, 6),
}


def chart_header(d, info):
    head = get_xun_head(d['hgz'])
    return dict(info, 体系='时家阳盘转盘拆补', 旬首=head, 旬空地支=void_map[head],
                值符=(d['zhifu_star'], PALACE_NAME[d['zf_pal']]),
                值使=(d['zhishi_gate'], PALACE_NAME[d['zs']]))


def event(stamp, category, question, outcome, *, parties=None, year_life=None, gender=None,
          topic=None, roles=None, first_mover=None, urgency=None, stage=None, horizon=None,
          primary=None, screenshot=None, case_refs=False, **calendar):
    """outcome 是可观察的事件，例如收到签章合同。
    case_refs=True 时附『书例参照』：同类《神奇之门》书例的断法范本，仅供校准用神与读象，
    不得直接套用其结局；当前盘结论一律以 analyze 数据包为准。"""
    if category not in CATEGORY_SHEN or category == '终身局':
        raise ValueError('请选事件类别：' + '、'.join(k for k in CATEGORY_SHEN if k != '终身局'))
    if not question.strip() or not outcome.strip():
        raise ValueError('先写所问事项和可观察的结果')
    scope = resolve_scope(category, question, outcome, topic=topic, parties=parties,
                          roles=roles, first_mover=first_mover, urgency=urgency,
                          stage=stage, horizon=horizon, primary=primary)
    result = {'模式':'事件局', '问题':question, '观察结果':outcome, '主客':parties or scope['角色'],
              '问项资料':scope}
    # V2.4 期限收集提示：horizon 缺省不阻断起局，但显式提醒补期限以激活应期层。
    if not (horizon and horizon.strip()) and horizon != '未提供':
        result['期限提示'] = ('未提供观察期限（horizon），应期层只给候选线索不落具体窗口；'
                            '若需应期，请补 horizon（如"本月底""7月31日前"）。')
    if stamp is not None:
        d, info = auto_pan(stamp, **calendar)
        if d is None:
            raise ValueError('请提供有阴阳遁及一至九局的有效局式')
        result['盘头'] = chart_header(d, info)
    elif screenshot is None:
        raise ValueError('需要起局时间或截图转录')
    if screenshot is not None:
        from chart_review import compare_chart, snapshot
        reference = snapshot(d, result['盘头']) if stamp is not None else None
        review = compare_chart(screenshot, reference)
        result['截图核对'] = review
        if review['状态'] != '全部一致':
            return result
    result['分析'] = analyze(d, category, gender=gender, year_life=year_life, scope=scope)
    if case_refs:
        note = '同类原著书例断法范本，仅校准用神/读象/应期，不得套用结局'
        try:
            from original_cases import retrieve, safe_note, safe_point, safe_title
            pkg = result['分析']
            syms = list(pkg['locate']['shen'].keys()) if pkg.get('locate') else []
            got = retrieve(predict_cat=category, symbols=syms)
            result['书例参照'] = {
                '说明': note,
                '检索状态': got.get('状态', '未知'),
                '检索依据': got.get('检索依据', ''),
                '事项域': got.get('事项域', []),
                '内容边界': '历史断语已摘要化；不输出伤亡、他人隐私、医疗结论、性别判断或现实时局指代',
                '书例': [{'编号': r['id'], '标题': safe_title(r), '匹配分': r['匹配分'],
                        '重合用神': r['重合用神'], '重合手法': r['重合手法'],
                        '事项域': r['domain'], '断法标签': r['tech'],
                        '检索依据': r['检索依据'],
                        '断法要点': safe_point(r), '口径标注': safe_note(r)} for r in got.get('书例', [])],
            }
        except ImportError as e:
            result['书例参照'] = {'说明': note, '检索状态': '书例模块不可用',
                                  '错误': f'{type(e).__name__}: {e}', '书例': []}
        except Exception as e:
            # 不再静默吞错：主分析仍可返回，但检索失败必须可见。
            result['书例参照'] = {'说明': note, '检索状态': '检索失败',
                                  '错误': f'{type(e).__name__}: {e}', '书例': []}
    return result


def stages(branch, order='九宫数序'):
    if order not in PALACE_ORDERS:
        raise ValueError('未知的大运宫序')
    cycle = PALACE_ORDERS[order]
    start = cycle.index(branch_palace[branch])
    return [{'年龄段':(15*i+1, 15*i+15), '宫':PALACE_NAME[cycle[(start+i)%8]]}
            for i in range(8)]


def lifetime(birth, *, order='九宫数序', compare_order=None, gender=None, **calendar):
    """年龄为本法分段序号；未知时辰只返回资料状态。"""
    from datetime import date
    import re
    birth = birth.strip()
    if re.fullmatch(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}', birth):
        y, m, d = map(int, re.split('[-/]', birth))
        date(y, m, d)
        return {'模式':'终身局', '状态':'出生时辰待核', '出生日期':birth,
                '待核':['出生时间范围、出生地和换日口径','暂缓时柱、局数、落宫及分期解释']}
    d, info = auto_pan(birth, **calendar)
    branch = d['ygz'][1]
    base = stages(branch, order)
    result = {'模式':'终身局','状态':'已排候选盘','出生记录':birth,
              '盘头':chart_header(d, info),'出生年命':d['ygz'],'起运宫':base[0]['宫'],
              '宫序':order,'年龄口径':'本法第1至120岁，每15岁一段；映射公历年份前须确认年龄计法',
              '大运':base,'分析':analyze(d, '终身局', gender=gender, year_life=d['ygz'])}
    if compare_order:
        other = stages(branch, compare_order)
        result['宫序比较'] = {'备选':compare_order, '差异阶段':[
            {'年龄段':a['年龄段'],'默认宫':a['宫'],'备选宫':b['宫']}
            for a,b in zip(base,other) if a['宫'] != b['宫']]}
    return result
