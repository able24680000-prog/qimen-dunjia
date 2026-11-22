import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import courses from '../knowledge/maidu-summary.json'
import externalLearning from '../knowledge/external-learning-notes.json'
import externalCatalog from '../knowledge/external-source-catalog.json'
import judgementSentenceTable from '../knowledge/judgement-sentence-table.json'

const learningItems = externalLearning.items.map((item) => ({
  ...item, id: `external-${item.id}`, desc: item.summary, focus: `补充学习 · ${item.category}`,
}))
const [bookCatalog, classicsCatalog] = externalCatalog.sources
const sourceItems = [
  ...bookCatalog.chapters.map((chapter) => ({
    id: `book-${chapter.id}`, title: chapter.title, category: bookCatalog.name,
    desc: '原始资料章节 · 在线读取 · 尚未逐条校对',
    focus: '外部资料 · 时家转盘', sourceUrl: chapter.reference,
    rawUrl: 'https://raw.githubusercontent.com/c0ng-Alex/qimen-dunjia/main/qimen-dunjia.html',
    sectionId: chapter.sourceSection,
    caution: bookCatalog.caution,
  })),
  ...classicsCatalog.works.flatMap((work, workIndex) => work.chapters.map((chapter, chapterIndex) => ({
    id: `classic-${workIndex}-${chapterIndex}`, title: chapter.title, category: work.title,
    desc: `${work.title} · 原始资料章节 · 在线读取 · 尚未逐条校对`,
    focus: `外部资料 · ${work.title}`, sourceUrl: chapter.url,
    rawUrl: chapter.url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/main/', '/main/'),
    caution: classicsCatalog.caution,
  }))),
]
const allCourses = [...courses, ...learningItems, ...sourceItems]

const COURSE_TEXTS = import.meta.glob('../knowledge/maidu-c*.txt', {
  eager: true,
  import: 'default',
  query: '?raw',
})

const GROUPS = [
  {
    title: '起局依据',
    desc: '先确认时间、节气、阴阳遁、三元与局数。时家奇门尤其要看真实交节时刻，不能只按日期粗分。',
    items: ['真实节气', '阴阳遁', '上中下元', '值符值使'],
  },
  {
    title: '断盘顺序',
    desc: '先定所问，再取用神；先看值符和值使，再看日干、时干、星门神与宫位生克。不要只凭单一符号下结论。',
    items: ['定问题', '取用神', '看主客', '验空亡驿马'],
  },
  {
    title: '盘面核心',
    desc: '九星看长期资源与能力，八门看事情门路与吉凶，八神看外部助阻和人事状态，天盘地盘看主客关系。',
    items: ['九星', '八门', '八神', '天盘地盘'],
  },
  {
    title: '置信度',
    desc: '本站的置信度来自星门神一致性、用神匹配、值符值使、空亡、驿马等信号，只表示盘内参考强弱，不保证现实结果。',
    items: ['70%以上：信号集中', '58-69%：可参考', '58%以下：需复核', '重大事项需现实验证'],
  },
]


const CORE_TERMS = [
  ['三奇', '乙、丙、丁。常作为盘中较有主导意义的天干线索，分别关联文书、人事、光明与信息。'],
  ['六仪', '戊、己、庚、辛、壬、癸。甲隐于六仪之下，排盘时通过旬首遁仪进入九宫。'],
  ['八门', '休、生、伤、杜、景、死、惊、开。门看事情入口、路径和吉凶倾向，不能脱离宫位单断。'],
  ['九星', '天蓬、天任、天冲、天辅、天英、天芮、天柱、天心、天禽。星看资源、能力、长期气象。'],
  ['八神', '值符、螣蛇、太阴、六合、白虎、玄武、九地、九天。神看外部助阻、人事状态和隐情。'],
  ['九宫', '坎、坤、震、巽、中、乾、兑、艮、离。宫位把符号落到现实方位、场域和五行关系。'],
]

const FOUR_LAYERS = [
  ['地盘', '九宫八卦的基础盘，承载局数、三奇六仪和基本空间结构。'],
  ['人盘', '以八门为核心，观察事情的入口、门路、行动方式和现实阻力。'],
  ['天盘', '以九星与天盘干为核心，观察天时、资源、能力和主客关系。'],
  ['神盘', '以八神为核心，观察助力、隐情、压力、气势和外部变量。'],
]
const PURPOSES = [
  ['事业', '重点看开门、值符、乾宫、离宫、天心、天英。判断上级态度、流程门槛、公开表现和执行路径。'],
  ['财运', '重点看生门、戊己财星、资金流动宫、合同兑现宫。建议配合现金流、仓位和风险控制。'],
  ['婚姻', '重点看六合、乙庚、双方落宫、沟通宫。先看合象，再看冲克、空亡与第三方干扰。'],
  ['健康', '重点看天芮、死门、伤门、坤艮土宫和休养之象。只作调养提醒，不替代医疗诊断。'],
  ['学业', '重点看天辅、景门、巽宫、离宫。判断学习资源、表达能力、考试状态与复盘效率。'],
]

const STEPS = [
  '确认局盘：节气、阴阳遁、局数、值符、值使是否正确。',
  '明确问题：一盘只围绕一个核心问题，不把事业、财运、感情混在一起断。',
  '取用神：按问题选择开门、生门、六合、天芮、天辅等核心符号。',
  '看落宫：看用神落宫的旺衰、星门神组合、天盘地盘和宫位五行关系。',
  '看特殊信号：空亡主虚、迟、落空；驿马主动、迁移、变化；值符值使主全局权重。',
  '给建议：只给可执行建议，如推进、暂缓、复核、换时间、换路径。',
]

