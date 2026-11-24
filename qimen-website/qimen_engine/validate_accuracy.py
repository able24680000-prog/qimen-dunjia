# -*- coding: utf-8 -*-
"""交叉验证工具：用《神奇之门》原著案例作金标准，量化三层准确率。

用法（Windows / 本包目录）：
    env -u PYTHONPATH python validate_accuracy.py

三层口径：
  L1 历法层  公历时刻 -> 四柱      独立锚点，与原书 OCR 正文记载对照
  L2 定局/盘面层 局数 + 值符值使 + 原著明示盘面断言
  L3 断法/检索层 断法标签证据覆盖 + leave-one-out 自检索

注意：这是「与原著一致性」验证，不是科学意义上的预测准确率。
玄学体系的结局不可证伪；本工具只测可复核的确定性部分。
"""
import re
import json
from collections import Counter

from pan_engine import pan
from analyze import analyze
from calendar_util import auto_pan
import original_cases as oc
from original_cases import retrieve, PREDICT_DOMAIN, _CASE_DOMAIN

# L1 独立锚点：公历时刻从原著 OCR 正文逐条提取，四柱/局数为原书记载。
# 来源：raw/奇门遁甲/张志春原著案例库/神奇之门-案例NN-*.md 正文叙述段
L1_ANCHORS = [
    ('03', '1996-03-16 16:10', '丙子年辛卯月壬子日戊申时', '阳三局', '置闰法'),
    ('04', '1996-07-27 16:00', '丙子年乙未月乙丑日甲申时', '阴七局', '拆补法'),
    ('06', '1996-03-27 09:30', '丙子年辛卯月癸亥日丁巳时', '阳六局', '拆补法'),
    ('17a', '1996-07-06 08:25', '丙子年甲午月甲辰日戊辰时', '阴六局', '拆补法'),
    ('17b', '1996-06-06 10:00', '丙子年甲午月甲戌日己巳时', '阳九局', '拆补法'),
    ('18', '1994-12-19 16:10', '甲戌年丙子月己卯日壬申时', '阳一局', '拆补法'),
    ('20', '1995-01-16 09:40', '甲戌年丁丑月丁未日乙巳时', '阳五局', '拆补法'),
    ('24b', '1998-02-07 13:20', '戊寅年甲寅月乙酉日癸未时', '阳五局', '拆补法'),
    ('26', '1998-03-05 19:20', '戊寅年甲寅月辛亥日戊戌时', '阳一局', '拆补法'),
]


def norm_gz(s):
    return re.sub(r'\s', '', s)


def norm_ju(s):
    m = re.search(r'([阴阳]).*?([一二三四五六七八九1-9])局', s)
    return (m.group(1), m.group(2)) if m else s


def pal_of(d, kind, name):
    table = {'门': 'gates', '神': 'gods', '星': 'stars'}[kind]
    for p, v in d[table].items():
        if v == name:
            return p
    return None


def gan_pal(d, g):
    for p, gs in d['tp'].items():
        if g in gs:
            return p
    return None


def predict_cat(cid):
    dom = _CASE_DOMAIN.get(cid, '')
    for p, ds in PREDICT_DOMAIN.items():
        if dom in ds:
            return p
    return None


def l1_calendar():
    rows = []
    for cid, ts, gz, ju, method in L1_ANCHORS:
        _, info = auto_pan(ts)
        rows.append({
            'id': cid, 'stamp': ts, 'method': method,
            'gz_ok': norm_gz(info['ganzhi']) == norm_gz(gz),
            'engine_gz': norm_gz(info['ganzhi']), 'book_gz': norm_gz(gz),
            'ju_ok': norm_ju(info['ju_name']) == norm_ju(ju),
            'engine_ju': info['ju_name'], 'book_ju': ju,
        })
    return rows


def l2_pan():
    D = {c['id']: pan(c['gz'], c['ju']) for c in oc.all_cases()}
    E = {c['id']: analyze(D[c['id']], '求财')['detect'] for c in oc.all_cases()}
    checks = []

    def add(cid, desc, got, exp, source='原著 point 明示'):
        checks.append({'id': cid, '断言': desc, '实测': got, '原著': exp,
                       '通过': got == exp, '来源': source})

    # 伏吟/反吟：原文明写「星门俱伏吟」「九星反吟」「八门反吟」等
    for cid, key, desc in [
        ('04', 'fuyin_type', '星门俱伏吟'), ('09', 'fuyin_type', '全盘伏吟'),
        ('16', 'fanyin_type', '九星反吟'), ('17a', 'fuyin_type', '星伏吟'),
        ('17b', 'fanyin_type', '九星反吟'), ('18', 'fanyin_type', '八门反吟'),
        ('19', 'fuyin_type', '景门伏吟'), ('24b', 'fuyin_type', '休门伏吟'),
        ('23', 'fuyin_type', '伏吟标签'),
    ]:
        t = E[cid][key] or ''
        add(cid, desc, '伏吟' in t or '反吟' in t, True)

    # 落宫/空亡：原文逐条陈述
    add('06', '乙落震3', gan_pal(D['06'], '乙'), 3)
    add('06', '庚落兑7', gan_pal(D['06'], '庚'), 7)
    add('07', '时干壬落空亡', D['07']['sg_tp'] in D['07']['void'], True)
    add('07', '杜门随时干宫', pal_of(D['07'], '门', '杜门'), D['07']['sg_tp'])
    add('07', '六合随时干宫', pal_of(D['07'], '神', '六合'), D['07']['sg_tp'])
    add('08', '艮8逢空（日旬空寅卯）', 8 in D['08']['void'], True)
    add('14', '开门落艮8', pal_of(D['14'], '门', '开门'), 8)
    add('14', '日干逢空', D['14']['rg_tp'] in D['14']['void'], True)
    add('18', '玄武落震3', pal_of(D['18'], '神', '玄武'), 3)
    add('18', '时干壬落震3', D['18']['sg_tp'], 3)
    add('20', '玄武落坎1', pal_of(D['20'], '神', '玄武'), 1)
    add('24a', '值符落兑7', D['24a']['zf_pal'], 7)
    add('24a', '庚落巽4', gan_pal(D['24a'], '庚'), 4)
    add('24a', '庚落空亡', 4 in D['24a']['void'], True)
    add('21', '景门落震3空亡', pal_of(D['21'], '门', '景门') in D['21']['void'], True)
    return checks, D, E


