# -*- coding: utf-8 -*-
"""
original_cases.py · 《神奇之门》时家案例结构化模块（30 局 / 27 例）

来源：知识库 raw/奇门遁甲/张志春原著案例库/神奇之门-案例01~27（RapidOCR 提取）。
用途：把原著案例变成「可被检索、可被引擎复算、可参与预测对照」的数据，
      而不是只读文本。断局时可用 similar()/by_category() 调出同类书例作断法参照。

数据口径（重要，先读）：
- 四柱已做 OCR 校正：王→壬、葵/营→癸、已→己或巳（按干支位）、良→艮、翼→巽、
  騰→螣、闽→闰、交→爻。校正后 30 局全部通过 pan_engine.valid_gz。
- 原文九宫盘面为 OCR 图识别，字符可能有误差；不转录盘面，只保留可复算的
  四柱+局数+值符值使，盘面一律用 auto_pan 现排。
- 局数验证：30 局值符/值使名称与引擎 100% 一致（verify() 可复核）。
  其中 20 局落宫全可比且一致，5 局原书未载落宫（仅名称一致），5 局出现
  「中宫寄宫」差异：原书阳遁中宫寄坤2，本引擎按拆补法阳遁寄艮8，属流派
  口径差异而非引擎错误。verify() 用的是给定四柱+局数的 pan()，不能替代
  公历日期→四柱→局数的 auto_pan() 独立反推。
- 案例24（海湾危机）含时局预测，仅作「主客/值符庚取用」断法范本，
  不用于现实时局推演（技能内容边界）。
- 案例16含不利结局，登记为「事后转录」。模块内保留原始断法要点供历史核对；
  事件入口只返回 safe_point()/safe_note() 过滤后的摘要，不把敏感原断送进预测上下文。

接口：
  all_cases()          -> list[dict] 全部 30 局（含 domain/tech 分类字段）
  by_category(cat)     -> 按原著事项类别筛选
  by_id(cid)           -> 按编号取单局（'14' / '17a' / '24b'）
  by_domain(domain)    -> 按统一事项域筛选（跨原著类别）
  by_technique(tag)    -> 按断法标签筛选（如 '空亡' '值符逢空'）
  similar(category, symbols, limit=5) -> 兼容旧接口：按事项域+用神/手法检索，返回 enriched 行
  retrieve(predict_cat=None, symbols=None, technique=None, limit=5)
                       -> 统一检索：预测类别经事项域映射，支持纯 technique 检索
  route(predict_cat)   -> 诊断某预测类别映射到哪些域/原著类别/候选书例数
                          （注意：这是类别候选数，不等于 retrieve() 主域命中数）
  safe_point(case)     -> 事件入口可用的敏感信息过滤摘要
  safe_note(case)      -> 口径标注的安全摘要
  safe_title(case)     -> 标题的安全摘要
  verify()             -> 逐局跑引擎，返回验证报告（干支/值符/值使/宫位）
  summary()            -> 数量统计（按证据等级/类别/验证状态）

分类体系（2026-11-20 增）：
  预测入口 CATEGORY_SHEN 用「求财/婚姻/事业官运」等 13 类，原著书例用
  「经营求财/婚恋情感/官运职场」等 15 类，名称不通导致 12 类里 9 类检索为空。
  故加一层统一事项域（DOMAINS）做双向映射，并以断法标签（TECHNIQUES）标注
  每局「用到什么手法」，使预测遇到同一盘眼时可反查书例，检索结果附命中依据。
"""
from pan_engine import pan, valid_gz, get_xun_head

# 类别归一化：与原著事项对齐到技能包九类检索口径
# 用神符号：该书例断局实际主取的用神，供 similar() 做重合度匹配