const SINGLE_PALACE_STEPS = [
  ['宫性打底', '先看九宫本性，判断事情进入此宫后天然偏向犹豫、停滞、突发、口舌、规则或曝光。'],
  ['神定性', '八神看事件底色、外部助阻、人事状态和隐情。'],
  ['星定势', '九星看天时、长期资源、能力环境和趋势高低。'],
  ['门定行', '八门看行动入口、现实路径、阻力和可走的办法。'],
  ['干定事', '天盘干为客，地盘干为主，十干克应看具体事务。'],
  ['生克量化', '把星、门、干与地盘宫做生克比较，判断利主、利客、受制或消耗。'],
  ['四害排查', '空亡、入墓各减八成权重，击刑、门迫各减半权重，触发时先降级判断。'],
  ['旺衰定级', '结合月令、落宫和现有格局判断象意能否发挥，不把弱象当强象。'],
  ['远近定速', '用内外盘、伏吟、反吟判断远近快慢；空亡或伏吟时先提示转宫参考。'],
]

const JUDGEMENT_BASIS = [
  ['值符', '全局主导、核心资源、最有权重的力量', '值符宫吉，事情有主心骨；值符受制或逢空，先看主导者、资源或核心承诺是否不稳。'],
  ['值使', '事情门路、执行路径、行动入口', '值使宫吉，路径较顺；值使宫凶或空，常表现为流程卡点、执行慢或入口不清。'],
  ['八门', '事情能不能走通，以及走什么路径', '开、生、休多看可用路径；伤、杜、死、惊多看阻滞、损耗、封闭和突发。'],
  ['九星', '资源、能力、长期趋势和人的状态', '天心、天辅、天任、天英多偏可用；天蓬、天芮、天柱需先看风险、病符、口舌或压力。'],
  ['八神', '外部助阻、人事状态、隐情和气势', '值符、六合、太阴、九天多看助力；白虎、玄武、螣蛇多看伤害、隐瞒、反复和虚惊。'],
  ['空亡', '虚、迟、落空、承诺不实', '核心用神逢空，不轻易给高置信结论；必须用现实证据补验。'],
  ['驿马', '动、迁移、变更、外部催动', '驿马临吉可借移动、拜访、换渠道推进；临凶则防临时变化、奔波损耗。'],
  ['宫位五行', '事情落到哪个现实场域', '宫生门、门生宫、比和、克制关系会影响推进成本和资源消耗。'],
]

const PALACE_METHODS = [
  ['坎一', '流动、隐伏、风险、资金周转', '若吉，利沟通流转、信息搜集、资金调度；若凶，先查隐患、合同暗项和情绪压力。'],
  ['坤二', '承载、关系、家庭、长期资源', '若吉，适合稳住合作、修复关系、做后勤安排；若凶，防拖累、消耗和承诺过重。'],
  ['震三', '启动、行动、突发变化', '若吉，宜主动发起、快速试探；若凶，防冲动、争执、损伤和流程被打断。'],
  ['巽四', '文书、传播、谈判、柔性策略', '若吉，利写方案、沟通、学习、传播；若凶，防信息反复、口径不清和计划虚浮。'],
  ['中五', '全局枢纽、自身压力、中转', '多看作全局压力点，通常不单独断事，要结合寄宫和日干、值符值使一起看。'],
  ['乾六', '领导、规则、权力、高层资源', '若吉，利见领导、申请授权、走正规流程；若凶，防规则卡点、上级压力和刚性冲突。'],
  ['兑七', '口舌、谈判、兑现、收益出口', '若吉，利报价、成交、表达诉求；若凶，防口舌、违约、情绪化沟通和收益打折。'],
  ['艮八', '门槛、停止、积累、不动产', '若吉，利守成、沉淀、做长期资产；若凶，常见卡住、拖延、资源冻结。'],
  ['离九', '曝光、名声、证照、公开表现', '若吉，利展示、考试、宣传、面试；若凶，防虚火、表面热闹、名誉压力。'],
]

const SENTENCE_PATTERNS = [
  ['结论句', '在验证窗口内，若先出现“可执行机会/明确回应/资源到位”，则按吉象小步推进；若先出现拖延、反复或信息不实，则降低置信度。'],
  ['建议句', '不直接说“必成”或“必败”，而是给出推进、暂缓、换路径、补证据四类动作，并写清先看哪个现实信号。'],
  ['复盘句', '到期后只按事前写下的观察指标复盘，不事后改解释。命中、部分命中、未命中都保留。'],
]

const REFERENCES = [
  '《烟波钓叟歌》：重视符头、节气、值符值使与顺逆飞布，是学习起局和断盘的基础歌诀。',
  '传统奇门断法：常以九星、八门、八神、天盘地盘、日时干、用神落宫综合判断。',
  '本站处理方式：把传统取象转成结构化依据、风险和行动建议，强调复核而不是绝对断语。',
]

