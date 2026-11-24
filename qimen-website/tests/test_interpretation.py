import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'api'))
from qimen import run_analysis
from interpretation import interpret

PAYLOAD = {'mode':'event', 'time':'2026-06-22 12:00', 'category':'求财', 'question':'尾款能否收回？'}
TITLES = ('结论','盘面依据','不确定因素','应期与观察')

class Response:
    def __init__(self, sections): self.sections = sections
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self, size):
        content = json.dumps({'sections':self.sections}, ensure_ascii=False)
        return json.dumps({'choices':[{'message':{'content':content}}]},ensure_ascii=False).encode()

def sections(ref='E1'):
    return [{'title':title, 'text':'按盘面条件复核。', 'citations':[ref]} for title in TITLES]

class InterpretationTest(unittest.TestCase):
    def test_server_computes_evidence_and_returns_valid_citations(self):
        calls = []
        def open_mock(request, timeout):
            body = json.loads(request.data)
            calls.append(body)
            self.assertIn('尾款能否收回', body['messages'][1]['content'])
            return Response(sections())
        got = interpret(PAYLOAD, run_analysis, 'test-key', open_mock)
        self.assertEqual(got['sections'][0]['citations'], ['E1'])
        self.assertEqual(got['evidence'][0]['id'], 'E1')
        self.assertEqual(got['header'], run_analysis(PAYLOAD)['header'])
        self.assertEqual(len(calls), 1)
    def test_rejects_invented_evidence(self):
        with self.assertRaisesRegex(RuntimeError, '引用校验'):
            interpret(PAYLOAD, run_analysis, 'test-key', lambda req, timeout:Response(sections('E999999')))
    def test_rejects_missing_sections(self):
        with self.assertRaises(RuntimeError):
            interpret(PAYLOAD, run_analysis, 'test-key', lambda req, timeout:Response(sections()[:-1]))
    def test_requires_key_and_event(self):
        with self.assertRaisesRegex(RuntimeError, '尚未配置'): interpret(PAYLOAD, run_analysis, '')
        with self.assertRaises(ValueError): interpret({'mode':'chart'}, run_analysis, 'key')