_CASES = [
    dict(id='01', title='起局步骤教学·阳遁三局', cat='教学', grade='B', src='P100',
         gz='乙亥年壬午月癸酉日丁巳时', ju='阳三局', zf='天任', zf_pal=9, zs='生门', zs_pal=2,
         shen=[], point='拆补法符头定三元（芒种中元）→阳遁三局；值符随时干、值使随时宫完整起局演示',
         outcome='教学示例，无断语', note='OCR校正:王午→壬午,葵酉→癸酉,丁已→丁巳'),
    dict(id='02', title='起八局步骤教学', cat='教学', grade='A', src='P102',
         gz='乙亥年甲申月丙子日戊戌时', ju='阴八局', zf='天禽', zf_pal=None, zs='死门', zs_pal=None,
         shen=[], point='立秋下元阴遁八局；甲午辛寄坤2值班取值符值使',
         outcome='教学示例，原文止于进入判断过程', note='OCR校正:戊成→戊戌'),
    dict(id='03', title='测动过手术', cat='健康', grade='A', src='P168',
         gz='丙子年辛卯月壬子日戊申时', ju='阳三局', zf='天柱', zf_pal=3, zs='惊门', zs_pal=2,
         shen=['日干','天芮','死门'], point='日干壬落震3乘值符，小蛇化龙；以天芮/死门定病灶',
         outcome='见原文（健康类仅作关注方向参考）', note='原书用置闰法起局，本包拆补法；局数一致'),
    dict(id='04', title='女测父病', cat='健康', grade='B', src='P169',
         gz='丙子年乙未月乙丑日甲申时', ju='阴七局', zf='天禽', zf_pal=None, zs='死门', zs_pal=None,
         shen=['天芮','死门'], point='星门俱伏吟；天芮落宫定病灶，逢空亡+天网四张',
         outcome='起局片段', note='原书1981辛酉年参照'),
    dict(id='05', title='当场测病', cat='健康', grade='A', src='P175',
         gz='丙子年戊戌月癸卯日庚申时', ju='阴八局', zf='天冲', zf_pal=6, zs='伤门', zs_pal=6,
         shen=['天芮','日干','死门'], point='值符值使同落乾6；天芮定病灶、日干定人',
         outcome='见原文（健康类仅作关注方向参考）', note=''),
    dict(id='06', title='杜新会测男青年离婚', cat='婚恋情感', grade='A', src='P180',
         gz='丙子年辛卯月癸亥日丁巳时', ju='阳六局', zf='天芮', zf_pal=3, zs='死门', zs_pal=8,
         shen=['乙','庚','丁','六合'], point='乙庚落3/7对冲主散；乙旺庚囚主女方先提；丁为离婚证落6宫开门主已批准；丁下临戊定应期',
         outcome='已离婚，女方先提出，因钱财（九千元邮票）争执',
         note='⚠️中宫寄宫口径差：原书值使死门"落5寄2"，本引擎阳遁寄艮8'),
    dict(id='07', title='中年妇女测婚（婚外恋）', cat='婚恋情感', grade='A', src='P182',
         gz='丁丑年辛亥月庚辰日壬午时', ju='阴五局', zf='天辅', zf_pal=1, zs='杜门', zs_pal=5,
         shen=['乙','庚','壬','六合','丙','丁'], point='乙克庚、时干壬临杜门六合又空→丈夫隐瞒夜不归；丙为第三者男、丁壬合为淫合',
         outcome='丈夫有外遇，当事人决意离婚',
         note='中宫寄宫口径差：原书值使杜门落5，本引擎阴遁寄生2'),
    dict(id='08', title='测怀孕生男生女', cat='求子生产', grade='A', src='P189',
         gz='乙亥年己丑月己酉日壬申时', ju='阳三局', zf='天冲', zf_pal=7, zs='伤门', zs_pal=2,
         shen=['日干','时干','坤宫','天芮','乙','庚','六合'], point='坤宫天盘星定胎儿性别（天任阳星/伤门阳门主男）；艮8空寅月填实、乙庚合定怀孕期',
         outcome='1996年正月怀孕（应验）', note='起局字段原被OCR污染，据正文校正'),
    dict(id='09', title='临产测生产平安', cat='求子生产', grade='A', src='P191',
         gz='丙子年丁酉月甲子日甲戌时', ju='阴七局', zf='天心', zf_pal=None, zs='开门', zs_pal=None,
         shen=['坤宫','天芮','乙','时干'], point='全盘伏吟；坤宫太阴荫护、对冲宫双乙奇临生门九地→平安；天芮阴星+癸阴干→女；辰戌冲定辰时',
         outcome='次日乙丑日辰时生女（应验）', note=''),
    dict(id='10', title='王作霞测早产', cat='求子生产', grade='A', src='P192',
         gz='丁丑年癸卯月丙寅日丁酉时', ju='阳三局', zf='天心', zf_pal=9, zs='开门', zs_pal=9,
         shen=['坤宫','丙','辛','丁','天心','乙奇'], point='坤宫丙加庚荧入太白主车撞早产；辛在9宫击刑临开门主手术；天心乙奇临9/2宫主手术顺利；庚下之戊定戊戌时',
         outcome='戊戌时剖腹产男婴，母子平安（应验）', note='张志春按：原判修改加工后收录'),
    dict(id='11', title='父测子升大学', cat='考试求学', grade='A', src='P198',
         gz='丙子年乙未月庚戌日丙戌时', ju='阴八局', zf='天心', zf_pal=1, zs='开门', zs_pal=4,
         shen=['时干','天辅','值符','丁奇','景门','年命'], point='时干丙落艮8长生+丙戊鸟跌穴；天辅为考试院、丁奇为文章、景门为试卷；年命丁定专业方向',
         outcome='考上重点大学（应验）', note=''),
    dict(id='12', title='尚领吉测选举名次', cat='官运职场', grade='A', src='P214',
         gz='丙子年戊戌月丁酉日戊申时', ju='阴五局', zf='天蓬', zf_pal=2, zs='休门', zs_pal=6,
         shen=['方位用神','月建','旺相休囚'], point='以五人居住方位落宫，只比较各宫月令旺相休囚定名次；乾宫当令第一、坤宫次之',
         outcome='乾宫尚耀坤第一、坤宫尚明吉第二（全中）', note='转宫法/方位定用神典型案例'),
    dict(id='13', title='测引进外资建商城', cat='经营求财', grade='A', src='P223',
         gz='乙亥年己卯月庚子日癸未时', ju='阳七局', zf='天任', zf_pal=3, zs='生门', zs_pal=8,
         shen=['生门','开门','日干','丁奇'], point='生门落艮8旺相与日干比和主房地产；开门乾6戊乙青龙合灵主事成；丁奇为外资客户在巽4；八门伏吟主进展慢',
         outcome='参见原文（长期项目）', note='OCR校正:已卯→己卯,葵未→癸未'),
    dict(id='14', title='测合资办厂（不成）', cat='经营求财', grade='A', src='P228',
         gz='乙亥年辛巳月庚戌日丁亥时', ju='阳五局', zf='天柱', zf_pal=2, zs='惊门', zs_pal=1,
         shen=['开门','日干','丁奇','时干'], point='开门落8宫入墓+逢日干空亡→办不成；丁奇文书落9宫空亡→契约落空；庚戊天乙伏宫',
         outcome='合资落空（应验）', note='OCR校正:辛已→辛巳'),
    dict(id='15', title='杜新会测讨债', cat='财物日常', grade='A', src='P242',
         gz='乙亥年乙酉月丙午日壬辰时', ju='阴六局', zf='天辅', zf_pal=2, zs='杜门', zs_pal=2,
         shen=['伤门','天乙','值符','开门'], point='伤门索债人生值符宫→有利；天乙天芮落6宫被离9火克→可获；三宫皆阴遁内盘→速度快；艮8开门戊丙龙回首→往东北',
         outcome='当日12:50收回10500元（应验）', note='OCR校正:王辰→壬辰'),
    dict(id='16', title='测人下落（兄溺水）', cat='走失', grade='A', src='P260',
         gz='乙亥年己丑月辛亥日己亥时', ju='阳三局', zf='天心', zf_pal=4, zs='开门', zs_pal=2,
         shen=['月干','时干','年命','伤门'], point='月干己为兄落6宫，己辛游魂入墓+白虎；年命辛入墓又值空，值符逢空年命不保；九星反吟主快',
         outcome='事后转录：1月17日于水库捞出（运势低潮口径，不含伤亡细节）',
         note='内容边界：伤亡结局已软化，仅作年命入墓+值符逢空断法范本'),
    dict(id='17a', title='测初中生走失·问测局', cat='走失', grade='A', src='P261',
         gz='丙子年甲午月甲辰日戊辰时', ju='阴六局', zf='天心', zf_pal=6, zs='开门', zs_pal=2,
         shen=['时干','年命','杜门','马星'], point='时干戊落6宫逢空主出走；杜门马星在艮8主东北找回；星伏吟主慢；旬空填实定戌月',
         outcome='农历九月十三从天津（东北）找回（应验）', note='此为问测局，与走失局17b并看'),
    dict(id='17b', title='测初中生走失·走失局', cat='走失', grade='A', src='P261',
         gz='丙子年甲午月甲戌日己巳时', ju='阳九局', zf='天英', zf_pal=1, zs='景门', zs_pal=2,
         shen=['日干','时干','年命'], point='按走失时间起局以日干为用神；九星反吟主能回；日时年命皆外盘主慢；年命逢空填实定农历九月',
         outcome='农历九月十三找回（应验）', note='⚠️中宫寄宫差：原书值使景门"落5寄2"，本引擎阳遁寄艮8'),
    dict(id='18', title='王建国测找发票', cat='财物日常', grade='A', src='P272',
         gz='甲戌年丙子月己卯日壬申时', ju='阳一局', zf='天蓬', zf_pal=2, zs='休门', zs_pal=9,
         shen=['景门','日干','时干','玄武'], point='景门文书落坎1火入水乡主遗失；时干壬与玄武同落震3主东方；八门反吟+震内盘主快；3数主三日',
         outcome='第三日于东边工商局铁皮保险柜找到（应验）', note='OCR校正:已卯→己卯,王申→壬申'),
    dict(id='19', title='王建国测身份证下落', cat='财物日常', grade='A', src='P274',
         gz='乙亥年壬午月己巳日癸酉时', ju='阳三局', zf='天冲', zf_pal=8, zs='伤门', zs_pal=3,
         shen=['日干','时干','景门'], point='时干癸生日干主能找到；景门文书落离9伏吟主未动、离中虚主红色容器；阴干寻庚上，坤宫庚上之壬定应期',
         outcome='6月11日癸酉日于旧房北屋找到', note='OCR校正:王午→壬午,已→己/巳'),
    dict(id='20', title='测钱被偷案', cat='财物日常', grade='A', src='P284',
         gz='甲戌年丁丑月丁未日乙巳时', ju='阳五局', zf='天英', zf_pal=4, zs='景门', zs_pal=1,
         shen=['玄武','生门','庚','景门'], point='玄武临坎1旺主青壮年男性、阳遁内盘主单位内部人、景门主会写文章；生门坤2旺相取数约400元；庚下临丁定破案期',
         outcome='当晚8:10破案，为本单位年轻同事所偷，款追回（应验）',
         note='OCR校正:乙已→乙巳'),
    dict(id='21', title='杜新会测官司（父被诬告）', cat='官司诉讼', grade='A', src='P297',
         gz='乙亥年辛巳月丁酉日辛亥时', ju='阳四局', zf='天任', zf_pal=7, zs='生门', zs_pal=6,
         shen=['年干','景门','开门','日干','乙奇'], point='年干乙入墓乾6主被关押；景门举报信落震3空亡主举报不实；开门法官落坤2与日干比和主得领导同情；地盘乙在3宫定放人日',
         outcome='父被诬告传讯，次日获释（应验）', note='OCR校正:辛已→辛巳'),
    dict(id='22', title='测世乒赛女团决赛', cat='竞技预测', grade='A', src='P307',
         gz='乙亥年辛巳月戊戌日壬戌时', ju='阳四局', zf='天英', zf_pal=8, zs='景门', zs_pal=8,
         shen=['时干','值符','辛'], point='地盘时干为主队落艮8乘值符（裁判）主有利；天盘时干为客队落兑7虽强但月令火旺金死；辛为金牌，地盘胜主队胜',
         outcome='中国女队3:0胜韩国夺金（应验）', note='主客/地盘天盘分主队客队范本'),
    dict(id='23', title='测世乒赛男团决赛', cat='竞技预测', grade='A', src='P308',
         gz='乙亥年辛巳月己亥日甲戌时', ju='阳一局', zf='天芮', zf_pal=None, zs='死门', zs_pal=None,
         shen=['时干','值符','辛','景门'], point='地盘时干乙主队落离9火旺得地得时乘值符；天盘时干乙客队落巽4木生火；辛金牌二宫比和但天盘乘九天死门不利',
         outcome='中瑞前四局2:2平，中国队最终夺冠', note='星门俱伏吟（原文另列乙亥时局对照）'),
    dict(id='24a', title='海湾危机·1月29日局', cat='时局趋势', grade='A', src='P318',
         gz='丁丑年癸丑月丙子日己亥时', ju='阳六局', zf='天英', zf_pal=7, zs='景门', zs_pal=2,
         shen=['值符','庚','六合','主客'], point='值符为守方（伊拉克）落兑7，庚为攻方（美国）落巽4逢空主虚张；值符金庚木木难克金；主客相生主打不起来',
         outcome='未开战（应验）', note='仅作主客/值符庚取用断法范本，不用于现实时局推演'),
    dict(id='24b', title='海湾危机·2月7日局', cat='时局趋势', grade='A', src='P319',
         gz='戊寅年甲寅月乙酉日癸未时', ju='阳五局', zf='天心', zf_pal=1, zs='开门', zs_pal=6,
         shen=['值符','庚','六合','主客'], point='值符落坎1休门伏吟不动；庚落乾6与值符金生水；主客相生；六合联合国落巽4调解',
         outcome='未开战（应验）', note='同24a，断法范本'),
    dict(id='24c', title='海湾危机·2月22日局', cat='时局趋势', grade='A', src='P321',
         gz='戊寅年甲寅月庚子日丙戌时', ju='阳六局', zf='天任', zf_pal=4, zs='生门', zs_pal=1,
         shen=['值符','庚','六合','景门'], point='值符与庚同落巽4比和；六合调解人落兑7金克4木主说服；景门文书受生主协议达成',
         outcome='安南调解成功，未开战（应验）', note='同24a，断法范本'),
    dict(id='25', title='袁炜文测天气', cat='天气', grade='A', src='P327',
         gz='丙子年甲午月壬辰日乙巳时', ju='阳九局', zf='天辅', zf_pal=8, zs='杜门', zs_pal=2,
         shen=['壬','天蓬','玄武','天英','天柱'], point='壬落艮8乘开门金生水主雨；壬辰日水库辰辰相刑主雨大；乙巳时乙木泄壬、巳火制水主雨停；天柱雨师落9宫受制',
         outcome='6月24日9时雨停、9:15如期揭牌（应验）', note='OCR校正:王辰→壬辰,乙已→乙巳'),
    dict(id='26', title='王庆丰测阴宅风水', cat='阴宅风水', grade='B', src='P334',
         gz='戊寅年甲寅月辛亥日戊戌时', ju='阳一局', zf='天辅', zf_pal=1, zs='杜门', zs_pal=8,
         shen=['死门','值符'], point='阴宅以死门、值符定坐向与吉凶（起局片段，断语见原文）',
         outcome='起局片段', note=''),
    dict(id='27', title='选最佳建筑方案', cat='阳宅风水', grade='A', src='P335',
         gz='丁丑年戊申月辛丑日甲午时', ju='阴四局', zf='天蓬', zf_pal=None, zs='休门', zs_pal=None,
         shen=['生门','日干','方位用神'], point='以生门、日干与候选方案方位落宫生克比较择优（详见原文）',
         outcome='见原文', note=''),
]