const SOURCE_LINKS = [
  ['时家转盘：七步排盘示例', 'https://github.com/c0ng-Alex/qimen-dunjia/blob/main/qimen-dunjia.html#ch4-8', '按阴阳遁与局数、地盘、旬首与符使、天盘、八门、八神梳理排盘顺序；示例未提供完整公历时间，不能作为定局与节气校验基准。'],
  ['门迫与门制：传统说法', 'https://github.com/c0ng-Alex/qimen-dunjia/blob/main/qimen-dunjia.html#ch5-4', '该资料采用门克宫为迫、宫克门为制的口径。阅读时记录流派，不将单一信号直接转为现实结论。'],
  ['教学案例：合伙、求职与寻物', 'https://github.com/c0ng-Alex/qimen-dunjia/blob/main/qimen-dunjia.html#ch5-10', '原文说明三个都是教学演示，无可验证反馈；求职与寻物示例的日干、时干组合和常用五鼠遁不符，不能用作准确排盘基准或真实案例。'],
  ['补充阅读：定局与三元', 'https://github.com/youngzs/xuanxue/blob/main/docs/奇门遁甲专业知识/001第一讲%20定局概说.md', '用于对照节气、阴阳遁与上中下元。此转载文本前后存在局数表述冲突，不能直接作为排盘基准。'],
  ['补充阅读：九宫与三奇六仪', 'https://github.com/youngzs/xuanxue/blob/main/docs/奇门遁甲专业知识/003第三讲%20九宫、六仪、三奇.md', '用于学习六甲遁仪与排布顺序；原文把兑七宫写为西北，本站按兑七正西、乾六西北核对。'],
  ['补充阅读：主客与动静', 'https://github.com/youngzs/xuanxue/blob/main/docs/奇门遁甲专业知识/010第十讲%20主客.md', '用于学习动静、先后和天地盘主客的传统说法。具体取法随场景及流派变化；绝对化断语不作为事实或行动保证。'],
  ['《烟波钓叟歌》公开文本', 'https://zh.wikisource.org/wiki/煙波釣叟歌', '用于校验“阴阳顺逆、值符值使、九星八门”等基础术语。'],
  ['奇门遁甲基础条目', 'https://zh.wikipedia.org/wiki/奇门遁甲', '用于核对九宫、八门、九星、八神等基本结构。'],
  ['《奇门遁甲统宗》检索', 'https://ctext.org/searchbooks.pl?if=gb&searchu=%E5%A5%87%E9%96%80%E9%81%81%E7%94%B2%E7%B5%B1%E5%AE%97', '用于继续查找传统断法、格局与门星神组合的原始语境。'],
]

const CHECKLIST = [
  ['问题是否单一', '一盘只问一事，问题越具体，后续验证越清楚。'],
  ['用神是否匹配', '事业看开门和值符，财运看生门和资金，感情看六合与双方落宫。'],
  ['核心宫是否不空', '用神、值符、值使若逢空亡，现实中常表现为虚、迟、落空。'],
  ['星门神是否同向', '星、门、神同吉时可提高参考置信度；互相打架时只给谨慎建议。'],
  ['现实信号能否验证', '必须能写出3-5条观察指标，不能验证的结论不进入高置信区间。'],
  ['是否有风险替代方案', '凶象不是只说不好，而是给出暂缓、换时、换路径、补证据。'],
]

const CALIBRATION = [
  '每次起局记录：问题、起局时间、所取用神、重点宫位、参考置信度和明确预测句。',
  '提前设定验证窗口：短事看3-7天，中事看半月到一月，长期事项单独标注。',
  '结果分为命中、部分命中、未命中，不用事后改口径。样本少于30盘时不谈稳定准确率。',
  '当同一类问题累计到100盘以上，再统计命中率，并反向调整取用神和权重。',
]

const ACCURACY_LEVELS = [
  ['70%以上高置信盘', '只代表星门神、用神、值符值使、空亡驿马等盘内信号集中。适合重点观察和小步行动。'],
  ['30盘初步校准', '同类问题至少30个已复盘样本，才有资格判断模型方向是否偏差。少于30盘只看趋势。'],
  ['100盘稳定复盘', '同类问题累计到100盘以上，再看是否长期达到70%。若达不到，要调整权重或细分问题类型。'],
]

const COURSE_KEYWORDS = {
  k01: ['九星', '旺衰', '天时', '五行', '环境'],
  k02: ['八门', '人盘', '行为', '门迫', '行动'],
  k03: ['八神', '神盘', '随机变量', '外部助力', '定性'],
  k04: ['暗干', '潜意识', '备选方案', '转宫', '隐藏信息'],
  k05: ['读象', '五行根源', '天地人', '取象', '判断'],
  k06: ['伏吟', '反吟', '局势', '冻结', '对冲'],
  k07: ['九遁', '格局', '战略', '运筹', '特殊通道'],
  k08: ['四步断卦', '逻辑闭环', '单宫', '应期', '六亲'],
  k09: ['逻辑推演', '环境模拟', '矛盾', '系统思维', '模型'],
  k10: ['专业水准', '决策顾问', '行业场景', '高级应用', '精度'],
}

const STUDY_PATHS = [
  ['入门读盘', ['k01', 'k02', 'k03'], '先建立星、门、神三层框架，再回到排盘页看每宫依据。'],
  ['进阶断事', ['k04', 'k05', 'k08'], '用暗干、读象和四步断卦法，把单宫信息转成可验证判断。'],
  ['高阶校准', ['k06', 'k07', 'k09', 'k10'], '处理伏吟反吟、九遁格、系统推演和决策顾问式表达。'],
]

const QUICK_NAV = [
  ['courses', '入门十课', '从课程索引开始'],
  ['core-terms', '核心术语', '补齐基本盘面语言'],
  ['reading-flow', '推测流程', '按步骤读盘'],
  ['judgement-basis', '断盘依据', '回看判断线索'],
  ['palace-methods', '九宫口径', '理解宫位落点'],
  ['calibration', '验证复盘', '建立长期样本'],
]

