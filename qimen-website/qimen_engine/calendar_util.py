# -*- coding: utf-8 -*-
"""
calendar_util.py · 万年历 + 节气定局 + 真太阳时（供 auto_pan 自动排盘）

功能链：公历时间 → 真太阳时校正 → 四柱干支 → 拆补法定局 → 调 pan_engine.pan() 出盘

历法要点（张志春拆补法体系）：
- 日柱锚点：J2000（2000-01-01）= 戊午日；交叉锚点 1900-01-01 = 甲戌日（自洽验证）
- 年柱以立春为界；月柱以十二节为界，月干用五虎遁
- 时柱以 23:00 起为次日子时（zi_mode='change'，主流做法），可切 'keep'（晚子时不换日）
- 定局：冬至后阳遁/夏至后阴遁；日柱找符头（最近甲/己日）；符头地支定三元；查节气用局表
- 真太阳时 = 北京时间 + (地方经度-120°)×4分钟 + 均时差
"""

import math
from datetime import datetime

GAN = '甲乙丙丁戊己庚辛壬癸'
ZHI = '子丑寅卯辰巳午未申酉戌亥'
JIAZI = [GAN[i % 10] + ZHI[i % 12] for i in range(60)]

# ---------- 基础历法 ----------

def jdn(y, m, d):
    """公历 → 儒略日数（整数，格里历）"""
    a = (14 - m) // 12
    yy = y + 4800 - a
    mm = m + 12 * a - 3
    return d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - yy // 100 + yy // 400 - 32045