_PALACE = {1:'坎',2:'坤',3:'震',4:'巽',5:'中',6:'乾',7:'兑',8:'艮',9:'离'}

# ===== 统一分类层（预测类别 ↔ 事项域 ↔ 原著类别）=====
# 预测入口类别见 analyze.CATEGORY_SHEN；此处只列事项映射，不重复用神定义。
DOMAINS = ('求财经营','事业竞争','婚恋情感','健康生育','官非诉讼','考试求学',
           '走失寻物','择日营造','天气物候','时局趋势','教学范本')

# 预测类别 -> 事项域（一个预测类可落到多个域；终身局无对应书例）
PREDICT_DOMAIN = {
    '求财':     ('求财经营',),
    '事业官运': ('事业竞争',),
    '婚姻':     ('婚恋情感',),
    '健康':     ('健康生育',),
    '官司':     ('官非诉讼',),
    '考试':     ('考试求学',),
    '出行':     ('走失寻物',),
    '走失':     ('走失寻物',),
    '择吉':     ('择日营造',),
    '天气':     ('天气物候',),
    '风水阳宅': ('择日营造',),
    '风水阴宅': ('择日营造',),
    '终身局':   (),  # 书例库暂无终身局，如实返回空，不硬凑
}

# 域 -> 原著类别（retrieve 时把域内书例全部纳入）
DOMAIN_CATS = {
    '求财经营': ('经营求财','财物日常'),
    '事业竞争': ('官运职场','竞技预测'),
    '婚恋情感': ('婚恋情感',),
    '健康生育': ('健康','求子生产'),
    '官非诉讼': ('官司诉讼',),
    '考试求学': ('考试求学',),
    '走失寻物': ('走失','财物日常'),
    '择日营造': ('阳宅风水','阴宅风水'),
    '天气物候': ('天气',),
    '时局趋势': ('时局趋势',),
    '教学范本': ('教学',),
}

