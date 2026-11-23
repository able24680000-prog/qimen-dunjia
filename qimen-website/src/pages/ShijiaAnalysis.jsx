import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdvancedShijia from '../components/AdvancedShijia'

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
  const [form, setForm] = useState({ time: beijingNow(), category: '事业官运', question: '', outcome: '', manual: false, manualGanzhi: '', horizon: '', urgency: '待核', firstMover: '待核', trueSolar: false, longitude: '', ziMode: 'change', manualJu: '', gender: '', yearLife: '', topic: '', primary: '', stage: '', asker: '', subject: '' })
  const [mode, setMode] = useState('event')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const response = await fetch('/api/qimen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, mode: form.manual ? 'manual' : 'event', time: form.time.replace('T', ' '), longitude: form.trueSolar && form.longitude !== '' ? Number(form.longitude) : null }) })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) throw new Error('时家分析服务尚未启用，请确认网站部署支持 Python 服务。')
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || '分析失败，请稍后再试。')
      setResult(body)
    } catch (exception) { setError(exception.message || '无法连接时家分析服务。') }
    finally { setLoading(false) }
  }
  return <div className="mx-auto max-w-6xl px-4 py-8 text-[var(--qm-ink)]">
    <div className="mb-7"><p className="text-sm text-[var(--qm-secondary)]">时家阳盘 · 转盘 · 拆补法</p><h1 className="mt-2 text-3xl font-semibold">时家奇门分析</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--qm-ink-soft)]">按一盘一问填写事件与可观察结果。盘面和分析均由时家奇门 v2.6 计算；默认使用北京时间，可选择按经度校正真太阳时。</p><p className="mt-2 text-xs text-[var(--qm-muted)]">你填写的内容会发送至本站分析服务进行计算，请避免输入不必要的个人敏感信息。</p><Link className="mt-3 inline-block text-sm text-[var(--qm-secondary)] underline" to="/divination">返回原排盘页</Link></div>
    <div className="mb-5 flex flex-wrap gap-2">{[['event','事件分析'],['lifetime','终身局'],['review','截图转录核盘'],['cases','案例与复盘'],['compare','转宫比较']].map(([id,label]) => <button type="button" key={id} onClick={() => setMode(id)} className={`rounded border border-[var(--qm-border)] px-3 py-2 text-sm ${mode === id ? 'bg-[var(--qm-primary)] text-[var(--qm-surface)]' : 'bg-[var(--qm-surface)]'}`}>{label}</button>)}</div>
    {mode !== 'event' && <AdvancedShijia mode={mode} initialTime={form.time} />}
    {mode === 'event' && <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <form onSubmit={submit} className={`${card} grid gap-4`}>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="manual" checked={form.manual} onChange={update}/>手工输入四柱与局式</label>{form.manual ? <><label className="grid gap-1 text-sm">四柱<input className={input} name="manualGanzhi" required value={form.manualGanzhi} onChange={update} placeholder="丙午年 甲午月 丁卯日 丙午时" /></label><label className="grid gap-1 text-sm">局式<input className={input} name="manualJu" required value={form.manualJu} onChange={update} placeholder="阴遁九局" /></label></> : <label className="grid gap-1 text-sm">起局时间（北京时间）<input className={input} type="datetime-local" name="time" required value={form.time} onChange={update} /></label>}
        <label className="grid gap-1 text-sm">事项类别<select className={input} name="category" value={form.category} onChange={update}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="grid gap-1 text-sm">具体所问<textarea className={input} name="question" required maxLength="200" rows="3" value={form.question} onChange={update} placeholder="例如：这笔合同尾款能否收回？" /></label>
        <label className="grid gap-1 text-sm">可观察结果<input className={input} name="outcome" required maxLength="200" value={form.outcome} onChange={update} placeholder="例如：收到合同尾款" /></label>
        <label className="grid gap-1 text-sm">观察期限（可选）<input className={input} name="horizon" maxLength="80" value={form.horizon} onChange={update} placeholder="例如：月底前" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">事项急缓<select className={input} name="urgency" value={form.urgency} onChange={update}><option>待核</option><option>急</option><option>缓</option></select></label><label className="grid gap-1 text-sm">行动先后<select className={input} name="firstMover" value={form.firstMover} onChange={update}>{['待核','本人','对方','双方未动','同动'].map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <details className="border-t border-[var(--qm-border-soft)] pt-3"><summary className="cursor-pointer text-sm font-semibold">起局与用神进阶选项</summary><div className="mt-3 grid gap-3">
        <label className="flex gap-2 text-sm"><input type="checkbox" name="trueSolar" checked={form.trueSolar} onChange={update} />按经度校正真太阳时</label>{form.trueSolar && <label className="grid gap-1 text-sm">起局地经度（东经为正）<input className={input} name="longitude" type="number" step="any" min="-180" max="180" required value={form.longitude} onChange={update} /></label>}
        <label className="grid gap-1 text-sm">子时换日<select className={input} name="ziMode" value={form.ziMode} onChange={update}><option value="change">23点换日</option><option value="keep">0点换日</option></select></label>
        {[['manualJu','手工局式（可选，如阴遁二局）'],['yearLife','年命干支（可选，如庚戌）'],['topic','明确问项（可选）'],['primary','指定主用神（可选）'],['stage','事项阶段（可选）'],['asker','问者（代问时填写）'],['subject','所测人（代问时填写）']].map(([name,label])=><label key={name} className="grid gap-1 text-sm">{label}<input className={input} name={name} value={form[name]} onChange={update} /></label>)}
        <label className="grid gap-1 text-sm">性别（可选）<select className={input} name="gender" value={form.gender} onChange={update}><option value="">未提供</option><option>男</option><option>女</option></select></label></div></details>
        <button disabled={loading} className="rounded bg-[var(--qm-primary)] px-4 py-3 font-semibold text-[var(--qm-surface)] disabled:opacity-60">{loading ? '正在分析…' : '起局并分析'}</button>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </form>
      <div className="grid gap-5">
        {!result && <div className={`${card} text-sm leading-7 text-[var(--qm-ink-soft)]`}>填写时间和事件后，这里会显示 v2.6 的盘头、九宫和分析依据。不同排盘体系的结果不自动混用。</div>}
        {result && <>
          <div className={card}><h2 className="text-lg font-semibold">盘面信息</h2><p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">{result.header.ganzhi} · {result.header.ju_name} · {result.header.旬首}旬<br />值符：{result.header.值符.join(' · ')}　值使：{result.header.值使.join(' · ')}　旬空：{result.header.旬空地支}<br />{result.timeConvention}</p></div>
          <div className={card}><h2 className="mb-4 text-lg font-semibold">九宫盘</h2><div className="grid grid-cols-3 gap-1 sm:gap-2">{result.cells.map((cell) => <div key={cell.palace} className="min-h-28 rounded border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-2 text-xs leading-6 sm:p-3 sm:text-sm"><div className="flex justify-between text-[var(--qm-secondary)]"><b>{names[cell.palace]}</b><span>{cell.void ? '空' : ''}{cell.horse ? ' 马' : ''}</span></div><div>{cell.god || '—'}</div><div>{cell.star === '芮禽' ? '天芮、天禽' : cell.star || '—'} <span className="float-right">{cell.heaven.join('、')}</span></div><div>{cell.gate || '—'} <span className="float-right">{cell.earth}</span></div></div>)}</div><p className="mt-2 text-xs text-[var(--qm-muted)]">地盘寄干按 v2.6 核盘口径显示；中五仅显示地盘原干，不重复判断。</p></div>
          {result.cases && <details className={card}><summary className="cursor-pointer font-semibold">同类书例参照（{result.cases.书例?.length || 0}）</summary><p className="mt-2 text-xs text-[var(--qm-muted)]">{result.cases.说明}；{result.cases.检索状态}。历史案例只作方法参考，不可套用结果。</p>{result.cases.书例?.map((item)=><div key={item.编号} className="mt-3 border-t border-[var(--qm-border-soft)] pt-2 text-sm"><b>{item.编号} · {item.标题}</b><p>{item.断法要点}</p><p className="text-xs text-[var(--qm-muted)]">{item.检索依据}</p></div>)}</details>}
          <div className={card}><h2 className="text-lg font-semibold">分析依据</h2><p className="mt-2 text-sm leading-7 text-[var(--qm-ink-soft)]">以下是 v2.6 的规则输出，用于学习和复盘。评分与“信心”属于模型内部信号，不代表经过验证的预测概率；结论仍需结合现实条件、反证与观察期限复核。</p>{result.timingNote && <p className="mt-2 text-sm text-[var(--qm-secondary)]">{result.timingNote}</p>}<details className="mt-4 border border-[var(--qm-border-soft)] p-3"><summary className="cursor-pointer font-semibold">五层主流程与六维校验清单</summary><p className="mt-2 text-sm leading-7">五层：定局 → 定位 → 定象 → 定势 → 定策。请依次核查盘头、主辅用神、星门神干、旺衰四害和现实行动。</p><p className="mt-2 text-sm leading-7">六维：竖看、横看、远近、高低、多重用神、信息同步。以下报告提供盘面线索；无法从输入或计算结果确认的维度仍需人工核对，未自动视为通过。</p></details><pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[var(--qm-ink)]">{result.report}</pre><p className="mt-5 border-t border-[var(--qm-border-soft)] pt-4 text-xs leading-6 text-[var(--qm-muted)]">以上内容属于传统文化与时空决策模型的分析参考，不构成绝对预测；涉及健康、法律、投资和重大人生决定时，请结合现实信息与专业意见。</p></div>
        </>}
      </div>
    </div>}
  </div>
}
