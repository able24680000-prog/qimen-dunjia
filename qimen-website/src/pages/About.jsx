import { Link } from 'react-router-dom'

const POSITIONING = [
  ['本站是什么', '本站是一个传统术数学习与排盘校验工具，帮助用户按时间起局、查看九宫盘、理解星门神与宫位线索，并把判断记录为可复盘样本。'],
  ['本站不是什么', '本站不提供医疗诊断、法律意见、投资建议、心理治疗或重大人生决策指令。盘面结论不是事实承诺，也不保证准确率。'],
  ['数据如何处理', '当前排盘问题、出生年、复盘记录和皮肤设置默认保存在本机浏览器。请不要输入身份证号、手机号、住址、病历、银行卡、公司机密或合同全文。'],
]

const BOUNDARIES = [
  ['医疗健康', '身体不适、疾病诊断、用药和治疗应以医生、检查结果和正规医疗机构意见为准。'],
  ['法律合同', '诉讼、合同、赔偿、劳动纠纷等事项应咨询律师或相关专业机构。'],
  ['投资理财', '投资、借贷、交易、付款等事项应依据合同、风险评估、现金流和持牌机构建议。'],
  ['心理危机', '若出现伤害自己或他人的风险，应立即联系专业机构、亲友或当地紧急服务。'],
  ['婚姻就业', '婚姻、就业、搬迁、合作等重大决定，应结合现实证据、当事人沟通和专业意见。'],
]

const STORAGE = [
  ['qimen-review-records-v1', '保存本地复盘样本，包括问题、起局时间、置信度、验证窗口和实际反馈。'],
  ['qimen-skin', '保存用户选择的页面皮肤。'],
]

export default function About() {
  return (
    <div className="min-h-[80vh] bg-transparent px-4 py-10 text-[var(--qm-ink)] md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-9 border-b border-[var(--qm-border)] pb-6">
          <h1
            className="text-3xl font-semibold text-[#1c1712] md:text-4xl"
            style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
          >
            关于本站
          </h1>
          <p className="mt-3 max-w-[72ch] leading-7 text-[#554a3f]">
            本站把奇门遁甲做成一套清楚、可复核的学习流程：先起局，再看盘面依据，最后用现实反馈复盘。它帮助思考，不替代判断。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {POSITIONING.map(([title, desc]) => (
            <section key={title} className="border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5">
              <h2 className="text-lg font-semibold text-[var(--qm-primary)]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#554a3f]">{desc}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">免责声明</h2>
          <p className="mt-3 max-w-[76ch] text-sm leading-7 text-[#554a3f]">
            本站内容仅供传统文化学习、排盘练习和个人复盘参考。盘面建议以“观察点”和“验证窗口”为核心，不构成任何专业建议，不应作为唯一决策依据。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {BOUNDARIES.map(([title, desc]) => (
              <div key={title} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="text-sm font-bold text-[var(--qm-secondary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 border border-[var(--qm-border)] bg-[var(--qm-surface)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--qm-primary)]">隐私与本地存储</h2>
          <p className="mt-3 max-w-[76ch] text-sm leading-7 text-[#554a3f]">
            当前版本没有登录系统，复盘样本和皮肤偏好默认保存在本机浏览器。清空浏览器数据或在排盘页点击“清空样本”后，本地记录会被删除。若未来接入云端同步，需要另行更新隐私说明。
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {STORAGE.map(([key, desc]) => (
              <div key={key} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
                <h3 className="font-mono text-sm font-bold text-[var(--qm-secondary)]">{key}</h3>
                <p className="mt-2 text-sm leading-7 text-[#3e3429]">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-[var(--qm-border-soft)] pt-4 text-sm leading-7 text-[#7a4a25]">
            请避免输入真实姓名、身份证号、手机号、住址、病历、账户、银行卡、公司机密、合同全文等敏感信息。一个问题只需写清事项，不需要暴露个人隐私。
          </p>
        </section>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border border-[var(--qm-border)] bg-[var(--qm-surface-2)] p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#1c1712]">从当前时间开始</h2>
            <p className="mt-2 text-sm leading-6 text-[#635448]">排盘页会自动按当前时间起局，也可以手动改时间校验案例。</p>
          </div>
          <Link to="/divination" className="inline-flex h-11 items-center justify-center bg-[var(--qm-primary)] px-6 text-sm font-semibold text-[var(--qm-surface)] hover:bg-[var(--qm-primary-hover)]">
            打开排盘
          </Link>
        </div>
      </div>
    </div>
  )
}
