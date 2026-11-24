"""Optional server-side DeepSeek question clarification; keys never reach the browser."""
import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

MAX_BYTES = 8192
SYSTEM = '''你是问句整理助手，不是预测者。把用户输入整理成最多五个相互独立、语义不变的问题，每行一个。每个问题应以正向事件为判断目标（例如“会不会收不回来”整理为“能否收回”）。不添加事实，不回答问题，不给出盘面或结论。若不能确定含义，在 needs_confirmation 中说明。仅输出 JSON 对象：{"questions":["..."],"needs_confirmation":"..."}。'''

def clarify(question, api_key, opener=urlopen):
    if not isinstance(question, str) or not question.strip() or len(question) > 600:
        raise ValueError('请输入不超过600字的问题。')
    if not api_key:
        raise RuntimeError('模型服务尚未配置，请手动将问题整理为正向、单一的问句。')
    payload = {'model': os.getenv('DEEPSEEK_MODEL', 'deepseek-chat'), 'messages': [{'role':'system','content':SYSTEM},{'role':'user','content':question.strip()}], 'response_format': {'type':'json_object'}, 'temperature':0, 'max_tokens':800}
    req = Request('https://api.deepseek.com/chat/completions', data=json.dumps(payload, ensure_ascii=False).encode(), headers={'Content-Type':'application/json','Authorization':'Bearer '+api_key}, method='POST')
    try:
        with opener(req, timeout=30) as response:
            data = json.loads(response.read(MAX_BYTES * 4))
        parsed = json.loads(data['choices'][0]['message']['content'])
        questions = parsed['questions']
        note = parsed.get('needs_confirmation', '')
        if not isinstance(questions,list) or not 1 <= len(questions) <= 5 or any(not isinstance(q,str) or not q.strip() or len(q)>120 or '\n' in q for q in questions) or not isinstance(note,str) or len(note)>300:
            raise ValueError('invalid response')
        return {'questions':[q.strip() for q in questions], 'note':note.strip()}
    except (HTTPError, URLError, TimeoutError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        raise RuntimeError('问题整理暂时不可用，请手动将问题整理为正向、单一的问句。') from None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length','0'))
            if length <= 0 or length > MAX_BYTES: raise ValueError('请求长度无效。')
            data = json.loads(self.rfile.read(length).decode('utf-8'))
            if not isinstance(data, dict): raise ValueError('请求格式无效。')
            result = clarify(data.get('question'), os.environ.get('DEEPSEEK_API_KEY'))
            status = 200
        except (ValueError, UnicodeError, json.JSONDecodeError) as exc:
            status, result = 400, {'error':str(exc)}
        except RuntimeError as exc:
            status, result = 503, {'error':str(exc)}
        body = json.dumps(result,ensure_ascii=False).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(body)
