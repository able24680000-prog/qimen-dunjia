"""
奇门遁甲排盘引擎 · 张志春拆补法（转盘）
- 地盘六仪：九宫数组顺序 [1,2,3,4,5,6,7,8,9]，阳顺阴逆
- 天盘九星/八门/八神：洛书顺时针8宫 [1,6,7,2,9,4,3,8]，阳遁顺飞阴遁逆飞
- 值使门飞步：九宫数组顺序，经过中5算1步但不落门
- 中5寄宫：阳遁寄艮8，阴遁寄坤2
- 天禽星寄天芮星
"""

palace_num = {'坎':1,'坤':2,'震':3,'巽':4,'中':5,'乾':6,'兑':7,'艮':8,'离':9}
num_palace = {v:k for k,v in palace_num.items()}
liu_yi = ['戊','己','庚','辛','壬','癸','丁','丙','乙']
original_star = {1:'天蓬',2:'天芮',3:'天冲',4:'天辅',5:'天禽',6:'天心',7:'天柱',8:'天任',9:'天英'}
original_gate = {1:'休门',2:'死门',3:'伤门',4:'杜门',5:None,6:'开门',7:'惊门',8:'生门',9:'景门'}
branch_order = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']

# 九宫数组顺序（地盘六仪、值使飞步用）
luoshu = [1,2,3,4,5,6,7,8,9]

# 洛书顺时针8宫序列（天盘星/门/神飞布用，不含中5）
# 洛书排列: 4 9 2 / 3 5 7 / 8 1 6
# 顺时针从1: 1→6→7→2→9→4→3→8→(回1)
luoshu_cw = [1, 6, 7, 2, 9, 4, 3, 8]

# 九星圆环（按洛书顺时针原始宫位排列，8星不含天禽）
star_ring = ['天蓬','天心','天柱','天芮','天英','天辅','天冲','天任']

# 八门圆环（按洛书顺时针原始宫位排列）
gate_ring = ['休门','开门','惊门','死门','景门','杜门','伤门','生门']

# 八神顺序（张志春标准）
god_order = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天']