# 每局的事项域（人工按断局主问归属；一局只归一个主域，跨类用 TECH 标签补）
_CASE_DOMAIN = {
    '01':'教学范本','02':'教学范本',
    '03':'健康生育','04':'健康生育','05':'健康生育',
    '06':'婚恋情感','07':'婚恋情感',
    '08':'健康生育','09':'健康生育','10':'健康生育',
    '11':'考试求学','12':'事业竞争',
    '13':'求财经营','14':'求财经营','15':'求财经营',
    '16':'走失寻物','17a':'走失寻物','17b':'走失寻物',
    '18':'走失寻物','19':'走失寻物','20':'走失寻物',
    '21':'官非诉讼',
    '22':'事业竞争','23':'事业竞争',
    '24a':'时局趋势','24b':'时局趋势','24c':'时局趋势',
    '25':'天气物候','26':'择日营造','27':'择日营造',
}

# 断法标签词表：取自原书断法要点与技能词表；point 是压缩摘要，标签不一定逐字出现
TECHNIQUES = ('空亡','填实','入墓','伏吟','反吟','马星','玄武','白虎','值符逢空',
              '天芮','死门','景门文书','生门旺相','开门','伤门','日干','时干','年命',
              '值符','值使','乙庚','六合','丁奇','庚格','旺相休囚','主客','击刑','天乙',
              '杜门','三奇','荧入太白','游魂','青龙','内盘','外盘')

