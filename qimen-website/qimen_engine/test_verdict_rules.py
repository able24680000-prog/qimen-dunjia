# -*- coding: utf-8 -*-
"""V2.2 断语层回归：失败裁决口径 + 考试代测用神。"""
import unittest

from analyze import analyze, format_package
from event_scope import resolve_scope
from original_cases import by_id
from pan_engine import pan


class VerdictRulesTests(unittest.TestCase):
    def test_exam_delegation_uses_shigan(self):
        """代子女问学 → 主用神时干（子女），景门/丁奇入用神表。"""
        s = resolve_scope('考试', '孩子参加升学考试能否被录取', '收到通知书')
        self.assertEqual(s['问项'], '代子女问学')
        self.assertEqual(s['主用神'], '时干')
        self.assertIn('景门', s['用神'])
        self.assertIn('丁', s['用神'])

    def test_exam_self_uses_tianfu(self):
        """本人应考 → 主用神天辅，不误取时干。"""
        s = resolve_scope('考试', '我参加高考能否被录取', '收到通知书')
        self.assertEqual(s['主用神'], '天辅')
        self.assertNotEqual(s['主用神'], '时干')

    def test_old_debt_still_uses_shangmen(self):
        """旧款回收细分未被考试类新增破坏。"""
        s = resolve_scope('求财', '这笔欠款能否讨回', '如数收到欠款')
        self.assertEqual(s['主用神'], '伤门')

    def test_package_has_verdict_section(self):
        """数据包含成败裁决口径段，且声明盘眼不单独否决。"""
        c = by_id('15')
        d = pan(c['gz'], c['ju'])
        s = resolve_scope('求财', '这笔欠款能否讨回', '如数收到欠款')
        pkg = analyze(d, '求财', scope=s)
        text = format_package(pkg)
        self.assertIn('【成败裁决口径】', text)
        self.assertIn('不单独否决成败', text)
        self.assertIn('主用神生克', text)

    def test_wubuyu_level_kept_but_wording_softened(self):
        """五不遇时求财类仍 P0（兼容 selftest），但文案不再一刀切否决。"""
        c = by_id('15')
        d = pan(c['gz'], c['ju'])
        pkg = analyze(d, '求财', scope=resolve_scope('求财', '欠款能否讨回', 'x'))
        wu = [e for e in pkg['eye']['eyes'] if e['tag'] == '五不遇时']
        self.assertTrue(wu)
        self.assertEqual(wu[0]['level'], 'P0')
        self.assertIn('不单独否决成败', wu[0]['desc'])