def l3_technique(D, E):
    def star_pal(d, name):
        for p, v in d['stars'].items():
            if v == name or (name == '天芮' and v == '芮禽'):
                return p
        return None

    def gate_pal(d, name):
        for p, v in d['gates'].items():
            if v == name.replace('文书', ''):
                return p
        return None

    def evidence(cid, tag):
        d, det = D[cid], E[cid]
        if tag in ('空亡', '填实'):
            return bool(d['void'])
        if tag in ('伏吟', '反吟'):
            return bool(det['fuyin_type'] or det['fanyin_type'])
        if tag == '马星':
            return bool(d['horse'])
        if tag == '值符逢空':
            return d['zf_pal'] in d['void']
        if tag in ('玄武', '白虎', '九天', '九地', '太阴', '螣蛇'):
            return pal_of(d, '神', tag) is not None
        if tag in ('天芮', '天辅', '天柱', '天心', '天英', '天蓬', '天任', '天冲', '天禽'):
            return star_pal(d, tag) is not None
        if tag.startswith(('死门', '开门', '生门', '景门', '杜门', '惊门', '休门', '伤门')):
            return gate_pal(d, tag) is not None
        return True  # 用神类符号恒在盘上，不是可证伪断言

    rows = []
    for c in oc.all_cases():
        for t in c['tech']:
            rows.append({'id': c['id'], '标签': t, '有盘面证据': evidence(c['id'], t)})
    return rows


def l3_retrieval():
    rows = []
    for c in oc.all_cases():
        cid = c['id']
        cat, syms = predict_cat(cid), list(c['shen'])
        if not cat or not syms:
            continue
        hits = retrieve(predict_cat=cat, symbols=syms, limit=99)['书例']
        ids = [x['id'] for x in hits]
        rows.append({'id': cid, '命中': cid in ids,
                     '名次': ids.index(cid) + 1 if cid in ids else None})
    return rows


def l3_cross_case():
    """跨案盲测：用 A 案用神检索，看召回书例是否与 A 同事项域（而非自己查自己）。"""
    cases = [c for c in oc.all_cases() if c['shen'] and predict_cat(c['id'])]
    precision, reciprocal = [], []
    for c in cases:
        cid = c['id']
        got = retrieve(predict_cat=predict_cat(cid), symbols=list(c['shen']), limit=99)['书例']
        others = [x for x in got if x['id'] != cid]
        same = [x for x in others
                if _CASE_DOMAIN.get(x['id']) == _CASE_DOMAIN.get(cid)]
        if others:
            precision.append(len(same) / len(others))
        for b in same:
            back = retrieve(predict_cat=predict_cat(b['id']),
                            symbols=oc.by_id(b['id'])['shen'], limit=99)['书例']
            reciprocal.append(cid in [x['id'] for x in back])
    return {
        '盲测样本': len(cases),
        '同类纯度': f'{sum(precision) / len(precision) * 100:.1f}%' if precision else 'n/a',
        '同类互召': f'{sum(reciprocal)}/{len(reciprocal)}' if reciprocal else 'n/a',
    }


def main():
    out = {}
    a = l1_calendar()
    out['L1_历法'] = {
        '四柱一致': f"{sum(r['gz_ok'] for r in a)}/{len(a)}",
        '局数一致': f"{sum(r['ju_ok'] for r in a)}/{len(a)}",
        '局数分歧': [{'id': r['id'], '引擎': r['engine_ju'], '原书': r['book_ju'],
                     '方法': r['method']} for r in a if not r['ju_ok']],
    }
    ch, D, E = l2_pan()
    # 值符值使名称自洽
    vd = oc.verify(False)
    name_ok = sum(1 for r in vd if r['状态'] in
                  ('OK', '中宫寄宫口径差', '名称一致（落宫未载）'))
    out['L2_盘面'] = {
        '值符值使名称一致': f'{name_ok}/30',
        '原著断言通过': f"{sum(1 for x in ch if x['通过'])}/{len(ch)}",
        '断言失败': [x for x in ch if not x['通过']],
    }
    te = l3_technique(D, E)
    rt = l3_retrieval()
    out['L3_断法检索'] = {
        '标签证据覆盖': f"{sum(1 for x in te if x['有盘面证据'])}/{len(te)}",
        '自检索召回': f"{sum(1 for x in rt if x['命中'])}/{len(rt)}",
        'Top1': f"{sum(1 for x in rt if x['名次'] == 1)}/{len(rt)}",
        'Top3': f"{sum(1 for x in rt if x['名次'] and x['名次'] <= 3)}/{len(rt)}",
        '跨案盲测': l3_cross_case(),
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
