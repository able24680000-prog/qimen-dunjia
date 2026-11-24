# -*- coding: utf-8 -*-
"""
analyze.py · 断局数据包：格局检测 + 盘眼识别 + 用神定位

设计原则（确定性部分代码化）：
- 排盘/格局检测/用神落宫 = 纯布尔与查表逻辑 → 本模块代码算，零解释空间
- 符号取向/场景判断/行动建议 = 生成式 → 交给 LLM
- 本模块输出的是「断局输入包」，LLM 拿包做解释，不重读盘面文字

「盘眼」（eye_of_pan）：
把大师「一眼定调」的直觉规则化为优先级决策树——全局最影响决策的 1-3 个信号。
P0 全局定调（命中即为主盘眼）→ P1 关键结构 → P2 关键生克 → P3 变动信号。
"""

# ---------- 基础表 ----------

original_star = {1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅',
                 6: '天心', 7: '天柱', 8: '天任', 9: '天英'}
original_gate = {1: '休门', 2: '死门', 3: '伤门', 4: '杜门',
                 6: '开门', 7: '惊门', 8: '生门', 9: '景门'}

# 对冲宫（反吟判定）
OPPOSITE = {1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4}

GAN_LIST = '甲乙丙丁戊己庚辛壬癸'
KE = {'金': '木', '木': '土', '土': '水', '水': '火', '火': '金'}   # 我克
gan_wuxing = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
              '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}
palace_wuxing = {1: '水', 2: '土', 3: '木', 4: '木', 5: '土',
                 6: '金', 7: '金', 8: '土', 9: '火'}
gate_wuxing = {'休门': '水', '生门': '土', '伤门': '木', '杜门': '木',
               '景门': '火', '死门': '土', '惊门': '金', '开门': '金'}
star_wuxing = {'天蓬': '水', '天任': '土', '天冲': '木', '天辅': '木',
               '天英': '火', '天芮': '土', '天禽': '土', '天柱': '金', '天心': '金'}

# 六仪击刑表：六仪（天盘干）落特定宫为击刑
JIXING = {'戊': [3],            # 甲子戊 落震3（子卯相刑）
          '己': [2],            # 甲戌己 落坤2（戌刑未）
          '庚': [8],            # 甲申庚 落艮8（寅刑申）
          '辛': [9],            # 甲午辛 落离9（午午自刑）
          '壬': [4], '癸': [4]} # 甲辰壬/甲寅癸 落巽4（辰辰自刑/寅巳刑）

# 六仪入墓表（天干墓库）：甲乙木墓未(坤2)、丙丁火墓戌(乾6)、
# 戊己土随火墓戌(乾6)、庚辛金墓丑(艮8)、壬癸水墓辰(巽4)
RUMU = {'甲': [2], '乙': [2], '丙': [6], '丁': [6],
        '戊': [6], '己': [6], '庚': [8], '辛': [8], '壬': [4], '癸': [4]}

# 同包三奇条目补充乙乾与丁艮。基础干墓表保留，输出注明来源。
THREE_WONDERS_TOMB = {'乙': {2, 6}, '丙': {6}, '丁': {8}}
TOMB_BRANCH = {2:'未', 4:'辰', 6:'戌', 8:'丑'}


def tomb_sources(stem, palace):
    sources = []
    if palace in RUMU.get(stem, ()):
        sources.append('基础干墓')
    if palace in THREE_WONDERS_TOMB.get(stem, ()):
        sources.append('三奇入墓')
    return sources


PALACE_NAME = {1: '坎1', 2: '坤2', 3: '震3', 4: '巽4', 5: '中5',
               6: '乾6', 7: '兑7', 8: '艮8', 9: '离9'}

LIUJIA = ('甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅')

# ---------- M 项增补数据表（来自 references/01-core 3.4、05-thinking 3.1、02-checklist） ----------

# M1 十干克应 81 组：'天盘干+地盘干' -> (格局名, 吉凶)。取自 01-core-knowledge.md 3.4
KE_YING = {
 '戊+戊':('伏吟','凶'),'戊+乙':('青龙和会','中'),'乙+戊':('阴害阳门','中'),
 '戊+丙':('青龙返首','大吉'),'丙+戊':('飞鸟跌穴','大吉'),'戊+丁':('青龙耀明','吉'),
 '丁+戊':('青龙转光','吉'),'戊+己':('贵人入狱','凶'),'己+戊':('犬遇青龙','中'),
 '戊+庚':('值符飞宫','凶'),'庚+戊':('天乙伏宫','凶'),'戊+辛':('青龙折足','凶'),
 '辛+戊':('困龙被伤','凶'),'戊+壬':('青龙入天牢','凶'),'壬+戊':('小蛇化龙','吉'),
 '戊+癸':('青龙华盖','中'),'癸+戊':('天乙会合','中'),
 '乙+乙':('日奇伏吟','平'),'乙+丙':('奇仪顺遂','吉'),'丙+乙':('日月并行','吉'),
 '乙+丁':('奇仪相佐','吉'),'丁+乙':('玉女奇生','吉'),'乙+己':('日奇入墓','凶'),
 '己+乙':('地户逢星','中'),'乙+庚':('日奇被刑','凶'),'庚+乙':('太白逢星','中'),
 '乙+辛':('龙逃走','大凶'),'辛+乙':('虎猖狂','大凶'),'乙+壬':('日奇入天罗','凶'),
 '壬+乙':('小蛇得势','吉'),'乙+癸':('日奇入地网','凶'),'癸+乙':('华盖逢星','中'),
 '丙+丙':('月奇悖师','凶'),'丙+丁':('星奇朱雀','吉'),'丁+丙':('星随月转','中'),
 '丙+己':('火悖入刑','中'),'己+丙':('火悖地户','凶'),'丙+庚':('荧入太白','中'),
 '庚+丙':('白入荧','凶'),'丙+辛':('月奇相合','吉'),'辛+丙':('干合悖师','中'),
 '丙+壬':('火入天罗','凶'),'壬+丙':('水蛇入火','凶'),'丙+癸':('月奇地网','凶'),
 '癸+丙':('华盖悖师','凶'),
 '丁+丁':('星奇伏吟','吉'),'丁+己':('火入勾陈','凶'),'己+丁':('朱雀入墓','中'),
 '丁+庚':('星奇受阻','凶'),'庚+丁':('亭亭之格','凶'),'丁+辛':('朱雀入狱','中'),
 '辛+丁':('狱神得奇','吉'),'丁+壬':('奇仪相合','吉'),'壬+丁':('干合蛇刑','中'),
 '丁+癸':('朱雀投江','大凶'),'癸+丁':('螣蛇夭矫','大凶'),
 '己+己':('地户逢鬼','凶'),'己+庚':('刑格返名','凶'),'庚+己':('官府刑格','大凶'),
 '己+辛':('游魂入墓','凶'),'辛+己':('入狱自刑','凶'),'己+壬':('地网高张','凶'),
 '壬+己':('反吟蛇刑','凶'),'己+癸':('地刑玄武','凶'),'癸+己':('华盖地户','凶'),
 '庚+庚':('太白同宫','大凶'),'庚+辛':('白虎干格','凶'),'辛+庚':('白虎出力','凶'),
 '庚+壬':('小格/移荡格','凶'),'壬+庚':('太白擒蛇','凶'),'庚+癸':('大格','大凶'),
 '癸+庚':('太白入网','凶'),
 '辛+辛':('伏吟天庭','凶'),'辛+壬':('凶蛇入狱','凶'),'壬+辛':('螣蛇相缠','凶'),
 '辛+癸':('虎投地网','凶'),'癸+辛':('网盖天牢','凶'),
 '壬+壬':('天狱自刑','凶'),'壬+癸':('天罗地网','凶'),'癸+壬':('复见螣蛇','凶'),
 '癸+癸':('天网四张','凶'),
}
# 用神为天盘主动方时的格局吉凶翻转（01-core 使用规则）
KE_YING_FLIP = {'庚+戊':'反吉','辛+戊':'反吉','庚+丙':'为客进利','丙+庚':'反凶'}

# M2 八神/九星场景取向提示（05-thinking 3.1，多场景压缩为通用取向词）
GOD_ORIENT = {'值符':'权威/核心/贵气','螣蛇':'虚惊/缠绕/文书','太阴':'隐秘/阴私/女性',
              '六合':'合作/婚姻/中介','白虎':'伤病/阻隔/刚猛','玄武':'暗箱/不透明/盗失/暧昧',
              '九地':'稳固/基础/主方/旧事','九天':'高远/主动/客方/扩张'}
STAR_ORIENT = {'天蓬':'风险/贪婪/大','天芮':'疾病/弱点/问题','芮禽':'疾病/弱点/问题',
               '天冲':'冲动/起步/雷动','天辅':'文书/教育/职称','天英':'火/文明/急躁',
               '天心':'策略/智慧/良医','天柱':'破坏/阻碍/压力','天任':'稳定/承载/土地'}

