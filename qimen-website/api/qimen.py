"""时家奇门 v2.6 web endpoint: all data is calculated by the supplied engine."""
import json
import os
import re
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'qimen_engine'))
from calendar_util import auto_pan
from workflow import event
from analyze import CATEGORY_SHEN, format_package

MAX_BYTES = 8192

def run_analysis(data):
    if not isinstance(data, dict):
        raise ValueError('请输入有效的分析资料。')
    stamp = data.get('time', '')
    if not isinstance(stamp, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}', stamp):
        raise ValueError('时间须使用 YYYY-MM-DD HH:mm 格式。')
    parsed = datetime.strptime(stamp, '%Y-%m-%d %H:%M')
    if not 1901 <= parsed.year <= 2099:
        raise ValueError('请输入 1901 至 2099 年的时间。')
    category = data.get('category')
    if not isinstance(category, str) or category not in CATEGORY_SHEN or category == '终身局':
        raise ValueError('请选择支持的事件类别。')
    def field(name, required=False, maximum=200):
        value = data.get(name, '')
        if not isinstance(value, str) or len(value) > maximum:
            raise ValueError('输入内容格式不正确或过长。')
        value = value.strip()
        if required and not value:
            raise ValueError('请填写所问事项和可观察结果。')
        return value
    question = field('question', True)
    outcome = field('outcome', True)
    horizon = field('horizon', maximum=80)
    urgency = data.get('urgency', '待核')
    mover = data.get('firstMover', '待核')
    if urgency not in ('急', '缓', '待核') or mover not in ('本人', '对方', '双方未动', '同动', '待核'):
        raise ValueError('急缓或行动顺序无效。')
    # Website input explicitly uses Beijing civil time; do not silently apply true solar time.
    kwargs = dict(use_true_solar=False, urgency=urgency, first_mover=mover, horizon=horizon or None)
    package = event(stamp, category, question, outcome, **kwargs)
    chart, _ = auto_pan(stamp, use_true_solar=False)
    if chart is None:
        raise ValueError('无法生成有效盘面。')
    cells = []
    for palace in (4, 9, 2, 3, 5, 7, 8, 1, 6):
        cells.append({'palace': palace, 'star': chart['stars'].get(palace, ''),
                      'gate': chart['gates'].get(palace, ''), 'god': chart['gods'].get(palace, ''),
                      'heaven': chart['tp'].get(palace, []), 'earth': chart['gp'].get(palace, ''),
                      'void': palace in chart['void'], 'horse': palace == chart['horse']})
    return {'version': '时家奇门 v2.6', 'timeConvention': '北京时间，未做真太阳时校正；子时换日',
            'header': package['盘头'], 'scope': package['问项资料'],
            'timingNote': package.get('期限提示', ''), 'cells': cells,
            'report': format_package(package['分析'])}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > MAX_BYTES:
                raise ValueError('请求内容为空或过长。')
            data = json.loads(self.rfile.read(length).decode('utf-8'))
            body = run_analysis(data)
            status = 200
        except (ValueError, TypeError, UnicodeError, json.JSONDecodeError) as exc:
            status, body = 400, {'error': str(exc) or '请求格式有误。'}
        except Exception:
            status, body = 500, {'error': '分析暂时不可用，请稍后重试。'}
        encoded = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(encoded)