class TopicRefinementTests(unittest.TestCase):
    """V2.3：8 类新增问项细分，主用神按 01-core §2.3 权威表。"""

    CASES = [
        ('婚姻', '我们分手后还能复合吗', '感情复合', '六合'),
        ('婚姻', '婚期定在下月能否领证', '婚嫁成事', '休门'),
        ('健康', '这个病情能否好转', '疾病转归', '天芮'),
        ('健康', '需要求医问药吗', '求医问药', '天心'),
        ('官司', '这场诉讼能否胜诉', '诉讼胜负', '开门'),
        ('官司', '双方能否庭外调解', '纠纷调解', '六合'),
        ('出行', '明天出差路程顺利吗', '出行安危', '日干'),
        ('出行', '下月搬家乔迁是否合适', '迁移搬家', '开门'),
        ('择吉', '本月开业哪天好', '开业择日', '时干'),
        ('择吉', '结婚日子选得好吗', '婚嫁择日', '时干'),
        ('天气', '明天降雨会停吗', '晴雨判断', '天英'),
        ('天气', '明天刮大风吗', '风雨判断', '天辅'),
        ('风水阳宅', '这套住宅入住吉凶', '阳宅吉凶', '生门'),
        ('风水阴宅', '这处墓地安葬是否安稳', '阴宅吉凶', '死门'),
    ]

    def test_all_eight_categories_refined(self):
        for cat, q, topic, main in self.CASES:
            with self.subTest(cat=cat, q=q):
                s = resolve_scope(cat, q, '观察')
                self.assertEqual(s['问项'], topic)
                self.assertEqual(s['主用神'], main)
                self.assertIn('01-core', s['取用依据'])

    def test_refined_symbols_all_locate(self):
        """细分主用神须能在盘中落宫，不得定位为 None。"""
        c = by_id('15')
        d = pan(c['gz'], c['ju'])
        for cat, q, _, main in self.CASES:
            with self.subTest(cat=cat, main=main):
                s = resolve_scope(cat, q, '观察')
                pkg = analyze(d, cat, scope=s)
                self.assertIsNotNone(pkg['locate']['shen'].get(main))

    def test_generic_question_still_falls_back(self):
        """未命中触发词的问题仍回退通用，不误取细分用神。"""
        s = resolve_scope('健康', '最近感觉如何', '观察')
        self.assertEqual(s['问项'], '通用')
        self.assertIn('通用用神', s['取用依据'])

    def test_question_rules_cover_twelve_categories(self):
        """12 个事件类别现均有问项细分规则。"""
        from event_scope import QUESTION_RULES
        expected = {'事业官运','求财','考试','走失','婚姻','健康','官司',
                    '出行','择吉','天气','风水阳宅','风水阴宅'}
        self.assertEqual(set(QUESTION_RULES.keys()), expected)


class HorizonAnchoringTests(unittest.TestCase):
    """V2.4：观察期限收集提示 + 应期期限锚定（不改既有线索语义）。"""

    def test_missing_horizon_surfaces_prompt(self):
        from workflow import event
        r = event('2026-11-23 15:46', '择吉', '本月开业哪天好', '顺利', city='上海')
        self.assertIn('期限提示', r)
        self.assertIn('horizon', r['期限提示'])
        self.assertNotIn('期限提示', event(
            '2026-11-23 15:46', '择吉', '本月开业哪天好', '顺利',
            horizon='12月10日前', city='上海'))

    def test_horizon_anchoring_four_states(self):
        from analyze import yingqi
        from pan_engine import pan
        from analyze import detect, wangshuai
        c = by_id('15')
        d = pan(c['gz'], c['ju'])
        det = detect(d, ganzhi=f"{d['ygz']}年 {d['mgz']}月 {d['rgz']}日 {d['hgz']}时")
        wang = wangshuai(d, det)
        focus = {'宫': {4}, '干': {}, '应验事件': 'x', '观察期限': '未提供'}
        y1 = yingqi(d, det, wang, focus=focus)
        self.assertIn('期限锚定', y1)
        self.assertIn('未设观察期限', y1['期限锚定'])
        focus2 = dict(focus, 观察期限='本月底')
        y2 = yingqi(d, det, wang, focus=focus2)
        self.assertIn('本月底', y2['期限锚定'])
        focus3 = {'宫': set(), '干': {}, '应验事件': 'x', '观察期限': '未提供'}
        y3 = yingqi(d, det, wang, focus=focus3)
        self.assertIn('两项须补', y3['期限锚定'])

    def test_format_package_shows_anchoring(self):
        from workflow import event
        from analyze import format_package
        t = format_package(event('2026-11-23 15:46', '健康', '病情能否好转',
                                 '指标正常', horizon='12月底', city='上海')['分析'])
        self.assertIn('期限锚定', t)
        self.assertIn('12月底', t)