# M3 内外盘宫位（01-core：阳遁1/8/3/4内、阴遁9/2/7/6内）
INNER_PALACES = {True:{1,8,3,4}, False:{9,2,7,6}}   # key = 是否阳遁

# M6 取数（02-checklist 4.5 / 01-core 1.1 九宫八卦表）
HOU_TIAN = {1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9}       # 后天数（默认）
# 先天数（卦数，号码类）：乾6=1 兑7=2 离9=3 震3=4 巽4=5 坎1=6 艮8=7 坤2=8
# 修正：旧表 坤2=2/兑7=7/艮8=3/离9=9 四处错位，按 01-core 1.1 校正。
XIAN_TIAN = {6:1,7:2,9:3,3:4,4:5,1:6,8:7,2:8,5:0}
WUXING_NUM = {'水':(1,6),'火':(2,7),'木':(3,8),'金':(4,9),'土':(5,10)}  # (生数,成数)

# 落宫地支（01-core 1.2 地支与九宫）：空亡填实/冲实、马星冲动、应期地支用
PALACE_BRANCH = {1:('子',), 2:('未','申'), 3:('卯',), 4:('辰','巳'),
                 6:('戌','亥'), 7:('酉',), 8:('丑','寅'), 9:('午',)}
BRANCH_CHONG = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅',
                '卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'}  # 六冲

# ---------- 断语层补强数据表（应期/人物/脏腑/旺衰） ----------
# 人物类象（01-core 2.2 通用纲领性用神）
PERSON_ROLE = {
    '年干': '长辈/父母/上级领导/根', '月干': '兄弟姐妹/同事/同辈',
    '日干': '求测人本人', '时干': '下属/子女/所测之事/结局',
    '值符': '单位一把手/顶头上司/裁判', '值使门': '执行者/副主考/办事过程',
}
# 宫位→脏腑（01-core 2.4 人体疾病对应宫位）
ORGAN = {1:'肾/膀胱/泌尿生殖', 2:'脾胃/腹部/消化', 3:'肝胆/手足', 4:'肝胆/经络/神经',
         6:'头/肺/大脑', 7:'咽喉/口腔/呼吸(肺)', 8:'筋骨/关节/背', 9:'心/眼/血管'}
# 九星月令旺衰（01-core 核心旺衰表）：月令季节→星→状态
XING_WANG = {
    '春': {'天蓬':'旺','天芮':'囚','天冲':'相','天辅':'相','天禽':'囚','天心':'休','天柱':'休','天任':'囚','天英':'废'},
    '夏': {'天蓬':'休','天芮':'废','天冲':'旺','天辅':'旺','天禽':'废','天心':'囚','天柱':'囚','天任':'废','天英':'相'},
    '四季': {'天蓬':'囚','天芮':'相','天冲':'休','天辅':'休','天禽':'相','天心':'旺','天柱':'旺','天任':'相','天英':'旺'},
    '秋': {'天蓬':'废','天芮':'旺','天冲':'囚','天辅':'囚','天禽':'旺','天心':'相','天柱':'相','天任':'旺','天英':'休'},
    '冬': {'天蓬':'相','天芮':'休','天冲':'废','天辅':'废','天禽':'休','天心':'废','天柱':'废','天任':'休','天英':'囚'},
}
SEASON_BY_BRANCH = dict(zip('寅卯辰巳午未申酉戌亥子丑',
                            ('春','春','四季','夏','夏','四季','秋','秋','四季','冬','冬','四季')))
SEASON_ELEMENT = {'春':'木','夏':'火','秋':'金','冬':'水','四季':'土'}

# 十天干落宫十二长生（01-core 4.1 速查表）：状态归一 旺相/休囚/中平
CS_WANG = {'长生','沐浴','冠带','临官','帝旺'}
CS_XIU = {'衰','病','死','墓','绝'}
CHANGSHENG = {
 '甲': {1:'沐浴',2:'墓/绝',3:'帝旺',4:'衰/病',6:'养/长生',7:'胎',8:'冠带/临官',9:'死'},
 '乙': {1:'病',2:'养/胎',3:'临官',4:'冠带/沐浴',6:'墓/死',7:'绝',8:'衰/帝旺',9:'长生'},
 '丙': {1:'胎',2:'衰/病',3:'沐浴',4:'冠带/临官',6:'墓/绝',7:'死',8:'养/长生',9:'帝旺'},
 '丁': {1:'绝',2:'冠带/沐浴',3:'病',4:'衰/帝旺',6:'养/胎',7:'长生',8:'墓/死',9:'临官'},
 '戊': {1:'胎',2:'衰/病',3:'沐浴',4:'冠带/临官',6:'墓/绝',7:'死',8:'养/长生',9:'帝旺'},
 '己': {1:'绝',2:'冠带/沐浴',3:'病',4:'衰/帝旺',6:'养/胎',7:'长生',8:'墓/死',9:'临官'},
 '庚': {1:'死',2:'冠带/临官',3:'胎',4:'长生/沐浴',6:'衰/病',7:'帝旺',8:'墓/绝',9:'沐浴'},
 '辛': {1:'长生',2:'衰/帝旺',3:'绝',4:'墓/养',6:'冠带/沐浴',7:'临官',8:'死/胎',9:'病'},
 '壬': {1:'帝旺',2:'长生/沐浴',3:'死',4:'墓/绝',6:'冠带/临官',7:'胎',8:'衰/病',9:'胎'},
 '癸': {1:'临官',2:'死/胎',3:'长生',4:'养/墓',6:'帝旺/沐浴',7:'病',8:'冠带/衰',9:'绝'},
}

# M9 一票否决（02-checklist 3.2.1）——事业类表面吉象否决信号
VETO_JIXIONG_STARS = {'天芮','芮禽','天蓬','天柱'}

# 用神速查（主用神在前）——确定性部分：只定位落宫，取向判断交给 LLM
CATEGORY_SHEN = {
    '求财':    ['生门', '戊', '日干', '时干'],
    '事业官运': ['开门', '值符', '日干', '时干'],
    '婚姻':    ['乙', '庚', '六合', '休门'],   # 男看庚、女看乙（性别由参数定主次）
    '健康':    ['天芮', '日干', '死门'],
    '官司':    ['开门', '值符', '日干', '时干'],
    '考试':    ['天辅', '值符', '日干'],
    '出行':    ['日干', '时干', '开门'],
    '走失':    ['六合', '时干', '日干'],
    '择吉':    ['时干', '日干', '开门'],
    '天气':    ['天英', '天蓬', '天柱', '天辅', '壬', '癸'],
    '风水阳宅': ['生门', '日干'],
    '风水阴宅': ['死门', '日干'],
    '终身局':   ['日干', '值符', '值使', '年干', '月干', '时干'],  # 01-core 2.3
}


# ---------- 格局检测 ----------

def _palace_of(item, d):
    """在盘中找某符号的落宫。item ∈ {星名/门名/神名/单干}"""
    for p, s in d['stars'].items():
        if s == item or (item == '天芮' and s == '芮禽') or (item == '天禽' and s == '芮禽'):
            return p
    for p, g in d['gates'].items():
        if g == item:
            return p
    for p, g in d['gods'].items():
        if g == item:
            return p
    hits = [p for p, t in d['tp'].items() if item in t]
    if hits:
        return hits[0]
    dhits = [p for p, g in d['gp'].items() if item == g]
    if dhits:
        return dhits[0]
    return None


from pan_engine import visible_stem

GENERATES = dict(zip('木火土金水', '火土金水木'))


def palace_relation(left, right, left_name, right_name):
    """以落宫五行分别标明相生、相克的施受方。"""
    a, b = palace_wuxing[left], palace_wuxing[right]
    if a == b:
        return '比和'
    if GENERATES[a] == b:
        return left_name + '生' + right_name
    if GENERATES[b] == a:
        return right_name + '生' + left_name
    if KE[a] == b:
        return left_name + '克' + right_name
    return right_name + '克' + left_name