_CASE_TECH = {
    '01':('值符','值使'), '02':('值符','值使','入墓'),
    '03':('日干','天芮','死门','值符'), '04':('天芮','死门','伏吟','空亡'),
    '05':('天芮','日干','值符','空亡'),
    '06':('乙庚','六合','丁奇','开门'), '07':('乙庚','六合','丁奇','空亡'),
    '08':('天芮','乙庚','六合','填实'), '09':('天芮','伏吟','三奇','填实'),
    '10':('庚格','荧入太白','击刑','三奇'),
    '11':('天芮','丁奇','景门文书','年命','时干'),
    '12':('旺相休囚','日干'),
    '13':('生门旺相','开门','日干','丁奇','伏吟'),
    '14':('开门','空亡','丁奇','入墓'),
    '15':('伤门','天乙','值符','开门','内盘'),
    '16':('年命','入墓','值符逢空','反吟','白虎'),
    '17a':('时干','空亡','杜门','马星','伏吟','填实'),
    '17b':('日干','时干','年命','反吟','填实'),
    '18':('景门文书','玄武','反吟','内盘'),
    '19':('日干','时干','景门文书','伏吟'),
    '20':('玄武','生门旺相','庚格','景门文书'),
    '21':('年命','景门文书','开门','入墓','空亡'),
    '22':('时干','值符','主客','旺相休囚'),
    '23':('时干','值符','伏吟','主客'),
    '24a':('值符','庚格','六合','主客','空亡'),
    '24b':('值符','庚格','六合','伏吟','主客'),
    '24c':('值符','庚格','六合','景门文书'),
    '25':('日干','玄武','击刑','三奇'),
    '26':('死门','值符'), '27':('生门旺相','日干','旺相休囚'),
}


