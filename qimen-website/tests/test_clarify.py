import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'api'))
from clarify import clarify

class Response:
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self, length):
        return json.dumps({'choices':[{'message':{'content':json.dumps({'questions':['尾款能否收回？'],'needs_confirmation':''},ensure_ascii=False)}}]},ensure_ascii=False).encode()

class ClarifyTest(unittest.TestCase):
    def test_returns_reviewable_question(self):
        self.assertEqual(clarify('尾款会不会收不回来？','test-key',opener=lambda req, timeout:Response())['questions'], ['尾款能否收回？'])
    def test_missing_key_is_explicit(self):
        with self.assertRaisesRegex(RuntimeError, '尚未配置'): clarify('尾款能收回吗', '')
    def test_rejects_empty_question(self):
        with self.assertRaises(ValueError): clarify('', 'key')