def detect(d, ganzhi=None, category=None, *, main_symbol=None):
    """格局检测：纯布尔/枚举输出，无解释空间。
    ganzhi: 'X年 X月 X日 X时'（可选，用于天显时格/五不遇时）"""
    r = {}
    stars, gates = d['stars'], d['gates']

    # --- 星伏吟 / 门伏吟 / 反吟（星门分离） ---
    star_ok = all(
        (s == '芮禽' and p == 2) or s == original_star.get(p)
        for p, s in stars.items())
    gate_ok = all(g == original_gate[p] for p, g in gates.items())
    star_opp = all(
        (s == '芮禽' and OPPOSITE[p] == 2) or s == original_star.get(OPPOSITE[p])
        for p, s in stars.items())
    gate_opp = all(g == original_gate[OPPOSITE[p]] for p, g in gates.items())

    r['star_fuyin'] = star_ok          # 天时停滞
    r['gate_fuyin'] = gate_ok          # 人事停滞
    r['star_fanyin'] = star_opp        # 天时反复
    r['gate_fanyin'] = gate_opp        # 人事反复
    r['fuyin'] = star_ok and gate_ok                 # 星门俱伏吟
    r['fanyin'] = star_opp and gate_opp              # 星门俱反吟
    r['fuyin_type'] = ('星门俱伏吟' if r['fuyin'] else
                       '仅星伏吟' if star_ok else
                       '仅门伏吟' if gate_ok else None)
    r['fanyin_type'] = ('星门俱反吟' if r['fanyin'] else
                        '仅星反吟' if star_opp else
                        '仅门反吟' if gate_opp else None)

    # --- 天显时格 / 五不遇时 ---
    if ganzhi:
        parts = ganzhi.replace('年', ' ').replace('月', ' ').replace('日', ' ').split()
        hour_gz = parts[3] if len(parts) == 4 else None
        day_gan = parts[2][0] if len(parts) == 4 else None
        r['tianxian'] = bool(hour_gz and hour_gz.startswith('甲'))   # 六甲时
        if day_gan and hour_gz:
            hg = hour_gz[0]
            r['wubuyu'] = (GAN_LIST.index(hg) % 2 == GAN_LIST.index(day_gan) % 2 and
                           KE.get(gan_wuxing[hg]) == gan_wuxing[day_gan])
        else:
            r['wubuyu'] = False
    else:
        r['tianxian'] = None
        r['wubuyu'] = None

    # --- 空亡 / 马星 ---
    r['void'] = list(d['void'])
    r['horse'] = d['horse']

    # --- 四干落宫（D1 修复：用神一律取天盘飞临之宫；地盘宫另存仅供旺衰参考） ---
    # 兼容旧数据：若 pan() 未生成 *_tp 字段则回退到地盘（不至于崩溃）
    rg_tp = d.get('rg_tp') or d['rg']
    sg_tp = d.get('sg_tp') or d['sg']
    yg_tp = d.get('yg_tp') or d['yg_pal']
    mg_tp = d.get('mg_tp') or d['mg_pal']
    r['palaces'] = {'日干': rg_tp, '时干': sg_tp,
                    '年干': yg_tp, '月干': mg_tp,
                    '值符星': d['zf_pal'], '值使门': d['zs']}
    r['palaces_di'] = {'日干': d['rg'], '时干': d['sg'],
                       '年干': d['yg_pal'], '月干': d['mg_pal']}  # 地盘宫（旺衰用）

    # --- 日干宫关键状态（天盘落宫口径） ---
    rg = rg_tp
    r['rg_void'] = rg in d['void']
    day_stem = visible_stem(d['rgz'])
    r['rg_stem'] = day_stem
    r['rg_rumu'] = bool(tomb_sources(day_stem, rg))
    r['rg_jixing'] = rg in JIXING.get(day_stem, [])

    # --- 天盘干击刑 / 入墓（全盘扫描） ---
    r['jixing'] = [{'gan': t, 'palace': p} for p, ts in d['tp'].items()
                   for t in ts if p in JIXING.get(t, [])]
    r['rumu'] = [{'gan': t, 'palace': p} for p, ts in d['tp'].items()
                 for t in ts if tomb_sources(t, p)]

    # --- 门迫 / 门制（门与落宫生克） ---
    po, zhi, he, yi = [], [], [], []
    for p, g in gates.items():
        mg, pg = gate_wuxing[g], palace_wuxing[p]
        rel = ('迫' if KE[mg] == pg else
               '制' if KE[pg] == mg else
               '和' if mg == pg else '义')
        if rel == '迫': po.append({'gate': g, 'palace': p})
        elif rel == '制': zhi.append({'gate': g, 'palace': p})
        elif rel == '和': he.append({'gate': g, 'palace': p})
        else: yi.append({'gate': g, 'palace': p})
    r['men_po'], r['men_zhi'], r['men_he'], r['men_yi'] = po, zhi, he, yi

    # --- 日干宫与时干宫生克（天盘落宫口径） ---
    r['rg_sg_rel'] = palace_relation(rg, sg_tp, '日干宫', '时干宫')

    # 保留旧调用者读取的首干字段，每宫同时提供全部天盘干的明细。
    keying = {}
    for pal, stems in d['tp'].items():
        ground = d['gp'][pal]
        rows = []
        for index, stem in enumerate(stems):
            pair = f'{stem}+{ground}'
            name, grade = KE_YING.get(pair, ('待核', '待核'))
            rows.append({'天盘干': stem, '地盘干': ground, '位置': '寄干' if index else '本干',
                         '组合': pair, '格局': name, '吉凶': grade,
                         '击刑': pal in JIXING.get(stem, []), '墓库候选': bool(tomb_sources(stem, pal)), '墓库依据': tomb_sources(stem, pal)})
        if rows:
            keying[PALACE_NAME[pal]] = dict(rows[0], 逐干=rows)
    r['keying'] = keying

    # M3 内外盘标记（用神落宫口径）
    inner = INNER_PALACES.get(bool(d['yg']), {1, 8, 3, 4})
    r['inner_palaces'] = sorted(inner)
    r['内外盘'] = {k: ('内盘' if v in inner else '外盘')
                 for k, v in r['palaces'].items() if k in ('日干', '时干', '年干', '月干')}

    # M5 值使门过程质量：值使宫旺相/空亡 + 与日干生克
    zs_pal = d['zs']
    zs_gate = d['zhishi_gate']
    z_relation = gate_palace_relation(zs_gate, zs_pal)
    z_month = seasonal_grade(gate_wuxing[zs_gate], d['mgz'][1])
    z_void = zs_pal in d['void']
    factors = [z_relation] if z_relation in ('门迫', '门制') else []
    if z_void:
        factors.append('落空')
    if z_month in ('休', '囚', '死'):
        factors.append('月令'+z_month)
    zs_rel = palace_relation(zs_pal, rg_tp, '值使宫', '日干宫')
    r['zhishi_quality'] = {'门': zs_gate, '落宫': PALACE_NAME[zs_pal],
                           '门宫关系': z_relation, '月令': z_month, '旬空': z_void,
                           '质量': '、'.join(factors) if factors else '结合事项核对执行条件',
                           '与日干': zs_rel}

    # M9 一票否决信号（事业类"表面吉象"防错）
    veto = []
    # ① 开门受制：门迫/空亡/临凶星
    km_pal = [p for p, g in gates.items() if g == '开门']
    if km_pal and main_symbol in (None, '开门'):
        kp = km_pal[0]
        if {'gate': '开门', 'palace': kp} in po:
            veto.append('开门受制:门迫')
        if {'gate': '开门', 'palace': kp} in zhi:
            veto.append('开门受制:门制')
        if kp in d['void']:
            veto.append('开门受制:空亡')
        if d['stars'].get(kp) in VETO_JIXIONG_STARS:
            veto.append(f'开门受制:临{d["stars"].get(kp)}凶星')
    # ② 犯太岁：年干(太岁)落宫克日干落宫
    yg_p, rg_wx2 = palace_wuxing[yg_tp], palace_wuxing[rg_tp]
    if KE[yg_p] == rg_wx2:
        veto.append('犯太岁:年干宫克日干宫(上级压制)')
    # ③ 时干弱/空亡无动向（落空即命中）
    if sg_tp in d['void']:
        veto.append('时干空亡无动向')
    # ④ 日干真空：落宫休囚 + 空亡（空亡即视为真空信号，旺衰交 LLM 复核）
    if rg_tp in d['void']:
        veto.append('日干落空(真空疑)')
    r['veto'] = veto if category == '事业官运' else []

    return r


# ---------- 断语层补强：旺衰 / 应期 / 人物策略 / 脏腑类象 ----------

def _cs_grade(state):
    """十二长生状态串（如'墓/绝'）归一到 旺相/休囚/中平。"""
    parts = state.split('/')
    if any(p in CS_WANG for p in parts):
        return '旺相'
    if all(p in CS_XIU for p in parts):
        return '休囚'
    return '中平'


def _cs_of_gan_palace(gan, pal):
    """天干落宫的十二长生状态（取该宫代表地支的那一档）。"""
    states = CHANGSHENG.get(gan, {}).get(pal)
    return states


