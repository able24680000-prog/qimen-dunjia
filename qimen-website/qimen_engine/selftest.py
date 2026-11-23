# -*- coding: utf-8 -*-
"""
selftest.py · shijiaqimen-dunjia 自动回归测试
改动引擎或历法后必须跑通全部用例：
    python3 selftest.py
校验标尺：
- 日柱锚点：2000-01-01 戊午 / 1900-01-01 甲戌 / 2026-07-11 丙戌（妙玄App验证）
- 伏吟局：阳一局甲子时九星八门各归本宫
- 已知盘：2026-07-11 21:50 → 丙午年乙未月丙戌日己亥时，小暑中元阴二局（App逐宫核对）
- 空亡六旬、马星十二支（只落四维宫）
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pan_engine import pan, render, render_grid, void_palace, horse_palace, num_palace, pname, valid_gz
from calendar_util import (day_gz, year_gz, bazi, determine_ju, ju_str,
                           auto_pan, auto_render, term_dates_beijing, parse_dt)

PASS, FAIL = [], []


def check(name, got, want):
    if got == want:
        PASS.append(name)
        print(f"  ✓ {name}")
    else:
        FAIL.append(name)
        print(f"  ✗ {name}: got={got} want={want}")


def check_true(name, cond, extra=''):
    if cond:
        PASS.append(name)
        print(f"  ✓ {name}")
    else:
        FAIL.append(name)
        print(f"  ✗ {name} {extra}")


print("=" * 60)
print("【1】日柱锚点")
check('2000-01-01 戊午', day_gz(2000, 1, 1), '戊午')
check('1900-01-01 甲戌', day_gz(1900, 1, 1), '甲戌')
check('2026-07-11 丙戌(App验证)', day_gz(2026, 7, 11), '丙戌')
check('1949-10-01', day_gz(1949, 10, 1), day_gz(1949, 10, 1))  # 仅占位输出
print(f"    （1949-10-01 日柱 = {day_gz(1949,10,1)}，供人工核对万年历）")

print()
print("【2】年柱与立春分界")
check('2026 年柱(默认)', year_gz(2026), '丙午')
bz1 = bazi(2026, 2, 1, 12, 0)
bz2 = bazi(2026, 2, 10, 12, 0)
check('2026-02-01 立春前→乙巳', bz1['year'], '乙巳')
check('2026-02-10 立春后→丙午', bz2['year'], '丙午')

print()
print("【3】月柱五虎遁（丙年寅月起庚）")
bz3 = bazi(2026, 2, 10, 12, 0)   # 寅月
bz4 = bazi(2026, 7, 11, 12, 0)   # 未月
check('丙午年寅月=庚寅', bz3['month'], '庚寅')
check('丙午年未月=乙未', bz4['month'], '乙未')

print()
print("【4】时柱五鼠遁（丙日亥时）")
bz5 = bazi(2026, 7, 11, 21, 50)
check('2026-07-11 21:50 四柱', f"{bz5['year']} {bz5['month']} {bz5['day']} {bz5['hour']}",
      '丙午 乙未 丙戌 己亥')

print()
print("【5】空亡六旬宫位（修bug后）")
want_void = {'甲子': [6], '甲戌': [2, 7], '甲申': [2, 9],
             '甲午': [4], '甲辰': [3, 8], '甲寅': [1, 8]}
for xh, want in want_void.items():
    check(f'{xh}旬空亡={want}', void_palace[xh], want)

print()
print("【6】马星十二支（只落四维宫 2/4/6/8）")
want_horse = {'申': 8, '子': 8, '辰': 8, '寅': 2, '午': 2, '戌': 2,
              '巳': 6, '酉': 6, '丑': 6, '亥': 4, '卯': 4, '未': 4}
for z, want in want_horse.items():
    check(f'{z}时马在{num_palace[want]}宫', horse_palace[z], want)
check_true('马星只落四维宫', all(v in (2, 4, 6, 8) for v in horse_palace.values()))

print()
print("【7】伏吟局（阳一局甲子时，星门各归本宫）")
d = pan('甲子年 甲子月 甲子日 甲子时', '阳一局')
check('值符=天蓬', d['zhifu_star'], '天蓬')
check('值使=休门', d['zhishi_gate'], '休门')
want_stars = {1: '天蓬', 2: '芮禽', 3: '天冲', 4: '天辅', 6: '天心', 7: '天柱', 8: '天任', 9: '天英'}
check('九星归位(天禽寄芮)', {k: v for k, v in sorted(d['stars'].items())}, want_stars)
want_gates = {1: '休门', 2: '死门', 3: '伤门', 4: '杜门', 6: '开门', 7: '惊门', 8: '生门', 9: '景门'}
check('八门归位', {k: v for k, v in sorted(d['gates'].items())}, want_gates)

print()
print("【8】已知盘 2026-07-11 21:50（App逐宫核对标尺）")
dd, info = auto_pan('2026-07-11 21:50')
check('自动定局=阴遁二局', info['ju_name'], '阴遁二局')
check('节气=小暑', info['term'], '小暑')
check('元=中元(符头甲申)', info['futou'], '甲申')
check('四柱一致', info['ganzhi'], '丙午年 乙未月 丙戌日 己亥时')
dref = pan('丙午年 乙未月 丙戌日 己亥时', '阴二局')
check('盘面与手工 pan 完全一致', render(dd), render(dref))

print()
print("【9】节气日期抽查（2026，允许±1日浮动的硬约束）")
tds = term_dates_beijing(2026)
lc = tds['立春']; xs = tds['小暑']; dz = tds['冬至']
check_true('2026 立春在 2/3-2/5', lc[0] == 2026 and lc[1] == 2 and lc[2] in (3, 4, 5), f"实际={lc}")
check_true('2026 小暑在 7/6-7/8', xs[0] == 2026 and xs[1] == 7 and xs[2] in (6, 7, 8), f"实际={xs}")
check_true('2026 冬至在 12/21-12/23', dz[0] == 2026 and dz[1] == 12 and dz[2] in (21, 22, 23), f"实际={dz}")

print()
print("【10】节气定局抽查（2026-11-21 立冬节气）")
info2 = determine_ju(2026, 11, 21)
check('2026-11-21 节气=立冬', info2['term'], '立冬')
check('阴阳遁=阴', info2['yin_yang'], '阴')

print()
print("【11】跨年节气窗口（1月上旬属上年冬至→阳遁）")
info3 = determine_ju(1970, 1, 3)
check('1970-01-03 节气=冬至', info3['term'], '冬至')
check('阴阳遁=阳', info3['yin_yang'], '阳')
check('1970-01-03 符头=己卯(上元)', info3['futou'], '己卯')
check('1970-01-03 局=阳遁一局(案例4标尺)', ju_str(info3), '阳遁一局')
bz6 = bazi(1970, 1, 3, 22, 0)
check('1970-01-03 22:00 四柱(案例4标尺)', f"{bz6['year']} {bz6['month']} {bz6['day']} {bz6['hour']}",
      '己酉 丙子 癸未 癸亥')
for ytest in (2021, 2024, 2026):
    it = determine_ju(ytest, 1, 2)
    check_true(f'{ytest}-01-02 属上年冬至(阳遁)', it['term'] == '冬至' and it['yin_yang'] == '阳')

print()
print("【12】案例4终局对照（1970-01-03 22:00 阳遁一局）")
d4, info4 = auto_pan('1970-01-03 22:00')
check('值符=天心(案例4)', d4['zhifu_star'], '天心')
check('值使=开门(案例4)', d4['zhishi_gate'], '开门')
want_fu = {1: '天蓬', 2: '芮禽', 3: '天冲', 4: '天辅', 6: '天心', 7: '天柱', 8: '天任', 9: '天英'}
check('星门伏吟(案例4:大局伏吟)', {k: v for k, v in sorted(d4['stars'].items())}, want_fu)
# 断局要素：日干癸落乾6（甲寅癸宫）；年干按立春界四柱=己落坤2
# （书案例断语用公历年干庚戌口径，属流派差异——张志春标准为立春分界）
check('日干癸落乾6', pname(d4['rg']), '乾宫')
check('年干己落坤2(立春界四柱年柱)', pname(d4['yg_pal']), '坤宫')

print()
print("【13】月干跨支回归（张志春高级班笔记书例四柱标尺——子/丑/亥月干易错）")
# 书例原四柱：月支绕回（子丑亥）时月干必须按月序 mod 12 再 mod 10
yue_cases = [
    (1970, 1, 3, '己酉', '丙子'),    # 例十八：己酉年子月=丙子
    (1893, 12, 26, '癸巳', '甲子'),  # 例十六：癸巳年子月=甲子
    (1907, 12, 7, '丁未', '辛亥'),   # 例二十：丁未年亥月=辛亥
    (1996, 12, 16, '丙子', '庚子'),  # 例三十二：丙子年子月=庚子
    (1963, 10, 28, '癸卯', '壬戌'),  # 例十九：癸卯年戌月=壬戌
    (2000, 9, 16, '庚辰', '乙酉'),   # 例二十二：庚辰年酉月=乙酉
    (2003, 11, 16, '癸未', '癸亥'),  # 例二十五：癸未年亥月=癸亥
]
for (yy, mm, dd, ywant, mwant) in yue_cases:
    bz7 = bazi(yy, mm, dd, 12, 0, use_true_solar=False)
    check(f'{yy}-{mm:02d}-{dd:02d} 月柱={mwant}', bz7['month'], mwant)

print()
print("【14】书例四柱标尺扩充（案例库实战案例·含交节当天/晚子时/跨年）")
bazi_cases = [
    ((2001, 6, 11, 13, 20), '辛巳 甲午 乙巳 癸未', 'change', '志春例三'),
    ((2003, 6, 13, 18, 51), '癸未 戊午 丁巳 己酉', 'change', '志春例五'),
    ((1998, 4, 11, 13, 10), '戊寅 丙辰 戊子 己未', 'change', '志春例八'),
    ((2004, 4, 6, 10, 0),   '甲申 戊辰 乙卯 辛巳', 'change', '志春例十'),
    ((2004, 7, 13, 8, 50),  '甲申 辛未 癸巳 丙辰', 'change', '志春例十一'),
    ((2000, 9, 16, 17, 30), '庚辰 乙酉 丁丑 己酉', 'change', '志春例二二'),
    ((2003, 11, 8, 10, 0),  '癸未 癸亥 乙酉 辛巳', 'change', '志春例二六'),
    ((1996, 4, 4, 5, 0),    '丙子 辛卯 辛未 辛卯', 'change', '志春例二九(交节当天)'),
    ((2009, 8, 26, 23, 27), '己丑 壬申 甲辰 甲子', 'change', '高例5(晚子换日)'),
    ((2009, 8, 4, 23, 45),  '己丑 辛未 壬午 庚子', 'change', '高例9(晚子换日)'),
]
for (dt, want, mode, tag) in bazi_cases:
    y, m, d, h, mi = dt
    bz8 = bazi(y, m, d, h, mi, use_true_solar=False, zi_mode=mode)
    got = f"{bz8['year']} {bz8['month']} {bz8['day']} {bz8['hour']}"
    check(f'{tag} 四柱', got, want)

print()
print("【15】书例局数标尺（拆补法定局交叉验证·8例）")
from calendar_util import auto_pan
ju_cases = [
    ('2001-06-11 13:20', '阳遁九局', '志春例三'),
    ('2003-06-13 18:51', '阳遁三局', '志春例五'),
    ('1998-04-11 13:10', '阳遁一局', '志春例八'),
    ('2002-10-05 07:00', '阴遁四局', '志春例九'),
    ('2004-04-06 10:00', '阳遁一局', '志春例十'),
    ('2000-09-16 17:30', '阴遁六局', '志春例二二'),
    ('2003-11-16 13:00', '阴遁三局', '志春例二五'),
    ('1996-12-16 22:20', '阴遁七局', '志春例三二'),
]
for (dt, want, tag) in ju_cases:
    dd, info = auto_pan(dt, use_true_solar=False)
    check(f'{tag} 局数={want}', info['ju_name'], want)

print()
print("【16】晚子时换日→符头联动（高例5：23:27 起局须按次日甲辰起符头）")
dd5, info5 = auto_pan('2009-08-26 23:27', use_true_solar=False)
check('高例5 四柱=己丑 壬申 甲辰 甲子', info5['ganzhi'], '己丑年 壬申月 甲辰日 甲子时')
check('高例5 符头=甲辰(下元)', info5['futou'], '甲辰')
check('高例5 局数=阴遁七局', info5['ju_name'], '阴遁七局')

print()
print("【16b】D1 天盘落宫逐宫断言（非伏吟局，防伏吟掩盖取盘bug）")
# 阴二局丙戌日己亥时（App逐宫核对盘）：日干丙天盘落震3、地盘落巽4；
# 时干己天盘落乾6、地盘落坎1。二者不同宫，可区分天地盘口径。
dd16b = pan('丙午年 乙未月 丙戌日 己亥时', '阴二局')
check('日干丙 天盘落震3(非地盘巽4)', dd16b['rg_tp'], 3)
check('日干丙 地盘落巽4', dd16b['rg'], 4)
check_true('日干天地盘不同宫(非伏吟)', dd16b['rg_tp'] != dd16b['rg'])
check('时干己 天盘落乾6(非地盘坎1)', dd16b['sg_tp'], 6)
check('时干己 地盘落坎1', dd16b['sg'], 1)
# 案例 S2-13：庚日，天盘落坤2、地盘落离9——此前 bug 正是此类
dd_s2_13, _ = auto_pan('2009-05-15 13:10', use_true_solar=False)
check('S2-13 日干庚 天盘落坤2(D1铁证)', dd_s2_13['rg_tp'], 2)
check('S2-13 日干庚 地盘落离9(旧bug值)', dd_s2_13['rg'], 9)

print()
print("【17】analyze 断局数据包（格局检测/盘眼/用神定位）")
from analyze import (analyze, detect, eye_of_pan, format_package,
                     XIAN_TIAN, _cs_grade)
gz1 = '甲子年 甲子月 甲子日 甲子时'
d17 = pan(gz1, '阳一局')
det1 = detect(d17, ganzhi=gz1)
check('阳一局甲子时 星门俱伏吟', det1['fuyin'], True)
check('  星伏吟=True', det1['star_fuyin'], True)
check('  门伏吟=True', det1['gate_fuyin'], True)
check('  天显时格=True', det1['tianxian'], True)
check('  伏吟类型=星门俱伏吟', det1['fuyin_type'], '星门俱伏吟')
eye17 = eye_of_pan(d17, det1)
# D2 修复：天显时格伴生星门伏吟时降级，主盘眼让位伏吟（案例库 6/6 支持）
check('  天显伴伏吟→主盘眼=星门俱伏吟(D2)', eye17['main']['tag'], '星门俱伏吟')
check_true('  天显降为P1注记(D2)',
           any(e['tag'] == '天显时格(伴伏吟)' and e['level'] == 'P1' for e in eye17['eyes']))

gz2 = '甲子年 甲子月 甲子日 庚午时'
d18 = pan(gz2, '阳一局')
det2 = detect(d18, ganzhi=gz2)
check('甲日庚午时 五不遇时=True', det2['wubuyu'], True)
# D3 修复：五不遇时分场景——择日/健康类不作 P0 否决
from analyze import eye_of_pan as _eop
eye2_ze = _eop(d18, det2, category='择吉')
eye2_cai = _eop(d18, det2, category='求财')
check_true('  五不遇择日类降为P2(D3)',
           any(e['tag'].startswith('五不遇') and e['level'] == 'P2' for e in eye2_ze['eyes']))
check_true('  五不遇求财类仍P0(D3)',
           any(e['tag'] == '五不遇时' and e['level'] == 'P0' for e in eye2_cai['eyes']))

gz3 = '丙午年 乙未月 丙戌日 己亥时'
d19 = pan(gz3, '阴二局')
pkg19 = analyze(d19, category='婚姻', gender='男', ganzhi=gz3)
det3 = pkg19['detect']
check('阴二局 伏吟/反吟均无', (det3['fuyin'], det3['fanyin']), (False, False))
# D1 修复：日干落宫取天盘——丙天盘落震3（乘天辅/生门/九地），地盘落巽4不可再当落宫
check('  日干天盘落震3(D1)', det3['palaces']['日干'], 3)
check('  日干地盘落巽4(仅参考)', det3['palaces_di']['日干'], 4)
check('  日干不落空(天盘震3非空)', det3['rg_void'], False)
check('  时干天盘落乾6(D1)', det3['palaces']['时干'], 6)
check('  主盘眼=事压人(时克日)', pkg19['eye']['main']['tag'], '事压人')
check('  用神乙落艮8', pkg19['locate']['shen']['乙'], 8)
check('  用神庚落巽4', pkg19['locate']['shen']['庚'], 4)
check('  用神六合落坤2', pkg19['locate']['shen']['六合'], 2)

# 门迫检测：找一个已知门迫的局——阴二局伤门(木)落巽4(木)=比和；
# 用阳一局甲子时：死门(土)落坤2(土)=和，开门(金)落乾6(金)=和——伏吟局无门迫
check('  伏吟局门迫=[]', det1['men_po'], [])

print()
print("【18】M项增补：克应/内外盘/值使质量/否决（阴二局事业类）")
pkg18 = analyze(pan('丙午年 乙未月 丙戌日 己亥时', '阴二局'),
                category='事业官运', ganzhi='丙午年 乙未月 丙戌日 己亥时')
d18m = pkg18['detect']
# M1 克应：日干天盘落震3=丙、地盘乙 → 丙+乙=日月并行(吉)
check('M1 震3克应=日月并行', d18m['keying']['震3']['格局'], '日月并行')
check('M1 坤2克应=飞鸟跌穴? 天盘壬地盘戊', d18m['keying']['坤2']['组合'], '壬+戊')
# M3 内外盘：阴遁内盘=9/2/7/6 → 时干乾6内、日干震3外
check('M3 阴遁内盘集合', d18m['inner_palaces'], [2, 6, 7, 9])
check('M3 日干震3=外盘', d18m['内外盘']['日干'], '外盘')
check('M3 时干乾6=内盘', d18m['内外盘']['时干'], '内盘')
# M5 值使质量字段存在且结构正确
zq = d18m['zhishi_quality']
check_true('M5 值使质量含门/落宫/质量/与日干',
           all(k in zq for k in ('门', '落宫', '质量', '与日干')))
# M9 否决字段存在（此局开门坎1临天任非凶星、未门迫未空 → 应为空或不含开门受制）
check_true('M9 veto为list', isinstance(d18m['veto'], list))
# M2 符号取向：日干@震3 应带 天辅/九地 取向
syms = pkg18['symbols']
check('M2 日干星=天辅', syms['日干']['星'], '天辅')
check('M2 日干神=九地', syms['日干']['神'], '九地')
check_true('M2 辅助宫未混入符号取向',
           not any('地盘' in k for k in syms))

# M4 年命落宫/犯太岁（单独调用，传出生年干）
pkg18b = analyze(pan('丙午年 乙未月 丙戌日 己亥时', '阴二局'),
                 category='事业官运', ganzhi='丙午年 乙未月 丙戌日 己亥时', year_life='庚戌')
yl = pkg18b['detect']['year_life']
check_true('M4 年命字段含干支/落宫/与日干',
           all(k in yl for k in ('干支', '落宫', '落空', '与日干')))
check('M4 年命干支回显', yl['干支'], '庚戌')

print()
print("【19】D5 八神飞布修复（阳遁排布，独立案例锚点）")
# 关键：旧版 make_seq(yg)+方向yg 双重反转抵消，阴阳遁排布相同；D5方向固定False只纠正阳遁。
# 只有阳遁锚点对绕向有鉴别力；阴遁两锚点两绕法相同，仅作"未被破坏"的回归保护。
d_s204, _ = auto_pan('1998-04-11 13:10', use_true_solar=False)
check('D5 S2-04 阳遁兑7=螣蛇', d_s204['gods'].get(7), '螣蛇')
check('D5 S2-04 阳遁巽4=九地', d_s204['gods'].get(4), '九地')
d_s214, _ = auto_pan('2009-06-09 21:02', use_true_solar=False)
check('D5 S2-14 阳遁乾6=六合', d_s214['gods'].get(6), '六合')
d_case4, _ = auto_pan('1970-01-03 22:00', use_true_solar=False)
check('D5 案例4 阳遁白虎落巽4', d_case4['gods'].get(4), '白虎')
# 阴遁回归保护（两绕法一致，仅验证未被破坏）
d_s205, _ = auto_pan('2002-10-05 07:00', use_true_solar=False)
check('D5 S2-05 阴遁巽4=螣蛇', d_s205['gods'].get(4), '螣蛇')
d_s212, _ = auto_pan('2009-10-13 11:15', use_true_solar=False)
check('D5 S2-12 阴遁乾6=玄武', d_s212['gods'].get(6), '玄武')
# 阴阳遁排布必须不同（防双重反转抵消回归——这是D5真正要防的bug）
check_true('D5 阴阳遁八神排布不同',
           d_s204['gods'] != d_s212['gods'])

print()
print("【20】断语层补强：全宫克应输出 + 年命默认入口")
# 全宫克应：format_package 必须默认列出8宫格局（不只用神宫），
# 否则值符宫/开门宫的格局（如辛+丙）在断语层被漏掉。
gz20 = '己丑年 甲戌月 丙戌日 丙申时'
d20 = pan(gz20, '阴九局')
pkg20 = analyze(d20, category='婚姻', ganzhi=gz20, year_life='庚寅')
txt20 = format_package(pkg20)
check_true('全宫克应段存在', '【全宫克应格局】' in txt20)
seg20 = txt20.split('【全宫克应格局】')[1].split('【')[0] if '【全宫克应格局】' in txt20 else ''
n_pal = sum(1 for pn in ('坎1','坤2','震3','巽4','乾6','兑7','艮8','离9') if pn in seg20)
check('全宫克应列出8宫', n_pal, 8)
check_true('全宫克应含非用神宫格局(坤2辛+丙)', '辛+丙' in seg20)
# 年命段：传 year_life 时必须在数据包输出落宫+生克
check_true('年命段随包输出', '【年命】' in txt20 and '庚寅落' in txt20)

print()
print("【21】断语层补强：旺衰/应期/人物策略/脏腑类象")
# 先天数表修正（旧表坤2=2/兑7=7/艮8=3/离9=9 错位，按 01-core 1.1 校正）
check('先天数坤2=8', XIAN_TIAN[2], 8)
check('先天数兑7=2', XIAN_TIAN[7], 2)
check('先天数艮8=7', XIAN_TIAN[8], 7)
check('先天数离9=3', XIAN_TIAN[9], 3)
check('先天数乾6=1', XIAN_TIAN[6], 1)
# 十二长生归一
check('十二长生 临官=旺相', _cs_grade('临官'), '旺相')
check('十二长生 墓/绝=休囚', _cs_grade('墓/绝'), '休囚')
check('十二长生 养/胎=中平', _cs_grade('养/胎'), '中平')
# 旺衰方向锁死（本体系特殊规则：落我生之宫=旺，水落木宫为旺——曾写反成"我克=旺"）
check('旺衰 乙木落震3木宫=相',
      analyze(pan('辛巳年 甲午月 乙巳日 癸未时','阳九局'), ganzhi='辛巳年 甲午月 乙巳日 癸未时')['wangshuai']['日干落宫旺衰'],
      '相(同气)')
check('旺衰 癸水落巽4木宫=旺(落我生之宫)',
      analyze(pan('己丑年 壬申月 癸巳日 壬戌时','阴八局'), ganzhi='己丑年 壬申月 癸巳日 壬戌时')['wangshuai']['日干落宫旺衰'],
      '旺(落我生之宫,泄气为旺)')
# S3-14 健康：天芮病灶兑7(肺) + 日干巽4(肝胆) → 案例"肺肝"可推
dd_s314, info_s314 = auto_pan('2009-08-16 19:52', use_true_solar=False)
pkg_s314 = analyze(dd_s314, category='健康', ganzhi=info_s314['ganzhi'])
bd = pkg_s314['body']
check('S3-14 天芮病灶兑7=肺', bd['天芮病灶宫']['关注脏腑'], '咽喉/口腔/呼吸(肺)')
check('S3-14 日干巽4=肝胆', bd['日干本宫脏腑'], '肝胆/经络/神经')
# 应期字段：三套数系+空亡填实/冲实线索齐全
yq = pkg_s314['yingqi']
check_true('应期含三套数系', all(k in yq['时干宫数'] for k in ('后天','先天','五行生数','五行成数')))
check_true('应期含空亡填实线索', any('填实' in c for c in yq['应期线索']))
check_true('应期含冲实线索', any('冲实' in c for c in yq['应期线索']))
check_true('应期含马星冲动', any('马星' in c for c in yq['应期线索']))
# 空亡精确化：艮8空亡按甲寅旬子丑空，只列"丑"不误列"寅"(时柱旬首口径)
kong_line = [c for c in yq['应期线索'] if '艮8空亡' in c][0]
check_true('艮8空亡精确=丑日不误列寅', '丑日' in kong_line and '寅' not in kong_line.split('或')[0])
# 终身局用神类别（01-core 2.3）
dd_life, info_life = auto_pan('1970-01-03 22:00', use_true_solar=False)
pkg_life = analyze(dd_life, category='终身局', ganzhi=info_life['ganzhi'])
check_true('终身局用神含值符值使',
           '值符' in pkg_life['locate']['shen'] and '值使' in pkg_life['locate']['shen'])
# 人物策略：四干+值符+值使 六个角色齐全，且都带落宫+生克
st = pkg_s314['strategy']
check('人物策略六角色', len(st), 6)
check_true('人物策略全带对日干生克', all('对日干' in v for v in st.values()))
# S2-01 事业：月干(同事)/年干(上级) 有落宫可供"代谈/协调"策略
dd_s201, info_s201 = auto_pan('2001-06-11 13:20', use_true_solar=False)
pkg_s201 = analyze(dd_s201, category='事业官运', ganzhi=info_s201['ganzhi'])
st1 = pkg_s201['strategy']
check_true('S2-01 月干同事有落宫', '落宫' in st1['月干'] and st1['月干']['落宫'])
check_true('S2-01 年干上级有落宫', '落宫' in st1['年干'] and st1['年干']['落宫'])
# 旺衰字段：日干十二长生归一存在
check_true('旺衰含日干十二长生归一',
           '归一' in pkg_s201['wangshuai'].get('日干十二长生', {}))
# format_package 四段都输出
txt21 = format_package(pkg_s314)
for seg in ('【旺衰】','【应期取数】','【人物策略取象】','【脏腑类象】'):
    check_true(f'输出含{seg}', seg in txt21)

print()
print("【22】干支合法性防御（脏数据不硬崩，抛明确ValueError）")
# valid_gz 正确分类
check('合法 甲子', valid_gz('甲子'), True)
check('合法 乙丑', valid_gz('乙丑'), True)
check('合法 丙寅', valid_gz('丙寅'), True)
check('合法 癸亥', valid_gz('癸亥'), True)
check('非法 甲卯(阳干阴支)', valid_gz('甲卯'), False)
check('非法 乙子(阴干阳支)', valid_gz('乙子'), False)
check('非法 庚卯', valid_gz('庚卯'), False)
check('非法 长度不足', valid_gz('甲'), False)
# pan() 对非法四柱抛明确 ValueError 而非 KeyError
def _expect_valueerror(fn, label):
    try:
        fn()
    except ValueError as e:
        check_true(label, '干支' in str(e), f'(msg={e})')
    except Exception as e:
        check_true(label, False, f'(错抛{type(e).__name__}: {e})')
    else:
        check_true(label, False, '(未抛异常)')
_expect_valueerror(lambda: pan('甲辰年 戊辰月 甲卯日 丁巳时', '阳4局'), 'pan非法日柱抛ValueError')
_expect_valueerror(lambda: pan('甲辰年 戊辰月 癸卯日 乙子时', '阳4局'), 'pan非法时柱抛ValueError')
# analyze() 对非法年命抛明确 ValueError
from analyze import analyze as _az
from pan_engine import pan as _pan
_d = _pan('甲辰年 戊辰月 癸卯日 丁巳时', '阳4局')
_expect_valueerror(lambda: _az(_d, year_life='庚卯'), 'analyze非法年命抛ValueError')
# 合法输入仍正常（回归保护）
check_true('合法四柱排盘不受影响', _pan('甲辰年 戊辰月 癸卯日 丁巳时', '阳4局') is not None)

print()
print("=" * 60)
print(f"通过 {len(PASS)} / {len(PASS) + len(FAIL)}")
if FAIL:
    print("失败用例：")
    for f in FAIL:
        print("  ✗", f)
    sys.exit(1)
print("全部通过 ✓")
