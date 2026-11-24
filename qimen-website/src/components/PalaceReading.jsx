import { readXiang } from '../lib/duxiang'
import { JIU_GONG } from '../lib/qimen'

function linesFor(cell, field, value) {
  return readXiang({ gong: String(cell.palace), [field]: value }).lines.filter(line => !line.startsWith('坎宫') && !line.startsWith('坤宫') && !line.startsWith('震宫') && !line.startsWith('巽宫') && !line.startsWith('中宫') && !line.startsWith('乾宫') && !line.startsWith('兑宫') && !line.startsWith('艮宫') && !line.startsWith('离宫'))
}

export default function PalaceReading({ cell, onClose }) {
  const info = JIU_GONG[String(cell.palace)] || {}
  const stars = cell.star === '芮禽' ? ['天芮', '天禽'] : cell.star ? [cell.star] : []
  const sections = [
    { title: '神定性', lines: cell.god ? linesFor(cell, 'god', cell.god) : ['本宫无八神信息。'] },
    { title: '星定势', lines: stars.length ? stars.flatMap(star => linesFor(cell, 'star', star)) : ['本宫无九星信息。'] },
    { title: '门定行', lines: cell.gate ? [...linesFor(cell, 'door', cell.gate), `门与宫的关系：${cell.gateRelation || '待核'}。`] : ['本宫无八门信息。'] },
    { title: '干定事', lines: [
      ...cell.heaven.flatMap(stem => linesFor(cell, 'tianGan', stem)),
      ...cell.earth.flatMap(stem => linesFor(cell, 'diGan', stem)),
      ...(!cell.heaven.length && !cell.earth.length ? ['本宫无天地盘干信息。'] : []),
    ] },
  ]
  return <section className="mt-4 border-t border-[var(--qm-border-soft)] pt-4" aria-label={`${info.name}${cell.palace}宫详情`}>
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[var(--qm-primary)]">{info.name}{cell.palace}宫 · 单宫解读</h3><button type="button" onClick={onClose} className="border border-[var(--qm-border)] px-3 py-1 text-xs">关闭</button></div>
    <p className="mt-2 text-xs leading-6 text-[var(--qm-ink-soft)]">{info.direction} · {cell.void ? '空亡' : '未标空亡'} · {cell.horse ? '驿马' : '未标驿马'}。以下为符号的传统类象，需结合所问事项、旺衰与其他宫位判断。</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{sections.map(section => <div key={section.title} className="border border-[var(--qm-border-soft)] p-3"><h4 className="text-sm font-bold text-[var(--qm-primary)]">{section.title}</h4>{section.lines.map((line,index) => <p key={`${line}-${index}`} className="mt-1 text-sm leading-6">{line}</p>)}</div>)}</div>
    <div className="mt-3 border border-[var(--qm-border-soft)] p-3"><h4 className="text-sm font-bold text-[var(--qm-primary)]">天地盘干 · 格局参考</h4>{cell.patterns?.length ? cell.patterns.map((item,index) => <p key={`${item.组合}-${index}`} className="mt-1 text-sm leading-6">{item.位置} {item.天盘干}加{item.地盘干}：{item.格局}（{item.吉凶}）{item.击刑 ? '；击刑' : ''}{item.墓库候选 ? '；墓库候选，需复核' : ''}</p>) : <p className="mt-1 text-sm leading-6">当前宫位没有可用的天地盘干组合。</p>}<p className="mt-2 text-xs leading-6 text-[var(--qm-ink-soft)]">格局由当前时家奇门引擎提供，仅作传统规则参考；不能单凭一宫或单一格局断定吉凶。</p></div>
  </section>
}