def wangshuai(d, det, ganzhi=None):
    """旺衰字段：落宫五行旺衰(本体系:落我生之宫为旺) + 日干十二长生 + 九星月令旺衰。
    供应期'旺取成数/衰取生数'、脏腑'旺相发展快/休囚慢'使用。"""
    out = {}
    rg_p = det['palaces']['日干']

    # ① 日干落宫五行旺衰（本体系特殊规则：落我生之宫=旺，非生我之宫）
    sx = palace_wuxing[rg_p]                       # 日干五行
    gong = palace_wuxing[rg_p]                     # 落宫五行（同宫，看干与宫五行关系需另取）
    # 日干五行 vs 落宫五行：日干天盘的五行取gan_wuxing，落宫取palace_wuxing
    # 但天盘干落宫后，五行关系按"干落宫"判：干为我、宫为环境
    rg_gan = None
    if ganzhi:
        parts = ganzhi.replace('年', ' ').replace('月', ' ').replace('日', ' ').split()
        rg_gan = parts[2][0] if len(parts) == 4 else None
    if rg_gan:
        sx = gan_wuxing[rg_gan]
        gong = palace_wuxing[rg_p]
        # 本体系特殊规则(01-core 核心旺衰)：落我生之宫=旺(泄气为旺,如水落木宫)、
        # 同五行=相、落我克之宫=休(消耗)、落生我之宫=废(被养)、落克我之宫=囚。
        # 注意 KE[x]=x所克；sheng_wo[x]=生x者。gong被我生 ⟺ sheng_wo[gong]==sx。
        sheng_wo = {'木':'水','火':'木','土':'火','金':'土','水':'金'}  # 生我者
        if sheng_wo[gong] == sx:        # 宫五行被日干五行所生 = 落我生之宫
            grade = '旺(落我生之宫,泄气为旺)'
        elif sx == gong:
            grade = '相(同气)'
        elif KE[sx] == gong:            # 日干克宫五行 = 落我克之宫
            grade = '休(落我克之宫,消耗)'
        elif sheng_wo[sx] == gong:      # 宫生日干 = 落生我之宫
            grade = '废(落生我之宫,被养)'
        else:                           # KE[gong]==sx 宫克日干 = 落克我之宫
            grade = '囚(落克我之宫,被困)'
        out['日干落宫旺衰'] = grade
        cs = _cs_of_gan_palace(rg_gan, rg_p)
        if cs:
            out['日干十二长生'] = {'落宫': PALACE_NAME[rg_p], '状态': cs,
                                 '归一': _cs_grade(cs)}

    # ② 九星月令旺衰（值符星 + 用神星）：需月令，从 ganzhi 月支推季节
    if ganzhi:
        parts = ganzhi.replace('年', ' ').replace('月', ' ').replace('日', ' ').split()
        if len(parts) >= 2 and len(parts[1]) >= 2:
            month_branch = parts[1][1]
            if month_branch in SEASON_BY_BRANCH:
                season = SEASON_BY_BRANCH[month_branch]
                zf_star = d.get('zhifu_star', '').replace('芮禽', '天芮')
                if zf_star in XING_WANG[season]:
                    out['值符星月令旺衰'] = {'星': zf_star, '季': season,
                                        '状态': XING_WANG[season][zf_star]}
                # 天芮（病灶星）月令旺衰，健康类用
                if '天芮' in XING_WANG[season]:
                    out['天芮月令旺衰'] = XING_WANG[season]['天芮']
    return out


def verdict_tendency(pkg, scope, category=None):
    """确定性成败倾向（V2.5 基础，V2.6 金标准回测修复）：只用包内已算出的字段加权，给 LLM 断语一个可核验的基线。
    不取代 LLM 最终裁决——玄学断语含救应、现实条件与代测差异，此处只标'证据倾向'。
    评分：格局吉凶 / 落空 / 门迫门制 / 月令旺衰 / 日干与主用神生克（双向）/ P0P1盘眼减分。
    V2.6 修复（全部有原著断法佐证，见 validate_verdicts.py）：
    ①补"主用神宫生日干宫=事来就我（+1）"方向；②健康病星反向扩为 scope 评分反向通用口径
    （雨停转晴=天蓬反向）；③走失/寻物伏吟+1（物未动原地可寻）、反吟不计分；④婚姻类乙庚宫
    生克合参（相生+2/相克-2/对冲-2/同宫+1）。
    """
    if not scope or not pkg.get('locate') or not pkg.get('symbols'):
        return None
    main = scope.get('主用神')
    loc = pkg['locate']['shen']
    pal = loc.get(main)
    sym = pkg['symbols'].get(main)
    if pal is None or sym is None:
        return {'倾向': '待核', '信心': '低', '得分': 0,
                '证据': ['主用神未能落宫或无线索，暂不给倾向'], '说明': '主用神定位缺失'}
    score = 0
    evidence = []
    # 评分反向口径（V2.6）：scope 评分反向（雨停转晴等）或健康类病星天芮——
    # 问"病愈/雨停"时主用神旺/吉反而不利所问，凶象加身反为利好，
    # 故格局/落空/门迫/月令/生克全部反向计分。
    invert = bool(scope.get('评分反向')) or (category == '健康' and main == '天芮')
    # ① 格局吉凶（主用神宫克应）
    jx_map = {'大吉': 2, '吉': 1, '中': 0, '凶': -1, '大凶': -2}
    jx = sym.get('吉凶', '中')
    jx_score = jx_map.get(jx, 0)
    if invert:
        jx_score = -jx_score
    score += jx_score
    if jx_score:
        evidence.append(f"格局「{sym.get('克应','?')}」{jx}{'（反向口径）' if invert else ''}（{jx_score:+d}）")
    # ② 落空
    rev = pkg.get('review', {}).get(pal, {})
    if rev.get('落空'):
        score += 2 if invert else -2
        evidence.append(f"{PALACE_NAME.get(pal)}落空{'（反向口径：病/雨星落空为利）' if invert else ''}（{2 if invert else -2:+d}）")
    # ③ 门迫/门制
    men = rev.get('门宫关系', '')
    if men in ('门迫', '门制'):
        score += 1 if invert else -1
        evidence.append(f"{rev.get('门','门')}{men}{'（反向口径）' if invert else ''}（{1 if invert else -1:+d}）")
    # ④ 月令旺衰（逐干月令，取主用神干本干；无则用神宫星月令）
    yue = None
    for g in rev.get('逐干', []):
        if g.get('位置') == '本干':
            yue = g.get('月令')
            break
    if yue in ('旺', '相'):
        yue_score = -1 if invert else 1
        score += yue_score
        evidence.append(f"月令{yue}{'（反向口径）' if invert else ''}（{yue_score:+d}）")
    elif yue in ('休', '囚', '死', '墓', '绝', '胎', '养'):
        yue_score = 1 if invert else -1
        score += yue_score
        evidence.append(f"月令{yue}{'（反向口径）' if invert else ''}（{yue_score:+d}）")
    # ⑤ 日干宫与主用神宫的生克（双向：我生事/事生我皆利，我克事/事克我皆阻）
    rg = loc.get('日干')
    if rg is not None and rg != pal:
        rel = palace_relation(rg, pal, '日干宫', main + '宫')
        rel_flip = -1 if invert else 1
        if rel.endswith('生' + main + '宫'):
            score += 1 * rel_flip
            evidence.append(f"日干宫生主用神宫{'（反向口径）' if invert else ''}（{1*rel_flip:+d}）")
        elif rel.endswith('生日干宫'):
            score += 1 * rel_flip
            evidence.append(f"主用神宫生日干宫（事来就我）{'（反向口径）' if invert else ''}（{1*rel_flip:+d}）")
        elif rel.endswith('克' + main + '宫') or rel == main + '宫克日干宫':
            score -= 1 * rel_flip
            evidence.append(f"日干宫与主用神宫相克{'（反向口径）' if invert else ''}（{-1*rel_flip:+d}）")
    # ⑥ P0/P1 盘眼减分（已标注盘面固有者不计入）
    # 走失/寻物特例（V2.6）：伏吟=物未动、还在原处，利寻获（+1）；
    # 反吟=物已移位，原著以内外盘定远近快慢、不单独定成败，故不扣不加。
    fu_yin_bonus = 0
    veto = []
    for e in pkg.get('eye', {}).get('eyes', []):
        tag = e['tag']
        if e['level'] in ('P0', 'P1') and '盘面固有' not in e.get('desc', ''):
            if category == '走失' and '伏吟' in tag:
                fu_yin_bonus += 1
                evidence.append(f"{tag}（寻物：物未动原地可寻，+1）")
            elif category == '走失' and '反吟' in tag:
                evidence.append(f"{tag}（寻物：移位远近另核，不计分）")
            else:
                veto.append(tag)
    if veto:
        score -= min(2, len(veto)) * 0.5
        evidence.append(f"P0/P1盘眼{'、'.join(veto)}（-{min(2,len(veto))*0.5:g}）")
    score += fu_yin_bonus
    # ⑦ 婚姻乙庚合参（V2.6）：婚姻成败的判定性证据是乙(一方)与庚(另一方)的
    # 宫位关系——相生比和为合、相克对冲主散（01-core 婚姻用乙庚，gender 定主次）。
    if category == '婚姻':
        eb, gt = loc.get('乙'), loc.get('庚')
        if eb is not None and gt is not None:
            if eb == gt:
                score += 1
                evidence.append('乙庚同宫比和（+1）')
            else:
                rel2 = palace_relation(eb, gt, '乙宫', '庚宫')
                opposite = {(1, 9), (9, 1), (2, 8), (8, 2), (3, 7), (7, 3), (4, 6), (6, 4)}
                if (eb, gt) in opposite:
                    score -= 2
                    evidence.append('乙庚对冲主散（-2）')
                elif '生' in rel2:
                    score += 2
                    evidence.append(f'乙庚相生为合（{rel2}，+2）')
                elif '克' in rel2:
                    score -= 2
                    evidence.append(f'乙庚相克主散（{rel2}，-2）')
    trend = '成' if score >= 2 else '败' if score <= -2 else '两可'
    conf = '高' if abs(score) >= 4 and len(evidence) >= 4 else '中' if abs(score) >= 2 else '低'
    return {'倾向': trend, '信心': conf, '得分': score, '证据': evidence,
            '说明': '确定性信号加权基线，供断语参考；救应、代测与现实条件由 LLM 复核，不直接套用。'}


