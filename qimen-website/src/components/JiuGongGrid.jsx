import { JIU_GONG } from '../lib/qimen'

const GRID_ORDER = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
]

const FONT_SONG = "'SimSun', 'STSong', 'Noto Serif SC', serif"

const GONG_MARKER_STYLE = {
  kongwang: 'border-[#8f7d61] bg-[#f3e3c8] text-[#7a4a25]',
  mastar: 'border-[#2d6253]/35 bg-[#edf5ef] text-[var(--qm-secondary)]',
  jixing: 'border-[#9a4a22]/35 bg-[#fff7ed] text-[#9a4a22]',
  rumu: 'border-[#5f5144]/25 bg-[#efe8dc] text-[#5f5144]',
  menpo: 'border-[#9a4a22]/35 bg-[#fff7ed] text-[#9a4a22]',
  fuyin: 'border-[#7f725f]/30 bg-[var(--qm-surface-2)] text-[#5f5144]',
  fanyin: 'border-[#b45309]/35 bg-[#fff7ed] text-[#9a4a22]',
}

function getGongMarkers(result, gongKey, analysis) {
  const markers = []
  const add = (type, label, title) => {
    if (!markers.some((item) => item.type === type && item.label === label)) {
      markers.push({ type, label, title })
    }
  }

  if (result.kongWangGong?.includes(gongKey)) add('kongwang', '空', '空亡：事情易虚、迟、落空，需等填实或现实确认。')
  if (result.maStar?.gong === gongKey) add('mastar', '马', '驿马：主移动、变动、拜访、改期、换渠道。')

  for (const item of analysis?.geju?.items || []) {
    if (item.type === 'jixing') add('jixing', '刑', item.meaning || '击刑：主内耗、误伤、制度或细节卡顿。')
    if (item.type === 'rumu') add('rumu', '墓', item.meaning || '入墓：主收束、停滞、藏伏，推进不畅。')
    if (item.type === 'menpo') add('menpo', '迫', item.meaning || '门迫：行为压迫环境，推进易有冲突。')
    if (item.type === 'fuyin') add('fuyin', '伏', item.meaning || '伏吟：停滞、重复、原地打转。')
    if (item.type === 'fanyin') add('fanyin', '反', item.meaning || '反吟：反复、变动、方向逆转。')
  }

  return markers
}

export default function JiuGongGrid({ result, onPalaceClick, limitedMarkers = false }) {
  if (!result) return null

  const { tianPan, diPan, displayTianPan, displayDiPan, jiuXing, baMen, baShen, jiuGongAnalysis } = result

  return (
    <div>
      <div className="jiu-gong-grid grid grid-cols-3 gap-1.5 md:gap-2 max-w-lg mx-auto">
        {GRID_ORDER.flat().map((gongNum) => {
          const gongKey = gongNum.toString()
          const gongInfo = JIU_GONG[gongKey] || {}
          const analysis = jiuGongAnalysis?.[gongKey]
          const xing = jiuXing?.[gongKey] || ''
          const men = baMen?.[gongKey] || ''
          const shen = baShen?.[gongKey] || ''
          const tianGan = displayTianPan?.[gongKey] ?? tianPan?.[gongKey] ?? ''
          const diGan = displayDiPan?.[gongKey] ?? diPan?.[gongKey] ?? ''
          const markers = getGongMarkers(result, gongKey, analysis)

          return (
            <div
              key={gongNum}
              onClick={() => onPalaceClick?.(gongKey)}
              role="button"
              tabIndex={0}
              aria-label={`查看${gongInfo.name}${gongKey}宫详情`}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPalaceClick?.(gongKey) } }}
              className={`palace-cell aspect-square relative bg-[var(--qm-surface)] border rounded-lg p-2 md:p-3 cursor-pointer transition-all duration-200 hover:border-[rgba(107,36,31,0.6)] hover:bg-[rgba(255,250,240,0.9)] hover:shadow-[0_6px_16px_rgba(107,36,31,0.14)] ${
                gongNum === 5 ? 'col-span-1' : ''
              } border-[var(--qm-border)]`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="text-[10px] md:text-xs text-[var(--qm-primary)] font-bold" style={{ fontFamily: FONT_SONG }}>
                  {gongInfo.name}{gongKey}
                </div>
                {markers.length > 0 && (
                  <div className="flex max-w-[54px] flex-wrap justify-end gap-0.5" aria-label="宫位特殊标记">
                    {markers.slice(0, 4).map((marker) => (
                      <span
                        key={`${gongKey}-${marker.type}-${marker.label}`}
                        title={marker.title}
                        className={`border px-1 py-0.5 text-[9px] leading-none font-bold ${GONG_MARKER_STYLE[marker.type] || 'border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] text-[#5f5144]'}`}
                      >
                        {marker.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-h-[1.25rem] text-[12px] md:text-sm font-medium text-[#211b15]">
                {shen || '-'}
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-1">
                <div className="truncate text-[13px] md:text-base font-medium" style={{ color: gongInfo.color }}>
                  {xing || '-'}
                </div>
                <div className="text-[13px] md:text-base text-[#211b15]">
                  {tianGan || ''}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <div className="truncate text-[14px] md:text-lg text-[#211b15]">{men || '-'}</div>
                <div className="text-[14px] md:text-lg text-[#211b15]">{diGan || ''}</div>
              </div>

              {markers.length > 0 && (
                <div className="text-[9px] leading-none text-[#7f725f]">
                  {analysis?.jiXiongText || '待断'}
                </div>
              )}
              {!markers.length && (
                <div className="text-[9px] leading-none text-[#7f725f]">
                  {analysis?.jiXiongText || '待断'}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mx-auto mt-3 flex max-w-lg flex-wrap gap-1.5 text-[10px] text-[#5f5144]">
        {[
          ['空', '空亡'],
          ['马', '驿马'],
          ['刑', '击刑'],
          ['墓', '入墓'],
          ['迫', '门迫'],
          ['伏', '伏吟'],
          ['反', '反吟']
        ].filter(([mark]) => !limitedMarkers || ['空','马'].includes(mark)).map(([mark, label]) => (
          <span key={mark} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] px-2 py-1">
            <span className="font-bold text-[var(--qm-primary)]">{mark}</span> {label}
          </span>
        ))}
      </div>
    </div>
  )
}