def jd_to_ymd(jd):
    """儒略日数（整数）→ 公历 (y, m, d)"""
    a = jd + 32044
    b = (4 * a + 3) // 146097
    c = a - 146097 * b // 4
    dd = (4 * c + 3) // 1461
    e = c - 1461 * dd // 4
    mth = (5 * e + 2) // 153
    day = e - (153 * mth + 2) // 5 + 1
    month = mth + 3 - 12 * (mth // 10)
    year = 100 * b + dd - 4800 + (mth // 10)
    return year, month, day


BASE_JDN = 2451545          # 2000-01-01
BASE_IDX = 54               # 戊午

def day_gz(y, m, d):
    """日柱干支"""
    return JIAZI[(jdn(y, m, d) - BASE_JDN + BASE_IDX) % 60]


def year_gz(year):
    """年柱干支（不考虑立春分界，分界在 bazi() 里处理）"""
    return JIAZI[(year - 4) % 60]


# ---------- 节气（Meeus 低精度太阳黄经，精度约±15分钟） ----------

TERMS = ['春分','清明','谷雨','立夏','小满','芒种','夏至',
         '小暑','大暑','立秋','处暑','白露','秋分',
         '寒露','霜降','立冬','小雪','大雪','冬至',
         '小寒','大寒','立春','雨水','惊蛰']
TERM_LAM = {name: i * 15 for i, name in enumerate(TERMS)}   # 春分0°起，每15°一个


def sun_lambda(jd):
    """太阳视黄经（度）。jd 为儒略日（含小数，UT）"""
    T = (jd - 2451545.0) / 36525.0
    L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360
    M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360
    Mr = math.radians(M)
    C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * math.sin(Mr) \
        + (0.019993 - 0.000101 * T) * math.sin(2 * Mr) \
        + 0.000289 * math.sin(3 * Mr)
    omega = math.radians((125.04 - 1934.136 * T) % 360)
    return (L0 + C - 0.00569 - 0.00478 * math.sin(omega)) % 360


def term_jd(year, lam_target):
    """该年太阳黄经到达 lam_target 的儒略日（UT，含小数）。
    粗估锚点：year 年 1 月 1 日正午太阳黄经约 280°；每个节气从该锚点
    按黄经差顺推，保证 24 个节气全部落在公历 year 年内，再迭代收敛。"""
    est = jdn(year, 1, 1) + 0.5 + ((lam_target - 280) % 360) / 360.0 * 365.2422
    for _ in range(5):
        diff = ((lam_target - sun_lambda(est) + 180) % 360) - 180
        est += diff / 0.9856
    return est


def term_dates_beijing(year):
    """该年24节气在北京时间下的日期+时刻表 {节气名: (y,m,d,hour_float)}"""
    out = {}
    for name in TERMS:
        jd = term_jd(year, TERM_LAM[name])
        local = jd + 8 / 24          # 北京时间 = UT + 8h
        jdn_int = int(math.floor(local + 0.5))
        hour_f = (local + 0.5 - jdn_int) * 24.0   # 当地钟点（含小数）
        y, m, d = jd_to_ymd(jdn_int)
        out[name] = (y, m, d, hour_f)
    return out


def time_key(y, m, d, hour=12.0):
    """连续时间键（儒略日+当日时刻占比），用于交节时刻级别的比较"""
    return jdn(y, m, d) + hour / 24.0


# 节气定局表：节气 → (阴阳, 上元, 中元, 下元)（张志春拆补法标准）
JU_TABLE = {
    '冬至': ('阳', 1, 7, 4), '小寒': ('阳', 2, 8, 5), '大寒': ('阳', 3, 9, 6),
    '立春': ('阳', 8, 5, 2), '雨水': ('阳', 9, 6, 3), '惊蛰': ('阳', 1, 7, 4),
    '春分': ('阳', 3, 9, 6), '清明': ('阳', 4, 1, 7), '谷雨': ('阳', 5, 2, 8),
    '立夏': ('阳', 4, 1, 7), '小满': ('阳', 5, 2, 8), '芒种': ('阳', 6, 3, 9),
    '夏至': ('阴', 9, 3, 6), '小暑': ('阴', 8, 2, 5), '大暑': ('阴', 7, 1, 4),
    '立秋': ('阴', 2, 5, 8), '处暑': ('阴', 1, 4, 7), '白露': ('阴', 9, 3, 6),
    '秋分': ('阴', 7, 1, 4), '寒露': ('阴', 6, 9, 3), '霜降': ('阴', 5, 8, 2),
    '立冬': ('阴', 6, 9, 3), '小雪': ('阴', 5, 8, 2), '大雪': ('阴', 4, 7, 1),
}

YUAN_BY_BRANCH = {'子': '上', '午': '上', '卯': '上', '酉': '上',
                  '寅': '中', '申': '中', '巳': '中', '亥': '中',
                  '辰': '下', '戌': '下', '丑': '下', '未': '下'}
YUAN_ORDER = {'上': 0, '中': 1, '下': 2}

CN_NUM = {1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
          6: '六', 7: '七', 8: '八', 9: '九', 10: '十'}


def determine_ju(y, m, d, hour=12.0, day_ganzhi=None, term_cache={}):
    """拆补法定局：给定公历日期时刻 → dict(节气, 阴阳, 局数, 符头, 元)
    节气归属按交节【时刻】判（不是按日期），交节当天上午/下午可能属不同节气。
    day_ganzhi：四柱日柱（晚子时换日后的日柱），用于符头计算；不传则按公历日期算。"""
    if y not in term_cache:
        term_cache[y] = term_dates_beijing(y)
    dates = term_cache[y]

    # 当前节气：在已交节的节气里取「时刻最大」的那个
    t_now = time_key(y, m, d, hour)
    cur_term, cur_key = None, None
    for name in TERMS:
        ty, tm, td, th = dates[name]
        key = time_key(ty, tm, td, th)
        if key <= t_now and (cur_key is None or key > cur_key):
            cur_term, cur_key = name, key
    if cur_term is None:
        # 跨年窗口：y年小寒（1月上旬）之前的日期，节气仍属上一年冬至 → 阳遁
        cur_term = '冬至'

    yin_yang, up, mid, low = JU_TABLE[cur_term]

    # 符头：从日柱往前找最近的甲/己日（含当日）。甲/己在60甲子中索引%5==0
    # 晚子时换日时须用换日后的日柱（day_ganzhi），否则符头与三元全错
    if day_ganzhi:
        i0 = JIAZI.index(day_ganzhi)
    else:
        J = jdn(y, m, d)
        i0 = (J - BASE_JDN + BASE_IDX) % 60
    futou_idx = i0 - (i0 % 5)
    futou = JIAZI[futou_idx]
    yuan = YUAN_BY_BRANCH[futou[1]]
    ju_num = (up, mid, low)[YUAN_ORDER[yuan]]
    return {'term': cur_term, 'yin_yang': yin_yang, 'ju': ju_num,
            'futou': futou, 'yuan': yuan}


def ju_str(info):
    return f"{info['yin_yang']}遁{CN_NUM[info['ju']]}局"


# ---------- 真太阳时 ----------

CITY_LON = {
    '北京': 116.41, '上海': 121.47, '广州': 113.27, '深圳': 114.06,
    '杭州': 120.16, '南京': 118.78, '成都': 104.07, '重庆': 106.55,
    '西安': 108.94, '武汉': 114.31, '郑州': 113.63, '济南': 117.12,
    '天津': 117.20, '沈阳': 123.43, '哈尔滨': 126.63, '长春': 125.32,
    '太原': 112.55, '石家庄': 114.51, '合肥': 117.28, '福州': 119.30,
    '厦门': 118.09, '长沙': 112.94, '南宁': 108.33, '海口': 110.20,
    '贵阳': 106.63, '昆明': 102.83, '兰州': 103.83, '西宁': 101.78,
    '银川': 106.23, '乌鲁木齐': 87.62, '拉萨': 91.11, '呼和浩特': 111.75,
    '青岛': 120.38, '大连': 121.62, '苏州': 120.58, '宁波': 121.55,
}


def equation_of_time_minutes(y, m, d):
    """均时差（分钟）。B = 2π(N-81)/364，N=年积日"""
    N = jdn(y, m, d) - jdn(y, 1, 1) + 1
    B = 2 * math.pi * (N - 81) / 364
    return 9.87 * math.sin(2 * B) - 7.53 * math.cos(B) - 1.5 * math.sin(B)


def true_solar_time(y, m, d, hour, minute, longitude=120.0):
    """真太阳时。返回 (年,月,日, 真太阳时小时数浮点)"""
    lst_offset = (longitude - 120.0) * 4 / 60
    eot = equation_of_time_minutes(y, m, d) / 60
    t = hour + minute / 60.0 + lst_offset + eot
    yy, mm, dd = y, m, d
    if t < 0:
        yy, mm, dd = jd_to_ymd(jdn(y, m, d) - 1)
        t += 24
    elif t >= 24:
        yy, mm, dd = jd_to_ymd(jdn(y, m, d) + 1)
        t -= 24
    return yy, mm, dd, t


# ---------- 四柱 ----------

WUHUDUN = {'甲': '丙', '己': '丙', '乙': '戊', '庚': '戊',
           '丙': '庚', '辛': '庚', '丁': '壬', '壬': '壬', '戊': '甲', '癸': '甲'}
WUSHUDUN = {'甲': '甲', '己': '甲', '乙': '丙', '庚': '丙',
            '丙': '戊', '辛': '戊', '丁': '庚', '壬': '庚', '戊': '壬', '癸': '壬'}

# 十二节按公历时间排序（小寒1月 → 大雪12月），及其对应月支
JIE_ORDER = ['小寒', '立春', '惊蛰', '清明', '立夏', '芒种',
             '小暑', '立秋', '白露', '寒露', '立冬', '大雪']
JIE_MZHI = {'小寒': '丑', '立春': '寅', '惊蛰': '卯', '清明': '辰',
            '立夏': '巳', '芒种': '午', '小暑': '未', '立秋': '申',
            '白露': '酉', '寒露': '戌', '立冬': '亥', '大雪': '子'}


def bazi(y, m, d, hour, minute, longitude=120.0, use_true_solar=True, zi_mode='change'):
    """公历时间 → 四柱 dict。日柱/时柱按真太阳时（可选），年柱立春界、月柱节界。"""
    if use_true_solar:
        ry, rm, rd, t = true_solar_time(y, m, d, hour, minute, longitude)
    else:
        ry, rm, rd, t = y, m, d, hour + minute / 60.0

    # 时辰：23点起为次日子时（zi_mode='change'）
    hh = int(t)
    if zi_mode == 'change' and hh >= 23:
        ry2, rm2, rd2 = jd_to_ymd(jdn(ry, rm, rd) + 1)
        day = day_gz(ry2, rm2, rd2)
    else:
        day = day_gz(ry, rm, rd)

    # 时柱：五鼠遁（以「所用日柱」起）。hh>=23 时按次日子时
    h_idx = ((hh + 1) // 2) % 12
    hzhi = ZHI[h_idx]
    hgan = GAN[(GAN.index(WUSHUDUN[day[0]]) + h_idx) % 10]
    hour_gz = hgan + hzhi

    # 年柱/月柱判界统一用【北京时间】（节气表口径）；日柱/时柱用真太阳时（影响子时归属）
    t_bj = time_key(y, m, d, hour + minute / 60.0)

    # 年柱：立春为界（按交节【时刻】判）
    ty, tm_, td, th = term_dates_beijing(y)['立春']
    year = year_gz(y - 1) if t_bj < time_key(ty, tm_, td, th) else year_gz(y)

    # 月柱：按公历序取「最近已交节（含时刻）」，五虎遁起月干
    dates = term_dates_beijing(y)
    cur_jie = None
    for jie in JIE_ORDER:
        jy, jm, jd_, jh = dates[jie]
        if t_bj >= time_key(jy, jm, jd_, jh):
            cur_jie = jie
    if cur_jie is None:
        cur_jie = '大雪'   # 1月上旬未过小寒 → 上年大雪之后的子月
    mzhi = JIE_MZHI[cur_jie]
    # 月干偏移：从寅月(索引2)数起，月序偏移必须先 mod 12（月循环）再 mod 10（干循环）
    # 否则子月(偏移10)/丑月(11)会错——如己酉年子月应为丙子而非甲子
    gan_offset = (ZHI.index(mzhi) - 2) % 12
    mgan = GAN[(GAN.index(WUHUDUN[year[0]]) + gan_offset) % 10]
    month = mgan + mzhi

    return {'year': year, 'month': month, 'day': day, 'hour': hour_gz,
            'ts_y': ry, 'ts_m': rm, 'ts_d': rd, 'ts_hour': t}


# ---------- 自动排盘 ----------

def parse_dt(dt_str):
    """'2026-07-11 21:50' / '2026/7/11 21:50:30' → (y,m,d,h,mi)"""
    dt_str = dt_str.strip()
    if ' ' in dt_str:
        dpart, tpart = dt_str.split(' ', 1)
    elif 'T' in dt_str:
        dpart, tpart = dt_str.split('T', 1)
    else:
        raise ValueError('缺少时刻。请提供时分或注明候选时辰，不能由日期确定唯一盘。')
    y, m, d = [int(x) for x in dpart.replace('/', '-').split('-')]
    tparts = [int(x) for x in tpart.split(':')]
    tparts += [0] * (2 - len(tparts))
    if len(tparts) > 3:
        raise ValueError('时刻格式不正确')
    datetime(y, m, d, *tparts)
    return y, m, d, tparts[0], tparts[1]


def auto_pan(dt_str, longitude=None, city=None, use_true_solar=True,
             zi_mode='change', ju=None):
    """一键排盘：公历时间 → 完整盘面。
    longitude/city：真太阳时用的地方经度（city 优先查表）
    ju：手工指定局（'阴二局'/'阳三局'），跳过自动定局
    返回 (d, info)；d 为 pan_engine.pan() 结果。失败返回 (None, info)。"""
    from pan_engine import pan
    y, m, d, h, mi = parse_dt(dt_str)
    lon = CITY_LON.get(city, longitude)
    notes = []
    if lon is None:
        lon = 120.0
        notes.append(f"地点{city or '未提供'}；采用默认经度 120°E，请核对真太阳时边界。")
    elif not math.isfinite(lon) or not -180 <= lon <= 180:
        raise ValueError('经度须在 -180 至 180 度之间')
    if city is not None and city not in CITY_LON and longitude is not None:
        notes.append(f"城市未匹配，按输入经度 {longitude}° 计算。")
    if zi_mode not in ('change', 'keep'):
        raise ValueError('未知的子时换日设置')

    bz = bazi(y, m, d, h, mi, longitude=lon, use_true_solar=use_true_solar, zi_mode=zi_mode)

    gz = f"{bz['year']}年 {bz['month']}月 {bz['day']}日 {bz['hour']}时"

    local_minutes = bz['ts_hour'] * 60
    if min(abs(local_minutes - boundary * 60) for boundary in range(1, 24, 2)) <= 5:
        notes.append("距时辰边界约五分钟以内；时刻来源不精确时须对照两侧候选盘。")
    current = time_key(y, m, d, h + mi / 60)
    for term, parts in term_dates_beijing(y).items():
        if abs(current - time_key(*parts)) * 1440 <= 15:
            notes.append(f"接近{term}交节（约15分钟内）；须核实交节时刻并对照两侧候选盘。")
    if ju:
        num = int(''.join(ch for ch in ju if ch.isdigit()) or 0)
        ju_info = {'term': None, 'yin_yang': '阳' if ju.startswith('阳') else '阴',
                   'ju': num, 'futou': None, 'yuan': None}
        ju_name = ju
    else:
        ju_info = determine_ju(y, m, d, hour=h + mi / 60.0, day_ganzhi=bz['day'])
        ju_name = ju_str(ju_info)

    dd = pan(gz, ju_name)
    info = {'bazi': bz, 'ganzhi': gz, 'ju_name': ju_name,
            'term': ju_info.get('term'), 'yuan': ju_info.get('yuan'),
            'futou': ju_info.get('futou'), 'longitude': lon,
            'city': city, 'zi_mode': zi_mode, 'use_true_solar': use_true_solar}
    info['input_notes'] = notes
    if dd is not None:
        dd['input_notes'] = notes
    return dd, info


def auto_render(dt_str, longitude=None, city=None, use_true_solar=True,
                zi_mode='change', ju=None, grid=True):
    """auto_pan + 格式化输出（默认九宫格）"""
    from pan_engine import pname, render, render_grid
    dd, info = auto_pan(dt_str, longitude=longitude, city=city,
                        use_true_solar=use_true_solar, zi_mode=zi_mode, ju=ju)
    if dd is None:
        return f"排盘失败：{dt_str}"
    bz = info['bazi']
    lines = list(info['input_notes'])
    lines.append(f"公历：{dt_str}" + (f"（{info['city']}，经度{info['longitude']}）" if info['city'] else f"（经度{info['longitude']}）"))
    lines.append(f"四柱：{info['ganzhi']}")
    if info['term']:
        lines.append(f"节气：{info['term']}  符头：{info['futou']}  {info['yuan']}元 → {info['ju_name']}")
    else:
        lines.append(f"用局：{info['ju_name']}（手工指定）")
    lines.append(f"值符：{dd['zhifu_star']}（落{pname(dd['zf_pal'])}）  值使：{dd['zhishi_gate']}（落{pname(dd['zs'])}）")
    lines.append(f"日干{bz['day'][0]}落{pname(dd['rg_tp'])}  时干{bz['hour'][0]}落{pname(dd['sg_tp'])}"
                 f"  年干{bz['year'][0]}落{pname(dd['yg_tp'])}  月干{bz['month'][0]}落{pname(dd['mg_tp'])}")
    lines.append(f"旬空：{'/'.join(pname(x) for x in dd['void'])}  马星：{pname(dd['horse']) if dd['horse'] else '—'}")
    lines.append("")
    lines.append(render_grid(dd) if grid else render(dd))
    return '\n'.join(lines)