def yingqi(d, det, wang, ganzhi=None, category=None, *, focus=None):
    """应期取数字段（02-checklist 四）：三套数系+单位判定+五类应期线索。
    只给'候选线索'，不武断定死应期——最终落年/月/日交 LLM 结合旺衰裁决。"""
    out = {}
    rg_p = det['palaces']['日干']
    sg_p = det['palaces']['时干']

    # ① 三套数系（取时干宫=事体宫为主，日干宫为辅）
    def nums(pal):
        wx = palace_wuxing[pal]
        sheng, cheng = WUXING_NUM[wx]
        return {'宫': PALACE_NAME[pal], '后天': HOU_TIAN[pal],
                '先天': XIAN_TIAN[pal], '五行生数': sheng, '五行成数': cheng,
                '旺取': cheng, '衰取': sheng}
    out['时干宫数'] = nums(sg_p)
    out['日干宫数'] = nums(rg_p)

    # ② 旺衰决定取生数/成数
    grade = wang.get('日干十二长生', {}).get('归一', '中平')
    out['取数档'] = ('旺相取成数' if grade == '旺相' else
                  '休囚取生数' if grade == '休囚' else '中平：生数成数皆可参考')
    # 旺衰档供取数：给一个明确的推荐数（时干宫）
    tn = out['时干宫数']
    out['推荐取数'] = tn['旺取'] if grade == '旺相' else tn['衰取'] if grade == '休囚' else tn['后天']

    # ③ 单位判定（内外盘+伏吟反吟），01-core 1.1 / 02-checklist 4.5
    inner = set(det['inner_palaces'])
    both_in = rg_p in inner and sg_p in inner
    both_out = rg_p not in inner and sg_p not in inner
    if both_in:
        unit = '日/旬/月（皆内盘，近而快）'
    elif both_out:
        unit = '月/季/年（皆外盘，远而慢）'
    else:
        unit = '月（一内一外）'
    if det['star_fuyin'] or det['gate_fuyin']:
        unit += '；伏吟放大一档'
    if det['star_fanyin'] or det['gate_fanyin']:
        unit += '；反吟缩小一档'
    out['应期单位'] = unit

    # ④ 五类应期线索
    clues = []
    focus_palaces = None if focus is None else set(focus['宫'])
    if focus is not None:
        relevant = focus_palaces
        out = {'应期线索': clues, '应验事件': focus['应验事件'],
               '观察期限': focus['观察期限'], '候选宫': sorted(relevant),
               '应期状态': '候选待核' if relevant else '主用神待核，暂不定应期'}

    # (a) 空亡：填实(出旬)/冲实(对冲地支之日月)
    # 精度：奇门以"时柱旬首"起局(pan 内 xh=get_xun_head(hgz))，空亡同源于时旬。
    # 用 d['hgz'] 推精确旬空地支(如甲寅旬子丑空)，只取落在该空宫的那些支，
    # 避免四孟宫(坤2=未申/乾6=戌亥)把非旬空支也列进来。
    xu_kong_zhi = ()
    if d.get('hgz'):
        from pan_engine import get_xun_head, void_map
        xh = get_xun_head(d['hgz'])
        xu_kong_zhi = tuple(void_map.get(xh, ''))
    if det['void']:
        for vp in det['void']:
            if focus_palaces is not None and vp not in focus_palaces:
                continue
            cands = PALACE_BRANCH.get(vp, ())
            brs = tuple(b for b in cands if b in xu_kong_zhi) if xu_kong_zhi else cands
            if not brs:
                brs = cands
            chong = '/'.join(BRANCH_CHONG[b] for b in brs)
            clues.append(f"{PALACE_NAME[vp]}空亡→填实({'、'.join(brs)}日/出旬) 或 冲实({chong}日)")
    # (b) 马星：被冲动之时
    hp = det.get('horse')
    if hp and d.get('hgz') and (focus_palaces is None or hp in focus_palaces):
        from pan_engine import horse_branch
        branch = horse_branch[d['hgz'][1]]
        clues.append(f"马星在{PALACE_NAME[hp]}（{branch}）→逢冲({BRANCH_CHONG[branch]}日/月)为候选动期")
    # (c) 伏吟以冲、反吟以合
    if (focus is None or focus_palaces) and (det['star_fuyin'] or det['gate_fuyin']):
        clues.append('伏吟提示节奏偏缓，观察主用神受冲时是否有进展')
    if (focus is None or focus_palaces) and (det['star_fanyin'] or det['gate_fanyin']):
        clues.append('反吟提示过程反复，核对主用神逢合能否稳定')
    # (d) 入墓：冲墓之时
    for item in det.get('rumu', []):
        p = item['palace']
        if focus is not None and item['gan'] not in focus['干'].get(p, ()):
            continue
        tomb_branch = TOMB_BRANCH[p]
        clues.append(f"{item['gan']}临墓库地{PALACE_NAME[p]}，冲{tomb_branch}为{BRANCH_CHONG[tomb_branch]}；须关联主用神")
    # 庚临某干按天盘庚与该宫地盘干核对；寄干、合象不清时暂不定窗。
    if category == '走失' and (focus is None or focus.get('庚格')):
        gp = _palace_of('庚', d)
        if gp and gp not in det['void'] and d['gp'][gp] != '乙' and '乙' not in d['tp'][gp]:
            for label, field in [('年','ygz'),('月','mgz'),('日','rgz'),('时','hgz')]:
                if visible_stem(d[field]) == d['gp'][gp]:
                    clues.append(f"庚格候选：天盘庚临地盘{d['gp'][gp]}，对应{label}干；须复核主用神与观察期")
    out['应期线索'] = clues
    if focus is not None and focus_palaces and not clues:
        out['应期状态'] = '当前无相关线索，暂不定应期'
    # V2.4 期限锚定：观察期限此前只记录不参与裁决，此处把它落成对候选的使用约束。
    # 不改 应期线索/应期状态 的既有语义（兼容 selftest/test_event_details）。
    if focus is not None:
        horizon = (focus.get('观察期限') or '').strip()
        has_horizon = bool(horizon) and horizon != '未提供'
        has_clue = bool(clues)
        if has_horizon and has_clue:
            out['期限锚定'] = (f'已按观察期限「{horizon}」收窄：上列候选仅为线索，'
                              f'须逐条核对是否落在该期限内，写明触发条件与失效条件后取用。')
        elif has_horizon and not has_clue:
            out['期限锚定'] = (f'观察期限为「{horizon}」，但当前无填实/冲实/马动候选；'
                              f'按主用神旺衰与现实节点另核，不硬套日期。')
        elif not has_horizon and has_clue:
            out['期限锚定'] = ('未设观察期限：上列线索仅为候选，'
                              '补期限（如本周/月底/某节点）后方可定窗口，暂不落具体日期。')
        else:
            out['期限锚定'] = '未设观察期限且暂无应期线索，期限与候选两项须补，暂不定应期。'
    return out


def strategy(d, det):
    """人物策略取象字段（01-core 2.2）：四干+值符+值使落宫，标注人物角色与对日干生克。
    解决'同事代谈(月干)/上级协调(年干)'这类策略断语无输入的问题。"""
    out = {}
    rg_p = det['palaces']['日干']
    targets = {
        '年干': det['palaces']['年干'], '月干': det['palaces']['月干'],
        '日干': rg_p, '时干': det['palaces']['时干'],
        '值符': det['palaces']['值符星'], '值使门': det['palaces']['值使门'],
    }
    for name, pal in targets.items():
        if pal is None or pal == 5:
            out[name] = {'落宫': PALACE_NAME.get(pal, '中宫寄'), '角色': PERSON_ROLE[name]}
            continue
        rel = palace_relation(pal, rg_p, name+'宫', '日干宫')
        star = d['stars'].get(pal, '').replace('芮禽', '天芮')
        gate = d['gates'].get(pal, '')
        god = d['gods'].get(pal, '')
        out[name] = {'落宫': PALACE_NAME[pal], '角色': PERSON_ROLE[name],
                     '乘': f"{star}/{gate}/{god}", '对日干': rel,
                     '空亡': pal in det['void']}
    return out