def _enrich(c):
    row = dict(c)
    row['domain'] = _CASE_DOMAIN.get(c['id'], '')
    row['tech'] = list(_CASE_TECH.get(c['id'], ()))
    row['shen'] = list(c['shen'])   # 深一层：防止调用方污染原始用神列表
    return row


# ===== 事件入口的安全摘要层 =====
# 模块内 point/note 保留原著断法要点供历史核对；event(case_refs=True) 只能拿过滤后的文本。
# 过滤原则：只保留手法与可观察趋势，剔除死亡/伤亡、他人隐私、医疗诊断与性别结论、
# 现实时局的国别指代和具体法律结论。
_SAFE_RULES = (
    ('丁为离婚证落6宫开门主已批准', '丁奇文书落6宫：仅作手续推进信号'),
    ('主女方先提', '关系推动方不作现实归因'),
    ('丈夫隐瞒夜不归', '关系信息不透明（他人隐私不判）'),
    ('主隐瞒夜不归', '关系信息不透明（他人隐私不判）'),
    ('丙为第三者男', '丙丁合象只作关系互动信号'),
    ('丁壬合为淫合', '丁壬合只作关系牵连信号'),
    ('天芮/死门定病灶', '天芮/死门仅作健康关注方向，须医学核实'),
    ('天芮落宫定病灶', '天芮落宫仅作健康关注方向，须医学核实'),
    ('天芮定病灶', '天芮仅作健康关注方向，须医学核实'),
    ('车撞早产', '过程突发波动（仅作关注方向）'),
    ('主手术顺利', '医学处置结果须专业判断'),
    ('主手术', '是否需医学处置须专业判断'),
    ('天心乙奇临9/2宫主医学处置须专业判断', '天心乙奇临9/2宫：仅作支持条件提示'),
    ('天任阳星/伤门阳门主男', '天任阳星/伤门阳门只作传统取象，不输出性别判断'),
    ('天芮阴星+癸阴干→女', '孕育关注方向，不输出性别判断'),
    ('值符逢空年命不保', '年命受制：按运势低潮与防护口径表述'),
    ('己辛游魂入墓+白虎', '己辛游魂入墓+白虎：按风险信号表述'),
    ('主青壮年男性、阳遁内盘主单位内部人', '人员特征只作线索，须现实证据核实'),
    ('年干乙入墓乾6主被关押', '年干乙入墓乾6：受限信号，须现实证据核实'),
    ('景门举报信落震3空亡主举报不实', '景门落震3空亡：信息真实性待核'),
    ('地盘乙在3宫定放人日', '地盘乙在3宫：流程节点须现实核实'),
    ('守方（伊拉克）', '守方'),
    ('攻方（美国）', '攻方'),
    ('联合国', '调解方'),
    ('安南', '调解过程'),
)


def safe_point(case):
    """返回可进入预测上下文的断法摘要，不修改模块内原始 point。"""
    text = case.get('point', '') if isinstance(case, dict) else by_id(case)['point']
    original = text
    for src, dst in _SAFE_RULES:
        text = text.replace(src, dst)
    if text != original:
        text += '（已按内容边界摘要化）'
    return text


def safe_note(case):
    """返回安全口径标注。"""
    text = case.get('note', '') if isinstance(case, dict) else by_id(case)['note']
    text = text.replace('伤亡结局已软化，仅作年命入墓+值符逢空断法范本',
                        '不利结局按边界省略，仅作年命入墓+值符逢空断法范本')
    return text


def safe_title(case):
    """返回安全标题：保留案例编号辨识，去掉会暴露隐私或现实时局的标题细节。"""
    text = case.get('title', '') if isinstance(case, dict) else by_id(case)['title']
    for src, dst in (
        ('中年妇女测婚（婚外恋）', '婚姻事项范本（关系信息待核）'),
        ('杜新会测男青年离婚', '婚姻事项范本（手续推进）'),
        ('测人下落（兄溺水）', '人员下落范本（不利结局省略）'),
        ('海湾危机', '主客取用范本'),
    ):
        text = text.replace(src, dst)
    return text


