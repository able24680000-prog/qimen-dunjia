const CASES = [
  {
    id: 'career-promotion',
    category: '事业',
    title: '事业晋升判断',
    question: '是否适合主动争取新的岗位机会？',
    method: '取开门为岗位机会，值符看主导力量，日干看本人状态，值使看执行路径。',
    signals: ['开门或景门得吉星吉神：可主动表达', '值符、值使落宫不空：机会较实', '白虎、玄武、惊门重：防口舌与流程阻力'],
    verdict: '若开门宫与值使宫同向偏吉，判断为“可以小步争取”；若开门吉但值使空亡，则只判断“有机会信号，但流程未实”。',
    confidence: '高置信条件：开门、值符、值使至少两项同向偏吉，且不逢空亡。降置信条件：值使空亡、白虎玄武重、现实流程没有入口。',
    advice: '若开门宫置信度高，可准备成果材料，主动找上级沟通；若逢空亡或凶门，应先补证据、稳人际，再等待正式窗口。',
    verify: ['3-7天内是否有上级反馈或流程消息', '沟通后是否出现明确岗位、汇报或考核窗口', '人际阻力是否集中在同一人或同一流程'],
    review: '命中标准：出现明确沟通窗口、岗位信息或流程推进。只得到模糊鼓励算部分命中。',
  },
  {
    id: 'financial-investment',
    category: '财务',
    title: '财务投资判断',
    question: '一项投资是否值得进入？',
    method: '取生门为收益，戊己为资金，开门看交易通道，玄武与空亡看信息真假。',
    signals: ['生门临吉神且不空：可小额试探', '玄武、螣蛇、空亡并见：防消息不实', '伤门、惊门临资金宫：防波动和突发损耗'],
    verdict: '生门吉不代表重仓进入，只能判断“有收益线索”；若玄武、空亡同见，判断应降为“信息待证”。',
    confidence: '高置信条件：生门、资金干、合同通道同向，且退出条件清楚。降置信条件：玄武空亡同见、资金宫受伤惊门扰动。',
    advice: '即使盘面偏吉，也只建议控制仓位和分批验证；若资金宫凶象集中，不以单盘替代投资研究。',
    verify: ['验证窗口内是否出现价格波动或消息反转', '合同、回款、退出条件是否能落到文字', '小额试探是否比一次性进入更稳'],
    review: '命中标准：资金、合同、价格或回款至少一项按判断方向兑现。投资盈亏必须另做现实风控。',
  },
  {
    id: 'relationship-repair',
    category: '关系',
    title: '感情关系修复',
    question: '双方关系是否还有修复空间？',
    method: '取六合看关系，乙庚看双方，休门看沟通缓和，值使看实际行动。',
    signals: ['六合或休门得吉：仍有沟通空间', '乙庚落宫相生或比和：双方基础尚在', '杜门、死门、玄武重：有隔阂、隐瞒或冷处理'],
    verdict: '六合吉而值使弱，多判断“有修复意愿但行动慢”；六合空亡或被凶门压制，不宜断成稳定复合。',
    confidence: '高置信条件：六合、双方落宫、沟通门同向，且现实中有回应窗口。降置信条件：六合空亡、玄武重、沟通长期无反馈。',
    advice: '若关系宫吉而执行宫弱，适合先做低压力沟通；若六合逢空或凶神重，先降低期待，确认事实再谈修复。',
    verify: ['对方是否愿意在低压力场景回应', '是否出现第三方信息、隐瞒或旧问题反复', '沟通后关系是变轻松还是更僵持'],
    review: '命中标准：对方回应质量、关系温度、第三方干扰是否按窗口内表现复盘。',
  },
  {
    id: 'travel-negotiation',
    category: '出行',
    title: '出行与谈判择时',
    question: '某个时间是否适合出门谈合作？',
    method: '取开门为出行通道，景门为展示谈判，驿马看移动，值使看路径是否顺。',
    signals: ['开门、景门同见吉象：适合会面展示', '驿马临吉宫：动中有利', '惊门、白虎临出行宫：防延误、争执或安全问题'],
    verdict: '开门、景门、驿马同向时，可判断“适合出面推进”；若惊门白虎重，只建议换时或保守安排。',
    confidence: '高置信条件：开门景门同向、驿马不受凶神压制、对方时间确认。降置信条件：惊门白虎重、行程和议题都不确定。',
    advice: '若开门宫可用，可安排关键拜访；若出行宫凶，应换时段、预留缓冲或改为线上沟通。',
    verify: ['出行前是否出现临时改期、延误或路线变化', '对方是否愿意进入实质议题', '谈判后是否产生可执行清单或下一步时间'],
    review: '命中标准：行程是否顺、谈判是否进入实质、是否形成下一步清单。',
  },
  {
    id: 'health-recovery',
    category: '健康',
    title: '健康调养提醒',
    question: '近期身体状态是否适合继续高强度工作？',
    method: '取天芮、休门、死门、伤门和坤艮土宫看身体压力，值使看日常执行，太阴九地看恢复条件。',
    signals: ['天芮、死伤门集中：提示疲劳、旧症或恢复慢', '休门、生门得吉：适合调养和恢复', '白虎临身宫：注意急性损伤和过度消耗'],
    verdict: '健康盘只判断“风险提醒与调养方向”，不判断疾病名称。天芮凶象集中时，建议优先检查而不是硬扛。',
    confidence: '高置信条件：天芮、死伤门、身体宫位与现实症状同向。降置信条件：没有症状记录、缺少检查结果、问题描述太泛。',
    advice: '若健康宫有凶象，建议先降低强度、固定作息，并用检查结果验证；若休门生门可用，可把重点放在恢复节奏而非硬扛。',
    verify: ['1-7天内睡眠、胃口、疼痛或疲劳是否改善', '是否需要体检或医生建议', '降低强度后状态是否明显回稳'],
    review: '命中标准：症状、睡眠、检查结果或恢复速度与提醒方向一致。医疗结论以医生为准。',
  },
  {
    id: 'study-rhythm',
    category: '学业',
    title: '考试与学习节奏',
    question: '当前复习方式是否适合接下来的考试？',
    method: '取天辅、景门、开门、巽宫和离宫看学习资源、表达、文书和考试发挥，空亡看计划是否虚。',
    signals: ['天辅、景门得吉：利学习吸收和表达输出', '开门受制：答题路径或表达方式需要调整', '空亡临文书宫：计划容易停在想法，不易落地'],
    verdict: '天辅、景门吉时，判断“学习吸收和输出有利”；若文书宫空亡，重点不在能力差，而在计划难落地。',
    confidence: '高置信条件：天辅景门同向、学习计划具体、7天内可量化复盘。降置信条件：文书宫空亡、任务过多、没有模拟或错题数据。',
    advice: '若学业宫置信度高，可保持主计划并增加模拟输出；若逢空亡或杜门，先重排复习表，压缩任务，把错题和表达训练放在前面。',
    verify: ['7天内专注时长是否提高', '错题是否减少并能复述原因', '模拟题分数或口头表达是否出现正反馈'],
    review: '命中标准：专注时长、错题率、模拟分数、表达反馈至少两项出现同向变化。',
  },
]