def body_image(d, det):
    """脏腑类象字段（01-core 2.4）：天芮落宫=病灶脏腑，日干宫=自身对应脏腑。
    只给'关注部位'提示，不做医疗结论——健康类断语的'肺肝'类象由此可推。"""
    out = {}
    # 天芮（芮禽寄坤2）落宫
    rui_p = None
    for p, s in d['stars'].items():
        if s in ('天芮', '芮禽'):
            rui_p = p
            break
    if rui_p and rui_p in ORGAN:
        out['天芮病灶宫'] = {'落宫': PALACE_NAME[rui_p], '关注脏腑': ORGAN[rui_p],
                         '旺衰参': f"见【旺衰】月令项(旺相发展快/休囚发展慢)"}
    rg_p = det['palaces']['日干']
    if rg_p in ORGAN:
        out['日干本宫脏腑'] = ORGAN[rg_p]
    # 天心=医生/医药，乙奇=医药（健康类用神）
    xin_p = [p for p, s in d['stars'].items() if s == '天心']
    if xin_p:
        out['天心(医者)宫'] = PALACE_NAME[xin_p[0]]
    return out


# ---------- 盘眼识别（大师直觉的规则化） ----------

def eye_of_pan(d, det, category=None):
    """按优先级输出全局最影响决策的 1-3 个盘眼。
    P0 全局定调 → P1 关键结构 → P2 关键生克 → P3 变动信号
    D2/D3/D4 修复：天显伴伏吟降级、五不遇分场景、反吟中性化。"""
    eyes = []
    rg_tp = det['palaces']['日干']       # 天盘日干落宫（D1）
    sg_tp = det['palaces']['时干']

    def add(level, tag, desc, palace=None):
        eyes.append({'level': level, 'tag': tag, 'desc': desc,
                     'palace': PALACE_NAME.get(palace) if palace else None})

    # P0 全局定调（命中即为主盘眼，最多取2个P0）
    # D2 天显时格降级：与伏吟伴生（六甲时数学伴生）时不作"破局可动"主盘眼，
    #     降为 P1 注记，能否动交主用神生克裁决。案例库 6/6 天显例皆按伏吟宜静断。
    if det.get('tianxian'):
        if det['star_fuyin']:
            add('P1', '天显时格(伴伏吟)',
                '六甲值符虽透，但星门伏吟——不可据此断"可动"；须用神生克支持方可动，基调仍宜静')
        else:
            add('P0', '天显时格', '六甲之时值符透出——有破局之气，能否行动仍看主用神生克')
    # D3 五不遇时分场景：择日待客/健康诊断类不作一刀切否决
    if det.get('wubuyu'):
        if category == '择吉':
            add('P2', '五不遇时(择日分场景)',
                '时干与日干同阴阳且相克——动土/开业核心仪式忌，待客/迎亲等附属环节不忌')
        elif category not in ('求财', '出行', '官司'):
            add('P2', '五不遇时(事项提示)', '时干与日干同阴阳且相克——不作吉凶否决，仅作节奏提示')
        else:
            add('P0', '五不遇时', '时干与日干同阴阳且相克——求财/出行/诉讼推进吃力的节奏阻力；'
                '只作减分与提示，不单独否决成败，成败仍由主用神生克裁决')
    if det['fuyin']:
        add('P0', '星门俱伏吟', '天地人俱静——宜守不宜动、利主；行动策略是主客换位')
    if det['fanyin']:
        # D4 反吟中性化：变化放大器而非吉凶判定器，成败归主用神生克
        add('P0', '星门俱反吟', '天地俱反——反复多变、节奏快；"利客宜动"仅为节奏建议，成败看主用神生克')
    if det['star_fuyin'] and not det['gate_fuyin']:
        add('P0', '仅星伏吟', '天时停滞但人事通道仍开——环境不动，人可小步试')
    if det['gate_fuyin'] and not det['star_fuyin']:
        add('P0', '仅门伏吟', '人事停滞但天时有变——事推不动，等时机或换路径')
    if det['star_fanyin'] and not det['gate_fanyin']:
        add('P0', '仅星反吟', '天时反复而人事尚稳——外部环境多变，锁紧内部节奏')

    if det['gate_fanyin'] and not det['star_fanyin']:
        add('P0', '仅门反吟', '过程反复；由主用神与实际条件判断是否推进')

    # P1 关键结构
    if d['zf_pal'] in det['void']:
        add('P1', '值符落空', '核心支撑力量虚悬——值符所代表的支持条件待核', d['zf_pal'])
    if det['rg_void']:
        add('P1', '日干落空', '自身状态不实——先实后动，勿强行推进', rg_tp)
    if det['rg_rumu']:
        add('P1', '日干临墓库地', '核对该干月令旺衰，再分墓、库或待定', rg_tp)
    if det['rg_jixing']:
        add('P1', '日干击刑', '自身受刑——行事须防内伤与自耗', rg_tp)

    # P2 关键生克
    rel = det['rg_sg_rel']
    # 这三条由日干宫/时干宫的固定生克产生，是同一局盘面固有属性，与问哪件事无关。
    # 故显式标注"盘面固有、非本问专属"，避免被误读为本问的吉象或败象。
    fixed = '【盘面固有·非本问专属】由日干宫与时干宫固定生克得出，同一时刻各问皆同，不单独作本问成败依据。'
    if rel in ('日干宫生时干宫', '时干宫生日干宫'):
        add('P2', '人与事相生', rel + '，结合用神与阻力复核。' + fixed)
    elif rel == '日干宫克时干宫':
        add('P2', '人可控事', '主动权在求测人——可按计划推进。' + fixed)
    elif rel == '时干宫克日干宫':
        add('P2', '事压人', '事态强于人——勿硬顶，宜借力或缓行。' + fixed)

    # P3 变动信号
    if det['horse'] is not None and det['horse'] in (rg_tp, sg_tp):
        targets = [role for role in ('日干','时干') if det['palaces'][role] == det['horse']]
        add('P3', '马星临' + '、'.join(targets) + '宫', '按所临角色区分本人或事项的变动候选', det['horse'])
    for m in det['men_po']:
        if m['palace'] in (rg_tp, sg_tp):
            add('P3', '用神宫门迫', '门克宫——执行受阻，事倍功半', m['palace'])
            break

    # 主盘眼 = 最前面的 P0，无 P0 则取 P1；总输出 ≤3 条
    eyes.sort(key=lambda e: e['level'])
    main = eyes[0] if eyes else None
    return {'main': main, 'eyes': eyes[:3]}


# ---------- 用神定位（确定性部分） ----------

def locate(d, category, gender=None, *, symbols=None):
    """按类别定位用神落宫。gender 仅对'婚姻'生效：男测婚姻主看庚，女测主看乙。
    角色符号（日干/时干/值符等）直接取 pan() 已算出的落宫，不重新搜盘。"""
    # D1 修复：四干用神取天盘落宫（值符/值使本就是星门，落宫不变）
    role_map = {'日干': d.get('rg_tp') or d['rg'], '时干': d.get('sg_tp') or d['sg'],
                '年干': d.get('yg_tp') or d['yg_pal'], '月干': d.get('mg_tp') or d['mg_pal'],
                '值符': d['zf_pal'], '值使': d['zs']}
    shen = symbols if symbols is not None else CATEGORY_SHEN.get(category, ['日干', '时干'])
    out, lines = {}, []
    for name in shen:
        if name == '乙' and gender == '男':
            note = '（女用神，男测为辅）'
        elif name == '庚' and gender == '女':
            note = '（男用神，女测为辅）'
        else:
            note = ''
        p = role_map.get(name)
        if p is None:
            p = _palace_of(name, d)
        out[name] = p
        lines.append(f"  {name}{note} → 落{PALACE_NAME.get(p, '?')}")
    # 基础四干（天盘落宫口径；地盘宫另列供旺衰参考）
    out['日干宫'] = d.get('rg_tp') or d['rg']; out['时干宫'] = d.get('sg_tp') or d['sg']
    out['年干宫'] = d.get('yg_tp') or d['yg_pal']; out['年命干宫'] = None; out['月干宫'] = d.get('mg_tp') or d['mg_pal']
    out['日干宫_地盘'] = d['rg']; out['时干宫_地盘'] = d['sg']
    return {'category': category, 'core': tuple(shen), 'shen': out, 'text': '\n'.join(lines)}


# ---------- 总入口 ----------

