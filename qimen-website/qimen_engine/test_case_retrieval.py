# -*- coding: utf-8 -*-
"""V2.1 案例检索层回归：修 KeyError、纯 technique 检索、静默异常与安全摘要。"""
import json
import unittest
from unittest.mock import patch

from analyze import CATEGORY_SHEN
from original_cases import (
    all_cases, by_technique, retrieve, safe_note, safe_point, safe_title, similar, summary,
)
from workflow import event


class CaseRetrievalTests(unittest.TestCase):
    def test_similar_returns_enriched_rows(self):
        hits = similar('婚姻', ['乙', '庚'])
        self.assertTrue(hits)
        for row in hits:
            self.assertIn('tech', row)
            self.assertIn('domain', row)
            self.assertIn('检索依据', row)
        self.assertTrue(all(row['id'] in ('06', '07') for row in hits))

    def test_similar_lifetime_returns_empty(self):
        self.assertEqual(similar('终身局'), [])
        self.assertEqual(similar('终身局', ['日干']), [])

    def test_retrieve_by_technique_only(self):
        for tag in ('空亡', '伏吟', '值符逢空'):
            expected = {row['id'] for row in by_technique(tag)}
            got = retrieve(technique=tag, limit=99)
            self.assertEqual(got['状态'], '命中')
            self.assertEqual({row['id'] for row in got['书例']}, expected)

    def test_retrieve_rejects_bad_limit(self):
        for bad in (0, -1, '3'):
            with self.subTest(limit=bad), self.assertRaises(ValueError):
                retrieve('婚姻', limit=bad)

    def test_verify_counts_are_explicit(self):
        states = summary()['验证状态']
        self.assertEqual(states.get('OK'), 20)
        self.assertEqual(states.get('名称一致（落宫未载）'), 5)
        self.assertEqual(states.get('中宫寄宫口径差'), 5)
        self.assertEqual(summary()['原著案例数'], 27)
        self.assertEqual(summary()['自动检索覆盖局数'], 30)

    def test_case_lists_are_isolated(self):
        rows = all_cases()
        rows[2]['shen'].append('污染测试')
        self.assertNotIn('污染测试', all_cases()[2]['shen'])

    def test_safe_point_filters_sensitive_text(self):
        by_id = {c['id']: c for c in all_cases()}
        text = safe_point(by_id['16']) + safe_point(by_id['07']) + safe_point(by_id['08'])
        text += safe_note(by_id['16']) + safe_title(by_id['07']) + safe_title(by_id['16'])
        for bad in ('年命不保', '第三者男', '淫合', '隐瞒夜不归', '主男', '主女',
                    '伤亡', '婚外恋', '溺水'):
            self.assertNotIn(bad, text)

    def test_event_exposes_retrieval_failure(self):
        with patch('original_cases.retrieve', side_effect=KeyError('模拟数据错误')):
            out = event('2026-07-11 21:50', '婚姻', '婚姻走势',
                        '有可核对的新进展', city='上海', case_refs=True)
        self.assertEqual(out['书例参照']['检索状态'], '检索失败')
        self.assertIn('模拟数据错误', out['书例参照']['错误'])
        self.assertIn('分析', out)

    def test_event_case_refs_are_safe_and_json_ready(self):
        for category, question in (
            ('走失', '孩子走失'), ('婚姻', '婚姻是否稳定'), ('健康', '身体宜关注什么')
        ):
            with self.subTest(category=category):
                out = event('2026-07-11 21:50', category, question,
                            '有可核对的新进展', city='上海', case_refs=True)
                self.assertEqual(out['书例参照']['检索状态'], '命中')
                text = json.dumps(out, ensure_ascii=False)
                for bad in ('年命不保', '第三者男', '淫合', '隐瞒夜不归',
                            '定病灶', '主男', '主女', '伊拉克', '美国'):
                    self.assertNotIn(bad, text)

    def test_all_event_categories_smoke(self):
        for category in CATEGORY_SHEN:
            if category == '终身局':
                continue
            with self.subTest(category=category):
                out = event('2026-07-11 21:50', category, '通用事项趋势',
                            '有可核对的新进展', city='上海', case_refs=True)
                self.assertIn('书例参照', out)
                json.dumps(out, ensure_ascii=False)


if __name__ == '__main__':
    unittest.main()