const SECTION_META = {
  courses: ['课程', '麦垛十课', '选择原有课程、补充提要或外部资料章节；外部正文需要联网。'],
  'core-terms': ['基础', '核心术语与四层盘', '先补齐盘面语言，再理解地盘、人盘、天盘和神盘各自负责什么。'],
  'reading-flow': ['流程', '从起局到建议', '把读盘拆成可重复的步骤，避免只凭单一符号下结论。'],
  'judgement-basis': ['依据', '判断线索与断语规则', '查看值符、值使、星、门、神等线索如何共同形成判断。'],
  'palace-methods': ['方法', '单宫与九宫阅读方法', '从宫性、星门神和生克关系出发，写出可验证的观察句。'],
  calibration: ['复盘', '取用神与验证复盘', '按问题类型取用神，并用现实信号持续校准判断。'],
}

function splitCourseText(text, title) {
  const source = String(text || '').replace(title, '').trim()
  if (!source) return []

  const sentences = source.match(/[^。！？]+[。！？]?/g) || [source]
  const paragraphs = []
  for (let index = 0; index < sentences.length; index += 3) {
    paragraphs.push(sentences.slice(index, index + 3).join(''))
  }
  return paragraphs
}

function PageHeading({ eyebrow, title, description, backTo = '/knowledge', backLabel = '返回知识总览' }) {
  return (
    <div className="mb-8 border-b border-[var(--qm-border)] pb-6">
      {eyebrow && <div className="mb-3 text-xs font-bold text-[var(--qm-secondary)]">{eyebrow}</div>}
      <h1
        className="text-3xl font-semibold text-[#1c1712] md:text-4xl"
        style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
      >
        {title}
      </h1>
      <p className="mt-3 max-w-[68ch] leading-7 text-[#554a3f]">{description}</p>
      {backTo && (
        <Link
          to={backTo}
          className="mt-5 inline-flex border-b border-[var(--qm-secondary)] pb-1 text-sm font-bold text-[var(--qm-secondary)] transition-colors hover:border-[var(--qm-primary)] hover:text-[var(--qm-primary)]"
        >
          {backLabel}
        </Link>
      )}
    </div>
  )
}

