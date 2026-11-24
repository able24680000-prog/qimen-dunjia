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
    def test_event_question_without_observation(self):
        result = run_analysis({key: value for key, value in BASE.items() if key != 'outcome'})
        self.assertEqual(result['scope']['观察结果'], '未提供，待核')
        self.assertEqual(result['scope']['主用神'], '伤门')
        self.assertIn('倾向', result['tendency'])
        self.assertIn('【成败倾向结论】', result['report'])

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

class ExpandedApiTest(unittest.TestCase):
    def test_lifetime_without_hour_stops(self):
        result = run_analysis({'mode':'lifetime','birth':'1990-01-01'})
        self.assertEqual(result['status']['状态'], '出生时辰待核')
        self.assertNotIn('header', result)
    def test_lifetime_with_comparison_and_focus(self):
        result = run_analysis({'mode':'lifetime','birth':'1990-01-01 12:00','compareOrder':True,'focus':'事业官运'})
        self.assertEqual(len(result['stages']), 8)
        self.assertEqual(result['focus'], '事业官运')
        self.assertTrue(result['orderComparison']['差异阶段'])
        self.assertTrue(result['focusReport'])
    def test_solar_time_requires_longitude(self):
        with self.assertRaises(ValueError): run_analysis({**BASE,'trueSolar':True})
        result = run_analysis({**BASE,'trueSolar':True,'longitude':121.47})
        self.assertTrue(result['header']['use_true_solar'])
        self.assertEqual(result['header']['longitude'],121.47)
    def test_review_preserves_unknown_and_flags_differences(self):
        result=run_analysis({'mode':'review','time':BASE['time'],'transcription':{'盘头':{'局式':'阳遁一局'}}})
        self.assertEqual(result['review']['状态'],'存在差异')
        self.assertGreater(len(result['review']['未读或未提供']),0)
        self.assertEqual(result['review']['差异'][0]['字段'],'局式')
    def test_case_search_and_safe_summary(self):
        result=run_analysis({'mode':'cases','category':'求财'})
        self.assertEqual(result['status'],'命中')
        self.assertTrue(result['items'])
        self.assertIn('basis',result['items'][0])
    def test_comparison_uses_same_chart(self):
        result=run_analysis({'mode':'compare','time':BASE['time'],'sourcePalace':4,'targetPalaces':[1,6]})
        self.assertEqual(result['source']['palace'],4)
        self.assertEqual([x['palace'] for x in result['targets']],[1,6])
        self.assertIn('人工复核',result['note'])
    def test_manual_bureau_and_screenshot_partial(self):
        result=run_analysis({**BASE,'manualJu':'阴遁二局'})
        self.assertEqual(result['header']['ju_name'],'阴遁二局')
        self.assertEqual(result['header']['term'],None)
    def test_event_case_references(self):
        result=run_analysis(BASE)
        self.assertEqual(result['cases']['检索状态'],'命中')
        self.assertTrue(result['cases']['书例'])

class AdditionalCapabilitiesTest(unittest.TestCase):
    def test_manual_four_pillars(self):
        result = run_analysis({**BASE, 'mode':'manual','manualGanzhi':'丙午年 甲午月 丁卯日 丙午时','manualJu':'阴遁九局'})
        self.assertEqual(result['header']['值使'], ('死门','震3'))
        self.assertEqual(result['scope']['主用神'], '伤门')
    def test_manual_requires_bureau(self):
        with self.assertRaises(ValueError): run_analysis({**BASE,'mode':'manual','manualGanzhi':'丙午年 甲午月 丁卯日 丙午时'})
    def test_transcription_all_fields(self):
        from calendar_util import auto_pan
        from workflow import chart_header
        from chart_review import snapshot
        chart,info=auto_pan(BASE['time'],use_true_solar=False)
        reference=snapshot(chart,chart_header(chart,info))
        result=run_analysis({'mode':'review','time':BASE['time'],'transcription':reference})
        self.assertEqual(result['review']['状态'],'全部一致')
        self.assertEqual(result['review']['差异'],[])
    def test_solar_boundary_produces_distinct_hour_when_corrected(self):
        normal=run_analysis({**BASE,'time':'2026-07-11 21:02'})
        solar=run_analysis({**BASE,'time':'2026-07-11 21:02','trueSolar':True,'longitude':116.41})
        self.assertNotEqual(normal['header']['bazi']['hour'], solar['header']['bazi']['hour'])
    def test_casebook_original_and_feedback_separated(self):
        import tempfile, os
        from casebook import record, feedback, read_case
        with tempfile.TemporaryDirectory() as folder:
            db=os.path.join(folder,'cases.db')
            record(db,'1','事前判断',{'来源':'自测','盘面':'示例','问题':'回款','原断':'观察','可观察结果':'到账','观察窗口':'一周','失效条件':'未到账'})
            feedback(db,'f1','1','结果未知','未收到反馈','2026-06-30')
            item=read_case(db,'1')
            self.assertEqual(item['原始记录']['原断'],'观察')
            self.assertEqual(item['历次反馈'][0][1],'结果未知')
    def test_unmapped_case_is_explicit(self):
        result=run_analysis({'mode':'cases','category':'健康','technique':'不存在标签'})
        self.assertEqual(result['items'],[])
        self.assertNotEqual(result['status'],'命中')

class UnifiedPageTest(unittest.TestCase):
    def test_chart_only_matches_event_chart(self):
        chart = run_analysis({'mode':'chart','time':BASE['time']})
        event = run_analysis(BASE)
        self.assertEqual(chart['header'], event['header'])
        self.assertEqual(chart['cells'], event['cells'])
        self.assertNotIn('report', chart)
    def test_palace_patterns_use_v26_primary_earth_and_guest_stem(self):
        chart = run_analysis({'mode':'chart','time':BASE['time']})
        cells = {cell['palace']: cell for cell in chart['cells']}
        self.assertEqual(cells[2]['star'], '芮禽')
        self.assertEqual([(p['位置'], p['组合'], p['格局']) for p in cells[2]['patterns']],
                         [('本干','丙+丙','月奇悖师'), ('寄干','壬+丙','水蛇入火')])
        self.assertEqual(cells[5]['patterns'], [])
        self.assertEqual(cells[5]['earth'], ['壬'])

    def test_confirmed_sheng_gate_is_earth(self):
        from analyze import gate_wuxing
        from pan_engine import gate_wuxing as pan_gate_wuxing
        self.assertEqual(gate_wuxing['生门'], '土')
        self.assertEqual(pan_gate_wuxing['生门'], '土')
