import unittest
from copy import deepcopy

from analyze import format_package, tomb_sources
from calendar_util import auto_pan
from chart_review import snapshot
from workflow import chart_header, event


class EventDetailTests(unittest.TestCase):
    def run_question(self, category, question, outcome='有可核对的新进展', **kwargs):
        return event('2026-07-01 02:10',category,question,outcome,city='上海',**kwargs)

    def test_same_chart_different_career_topics(self):
        job = self.run_question('事业官运','什么时间签约')
        promotion = self.run_question('事业官运','职称能否评上')
        self.assertEqual(job['盘头'], promotion['盘头'])
        self.assertEqual(job['分析']['scope']['主用神'], '开门')
        self.assertEqual(promotion['分析']['scope']['主用神'], '天辅')
        self.assertIn('天辅', promotion['分析']['symbols'])
        self.assertTrue(all('开门' not in item for item in promotion['分析']['detect']['veto']))

    def test_cash_and_profit_differ_in_signals_and_timing(self):
        debt = self.run_question('求财','问旧项目尾款','款项进账',horizon='本月月底')
        profit = self.run_question('求财','问新项目净利润','结算后有净利润')
        self.assertEqual(debt['分析']['scope']['主用神'],'伤门')
        self.assertEqual(profit['分析']['scope']['主用神'],'生门')
        self.assertEqual(debt['分析']['yingqi']['观察期限'],'本月月底')
        self.assertEqual(debt['分析']['yingqi']['应验事件'],'款项进账')
        self.assertEqual(debt['分析']['yingqi']['应期线索'],[])
        self.assertTrue(profit['分析']['yingqi']['应期线索'])
        self.assertNotIn('推荐取数', format_package(debt['分析']))

    def test_multi_topic_requires_selection(self):
        mixed = self.run_question('事业官运','签约顺利吗、职称呢')
        self.assertIsNone(mixed['问项资料']['主用神'])
        self.assertEqual(mixed['分析']['yingqi']['应期线索'],[])
        resolved = self.run_question('事业官运','签约顺利吗、职称呢',topic='求职签约')
        self.assertEqual(resolved['问项资料']['主用神'],'开门')

    def test_delegation_host_guest_and_urgency(self):
        args = {'roles':{'问者':'母亲','所测人':'女儿','对方':'用人方'},'stage':'等人事审批'}
        urgent = self.run_question('事业官运','求职',first_mover='本人',urgency='急',**args)['分析']['scope']
        gradual = self.run_question('事业官运','求职',first_mover='对方',urgency='缓',**args)['分析']['scope']
        self.assertEqual(urgent['角色'],'客=女儿，主=用人方')
        self.assertEqual(gradual['角色'],'客=用人方，主=女儿')
        self.assertIn('代问', urgent['代问说明'])
        self.assertEqual(urgent['主用神取象'][0][0],'神')
        self.assertEqual(gradual['主用神取象'][0][0],'门')

    def test_tomb_omission(self):
        r = event('2026-07-02 22:10','走失','问猫','找到猫',city='上海',primary='日干')['分析']
        self.assertTrue(r['detect']['rg_rumu'])
        ding = next(x for x in r['review'][8]['逐干'] if x['天盘干']=='丁')
        self.assertEqual(ding['墓库依据'], ['三奇入墓'])
        self.assertEqual(tomb_sources('丁',6), ['基础干墓'])
        self.assertEqual(tomb_sources('乙',2), ['基础干墓','三奇入墓'])
        self.assertTrue(any('丁临墓库地艮8，冲丑为未' in x for x in r['yingqi']['应期线索']))

    def test_zhishi_process_and_open_gate_control(self):
        s = self.run_question('事业官运','何时签合同')['分析']
        p = s['detect']['zhishi_quality']
        self.assertEqual(p['门宫关系'],'门迫')
        self.assertEqual(p['月令'],'休')
        self.assertIn('与主用神',p)
        s = event('2026-07-03 00:10','事业官运','问签约','签章',city='上海')['分析']
        self.assertIn('开门受制:门制',s['detect']['veto'])

    def test_invalid_bureau_has_readable_error(self):
        for ju in ['阳十局','五局','阴啥','阳0局']:
            with self.subTest(ju=ju), self.assertRaisesRegex(ValueError,'局式'):
                self.run_question('求财','旧款',ju=ju)

    def test_chart_snapshot_paths(self):
        d, info = auto_pan('2026-07-01 02:10',city='上海')
        data = snapshot(d,chart_header(d,info))
        matched = self.run_question('求财','旧款回款',screenshot=data)
        self.assertEqual(matched['截图核对']['状态'],'全部一致')
        self.assertIn('分析',matched)
        partial = deepcopy(data)
        partial['九宫']['坤2']['星'] = None
        checked = self.run_question('求财','旧款回款',screenshot=partial)
        self.assertEqual(checked['截图核对']['未读或未提供'],['坤2/星'])
        self.assertNotIn('分析',checked)
        partial['九宫']['坤2']['门'] = '杜门'
        checked = self.run_question('求财','旧款回款',screenshot=partial)
        self.assertEqual(checked['截图核对']['差异'],[
            {'位置':'坤2','字段':'门','截图':'杜门','引擎':'开门'}])
        self.assertNotIn('分析',checked)
        image_only = event(None,'求财','旧款回款','到账',screenshot=partial)
        self.assertEqual(image_only['截图核对']['状态'],'仅截图转录')
        self.assertNotIn('分析',image_only)