class TendencyTests(unittest.TestCase):
    """V2.5：确定性成败倾向结论——基线可核验、健康病星反向、盘面固有不计入。"""

    def test_tendency_present_and_consistent(self):
        from workflow import event
        from analyze import format_package
        r = event('2026-11-23 15:49', '择吉', '本月开业哪天好', '顺利', city='上海')
        t = r['分析']['tendency']
        self.assertIn(t['倾向'], ('成', '败', '两可', '待核'))
        self.assertIsInstance(t['证据'], list)
        self.assertIn('成败倾向结论', format_package(r['分析']))

    def test_zeugi_strong_negative(self):
        """择吉时干落空+门迫+火入天罗 → 高信心败。"""
        from workflow import event
        t = event('2026-11-23 15:49', '择吉', '本月开业哪天好', '顺利', city='上海')['分析']['tendency']
        self.assertEqual(t['倾向'], '败')
        self.assertLessEqual(t['得分'], -3)
        self.assertTrue(any('落空' in e for e in t['证据']))

    def test_health_inverts_for_disease_star(self):
        """健康类天芮为病星：月令死休=病弱=对好转有利（反向）。"""
        from workflow import event
        t = event('2026-11-23 15:49', '健康', '病情能否好转', '指标正常', city='上海')['分析']['tendency']
        self.assertTrue(any('反向口径' in e for e in t['证据']))

    def test_fixed_pan_eye_not_scored(self):
        """标了盘面固有的 P2 相生盘眼不得进入倾向证据。"""
        from workflow import event
        t = event('2026-11-23 15:49', '出行', '出差能否成行', '成行', city='上海')['分析']['tendency']
        self.assertFalse(any('人与事相生' in e for e in t['证据']))


class V26BacktestFixTests(unittest.TestCase):
    """V2.6 金标准回测修复（依据 validate_verdicts.py 原著断法佐证）。"""

    def test_shen_sheng_rigan_counts(self):
        """案例19：主用神宫生日干宫（事来就我）必须计 +1（用案例19原盘）。"""
        import original_cases as oc
        from pan_engine import pan
        from analyze import analyze
        from event_scope import resolve_scope
        c = oc.by_id('19')
        scope = resolve_scope('走失', '身份证丢了能否找到', '物品找到', topic='物品遗失')
        pkg = analyze(pan(c['gz'], c['ju']), '走失', scope=scope)
        self.assertTrue(any('主用神宫生日干宫' in e for e in pkg['tendency']['证据']))

    def test_zoushi_fuyin_bonus(self):
        """寻物伏吟=物未动原地可寻，应计 +1 且不进否决列表（用案例19原盘）。"""
        import original_cases as oc
        from pan_engine import pan
        from analyze import analyze
        from event_scope import resolve_scope
        c = oc.by_id('19')
        scope = resolve_scope('走失', '身份证丢了能否找到', '物品找到', topic='物品遗失')
        pkg = analyze(pan(c['gz'], c['ju']), '走失', scope=scope)
        self.assertTrue(any('物未动原地可寻' in e for e in pkg['tendency']['证据']))

    def test_hunyin_yigeng_hecan(self):
        """婚姻通用类必须做乙庚宫合参；对冲/相克计负分。"""
        from workflow import event
        r = event('2026-11-23 15:49', '婚姻', '男方测婚姻能否维持', '双方关系维持', city='上海')
        t = r['分析']['tendency']
        self.assertTrue(any('乙庚' in e for e in t['证据']))

    def test_yuting_zhuanqing_invert(self):
        """雨停转晴：主用神取天蓬且评分反向；晴雨判断不再吞'雨停'触发词。"""
        from workflow import event
        r = event('2026-11-23 15:49', '天气', '仪式时段何时雨停', '如期雨停', city='上海')
        sc = r['问项资料']
        self.assertEqual(sc['问项'], '雨停转晴')
        self.assertEqual(sc['主用神'], '天蓬')
        self.assertTrue(sc['评分反向'])
        r2 = event('2026-11-23 15:49', '天气', '明天会不会下雨', '如预报降雨', city='上海')
        self.assertEqual(r2['问项资料']['问项'], '晴雨判断')
        self.assertFalse(r2['问项资料']['评分反向'])


if __name__ == '__main__':
    unittest.main()