def analyze(d, category=None, gender=None, ganzhi=None, year_life=None, *, scope=None):
    """断局输入包总入口。
    d = pan_engine.pan() 结果
    category = 用神类别（求财/事业官运/婚姻/健康/官司/考试/出行/走失/择吉/天气/风水阳宅/风水阴宅）
    gender = '男'/'女'（仅婚姻类生效）
    ganzhi = 'X年 X月 X日 X时'（用于天显时格/五不遇时检测）
    year_life = 求测人出生年干支，如'庚戌'（M4 年命落宫/犯太岁；与四柱年干=太岁区分）"""
    if ganzhi is None and all(d.get(k) for k in ('ygz', 'mgz', 'rgz', 'hgz')):
        ganzhi = f"{d['ygz']}年 {d['mgz']}月 {d['rgz']}日 {d['hgz']}时"
    if category == '终身局' and year_life is None:
        year_life = d['ygz']
    main_symbol = scope['主用神'] if scope is not None else None
    rule_focus = (main_symbol or '') if scope is not None else None
    det = detect(d, ganzhi=ganzhi, category=category, main_symbol=rule_focus)
    det['input_notes'] = d.get('input_notes', [])
    eye = eye_of_pan(d, det, category=category)
    core_symbols = scope['用神'] if scope is not None else None
    loc = locate(d, category, gender, symbols=core_symbols) if category else None
    # M4 年命落宫：出生年干取天盘落宫，判与日干生克/犯太岁
    if year_life:
        from pan_engine import real_palace_tp, valid_gz
        if not valid_gz(year_life):
            raise ValueError(f"非法年命干支 '{year_life}'：须为合法六十甲子（阴阳同配，"
                             f"如庚戌、乙卯合法，庚卯、乙子非法）。请核对出生年干支。")
        yl_pal = real_palace_tp(d, year_life)
        if yl_pal:
            yl_rel = palace_relation(yl_pal, det['palaces']['日干'], '年命宫', '日干宫')
            det['year_life'] = {'干支': year_life, '落宫': PALACE_NAME[yl_pal],
                                '落空': yl_pal in d['void'], '与日干': yl_rel}
            if loc:
                loc['shen']['年命干宫'] = yl_pal
    # M2 用神宫八神/九星取向 + M6 取数：按用神落宫附符号取向（交给 format_package 输出）
    # 仅对核心用神（CATEGORY_SHEN 定义项）出取向，排除 日干宫/时干宫/*_地盘 等辅助项
    sym = {}
    if loc:
        core = set(loc['core'])
        inner = INNER_PALACES.get(bool(d['yg']), {1, 8, 3, 4})
        for name, pal in loc['shen'].items():
            if name not in core or pal is None or pal == 5:
                continue
            god = d['gods'].get(pal); star = d['stars'].get(pal, '').replace('芮禽', '天芮')
            ke = det['keying'].get(PALACE_NAME[pal], {})
            roles = {'日干':'rgz', '时干':'hgz', '年干':'ygz', '月干':'mgz'}
            stem = visible_stem(d[roles[name]]) if name in roles else name
            if stem in GAN_LIST and len(stem) == 1:
                ke = next((row for row in ke.get('逐干', []) if row['天盘干'] == stem), {})
            sym[name] = {
                '组合': ke.get('组合', '待核'),
                '宫': PALACE_NAME.get(pal), '内外': '内盘' if pal in inner else '外盘',
                '星': star, '星取向': STAR_ORIENT.get(star, ''),
                '神': god, '神取向': GOD_ORIENT.get(god, ''),
                '克应': ke.get('格局', '—'), '吉凶': ke.get('吉凶', '平'),
            }
    # 断语层补强四字段：旺衰(应期前置) → 应期取数 → 人物策略 → 脏腑类象
    wang = wangshuai(d, det, ganzhi=ganzhi)
    focus = None
    if scope is not None:
        subjects = loc['shen']
        main = subjects.get(main_symbol)
        selected = scope['应期用神']
        direct = {name: subjects[name] for name in selected if main and subjects.get(name)}
        stems = {}
        stem_roles = {'日干':'rgz', '时干':'hgz', '年干':'ygz', '月干':'mgz'}
        for name, pal in direct.items():
            stem = visible_stem(d[stem_roles[name]]) if name in stem_roles else name
            if len(stem) == 1 and stem in GAN_LIST:
                stems.setdefault(pal, set()).add(stem)
        focus = {'宫': set(direct.values()), '干': stems,
                 '应验事件': scope['观察结果'], '观察期限': scope['观察期限'],
                 '庚格': bool(main and scope['问项'] != '通用' and '庚' in scope['用神'])}
        if main:
            zq = det['zhishi_quality']
            zq['与主用神'] = palace_relation(d['zs'], main, '值使宫', main_symbol+'宫')
            layers = {'神':d['gods'][main], '门':d['gates'][main], '星':d['stars'][main],
                      '天地盘干': [r['组合'] for r in det['keying'][PALACE_NAME[main]]['逐干']]}
            scope = dict(scope, 主用神宫=PALACE_NAME[main],
                         主用神取象=[(key, layers[key]) for key in scope['取象顺序']],
                         主用神与日干=palace_relation(main, det['palaces']['日干'], main_symbol+'宫','日干宫'))
    yq = yingqi(d, det, wang, ganzhi=ganzhi, category=category, focus=focus)
    st = strategy(d, det)
    bd = body_image(d, det) if category in ('健康','终身局') else {}
    checks = review_palaces(d, det, loc, year_life)
    tendency = verdict_tendency({'locate': loc, 'symbols': sym, 'review': checks, 'eye': eye}, scope, category)
    return {'scope': scope, 'review': checks, 'detect': det, 'eye': eye, 'locate': loc, 'symbols': sym,
            'wangshuai': wang, 'yingqi': yq, 'strategy': st, 'body': bd, 'tendency': tendency}


def seasonal_grade(element, month_branch):
    season = SEASON_ELEMENT[SEASON_BY_BRANCH[month_branch]]
    if season == element:
        return '旺'
    if GENERATES[season] == element:
        return '相'
    if GENERATES[element] == season:
        return '休'
    return '死' if KE[season] == element else '囚'


def review_palaces(d, det, loc, year_life):
    """以同宫共享的盘面事实为索引；干的旺衰、刑墓各归其干。"""
    roles = {'日干': det['palaces']['日干'], '时干': det['palaces']['时干']}
    if loc:
        for name in loc['core']:
            roles[name] = loc['shen'].get(name)
    if year_life:
        from pan_engine import real_palace_tp
        roles['年命'] = real_palace_tp(d, year_life)
    month = d['mgz'][1]
    facts = {}
    for role, pal in roles.items():
        if not pal:
            continue
        if pal not in facts:
            gate = d['gates'][pal]
            stem_rows = []
            for row in det['keying'][PALACE_NAME[pal]]['逐干']:
                stem = row['天盘干']
                grade = seasonal_grade(gan_wuxing[stem], month)
                strong = grade in ('旺','相')
                stem_rows.append(dict(row, 月令=grade,
                    空亡层次=('假空候选' if strong else '真空候选') if pal in d['void'] else '未落空',
                    墓库层次=('入库候选' if strong else '入墓候选') if row['墓库候选'] else '未临墓库地'))
            stars = ['天芮','天禽'] if d['stars'][pal] == '芮禽' else [d['stars'][pal]]
            facts[pal] = {'宫': PALACE_NAME[pal], '角色': [], '月支': month,
                          '门': gate, '门月令': seasonal_grade(gate_wuxing[gate], month),
                          '门宫关系': gate_palace_relation(gate, pal),
                          '星月令': {star: XING_WANG[SEASON_BY_BRANCH[month]].get(star,'待核') for star in stars},
                          '神': d['gods'][pal], '落空': pal in d['void'], '逐干': stem_rows}
        facts[pal]['角色'].append(role)
    return facts


def gate_palace_relation(gate, pal):
    g, p = gate_wuxing[gate], palace_wuxing[pal]
    if g == p:
        return '比和'
    if KE[g] == p:
        return '门迫'
    if KE[p] == g:
        return '门制'
    return '门生宫' if GENERATES[g] == p else '宫生门'