def all_cases():
    """返回全部案例的浅拷贝（含 domain/tech），避免调用方误改原始数据。"""
    return [_enrich(c) for c in _CASES]


def by_id(cid):
    for c in _CASES:
        if c['id'] == str(cid):
            return _enrich(c)
    raise KeyError(f'未知案例编号 {cid}；可用编号见 all_cases()')


def by_category(cat):
    return [_enrich(c) for c in _CASES if c['cat'] == cat]


def by_domain(domain):
    """按事项域筛选，跨原著类别。未知域名返回空列表并提示可选域。"""
    if domain not in DOMAINS:
        raise KeyError(f'未知事项域 {domain}；可选：' + '、'.join(DOMAINS))
    return [_enrich(c) for c in _CASES if _CASE_DOMAIN.get(c['id']) == domain]


def by_technique(tag):
    """按断法标签反查书例，例如盘眼是「值符逢空」时取全部用到该手法的书例。"""
    return [_enrich(c) for c in _CASES if tag in _CASE_TECH.get(c['id'], ())]


def explain(predict_cat=None, cid=None):
    """返回一条检索依据：预测类别经哪个域落到哪类书例，该局命中哪些用神/手法。"""
    domains = PREDICT_DOMAIN.get(predict_cat, ()) if predict_cat else ()
    parts = []
    if predict_cat:
        parts.append(f"预测类别「{predict_cat}」→事项域「{'/'.join(domains) if domains else '无对应书例'}」")
    if cid:
        c = by_id(cid)
        parts.append(f"书例 {cid}（{c['title']}）→原著类别「{c['cat']}」/事项域「{c['domain']}」")
        parts.append(f"断法标签：{'、'.join(c['tech']) or '无'}")
        parts.append(f"本案用神：{'、'.join(c['shen']) or '无'}")
    return '；'.join(parts) if parts else '未提供检索条件'


def similar(category=None, symbols=None, limit=5):
    """兼容旧接口：按事项域+用神/手法重合度返回书例。
    category 既可是原著类别（经营求财），也可是预测类别（求财）——后者经事项域展开。
    终身局明确无对应书例，返回空而不是把全库按类别分推荐。"""
    syms = set(symbols or [])
    cats = set()
    if category in PREDICT_DOMAIN:
        if not PREDICT_DOMAIN[category]:
            return []
        for dom in PREDICT_DOMAIN[category]:
            cats.update(DOMAIN_CATS.get(dom, ()))
    elif category:
        cats.add(category)
    scored = []
    for row in all_cases():                 # 必须用 enriched 行：tech/domain 由 _enrich 注入
        if cats and row['cat'] not in cats:
            continue
        overlap = len(syms & set(row['shen']))
        tech_hit = len(syms & set(row['tech']))
        score = overlap + tech_hit + (1 if category else 0)
        if syms or category:
            scored.append((score, row['id'], row))
    scored.sort(key=lambda x: (-x[0], x[1]))
    out = []
    for score, cid, row in scored[:limit]:
        result = dict(row)
        result['匹配分'] = score
        result['重合用神'] = sorted(syms & set(row['shen']))
        result['重合手法'] = sorted(syms & set(row['tech']))
        result['检索依据'] = explain(category, cid)
        out.append(result)
    return out


def retrieve(predict_cat=None, symbols=None, technique=None, limit=5):
    """统一检索：预测类别经事项域映射，叠加用神/断法标签重合，返回带检索依据的书例。
    支持仅传 technique 做盘眼反查；全部条件为空时返回空。limit 必须是正整数。"""
    if not isinstance(limit, int) or limit < 1:
        raise ValueError('limit 须为正整数')
    syms = set(symbols or [])
    domains = set(PREDICT_DOMAIN.get(predict_cat, ())) if predict_cat else set()
    cats = set()
    for dom in domains:
        cats.update(DOMAIN_CATS.get(dom, ()))
    if predict_cat and predict_cat not in PREDICT_DOMAIN:
        return {'状态': '未知预测类别', '预测类别': predict_cat,
                '可选类别': sorted(PREDICT_DOMAIN), '书例': []}
    if predict_cat and not cats:
        return {'状态': '该类别暂无对应书例', '预测类别': predict_cat,
                '检索依据': explain(predict_cat), '书例': []}
    scored = []
    for row in all_cases():
        if cats and row['cat'] not in cats:
            continue
        case_tags = set(row['tech'])
        if technique and technique not in case_tags:
            continue
        shen_hit = syms & set(row['shen'])
        tech_hit = syms & case_tags
        # 纯 technique 反查也必须有分，否则 score>0 会把全部命中过滤掉。
        score = (2 if domains and row['domain'] in domains else 0) + len(shen_hit) + len(tech_hit)
        score += 1 if technique else 0
        result = dict(row)
        result['匹配分'] = score
        result['重合用神'] = sorted(shen_hit)
        result['重合手法'] = sorted(tech_hit)
        result['检索依据'] = explain(predict_cat, row['id']) + (
            f"；断法标签筛选「{technique}」" if technique else '')
        if score > 0:
            scored.append((score, row['id'], result))
    scored.sort(key=lambda x: (-x[0], x[1]))
    hits = [row for _, _, row in scored[:limit]]
    return {'状态': '命中' if hits else '无匹配书例',
            '预测类别': predict_cat, '事项域': sorted(domains),
            '检索依据': explain(predict_cat) + (f"；断法标签筛选「{technique}」" if technique else ''),
            '书例': hits}