import { Link } from 'react-router-dom'

export function CasesLegacy() {
  return (
    <div className="min-h-[80vh] bg-transparent px-4 py-10 text-[var(--qm-ink)] md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 border-b border-[var(--qm-border)] pb-6">
          <h1
            className="text-3xl font-semibold text-[#1c1712] md:text-4xl"
            style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
          >
            案例分析
          </h1>
          <p className="mt-3 max-w-[72ch] leading-7 text-[#554a3f]">
            这些案例不是神断故事，而是演示如何把问题拆成用神、宫位、风险、行动建议和复盘验证点。看案例时重点看“为什么这样断”，以及后续如何记录结果。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {CASES.map((item) => (
            <article key={item.title} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5">
              <div className="mb-4 border-b border-[var(--qm-border-soft)] pb-4">
                <h2 className="text-xl font-semibold text-[var(--qm-primary)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#554a3f]">{item.question}</p>
              </div>

              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-bold text-[var(--qm-secondary)]">取用方法</h3>
                  <p className="mt-2 text-sm leading-7 text-[#3e3429]">{item.method}</p>
                </section>
                <section>
                  <h3 className="text-sm font-bold text-[var(--qm-secondary)]">关键盘面信号</h3>
                  <ul className="mt-2 space-y-2">
                    {item.signals.map((signal) => (
                      <li key={signal} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-3 py-2 text-sm leading-6 text-[#3e3429]">
                        {signal}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                  <h3 className="text-sm font-bold text-[var(--qm-secondary)]">真实判断句</h3>
                  <p className="mt-2 text-sm leading-7 text-[#3e3429]">{item.verdict}</p>
                </section>
                <section className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                  <h3 className="text-sm font-bold text-[var(--qm-secondary)]">高置信条件</h3>
                  <p className="mt-2 text-sm leading-7 text-[#3e3429]">{item.confidence}</p>
                </section>
                <section className="border border-[rgba(31,97,87,0.3)] bg-[#edf5ef] p-4">
                  <h3 className="text-sm font-bold text-[var(--qm-secondary)]">建议输出</h3>
                  <p className="mt-2 text-sm leading-7 text-[#29443e]">{item.advice}</p>
                </section>
                <section>
                  <h3 className="text-sm font-bold text-[var(--qm-secondary)]">复盘验证点</h3>
                  <ul className="mt-2 space-y-2">
                    {item.verify.map((point) => (
                      <li key={point} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-3 py-2 text-sm leading-6 text-[#3e3429]">
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-sm font-bold text-[var(--qm-secondary)]">命中率复盘口径</h3>
                  <p className="mt-2 border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-3 py-2 text-sm leading-7 text-[#3e3429]">
                    {item.review}
                  </p>
                </section>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Cases() {
  const caseId = typeof window === 'undefined' ? '' : window.location.pathname.split('/')[2] || ''
  const selectedCase = CASES.find((item) => item.id === caseId)

  if (!caseId) {
    return (
      <div className="min-h-[80vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 border-b border-[var(--qm-border)] pb-6">
            <h1
              className="text-3xl font-semibold text-[#1c1712] md:text-4xl"
              style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
            >
              案例分析
            </h1>
            <p className="mt-3 max-w-[68ch] leading-7 text-[#554a3f]">
              先选择一个与当前问题最接近的案例。列表只保留问题和判断框架，进入详情后再看取用、建议与复盘口径。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CASES.map((item, index) => (
              <Link
                key={item.id}
                to={`/cases/${item.id}`}
                className="group flex min-h-60 flex-col border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5 transition-colors hover:border-[var(--qm-primary)] hover:bg-[var(--qm-surface-2)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-[var(--qm-secondary)]">{String(index + 1).padStart(2, '0')} · {item.category}</span>
                  <span aria-hidden="true" className="text-lg text-[var(--qm-secondary)] transition-transform group-hover:translate-x-1">→</span>
                </div>
                <h2 className="mt-7 text-xl font-semibold text-[var(--qm-primary)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#554a3f]">{item.question}</p>
                <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--qm-ink-soft)]">{item.method}</p>
                <span className="mt-auto pt-5 text-xs font-bold text-[var(--qm-secondary)]">查看完整推演</span>
              </Link>
            ))}
          </div>

          <section className="mt-8 flex flex-col justify-between gap-4 border border-[var(--qm-border)] bg-[var(--qm-surface-2)] p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-[var(--qm-primary)]">先理解判断依据</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">案例用于展示方法，不替代现实调查和专业意见。</p>
            </div>
            <Link to="/knowledge/judgement-basis" className="shrink-0 border border-[var(--qm-primary)] px-4 py-2.5 text-sm font-bold text-[var(--qm-primary)] transition-colors hover:bg-[var(--qm-primary)] hover:text-[var(--qm-surface)]">查看判断依据</Link>
          </section>
        </div>
      </div>
    )
  }

  if (!selectedCase) {
    return (
      <div className="min-h-[70vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
        <div className="mx-auto max-w-4xl border-b border-[var(--qm-border)] pb-6">
          <h1 className="text-3xl font-semibold text-[var(--qm-primary)]">没有找到这个案例</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--qm-ink-soft)]">案例地址可能已经调整，请返回索引重新选择。</p>
          <Link to="/cases" className="mt-5 inline-flex border-b border-[var(--qm-secondary)] pb-1 text-sm font-bold text-[var(--qm-secondary)]">返回案例索引</Link>
        </div>
      </div>
    )
  }

  const caseIndex = CASES.findIndex((item) => item.id === selectedCase.id)
  const previousCase = CASES[caseIndex - 1]
  const nextCase = CASES[caseIndex + 1]

  return (
    <div className="min-h-[80vh] px-4 py-10 text-[var(--qm-ink)] md:py-14">
      <article className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-[var(--qm-border)] pb-6">
          <div className="mb-3 text-xs font-bold text-[var(--qm-secondary)]">案例 {String(caseIndex + 1).padStart(2, '0')} · {selectedCase.category}</div>
          <h1
            className="text-3xl font-semibold text-[#1c1712] md:text-4xl"
            style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
          >
            {selectedCase.title}
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#554a3f]">{selectedCase.question}</p>
          <Link to="/cases" className="mt-5 inline-flex border-b border-[var(--qm-secondary)] pb-1 text-sm font-bold text-[var(--qm-secondary)] transition-colors hover:border-[var(--qm-primary)] hover:text-[var(--qm-primary)]">返回案例索引</Link>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-[var(--qm-primary)]">取用方法</h2>
            <p className="mt-3 text-sm leading-7 text-[#3e3429]">{selectedCase.method}</p>
          </section>

          <section className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-5">
            <h2 className="text-lg font-semibold text-[var(--qm-primary)]">关键盘面信号</h2>
            <ul className="mt-3 space-y-3">
              {selectedCase.signals.map((signal) => <li key={signal} className="border-t border-[var(--qm-border-soft)] pt-3 text-sm leading-7 text-[#3e3429] first:border-t-0 first:pt-0">{signal}</li>)}
            </ul>
          </section>

          <section className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-5">
            <h2 className="text-lg font-semibold text-[var(--qm-primary)]">真实判断句</h2>
            <p className="mt-3 text-sm leading-7 text-[#3e3429]">{selectedCase.verdict}</p>
          </section>

          <section className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--qm-primary)]">置信条件</h2>
            <p className="mt-3 text-sm leading-7 text-[#3e3429]">{selectedCase.confidence}</p>
          </section>

          <section className="border border-[rgba(31,97,87,0.3)] bg-[#edf5ef] p-5">
            <h2 className="text-lg font-semibold text-[var(--qm-secondary)]">建议输出</h2>
            <p className="mt-3 text-sm leading-7 text-[#29443e]">{selectedCase.advice}</p>
          </section>

          <section className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-[var(--qm-primary)]">复盘验证点</h2>
            <ol className="mt-4 grid gap-3 md:grid-cols-3">
              {selectedCase.verify.map((point, index) => (
                <li key={point} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4 text-sm leading-7 text-[#3e3429]">
                  <span className="mb-2 block text-xs font-bold text-[var(--qm-secondary)]">验证 {index + 1}</span>
                  {point}
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-[var(--qm-border-soft)] pt-4 text-sm leading-7 text-[#7a4a25]">{selectedCase.review}</p>
          </section>
        </div>

        <nav aria-label="案例翻页" className="mt-6 grid gap-3 sm:grid-cols-2">
          {previousCase ? (
            <Link to={`/cases/${previousCase.id}`} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-4 transition-colors hover:border-[var(--qm-primary)]">
              <span className="block text-xs text-[var(--qm-secondary)]">上一个案例</span>
              <span className="mt-1 block font-semibold text-[var(--qm-primary)]">{previousCase.title}</span>
            </Link>
          ) : <span />}
          {nextCase && (
            <Link to={`/cases/${nextCase.id}`} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-4 text-right transition-colors hover:border-[var(--qm-primary)]">
              <span className="block text-xs text-[var(--qm-secondary)]">下一个案例</span>
              <span className="mt-1 block font-semibold text-[var(--qm-primary)]">{nextCase.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  )
}