def format_package(pkg):
    """把输入包格式化为给 LLM 的紧凑文本。"""
    det, eye, loc = pkg['detect'], pkg['eye'], pkg['locate']
    sym = pkg.get('symbols', {}) or {}
    L = []
    L.extend(det.get('input_notes', []))
    scope = pkg.get('scope')
    if scope:
        L.append(f"【本问】{scope['问项']}｜主用神 {scope['主用神'] or '待核'}｜{scope['取用依据']}")
        L.append(f"  观察结果 {scope['观察结果']}，期限 {scope['观察期限']}")
        L.append(f"  主客 {scope['角色']}，行动顺序 {scope['行动顺序']}")
        L.append(f"  {scope['代问说明']}")
        L.append(f"  神门取用 {scope['神门重点']}，当前阶段 {scope['阶段']}")
        if scope.get('主用神与日干'):
            L.append(f"  核心生克 {scope['主用神与日干']}")
            lines = '；'.join(f"{name} {'、'.join(value) if isinstance(value, list) else value}"
                             for name, value in scope['主用神取象'])
            L.append(f"  主用神宫 {scope['主用神宫']}，取象依次为 {lines}")
    L.append('【大局格局】')
    ft = det['fuyin_type']; fy = det['fanyin_type']
    if ft: L.append(f"  伏吟：{ft}（星伏吟={det['star_fuyin']} 门伏吟={det['gate_fuyin']}）")
    if fy: L.append(f"  反吟：{fy}（星反吟={det['star_fanyin']} 门反吟={det['gate_fanyin']}）")
    if not ft and not fy:
        L.append('  伏吟/反吟：均无')
    if det.get('tianxian'): L.append('  天显时格：是')
    if det.get('wubuyu'): L.append('  五不遇时：是')
    L.append(f"  旬空宫：{'、'.join(PALACE_NAME[p] for p in det['void']) or '无'}")
    L.append(f"  马星：{PALACE_NAME.get(det['horse'], '无')}")
    if det['jixing']:
        L.append(f"  击刑：{'、'.join(t['gan']+'落'+PALACE_NAME[t['palace']] for t in det['jixing'])}")
    if det['rumu']:
        L.append(f"  墓库候选：{'、'.join(t['gan']+'落'+PALACE_NAME[t['palace']] for t in det['rumu'])}")
    if det['men_po']:
        L.append(f"  门迫：{'、'.join(m['gate']+PALACE_NAME[m['palace']] for m in det['men_po'])}")
    L.append(f"  日干宫 vs 时干宫：{det['rg_sg_rel']}")

    L.append('')
    # 成败裁决口径（V2.2）：防止 P0 盘眼（五不遇时/值符落空）被当成成败结论，
    # 盖过主用神生克。盘眼=节奏与阻力，主用神=成败方向，两者不可混用。
    if scope and scope.get('主用神'):
        main_sym = scope['主用神']
        sym_row = sym.get(main_sym, {})
        L.append('【成败裁决口径】(先读此段，再看盘眼)')
        L.append(f"  成败只看主用神「{main_sym}」的生克旺衰：本包已把它已定位的落宫/克应/吉凶列在下方『用神宫符号取向』。")
        if sym_row:
            L.append(f"  主用神当前：{sym_row.get('宫','?')}·{sym_row.get('克应','—')}({sym_row.get('吉凶','平')})"
                     f"｜星 {sym_row.get('星','')}｜神 {sym_row.get('神','')}")
        L.append('  盘眼(P0/P1)只描述节奏快慢与推进阻力——五不遇时、值符落空、反吟均为减分项，不是成败结论。')
        L.append('  主用神旺相得生→倾向成；休囚受克/空墓→倾向败；盘眼只调整力度与应期，不得单独反转主用神方向。')
        t = pkg.get('tendency')
        if t:
            L.append(f"【成败倾向结论】{t['倾向']}（确定性信号基线，信心{t['信心']}，得分{t['得分']:+g}）")
            for ev in t['证据']:
                L.append(f"  · {ev}")
            L.append(f"  {t['说明']}")
        L.append('')
    L.append('【盘眼】（最影响决策的信号，按优先级）')
    if eye['main']:
        m = eye['main']
        L.append(f"  ◆ 主盘眼[{m['level']}] {m['tag']}：{m['desc']}" +
                 (f"（{m['palace']}）" if m['palace'] else ''))
        for e in eye['eyes'][1:]:
            L.append(f"  ○ {e['level']} {e['tag']}：{e['desc']}" +
                     (f"（{e['palace']}）" if e['palace'] else ''))
    else:
        L.append('  无强盘眼——按常规生克旺衰断')

    L.append('')
    L.append('【关键落宫】(天盘口径)')
    for k, v in det['palaces'].items():
        inner = det['内外盘'].get(k, '')
        L.append(f"  {k}：{PALACE_NAME.get(v, '?')}" + (f" [{inner}]" if inner else ''))

    # M1 全宫克应格局：8宫天盘干+地盘干组合全列（非仅用神宫）。
    # 价值：值符宫/开门宫等非用神宫的格局（如辛+丙=干合悖师，注"合作求财易致讼"）不再漏断。
    keying = det.get('keying', {})
    if keying:
        L.append('')
        L.append('【全宫克应格局】(8宫天盘+地盘→格局/吉凶；非用神宫也需扫，防漏断)')
        for p in (1, 2, 3, 4, 6, 7, 8, 9):
            ke = keying.get(PALACE_NAME[p])
            if ke:
                for row in ke.get('逐干', [ke]):
                    L.append(f"  {PALACE_NAME[p]}：{row['组合']} {row['格局']}({row['吉凶']}) {row.get('位置','')}")

    # M5 值使门过程质量
    zq = det.get('zhishi_quality')
    if zq:
        L.append('')
        L.append(f"【值使门·过程】{zq['门']}落{zq['落宫']}，{zq['门宫关系']}，月令{zq['月令']}，"
                 f"{'落空' if zq['旬空'] else '未落空'}，{zq['与日干']}"
                 + (f"，{zq['与主用神']}" if zq.get('与主用神') else ''))

    # M4 年命落宫
    if det.get('year_life'):
        yl = det['year_life']
        L.append('')
        L.append(f"【年命】{yl['干支']}落{yl['落宫']}" +
                 ("(落空)" if yl['落空'] else "") + f"：{yl['与日干']}")

    # M9 一票否决信号
    if det.get('veto'):
        L.append('')
        L.append('【事业约束候选】逐项复核用神与强度')
        for v in det['veto']:
            L.append(f"  ⚠ {v}")

    if loc:
        L.append('')
        L.append(f"【用神定位】（{loc['category']}）")
        L.append(loc['text'])
        # M1/M2 用神宫克应 + 星神取向
        sym = pkg.get('symbols', {})
        if sym:
            L.append('')
            L.append('【用神宫符号取向】(克应+八神九星，随场景变——勿机械套吉凶)')
            for name, s in sym.items():
                L.append(f"  {name}@{s['宫']}[{s['内外']}]：{s['克应']}({s['吉凶']})"
                         f" | {s['星']}·{s['星取向']} | {s['神']}·{s['神取向']}")
            flips = [f"{k}→{v}" for k, v in KE_YING_FLIP.items() if any(x['克应'] == k for x in sym.values())]
            if flips:
                L.append(f"  ※用神为天盘主动方时格局翻转：{'；'.join(flips)}")

    # 断语层补强四字段输出
    wang = pkg.get('wangshuai', {})
    if wang:
        L.append('')
        L.append('【旺衰】(落宫五行+十二长生+月令；旺取成数/衰取生数的前置)')
        for k, v in wang.items():
            if isinstance(v, dict):
                L.append(f"  {k}：{' '.join(f'{kk}={vv}' for kk, vv in v.items())}")
            else:
                L.append(f"  {k}：{v}")

    yq = pkg.get('yingqi', {})
    if scope and yq:
        L.append(f"【本问应期】观察 {yq['应验事件']}，期限 {yq['观察期限']}，{yq['应期状态']}")
        if yq['候选宫']:
            L.extend(f"  · {c}" for c in yq['应期线索'])
        if yq.get('期限锚定'):
            L.append(f"  期限锚定：{yq['期限锚定']}")
        L.append('  如采用某候选，写明与主用神、现实节点的关联和失效条件。')
    elif yq:
        L.append('')
        L.append('【应期取数】(候选线索,非定论——落年/月/日交场景裁决)')
        tn = yq['时干宫数']
        L.append(f"  时干宫{tn['宫']}：后天{tn['后天']}/先天{tn['先天']}/五行{tn['五行生数']},{tn['五行成数']}"
                 f" | 档:{yq['取数档']} | 推荐取数:{yq['推荐取数']}")
        L.append(f"  单位判定：{yq['应期单位']}")
        if yq['应期线索']:
            for c in yq['应期线索']:
                L.append(f"  · {c}")

    st = pkg.get('strategy', {})
    if st:
        L.append('')
        L.append('【人物策略取象】(落宫+角色+对日干生克——同事代谈/上级协调的策略依据)')
        for name, v in st.items():
            line = f"  {name}：{v['落宫']}·{v['角色']}"
            if '乘' in v:
                line += f" 乘{v['乘']} | 对日干:{v['对日干']}" + ("(空亡)" if v['空亡'] else "")
            L.append(line)

    bd = pkg.get('body', {})
    if bd:
        L.append('')
        L.append('【脏腑类象】(仅部位提示,不作医疗结论)')
        for k, v in bd.items():
            if isinstance(v, dict):
                L.append(f"  {k}：{v.get('落宫','')} {v.get('关注脏腑','')}")
            else:
                L.append(f"  {k}：{v}")
    if pkg.get('review'):
        L.append('【重点宫校验】同宫事实只登记一次；空墓层次与救应须合参')
        for row in pkg['review'].values():
            L.append(f"  {row['宫']}（{'、'.join(row['角色'])}）{row['月支']}月；{row['门']} {row['门月令']}，{row['门宫关系']}；星{row['星月令']}，神{row['神']}")
            for stem in row['逐干']:
                sources = '（' + '、'.join(stem['墓库依据']) + '）' if stem['墓库依据'] else ''
                L.append(f"    {stem['天盘干']} {stem['位置']}：月令{stem['月令']}，{stem['空亡层次']}，"
                         f"{stem['墓库层次']}{sources}，击刑{'是' if stem['击刑'] else '否'}")
        L.append('救应待核：写明触发条件、能减轻的限制和仍然存在的阻力。')
    return '\n'.join(L)