def route(predict_cat):
    """诊断一个预测类别能落到哪些事项域、哪些原著类别、多少书例。"""
    domains = PREDICT_DOMAIN.get(predict_cat)
    if domains is None:
        raise KeyError(f'未知预测类别 {predict_cat}；可选：' + '、'.join(PREDICT_DOMAIN))
    cats = tuple(dict.fromkeys(cat for d in domains for cat in DOMAIN_CATS.get(d, ())))
    n = sum(1 for c in _CASES if c['cat'] in cats)
    return {'预测类别': predict_cat, '事项域': domains, '原著类别': cats,
            '命中书例数': n, '检索依据': explain(predict_cat)}


def _pan_of(c):
    return pan(c['gz'], c['ju'])


def verify(verbose=True):
    """逐局跑引擎：校验干支合法 + 值符/值使名称 + 落宫（中宫寄宫差异单列）。"""
    report = []
    for c in _CASES:
        parts = [c['gz'][i:i+3] for i in range(0, len(c['gz']), 3)]
        stems = [p[:-1] for p in parts]
        legal = all(valid_gz(s) for s in stems)
        row = {'id': c['id'], '干支合法': legal}
        try:
            d = _pan_of(c)
        except ValueError as e:
            row.update({'状态': '干支非法', '错误': str(e)})
            report.append(row)
            continue
        if not d:
            row.update({'状态': '排盘失败'})
            report.append(row)
            continue
        got_zf = '天芮' if d['zhifu_star'] in ('芮禽', '天芮') else d['zhifu_star']
        got_zs = d['zhishi_gate']
        name_ok = got_zf == c['zf'] and got_zs == c['zs']
        palace_diff = []
        if c['zf_pal'] is not None and c['zf_pal'] != d['zf_pal']:
            palace_diff.append(f"值符 {_PALACE[d['zf_pal']]}/{_PALACE[c['zf_pal']]}")
        if c['zs_pal'] is not None and c['zs_pal'] != d['zs']:
            palace_diff.append(f"值使 {_PALACE[d['zs']]}/{_PALACE[c['zs_pal']]}")
        has_palace_ref = c['zf_pal'] is not None or c['zs_pal'] is not None
        if not legal:
            state = '干支非法'
        elif not name_ok:
            state = '名称不符'
        elif palace_diff:
            state = '中宫寄宫口径差'
        elif has_palace_ref:
            state = 'OK'
        else:
            state = '名称一致（落宫未载）'
        row.update({
            '状态': state,
            '旬首': get_xun_head(stems[3]),
            '引擎值符': f"{got_zf}@{_PALACE[d['zf_pal']]}",
            '引擎值使': f"{got_zs}@{_PALACE[d['zs']]}",
            '落宫差异': '、'.join(palace_diff),
        })
        report.append(row)
    if verbose:
        for r in report:
            print(f"{r['id']:<4}{r.get('状态',''):<16}{r.get('引擎值符',''):<12}{r.get('引擎值使',''):<12}{r.get('落宫差异','')}")
    return report


def summary():
    import re
    from collections import Counter
    n = len(_CASES)
    grades = Counter(c['grade'] for c in _CASES)
    cats = Counter(c['cat'] for c in _CASES)
    vr = verify(verbose=False)
    states = Counter(r['状态'] for r in vr)
    doms = Counter(_CASE_DOMAIN.get(c['id'], '') for c in _CASES)
    original_n = len({re.sub(r'[a-z]$', '', c['id']) for c in _CASES})
    return {'总局数': n, '原著案例数': original_n,
            '自动检索覆盖局数': n,
            '证据A级': grades.get('A', 0), '证据B级': grades.get('B', 0),
            '类别分布': dict(cats), '事项域分布': dict(doms),
            '验证状态': dict(states)}


if __name__ == '__main__':
    print('《神奇之门》案例库验证报告')
    print('=' * 60)
    verify()
    print('=' * 60)
    s = summary()
    for k, v in s.items():
        print(f'{k}: {v}')
    print('=' * 60)
    print('预测类别路由诊断（12 个事件类别 + 终身局）')
    for cat in PREDICT_DOMAIN:
        r = route(cat)
        print(f"  {cat:<6} → {'/'.join(r['事项域']) or '无书例':<10} 命中 {r['命中书例数']:>2} 例")
