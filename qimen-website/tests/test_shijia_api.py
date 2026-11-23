import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'api'))
from qimen import run_analysis

BASE = {'time': '2026-06-22 12:00', 'category': '求财', 'question': '合同尾款能否回收', 'outcome': '收到尾款'}

class ApiTest(unittest.TestCase):
    def test_chart_and_prediction_share_v26(self):
        result = run_analysis(BASE)
        self.assertEqual(result['header']['ju_name'], '阴遁九局')
        self.assertEqual(result['header']['值使'], ('死门', '震3'))
        self.assertEqual(next(c for c in result['cells'] if c['palace'] == 3)['gate'], '死门')
        self.assertEqual(result['scope']['主用神'], '伤门')
        self.assertIn('【本问】', result['report'])
    def test_question_specific_scope(self):
        result = run_analysis({**BASE, 'category': '考试', 'question': '孩子考试通过吗', 'outcome': '考试通过'})
        self.assertEqual(result['scope']['主用神'], '时干')
    def test_rain_stopping_inverts(self):
        result = run_analysis({**BASE, 'category': '天气', 'question': '雨停转晴吗', 'outcome': '雨停转晴'})
        self.assertEqual(result['scope']['主用神'], '天蓬')
        self.assertTrue(result['scope']['评分反向'])
    def test_no_horizon_keeps_candidates(self):
        self.assertIn('未提供观察期限', run_analysis(BASE)['timingNote'])
    def test_bad_inputs_rejected(self):
        for change in ({'time': '2026-02-30 12:00'}, {'category': '终身局'}, {'question': ''}, {'firstMover': 'anything'}, {'time': '1800-01-01 12:00'}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                run_analysis({**BASE, **change})
if __name__ == '__main__':
    unittest.main()