function ReadingCard({ title, children, tone = 'default' }) {
  const toneClass = tone === 'accent'
    ? 'border-[rgba(31,97,87,0.3)] bg-[#edf5ef]'
    : 'border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)]'

  return (
    <section className={`border p-5 ${toneClass}`}>
      <h2 className="text-lg font-semibold text-[var(--qm-primary)]">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-[#3e3429]">{children}</div>
    </section>
  )
}

function SectionContent({ sectionId, filteredCourses, query, setQuery }) {
  if (sectionId === 'courses') {
    return (
      <>
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {STUDY_PATHS.map(([title, ids, desc]) => (
            <section key={title} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5">
              <h2 className="text-lg font-semibold text-[var(--qm-primary)]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">{desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ids.map((id) => (
                  <Link
                    key={`${title}-${id}`}
                    to={`/knowledge/course/${id}`}
                    className="border border-[var(--qm-border)] bg-[var(--qm-surface-2)] px-2.5 py-1.5 text-xs font-bold text-[var(--qm-primary)] transition-colors hover:bg-[var(--qm-primary)] hover:text-[var(--qm-surface)]"
                  >
                    {id.toUpperCase()}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <label className="mb-5 block max-w-md">
          <span className="mb-2 block text-sm font-bold text-[var(--qm-secondary)]">搜索课程</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="如：八神、暗干、伏吟、读象"
            className="w-full border border-[var(--qm-border)] bg-[var(--qm-bg)] px-4 py-3 text-sm text-[var(--qm-ink)] placeholder:text-[#6d6256] focus:border-[var(--qm-primary)] focus:outline-none"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/knowledge/course/${course.id}`}
              className="group border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5 transition-colors hover:border-[var(--qm-primary)] hover:bg-[var(--qm-surface-2)]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-[var(--qm-secondary)]">{course.id.toUpperCase()} · {course.focus}</span>
                <span aria-hidden="true" className="text-lg text-[var(--qm-secondary)] transition-transform group-hover:translate-x-1">→</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[var(--qm-primary)]">{course.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">{course.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {getCourseKeywords(course).slice(0, 3).map((keyword) => (
                  <span key={`${course.id}-${keyword}`} className="border border-[var(--qm-border-soft)] px-2 py-1 text-xs text-[var(--qm-muted)]">{keyword}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-5 text-sm leading-7 text-[#7a4a25]">
            没有匹配课程。可以搜索“九星、八门、八神、暗干、读象、伏吟、九遁、应期”。
          </div>
        )}
      </>
    )
  }

  if (sectionId === 'core-terms') {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {CORE_TERMS.map(([title, desc]) => <ReadingCard key={title} title={title}>{desc}</ReadingCard>)}
        </div>
        <section className="border-t border-[var(--qm-border)] pt-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">四层盘怎么读</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {FOUR_LAYERS.map(([title, desc]) => <ReadingCard key={title} title={title}>{desc}</ReadingCard>)}
          </div>
        </section>
      </div>
    )
  }

  if (sectionId === 'reading-flow') {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          {GROUPS.map((group) => (
            <ReadingCard key={group.title} title={group.title}>
              <p>{group.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => <span key={item} className="border border-[var(--qm-border-soft)] px-2 py-1 text-xs">{item}</span>)}
              </div>
            </ReadingCard>
          ))}
        </div>
        <section className="border-t border-[var(--qm-border)] pt-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">六步读盘</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {STEPS.map((step, index) => (
              <div key={step} className="flex gap-4 border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] p-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--qm-primary)] text-xs font-bold text-[var(--qm-surface)]">{index + 1}</span>
                <p className="text-sm leading-7 text-[#3e3429]">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (sectionId === 'judgement-basis') {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          {JUDGEMENT_BASIS.map(([name, meaning, usage]) => (
            <ReadingCard key={name} title={name}>
              <p className="text-xs font-bold text-[var(--qm-secondary)]">{meaning}</p>
              <p className="mt-2">{usage}</p>
            </ReadingCard>
          ))}
        </div>
        <section className="border-t border-[var(--qm-border)] pt-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">可验证断语规则</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {judgementSentenceTable.map((item) => (
              <ReadingCard key={item.id} title={item.scene} tone="accent">
                <p>{item.judgement}</p>
                <p className="mt-3 border-t border-[rgba(31,97,87,0.2)] pt-3 text-[#29443e]">行动：{item.action}</p>
              </ReadingCard>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (sectionId === 'palace-methods') {
    return (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">单宫九步断法</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {SINGLE_PALACE_STEPS.map(([title, desc]) => <ReadingCard key={title} title={title}>{desc}</ReadingCard>)}
          </div>
        </section>
        <section className="border-t border-[var(--qm-border)] pt-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">九宫推测口径</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {PALACE_METHODS.map(([name, focus, usage]) => (
              <ReadingCard key={name} title={name}>
                <p className="font-bold">{focus}</p>
                <p className="mt-2 text-[var(--qm-ink-soft)]">{usage}</p>
              </ReadingCard>
            ))}
          </div>
        </section>
        <section className="border-t border-[var(--qm-border)] pt-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">判断句写法</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {SENTENCE_PATTERNS.map(([title, desc]) => <ReadingCard key={title} title={title}>{desc}</ReadingCard>)}
          </div>
        </section>
      </div>
    )
  }

  if (sectionId === 'calibration') {
    return (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">不同问题如何取用神</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {PURPOSES.map(([title, desc]) => <ReadingCard key={title} title={title}>{desc}</ReadingCard>)}
          </div>
        </section>
        <section className="border-t border-[var(--qm-border)] pt-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">复盘步骤</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {CALIBRATION.map((item, index) => <ReadingCard key={item} title={`复盘 ${index + 1}`}>{item}</ReadingCard>)}
          </div>
        </section>
        <section className="border-t border-[var(--qm-border)] pt-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">准确率与检查表</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ACCURACY_LEVELS.map(([title, desc]) => <ReadingCard key={title} title={title}>{desc}</ReadingCard>)}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {CHECKLIST.map(([title, desc]) => <ReadingCard key={title} title={title}>{desc}</ReadingCard>)}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
      <h2 className="text-xl font-semibold text-[var(--qm-primary)]">没有找到这个专题</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--qm-ink-soft)]">专题地址可能已经调整，请返回知识总览重新选择。</p>
    </div>
  )
}

function SourceReader({ course }) {
  const [result, setResult] = useState({ text: '', error: '', loading: true })

  useEffect(() => {
    const controller = new AbortController()
    setResult({ text: '', error: '', loading: true })
    async function readSource() {
      try {
        const response = await fetch(course.rawUrl, { signal: controller.signal })
        if (!response.ok) throw new Error('来源暂时无法访问')
        let text = await response.text()
        if (course.sectionId) {
          const document = new DOMParser().parseFromString(text, 'text/html')
          document.querySelectorAll('script, style, svg').forEach((node) => node.remove())
          const heading = document.getElementById(course.sectionId)
          if (!heading) throw new Error('来源目录已变化，未找到章节')
          const pieces = [heading.textContent]
          let node = heading.nextElementSibling
          while (node && !(/^H[1-3]$/.test(node.tagName) && Number(node.tagName.slice(1)) <= Number(heading.tagName.slice(1)))) {
            pieces.push(node.innerText || node.textContent || '')
            node = node.nextElementSibling
          }
          text = pieces.join('\n\n')
        }
        if (!text.trim()) throw new Error('该章节没有可显示的正文')
        setResult({ text, error: '', loading: false })
      } catch (error) {
        if (error.name !== 'AbortError') setResult({ text: '', error: error.message, loading: false })
      }
    }
    readSource()
    return () => controller.abort()
  }, [course.rawUrl, course.sectionId])

  return (
    <article className="mx-auto max-w-4xl">
      <PageHeading eyebrow={course.focus} title={course.title} description={course.desc} backTo="/knowledge/courses" backLabel="返回课程索引" />
      <p className="mb-5 text-sm leading-7 text-[#7a4a25]">{course.caution}</p>
      <a href={course.sourceUrl} target="_blank" rel="noreferrer" className="mb-5 block break-all text-sm underline">查看原始来源</a>
      <div className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5">
        {result.loading && <p>正在从原资料读取内容…</p>}
        {result.error && <p role="alert">读取失败：{result.error}。请使用上方链接打开原资料。</p>}
        {!result.loading && !result.error && <div className="whitespace-pre-wrap break-words text-[15px] leading-8">{result.text}</div>}
      </div>
      <p className="mt-4 text-sm leading-7">正文由原来源实时提供，可能更新或暂时无法访问；目录和内容尚未全面校勘。</p>
    </article>
  )
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function getCourseKeywords(course) {
  return COURSE_KEYWORDS[course.id] || (course.category ? [course.category, course.title] : [])
}

export default function Knowledge() {
  const { sectionId, courseId } = useParams()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const normalizedQuery = normalizeText(query)
  const filteredCourses = useMemo(() => {
    if (!normalizedQuery) return allCourses
    return allCourses.filter((course) => {
      const keywords = getCourseKeywords(course)
      return [course.title, course.desc, course.focus, ...keywords]
        .some((item) => normalizeText(item).includes(normalizedQuery))
    })
  }, [normalizedQuery])
  const courseById = useMemo(() => Object.fromEntries(allCourses.map((course) => [course.id, course])), [])

  if (courseId) {
    const course = courseById[courseId]
    if (!course) {
      return (
        <div className="min-h-[70vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
          <div className="mx-auto max-w-4xl">
            <PageHeading title="没有找到这节课程" description="课程编号可能已经调整，请返回课程索引重新选择。" backTo="/knowledge/courses" backLabel="返回课程索引" />
          </div>
        </div>
      )
    }

    if (course.rawUrl) {
      return (
        <div className="min-h-[80vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
          <SourceReader course={course} />
        </div>
      )
    }

    const courseIndex = allCourses.findIndex((item) => item.id === course.id)
    const previousCourse = allCourses[courseIndex - 1]
    const nextCourse = allCourses[courseIndex + 1]
    const rawText = course.summary || COURSE_TEXTS[`../knowledge/${course.file}`]
    const paragraphs = splitCourseText(rawText, course.title)

    return (
      <div className="min-h-[80vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
        <article className="mx-auto max-w-4xl">
          <PageHeading
            eyebrow={`${course.id.toUpperCase()} · ${course.focus}`}
            title={course.title}
            description={course.desc}
            backTo="/knowledge/courses"
            backLabel="返回课程索引"
          />

          <div className="mb-7 flex flex-wrap gap-2">
            {getCourseKeywords(course).map((keyword) => (
              <span key={keyword} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] px-3 py-1.5 text-xs text-[var(--qm-secondary)]">{keyword}</span>
            ))}
          </div>

          <div className="border border-[var(--qm-border)] bg-[var(--qm-surface)] px-5 py-6 md:px-8 md:py-8">
            <div className="mb-6 border-b border-[var(--qm-border-soft)] pb-4">
              <div className="text-xs font-bold text-[var(--qm-secondary)]">{course.summary ? '补充学习提要' : '课程正文'}</div>
              <p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">{course.summary ? course.status : '按自然段整理原始课程内容，阅读时可先抓住本课主题，再回到排盘页对照。'}</p>
            </div>
            <div className="space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p key={`${course.id}-paragraph-${index}`} className="text-[15px] leading-8 text-[#3e3429]">{paragraph}</p>
              ))}
            </div>
          </div>

          {course.source?.length > 0 && (
            <section className="mt-6 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5">
              <h2 className="text-lg font-semibold text-[var(--qm-primary)]">参考来源</h2>
              <p className="mt-2 text-sm leading-7">以下为相关资料入口，提要尚未逐条校对，不表示全部原文已导入。</p>
              {course.source.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm underline">{url}</a>
              ))}
            </section>
          )}

          <nav aria-label="课程翻页" className="mt-6 grid gap-3 sm:grid-cols-2">
            {previousCourse ? (
              <Link to={`/knowledge/course/${previousCourse.id}`} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-4 transition-colors hover:border-[var(--qm-primary)]">
                <span className="block text-xs text-[var(--qm-secondary)]">上一篇</span>
                <span className="mt-1 block font-semibold text-[var(--qm-primary)]">{previousCourse.title}</span>
              </Link>
            ) : <span />}
            {nextCourse && (
              <Link to={`/knowledge/course/${nextCourse.id}`} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-4 text-right transition-colors hover:border-[var(--qm-primary)]">
                <span className="block text-xs text-[var(--qm-secondary)]">下一篇</span>
                <span className="mt-1 block font-semibold text-[var(--qm-primary)]">{nextCourse.title}</span>
              </Link>
            )}
          </nav>
        </article>
      </div>
    )
  }

  const activeSection = sectionId || (normalizedQuery ? 'courses' : '')
  if (activeSection) {
    const sectionMeta = SECTION_META[activeSection] || ['专题', '知识专题', '按主题集中阅读相关内容。']
    return (
      <div className="min-h-[80vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
        <div className="mx-auto max-w-6xl">
          <PageHeading eyebrow={sectionMeta[0]} title={sectionMeta[1]} description={sectionMeta[2]} />
          <SectionContent
            sectionId={activeSection}
            filteredCourses={filteredCourses}
            query={query}
            setQuery={setQuery}
          />
        </div>
      </div>
    )
  }

  if (!sectionId && !courseId) {
    return (
      <div className="min-h-[80vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
        <div className="mx-auto max-w-6xl">
          <PageHeading
            title="奇门知识"
            description="先选择一个学习目标，再进入对应专题。这里不再一次铺开全部内容，让每次阅读只解决一个问题。"
            backTo=""
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {QUICK_NAV.map(([id, title, desc], index) => (
              <Link
                key={id}
                to={`/knowledge/${id}`}
                className="group flex min-h-48 flex-col border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5 transition-colors hover:border-[var(--qm-primary)] hover:bg-[var(--qm-surface-2)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--qm-secondary)]">{String(index + 1).padStart(2, '0')}</span>
                  <span aria-hidden="true" className="text-lg text-[var(--qm-secondary)] transition-transform group-hover:translate-x-1">→</span>
                </div>
                <h2 className="mt-8 text-xl font-semibold text-[var(--qm-primary)]">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">{desc}</p>
                <span className="mt-auto pt-5 text-xs font-bold text-[var(--qm-secondary)]">进入专题</span>
              </Link>
            ))}
          </div>

          <section className="mt-8 flex flex-col justify-between gap-4 border border-[var(--qm-border)] bg-[var(--qm-surface-2)] p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-[var(--qm-primary)]">从实际问题开始</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">已经有具体问题时，可以先看案例，再回到知识专题理解判断依据。</p>
            </div>
            <Link to="/cases" className="shrink-0 border border-[var(--qm-primary)] px-4 py-2.5 text-sm font-bold text-[var(--qm-primary)] transition-colors hover:bg-[var(--qm-primary)] hover:text-[var(--qm-surface)]">查看案例索引</Link>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] bg-transparent px-4 py-10 text-[var(--qm-ink)] md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 border-b border-[var(--qm-border)] pb-6">
          <h1
            className="text-3xl font-semibold text-[#1c1712] md:text-4xl"
            style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
          >
            奇门知识
          </h1>
          <p className="mt-3 max-w-[72ch] leading-7 text-[#554a3f]">
            这里整理本站排盘和预测建议的依据。重点不是背术语，而是学会按“起局、取用神、看宫位、给建议、做复核”的顺序读盘。
          </p>
        </div>

        <nav aria-label="知识页目录" className="mb-8 border border-[var(--qm-border)] bg-[var(--qm-surface)]">
          <div className="border-b border-[var(--qm-border-soft)] px-5 py-3 text-sm font-bold text-[var(--qm-primary)]">知识目录</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_NAV.map(([id, title, desc], index) => (
              <a
                key={id}
                href={`#${id}`}
                className="border-b border-r border-[var(--qm-border-soft)] px-4 py-4 transition-colors hover:bg-[var(--qm-surface-2)] last:border-r-0 lg:border-b-0"
              >
                <span className="block text-xs text-[var(--qm-secondary)]">{String(index + 1).padStart(2, '0')}</span>
                <span className="mt-1 block text-sm font-bold text-[var(--qm-primary)]">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--qm-ink-soft)]">{desc}</span>
              </a>
            ))}
          </div>
        </nav>

        <section id="courses" className="mb-8 scroll-mt-24 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">麦垛十课索引</h2>
              <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--qm-ink-soft)]">
                本站已经收录十节系统课程。先用关键词定位主题，再回到排盘页对照星、门、神、干、宫位和复盘口径。
              </p>
            </div>
            <label className="block w-full md:max-w-xs">
              <span className="mb-2 block text-sm font-bold text-[var(--qm-secondary)]">搜索课程</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="如：八神、暗干、伏吟、读象"
                className="w-full border border-[var(--qm-border)] bg-[var(--qm-bg)] px-4 py-3 text-sm text-[var(--qm-ink)] placeholder:text-[#6d6256] focus:border-[var(--qm-primary)] focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredCourses.map((course) => {
              const keywords = getCourseKeywords(course)
              return (
                <article key={course.id} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-[var(--qm-secondary)] px-2 py-0.5 text-xs font-bold text-[var(--qm-secondary)]">{course.id.toUpperCase()}</span>
                    <span className="text-xs text-[#7f725f]">{course.focus}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[var(--qm-primary)]">{course.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#3e3429]">{course.desc}</p>
                  <p className="mt-2 text-xs text-[#7f725f]">本地资料：src/knowledge/{course.file}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keywords.slice(0, 5).map((keyword) => (
                      <button
                        key={`${course.id}-${keyword}`}
                        type="button"
                        onClick={() => setQuery(keyword)}
                        className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] px-2 py-1 text-xs text-[#554a3f] transition-colors hover:border-[var(--qm-primary)] hover:text-[var(--qm-primary)]"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="mt-5 border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4 text-sm leading-7 text-[#7a4a25]">
              没有匹配课程。可以换成“九星、八门、八神、暗干、读象、伏吟、九遁、应期”等关键词。
            </div>
          )}

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {STUDY_PATHS.map(([title, ids, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-3)] p-4">
                <h3 className="font-semibold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ids.map((id) => (
                    <button
                      key={`${title}-${id}`}
                      type="button"
                      onClick={() => setQuery(courseById[id]?.title.replace(/^第.课：?/, '') || id)}
                      className="border border-[var(--qm-border)] bg-[var(--qm-surface)] px-2 py-1 text-xs font-bold text-[var(--qm-primary)] transition-colors hover:bg-[var(--qm-primary)] hover:text-[var(--qm-surface)]"
                    >
                      {id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="core-terms" className="mb-8 scroll-mt-24 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">核心术语入口</h2>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--qm-ink-soft)]">
            先认识三奇、六仪、八门、九星、八神和九宫，再进入具体断盘。术语不是答案，它们只是盘面线索。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {CORE_TERMS.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="font-semibold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">四层盘怎么读</h2>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--qm-ink-soft)]">
            摘要里提到的地盘、人盘、天盘、神盘，可以理解为从空间基础到行动路径、天时资源、外部变量的四层观察。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {FOUR_LAYERS.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="font-semibold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5">
              <h2 className="text-xl font-semibold text-[var(--qm-primary)]">{group.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#554a3f]">{group.desc}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {group.items.map((item) => (
                  <div key={item} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-3)] px-3 py-2 text-sm text-[#2b241d]">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section id="reading-flow" className="mt-8 scroll-mt-24 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">真实推测的基本流程</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {STEPS.map((step, index) => (
              <div key={step} className="flex gap-3 border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--qm-primary)] text-sm font-bold text-[var(--qm-surface)]">{index + 1}</div>
                <p className="text-sm leading-7 text-[#3e3429]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="judgement-basis" className="mt-8 scroll-mt-24 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">断盘依据表</h2>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--qm-ink-soft)]">
            下面这张表对应排盘页的宫位建议。一个结论至少要同时看主导力量、执行路径、门星神组合和现实验证点，不能只凭单个符号下断语。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {JUDGEMENT_BASIS.map(([name, meaning, usage]) => (
              <div key={name} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[var(--qm-secondary)]">{name}</h3>
                  <span className="text-xs text-[#7f725f]">{meaning}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{usage}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="palace-methods" className="mt-8 scroll-mt-24 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">断语数据表与迭代规则</h2>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--qm-ink-soft)]">
            断语不再散写成固定长段，而是按场景、触发条件、判断句、行动句和复盘指标维护。后续可以从知识库总结和真实复盘中持续更新这张表。
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--qm-border)] text-xs text-[var(--qm-secondary)]">
                  <th className="py-3 pr-4 font-bold">场景</th>
                  <th className="py-3 pr-4 font-bold">触发条件</th>
                  <th className="py-3 pr-4 font-bold">断语</th>
                  <th className="py-3 pr-4 font-bold">行动与验证</th>
                  <th className="py-3 pr-4 font-bold">迭代规则</th>
                  <th className="py-3 pr-4 font-bold">状态</th>
                </tr>
              </thead>
              <tbody>
                {judgementSentenceTable.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--qm-border-soft)] align-top">
                    <td className="py-3 pr-4 font-bold text-[var(--qm-primary)]">{item.scene}</td>
                    <td className="py-3 pr-4 leading-7 text-[#3e3429]">{item.trigger}</td>
                    <td className="py-3 pr-4 leading-7 text-[#3e3429]">{item.judgement}</td>
                    <td className="py-3 pr-4 leading-7 text-[#29443e]">{item.action}<br /><span className="text-[#7f725f]">{item.verification}</span></td>
                    <td className="py-3 pr-4 leading-7 text-[#7a4a25]">{item.updateRule}</td>
                    <td className="py-3 pr-4 leading-7 text-[#5f5144]">
                      <span className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-2 py-1 text-xs font-bold text-[var(--qm-secondary)]">{item.status || '候选'}</span><br />
                      <span className="text-xs">复盘 {item.reviewCount || 0} · 有效率 {item.hitRate === null || item.hitRate === undefined ? '待统计' : `${item.hitRate}%`}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="calibration" className="mt-8 scroll-mt-24 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">不同问题如何取用神</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-5">
            {PURPOSES.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="font-semibold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#554a3f]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">单宫九步断法</h2>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--qm-ink-soft)]">
            单宫不直接堆断语，先用宫性定底，再看星、门、神、干和生克关系；遇四害先降权，最后才给行动建议和复盘口径。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {SINGLE_PALACE_STEPS.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="text-sm font-bold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-[#7a4a25]">
            四害排查：空亡、入墓先看信息是否落空或被困；击刑、门迫先看内耗、冲突和行动路径是否自相矛盾。主客关系以天盘为客、地盘为主。
          </p>
        </section>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">九宫真实推测口径</h2>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--qm-ink-soft)]">
            宫位不是单独下结论的答案，而是把事情落到现实场景。先看所问事项是否落到该宫，再看星、门、神和空亡驿马，最后写成可验证的观察句。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {PALACE_METHODS.map(([name, focus, usage]) => (
              <div key={name} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="font-semibold text-[var(--qm-secondary)]">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--qm-ink)]">{focus}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">{usage}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">推测建议怎么写才可验证</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {SENTENCE_PATTERNS.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="text-sm font-bold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">如何验证准确率</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {CALIBRATION.map((item, index) => (
              <div key={item} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <div className="text-sm font-semibold text-[var(--qm-secondary)]">复盘 {index + 1}</div>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-[#7a4a25]">
            70%更适合作为同类问题长期回测后的目标，不应当作为单次起局的保证。本站会给出盘内参考置信度，真正命中率需要持续记录和复盘。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {ACCURACY_LEVELS.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="text-sm font-bold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">高置信断盘检查表</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {CHECKLIST.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="text-sm font-bold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-[#7a4a25]">
            本站把70%以上定义为“盘内信号集中且可验证”，不是承诺现实一定发生。真正准确率必须通过同类问题样本复盘得到。
          </p>
        </section>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">参考资料与边界</h2>
          <div className="mt-4 space-y-3">
            {REFERENCES.map((item) => (
              <p key={item} className="text-sm leading-7 text-[#554a3f]">{item}</p>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {SOURCE_LINKS.map(([title, url, desc]) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4 transition-colors hover:border-[var(--qm-primary)]"
              >
                <span className="text-sm font-bold text-[var(--qm-primary)]">{title}</span>
                <span className="mt-1 block text-sm leading-7 text-[#554a3f]">{desc}</span>
                <span className="mt-1 block break-all text-xs text-[var(--qm-secondary)]">{url}</span>
              </a>
            ))}
          </div>
          <p className="mt-5 border-t border-[var(--qm-border-soft)] pt-4 text-sm leading-7 text-[#7a4a25]">
            重要提醒：预测建议只适合学习、复盘和辅助思考。涉及医疗、法律、投资、婚姻重大决定时，应以专业意见和现实证据为准。
          </p>
        </section>
      </div>
    </div>
  )
}


