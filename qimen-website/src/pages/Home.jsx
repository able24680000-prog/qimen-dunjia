import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const previewCells = [
  { palace: '巽四', star: '天辅', door: '杜门', god: '九天' },
  { palace: '离九', star: '天英', door: '景门', god: '值符' },
  { palace: '坤二', star: '天芮', door: '死门', god: '螣蛇' },
  { palace: '震三', star: '天冲', door: '伤门', god: '六合' },
  { palace: '中五', star: '一念', door: '起局', god: '太阴' },
  { palace: '兑七', star: '天柱', door: '惊门', god: '白虎' },
  { palace: '艮八', star: '天任', door: '生门', god: '玄武' },
  { palace: '坎一', star: '天蓬', door: '休门', god: '九地' },
  { palace: '乾六', star: '天心', door: '开门', god: '太常' },
]

const notes = [
  ['择时', '以当前时刻或指定年月日时起局。'],
  ['看宫', '星、门、神、天地盘干分层追读。'],
  ['复盘', '记录验证窗口，以现实反馈校准判断。'],
]

const trustPoints = ['可信排盘', '知识回链', '本地复盘']

export default function Home() {
  const [question, setQuestion] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = question.trim()
    navigate(trimmed ? `/divination?question=${encodeURIComponent(trimmed)}` : '/divination')
  }

  return (
    <div className="relative overflow-hidden bg-[#f3f1e8] text-[#263c30]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(133,158,135,0.18),transparent_32%),linear-gradient(180deg,#f0f2e8_0%,#e4e9dc_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(90deg,#446758_1px,transparent_1px),linear-gradient(180deg,#446758_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <section className="relative px-4 py-6 md:py-10">
        <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <div className="max-w-xl">
            <p className="text-sm text-[#567462]">时家奇门 · 择时起局 · 九宫读象</p>
            <h1
              className="mt-4 text-4xl font-semibold leading-tight text-[#203a2c] md:text-6xl"
              style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif", textWrap: 'balance' }}
            >
              奇门遁甲在线排盘
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-[#52665a] md:text-lg md:leading-8">
              以当前时间或指定时间起局，查看九宫盘、星门神和宫位依据；每一次判断都保留为可复盘的观察记录。
            </p>

            <form onSubmit={handleSubmit} className="mt-5 max-w-xl rounded-lg border border-[#cbd5c3] bg-[#fdfdf8] p-3 shadow-[0_10px_30px_rgba(35,57,45,0.07)]">
              <label htmlFor="home-question" className="sr-only">此刻所问何事</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="home-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={120}
                  placeholder="此刻所问何事？一盘只问一件事。"
                  className="min-h-12 flex-1 rounded border border-[#cdd8c7] bg-[#f8faf4] px-4 text-sm text-[#203a2c] placeholder:text-[#6d8173] focus:border-[#527e64] focus:outline-none focus:ring-2 focus:ring-[#527e64]/30"
                />
                <button
                  type="submit"
                  className="min-h-12 rounded border border-[#315845] bg-[#315845] px-6 text-sm font-semibold text-[#fffdf4] transition-colors hover:bg-[#446f59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315845]"
                >
                  进入排盘
                </button>
              </div>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {trustPoints.map((item) => (
                <span key={item} className="rounded border border-[#d3ddd0] bg-[#f8faf4] px-3 py-1 text-xs text-[#486557]">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#536d5c]">
              <Link to="/knowledge" className="transition-colors hover:text-[#875337]">先看基础知识</Link>
              <Link to="/about" className="transition-colors hover:text-[#875337]">查看免责声明</Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[420px] lg:max-w-[520px]">
            <div className="absolute -inset-6 bg-[radial-gradient(circle,rgba(103,141,112,0.14),transparent_58%)] blur-2xl" />
            <div className="relative grid aspect-square grid-cols-3 overflow-hidden rounded-lg border border-[#aabda9] bg-[#f9faf2] shadow-[0_18px_45px_rgba(45,72,52,0.12)]">
              {previewCells.map((cell, index) => (
                <div
                  key={cell.palace}
                  className={`group min-h-16 border-[#cbd9c9] p-2 transition-colors hover:bg-[#e6eee3] md:min-h-24 md:p-5 ${index % 3 !== 2 ? 'border-r' : ''} ${index < 6 ? 'border-b' : ''} ${cell.palace === '中五' ? 'bg-[#e8ede2]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#657e6c]">
                    <span>{cell.palace}</span>
                    <span>{cell.god}</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#294c3a] md:mt-5 md:text-2xl" style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}>
                    {cell.star}
                  </div>
                  <div className="mt-2 text-sm text-[#8a5941]">{cell.door}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-[#d9dfd0] bg-[#fafaf4] px-4 py-10 text-[#211b15]">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-start">
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}>不是替你决定，而是帮你复盘</h2>
            <p className="mt-3 max-w-[54ch] text-sm leading-7 text-[#5b4f40]">
              排盘页默认按当前时间生成盘局。你可以改时间、补充所问事项，再点击宫位查看依据、风险和观察点。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {notes.map(([title, text]) => (
              <div key={title} className="border-t border-[#9c865b] pt-3">
                <div className="font-semibold text-[#6b241f]">{title}</div>
                <p className="mt-2 text-sm leading-6 text-[#5b4f40]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

