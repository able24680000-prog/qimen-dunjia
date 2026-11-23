import { useState } from 'react'
import { Link } from 'react-router-dom'

const categories = ['事业官运', '求财', '婚姻', '健康', '官司', '考试', '出行', '走失', '择吉', '天气', '风水阳宅', '风水阴宅']
const names = { 1: '坎一', 2: '坤二', 3: '震三', 4: '巽四', 5: '中五', 6: '乾六', 7: '兑七', 8: '艮八', 9: '离九' }
const input = 'w-full rounded border border-[var(--qm-border)] bg-[var(--qm-bg)] px-3 py-2.5 text-[var(--qm-ink)]'
const card = 'rounded-xl border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5'
function beijingNow() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
  const get = (type) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}
export default function ShijiaAnalysis() {
  const [form, setForm] = useState({ time: beijingNow(), category: '事业官运', question: '', outcome: '', horizon: '', urgency: '待核', firstMover: '待核' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const response = await fetch('/api/qimen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, time: form.time.replace('T', ' ') }) })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) throw new Error('时家分析服务尚未启用，请确认网站部署支持 Python 服务。')
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || '分析失败，请稍后再试。')
      setResult(body)
    } catch (exception) { setError(exception.message || '无法连接时家分析服务。') }
    finally { setLoading(false) }
  }
  return <div className="mx-auto max-w-6xl px-4 py-8 text-[var(--qm-ink)]">
    <div className="mb-7"><p className="text-sm text-[var(--qm-secondary)]">时家阳盘 · 转盘 · 拆补法</p><h1 className="mt-2 text-3xl font-semibold">时家奇门分析</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--qm-ink-soft)]">按一盘一问填写事件与可观察结果。盘面和分析均由时家奇门 v2.6 计算；使用北京时间，暂不校正真太阳时。</p><p className="mt-2 text-xs text-[var(--qm-muted)]">你填写的内容会发送至本站分析服务进行计算，请避免输入不必要的个人敏感信息。</p><Link className="mt-3 inline-block text-sm text-[var(--qm-secondary)] underline" to="/divination">返回原排盘页</Link></div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <form onSubmit={submit} className={`${card} grid gap-4`}>
        <label className="grid gap-1 text-sm">起局时间（北京时间）<input className={input} type="datetime-local" name="time" required value={form.time} onChange={update} /></label>
        <label className="grid gap-1 text-sm">事项类别<select className={input} name="category" value={form.category} onChange={update}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="grid gap-1 text-sm">具体所问<textarea className={input} name="question" required maxLength="200" rows="3" value={form.question} onChange={update} placeholder="例如：这笔合同尾款能否收回？" /></label>
        <label className="grid gap-1 text-sm">可观察结果<input className={input} name="outcome" required maxLength="200" value={form.outcome} onChange={update} placeholder="例如：收到合同尾款" /></label>
        <label className="grid gap-1 text-sm">观察期限（可选）<input className={input} name="horizon" maxLength="80" value={form.horizon} onChange={update} placeholder="例如：月底前" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">事项急缓<select className={input} name="urgency" value={form.urgency} onChange={update}><option>待核</option><option>急</option><option>缓</option></select></label><label className="grid gap-1 text-sm">行动先后<select className={input} name="firstMover" value={form.firstMover} onChange={update}>{['待核','本人','对方','双方未动','同动'].map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <button disabled={loading} className="rounded bg-[var(--qm-primary)] px-4 py-3 font-semibold text-[var(--qm-surface)] disabled:opacity-60">{loading ? '正在分析…' : '起局并分析'}</button>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </form>
      <div className="grid gap-5">
        {!result && <div className={`${card} text-sm leading-7 text-[var(--qm-ink-soft)]`}>填写时间和事件后，这里会显示 v2.6 的盘头、九宫和分析依据。不同排盘体系的结果不自动混用。</div>}
        {result && <>
          <div className={card}><h2 className="text-lg font-semibold">盘面信息</h2><p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">{result.header.ganzhi} · {result.header.ju_name} · {result.header.旬首}旬<br />值符：{result.header.值符.join(' · ')}　值使：{result.header.值使.join(' · ')}　旬空：{result.header.旬空地支}<br />{result.timeConvention}</p></div>
          <div className={card}><h2 className="mb-4 text-lg font-semibold">九宫盘</h2><div className="grid grid-cols-3 gap-1 sm:gap-2">{result.cells.map((cell) => <div key={cell.palace} className="min-h-28 rounded border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-2 text-xs leading-6 sm:p-3 sm:text-sm"><div className="flex justify-between text-[var(--qm-secondary)]"><b>{names[cell.palace]}</b><span>{cell.void ? '空' : ''}{cell.horse ? ' 马' : ''}</span></div><div>{cell.god || '—'}</div><div>{cell.star === '芮禽' ? '天芮、天禽' : cell.star || '—'} <span className="float-right">{cell.heaven.join('、')}</span></div><div>{cell.gate || '—'} <span className="float-right">{cell.earth}</span></div></div>)}</div><p className="mt-2 text-xs text-[var(--qm-muted)]">中五按引擎原始数据显示；寄宫与传统排盘软件可能采用不同口径。</p></div>
          <div className={card}><h2 className="text-lg font-semibold">分析依据</h2><p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">以下是 v2.6 的规则输出，用于学习和复盘。评分与“信心”属于模型内部信号，不代表经过验证的预测概率；结论仍需结合现实条件、反证与观察期限复核。</p>{result.timingNote && <p className="mt-2 text-sm text-[var(--qm-secondary)]">{result.timingNote}</p>}<pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[var(--qm-ink)]">{result.report}</pre><p className="mt-5 border-t border-[var(--qm-border-soft)] pt-4 text-xs leading-6 text-[var(--qm-muted)]">以上内容属于传统文化与时空决策模型的分析参考，不构成绝对预测；涉及健康、法律、投资和重大人生决定时，请结合现实信息与专业意见。</p></div>
        </>}
      </div>
    </div>
  </div>
}