# 五行
palace_wuxing = {1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'}
gan_wuxing = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'}
gate_wuxing = {'休门':'水','生门':'土','伤门':'木','杜门':'木','景门':'火','死门':'土','惊门':'金','开门':'金'}
star_wuxing = {'天蓬':'水','天任':'土','天冲':'木','天辅':'木','天英':'火','天芮':'土','天禽':'土','天柱':'金','天心':'金'}

def next_palace(p, yang):
    """九宫数组顺序的下一步（地盘六仪、值使飞步用）"""
    idx = luoshu.index(p)
    return luoshu[(idx+1)%9] if yang else luoshu[(idx-1)%9]

def next_palace_cw(p, yang):
    """洛书顺时针8宫的下一步（天盘星/门/神飞布用，不含中5）"""
    idx = luoshu_cw.index(p)
    return luoshu_cw[(idx+1)%8] if yang else luoshu_cw[(idx-1)%8]

def valid_gz(gz):
    """干支合法性校验：十干十二支须阴阳同配（阳干配阳支、阴干配阴支），
    即 gan 索引与 branch_order 索引同奇偶，否则不是六十甲子中的组合。
    防脏数据：如'甲卯'(甲阳干+卯阴支)在六十甲子中不存在，若不拦截会在
    get_xun_head→xun_liuyi 处抛 KeyError。合法返回 True，非法返回 False。"""
    if not gz or len(gz) != 2:
        return False
    if gz[0] not in gan or gz[1] not in branch_order:
        return False
    return (gan.index(gz[0]) % 2) == (branch_order.index(gz[1]) % 2)

def parse_ju(ju):
    import re
    if '需排盘' in ju:
        return None, None
    match = re.fullmatch(r'([阴阳])(?:遁)?([一二三四五六七八九1-9])局', ju.strip())
    if not match:
        raise ValueError('局式须注明阴或阳及一至九局，如阳三局或阴6局')
    number = match[2]
    return match[1] == '阳', int(number) if number.isdigit() else '一二三四五六七八九'.index(number) + 1


def ground_pan(yang,num):
    """地盘六仪：从局数宫起，戊己庚辛壬癸丁丙乙，阳顺阴逆，九宫数组顺序"""
    gp={}; p=num
    for g in liu_yi:
        gp[p]=g; p=next_palace(p,yang)
    return gp

def get_xun_head(gz):
    """旬首：该干支所在旬的六甲"""
    g = gan.index(gz[0]); b = branch_order.index(gz[1])
    return '甲' + branch_order[(b - g) % 12]

xun_liuyi={'甲子':'戊','甲戌':'己','甲申':'庚','甲午':'辛','甲辰':'壬','甲寅':'癸'}

def real_palace(gp,gz):
    """天干在地盘的落宫（甲遁于六仪）——仅用于判十二长生旺衰，不作用神落宫"""
    g=gz[0]
    if g in gp.values(): return [p for p,gg in gp.items() if gg==g][0]
    xh=get_xun_head(gz); return [p for p,gg in gp.items() if gg==xun_liuyi[xh]][0]

def visible_stem(gz):
    """天盘上代表该干支的奇仪。"""
    return xun_liuyi[get_xun_head(gz)] if gz[0] == '甲' else gz[0]


def real_palace_tp(d,gz):
    """天盘干飞临之宫——用神落宫唯一口径（张志春体系：日/时/年/月干落某宫乘某门某神，
    一律取天盘 d['tp']。甲遁六仪：甲干落宫取其旬首六仪在天盘的落宫）。
    D1 修复：此前 detect() 误用地盘 d['rg']，致整条断局链输入错位。"""
    g=gz[0]
    target = visible_stem(gz)
    for p, ts in d['tp'].items():
        if target in ts:
            return p
    return None

def make_seq(ring, start_item, yang):
    """从ring中找到start_item位置，阳遁正序、阴遁逆序，生成飞布序列"""
    si = ring.index(start_item)
    if yang:
        return ring[si:] + ring[:si]
    else:
        rev = ring[::-1]
        si_rev = rev.index(start_item)
        return rev[si_rev:] + rev[:si_rev]

def distribute_cw(start, seq, yang):
    """洛书顺时针8宫飞布（不含中5）"""
    res = {start: seq[0]}
    p = start
    for e in seq[1:]:
        p = next_palace_cw(p, yang)
        res[p] = e
    return res

# 地支固定宫位（与 references/01-core-knowledge.md 1.2 节一致，唯一事实来源）
branch_palace = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,
                 '午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6}

void_map={'甲子':'戌亥','甲戌':'申酉','甲申':'午未','甲午':'辰巳','甲辰':'寅卯','甲寅':'子丑'}
# 空亡宫位：由地支固定宫位派生，避免手写脱节（甲午旬空辰巳→巽4；甲辰旬空寅卯→艮8+震3）
void_palace={k: sorted({branch_palace[z] for z in v}) for k,v in void_map.items()}
# 马星：申子辰马在寅、寅午戌马在申、巳酉丑马在亥、亥卯未马在巳（只落四维宫）
horse_branch={'申':'寅','子':'寅','辰':'寅','寅':'申','午':'申','戌':'申',
              '巳':'亥','酉':'亥','丑':'亥','亥':'巳','卯':'巳','未':'巳'}
horse_palace={z: branch_palace[m] for z,m in horse_branch.items()}

def pan(ganzhi,ju):
    yg,num=parse_ju(ju)
    if num is None: return None
    parts=ganzhi.replace('年',' ').replace('月',' ').replace('日',' ').replace('时',' ').split()
    if len(parts)!=4: return None
    ygz,mgz,rgz,hgz=parts
    # 脏数据防御：四柱须为合法六十甲子（阴阳同配）。非法干支直接给出明确错误，
    # 避免如下游 get_xun_head('甲卯') 返回非法旬首后在 xun_liuyi 处 KeyError。
    for label, gz in (('年柱',ygz),('月柱',mgz),('日柱',rgz),('时柱',hgz)):
        if not valid_gz(gz):
            raise ValueError(f"非法{label}干支 '{gz}'：干支须阴阳同配（阳干配阳支/阴干配阴支，"
                             f"如甲子、乙丑合法，甲卯、乙子非法）。请核对四柱输入。")

    # 地盘
    gp=ground_pan(yg,num)

    # 天干落宫
    sg_palace=real_palace(gp,hgz)
    rg_palace=real_palace(gp,rgz)
    yg_palace=real_palace(gp,ygz)
    mg_palace=real_palace(gp,mgz)

    # 旬首 → 值符星、值使门
    xh=get_xun_head(hgz)
    ly=xun_liuyi[xh]
    xh_palace=[p for p,g in gp.items() if g==ly][0]

    # 中5寄宫处理
    if xh_palace==5:
        xh_palace_eff = 8 if yg else 2
    else:
        xh_palace_eff = xh_palace

    zhifu_star = original_star[xh_palace_eff]
    zhishi_gate = original_gate[xh_palace_eff]

    # 值符落宫 = 时干落宫（中5寄出）
    zf_pal=sg_palace
    if zf_pal==5: zf_pal=8 if yg else 2

    # 天盘九星（洛书顺时针8宫飞布）
    star_seq=make_seq(star_ring, zhifu_star, yg)
    stars=distribute_cw(zf_pal, star_seq, yg)

    # 天禽星寄天芮
    if '天芮' in stars.values():
        rui_pal=[p for p,s in stars.items() if s=='天芮'][0]
        stars[rui_pal]='芮禽'

    # 天盘干：九星携带其原固定宫位的三奇六仪，随星飞布到新宫。
    # 规则（张志春/东风纸上起局法）：值符随时干落宫后，其余星连同它们
    # 原本在地盘宫内的三奇六仪一起写到运转到的新宫——星转何处，其原
    # 属地盘干即落该宫，即为天盘干。天禽(原中5)寄天芮(原坤2)同落。
    original_star_inv = {v:k for k,v in original_star.items()}
    tp={}
    for pal, sname in stars.items():
        if sname=='芮禽':
            tp[pal]=[gp[2], gp[5]]   # 天芮原坤2宫干 + 天禽原中5宫干
        else:
            tp[pal]=[gp[original_star_inv[sname]]]

    # 值使门落宫（九宫数组顺序飞步，经过中5算1步）
    head_branch=xh[1]
    steps=(branch_order.index(hgz[1])-branch_order.index(head_branch))%12
    zs=xh_palace
    for _ in range(steps):
        zs=next_palace(zs, yg)
    if zs==5: zs=8 if yg else 2

    # 八门（洛书顺时针8宫飞布，从值使落宫开始）
    gate_seq=make_seq(gate_ring, zhishi_gate, yg)
    gates=distribute_cw(zs, gate_seq, yg)

    # 八神（洛书顺时针8宫飞布，从值符落宫开始）
    # D5修复：去掉方向上的重复反转。八神飞布只在「序列」里体现阳顺阴逆（make_seq(yg)），
    #   方向参数固定 False——若方向也传 yg，会与序列反转相互抵消，导致阴阳遁排布完全相同（原bug）。
    #   机制：distribute_cw 内部 next_palace_cw(p,False) 沿 luoshu_cw 反向(idx-1)=地理顺时针。
    #   效果：阴遁排布与修复前一致（旧版阴遁本就正确），仅阳遁被纠正。
    #   独立阳遁锚（3/3 命中）：S2-04兑7螣蛇+巽4九地 / S2-14乾6六合 / 案例4白虎落巽4。
    #   阴遁锚（S2-05巽4螣蛇/S2-12乾6玄武）两种绕法相同，无鉴别力，勿再当作D5证据。
    god_seq=make_seq(god_order, '值符', yg)
    gods=distribute_cw(zf_pal, god_seq, False)

    # 旬空、马星
    void=void_palace[xh]
    horse=horse_palace.get(hgz[1],None)

    d = dict(yg=yg,num=num,gp=gp,sg=sg_palace,rg=rg_palace,yg_pal=yg_palace,mg_pal=mg_palace,
             zhifu_star=('天禽' if xh_palace==5 else zhifu_star),zf_pal=zf_pal,zhishi_gate=zhishi_gate,zs=zs,
             stars=stars,gates=gates,gods=gods,tp=tp,void=void,horse=horse,
             rgz=rgz,hgz=hgz,ygz=ygz,mgz=mgz)
    # D1 修复：天盘落宫用神口径（与地盘 rg/sg/yg_pal/mg_pal 并存，各司其职）
    d['rg_tp'] = real_palace_tp(d, rgz)
    d['sg_tp'] = real_palace_tp(d, hgz)
    d['yg_tp'] = real_palace_tp(d, ygz)
    d['mg_tp'] = real_palace_tp(d, mgz)
    return d

def pname(p):
    return num_palace.get(p,'?')+'宫'

def render(d):
    """九宫盘面统一展示：天盘干 / 地盘干 / 星 / 门 / 神 / 空亡马星（竖列式）"""
    void=set(d['void']); horse=d['horse']
    gp=d['gp']; yg=d['yg']
    # 中宫寄宫：地盘干合并展示（阳遁中5寄艮8，阴遁中5寄坤2）
    dgp=dict(gp)
    if yg:
        dgp[8]=gp[8]+gp[5]
    else:
        dgp[2]=gp[2]+gp[5]
    lines=[]
    for p in [1,2,3,4,5,6,7,8,9]:
        td=d['gods'].get(p,'-'); tg=d['stars'].get(p,'-')
        tm=d['gates'].get(p,'-'); dp=dgp.get(p,'-')
        tp_s='/'.join(d['tp'].get(p,['-']))
        tag=[]
        if p in void: tag.append('空')
        if p==horse: tag.append('马')
        lines.append(f"  {num_palace[p]}宫({p}): 天盘[{tp_s}] 地盘[{dp}] 星{tg} 门{tm} 神{td} {' '.join(tag)}")
    return '\n'.join(lines)


def render_grid(d, width=20):
    """传统九宫格盘面（洛书布局 4 9 2 / 3 5 7 / 8 1 6），含神/星/天盘干/地盘干/门/空马标记。
    上排：巽4 | 离9 | 坤2；中排：震3 | 中5 | 兑7；下排：艮8 | 坎1 | 乾6。"""
    void=set(d['void']); horse=d['horse']
    gp=d['gp']; yg=d['yg']
    dgp=dict(gp)
    if yg:
        dgp[8]=gp[8]+gp[5]
    else:
        dgp[2]=gp[2]+gp[5]
    def cell(p):
        td=d['gods'].get(p,'-'); tg=d['stars'].get(p,'-')
        tm=d['gates'].get(p,'-'); dp=dgp.get(p,'-')
        tp_s='/'.join(d['tp'].get(p,['-']))
        tag=''
        if p in void: tag+='空'
        if p==horse: tag+='马'
        head=f"{num_palace[p]}{tag} {tg}"
        mid=f"天盘{tp_s} 地盘{dp}"
        foot=f"门{tm} 神{td}"
        return [head[:width-1],mid[:width-1],foot[:width-1]]
    layout=[[4,9,2],[3,5,7],[8,1,6]]
    lines=[]
    w=width
    for r,row in enumerate(layout):
        # 顶部边线
        lines.append('┌'+'┬'.join(['─'*w]*3)+'┐' if r==0 else '├'+'┼'.join(['─'*w]*3)+'┤')
        for li in range(3):
            lines.append('│'+'│'.join(cell(p)[li].ljust(w) for p in row)+'│')
    lines.append('└'+'┴'.join(['─'*w]*3)+'┘')
    return '\n'.join(lines)
