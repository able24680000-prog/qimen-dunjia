"""原版可复现的反例与按十日干正例表独立校验的两个月样本。"""
import unittest
from datetime import datetime, timedelta

from analyze import analyze, detect, format_package
from calendar_util import auto_pan, auto_render


def sample(stamp, category='事业官运', **kwargs):
    chart, info = auto_pan(stamp, city='上海')
    return analyze(chart, category=category, ganzhi=info['ganzhi'], **kwargs)


class RevisionTests(unittest.TestCase):
    def test_mismatched_polarity(self):
        self.assertFalse(sample('2026-07-01 10:10')['detect']['wubuyu'])

    def test_all_720_hours(self):
        # 十个日干各配一个五不遇时干。独立预期，不复用引擎判断函数。
        hours = dict(zip('甲乙丙丁戊己庚辛壬癸', '庚辛壬癸甲乙丙丁戊己'))
        hits = 0
        for i in range(720):
            stamp = datetime(2026, 7, 1, 0, 10) + timedelta(hours=2*i)
            d, info = auto_pan(stamp.strftime('%Y-%m-%d %H:%M'), city='上海')
            actual = detect(d, info['ganzhi'])['wubuyu']
            expected = hours[d['rgz'][0]] == d['hgz'][0]
            self.assertEqual(actual, expected, str(stamp))
            hits += actual
        self.assertEqual(hits, 72)

    def test_companion_stem(self):
        result = sample('2026-07-12 04:10')
        self.assertIn({'gan':'戊','palace':3}, result['detect']['jixing'])
        self.assertFalse(result['detect']['rg_jixing'])
        self.assertIn('丁+', result['symbols']['日干']['组合'])
        self.assertIn('丁+', format_package(result))

    def test_year_life(self):
        result = sample('2026-07-11 21:50', year_life='甲子')
        self.assertEqual(result['detect']['year_life']['与日干'], '日干宫生年命宫')

    def test_invalid_date(self):
        with self.assertRaises(ValueError):
            auto_pan('2026-02-30 12:00', city='上海')

    def test_missing_hour(self):
        with self.assertRaises(ValueError):
            auto_pan('2026-07-11', city='上海')

    def test_unknown_longitude(self):
        self.assertIn('默认经度', auto_render('2026-07-11 21:50', city='未收录城市'))
        self.assertNotIn('默认经度', auto_render('2026-07-11 21:50', city='未收录城市', longitude=116))

    def test_all_element_directions(self):
        from analyze import palace_relation
        # 坎水、震木、离火、坤土、乾金按相生排列。
        ring = [1, 3, 9, 2, 6]
        for i, left in enumerate(ring):
            for offset, label in enumerate(('比和', '甲宫生乙宫', '甲宫克乙宫', '乙宫克甲宫', '乙宫生甲宫')):
                self.assertEqual(palace_relation(left, ring[(i+offset)%5], '甲宫','乙宫'), label)





class WorkflowTests(unittest.TestCase):
    def test_event_scope(self):
        from workflow import event
        data = ('2026-07-01 02:10',)
        job = event(*data, '事业官运','何时签约','双方签章',city='上海')
        loss = event(*data,'走失','有无线索','收到可核对的目击信息',city='上海')
        self.assertEqual(job['盘头'], loss['盘头'])
        self.assertIn('开门受制:空亡', job['分析']['detect']['veto'])
        self.assertFalse(loss['分析']['detect']['veto'])
        self.assertNotIn('事业约束候选',format_package(loss['分析']))
        self.assertIn('马星临时干宫', [e['tag'] for e in loss['分析']['eye']['eyes']])
        self.assertFalse(loss['分析']['body'])
        for p, row in loss['分析']['review'].items():
            self.assertEqual(len(row['角色']),len(set(row['角色'])))
            self.assertEqual(row['落空'], p in loss['分析']['detect']['void'])

    def test_date_only_lifetime(self):
        from workflow import lifetime
        self.assertNotIn('分析',lifetime('1990-05-20',city='上海'))
        with self.assertRaises(ValueError):
            lifetime('2026-02-30')

    def test_known_lifetime(self):
        from workflow import lifetime
        a = lifetime('1990-05-20 14:30',city='上海',compare_order='地理顺时针')
        self.assertEqual(a['大运'][0]['宫'],a['起运宫'])
        self.assertEqual(a['大运'][-1]['年龄段'],(106,120))
        self.assertEqual(len({r['宫'] for r in a['大运']}),8)
        self.assertTrue(a['宫序比较']['差异阶段'])
        self.assertEqual(a['出生年命'],a['分析']['detect']['year_life']['干支'])

    def test_case_history(self):
        import tempfile
        import sqlite3
        from pathlib import Path
        from casebook import record,feedback,read_case
        with tempfile.TemporaryDirectory() as root:
            db = Path(root)/'cases.db'
            base={'来源':'示例','盘面':'纸记编号1','问题':'何时签约','原断':'窗口内有消息',
                  '可观察结果':'收到可验证的消息','观察窗口':'11月1日至5日','失效条件':'截至5日无消息'}
            record(db,'A','事前判断',base)
            with self.assertRaises(sqlite3.IntegrityError):
                record(db,'A','事前判断',dict(base,原断='修订'))
            feedback(db,'A-1','A','未命中','截至5日无消息','11月5日')
            feedback(db,'A-2','A','未命中','11月8日才有消息','11月8日')
            self.assertEqual(read_case(db,'A')['原始记录'],base)
            self.assertEqual(len(read_case(db,'A')['历次反馈']),2)
            record(db,'B','核盘样本',{'来源':'书例','盘面':'四柱'})
            with self.assertRaises(ValueError):
                feedback(db,'B-1','B','命中','盘面一致','11月5日')

    def test_month_mapping_and_empty_tomb(self):
        from analyze import SEASON_BY_BRANCH, seasonal_grade
        self.assertEqual(SEASON_BY_BRANCH['申'],'秋')
        self.assertEqual(SEASON_BY_BRANCH['寅'],'春')
        self.assertEqual(seasonal_grade('土','未'),'旺')
        pkg=sample('2026-07-12 04:10')
        q=pkg['review'][3]
        self.assertEqual(q['角色'].count('日干'),1)
        self.assertEqual(q['月支'],'未')
        self.assertEqual([x['天盘干'] for x in q['逐干'] if x['击刑']],['戊'])
        for c in pkg['yingqi']['应期线索']:
            if '冲戌' in c:
                self.assertIn('为辰',c)
                self.assertNotIn('巳',c)

    def test_term_and_hour_edges(self):
        from calendar_util import term_dates_beijing
        y,m,d,h = term_dates_beijing(2026)['立春']
        hour=int(h)
        minute=int((h-hour)*60)
        _,info = auto_pan(f'{y:04d}-{m:02d}-{d:02d} {hour:02d}:{minute:02d}',city='上海')
        self.assertTrue(any('接近立春' in n for n in info['input_notes']))
        _, info = auto_pan('2026-07-11 23:00',city='上海',use_true_solar=False)
        self.assertTrue(any('时辰边界' in n for n in info['input_notes']))


if __name__ == '__main__':
    unittest.main()
