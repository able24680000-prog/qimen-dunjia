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
    <div className="relative overflow-hidden bg-[#101513] text-[#f3efe4]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(197,164,94,0.16),transparent_28%),radial-gradient(circle_at_72%_44%,rgba(52,102,86,0.18),transparent_34%),linear-gradient(180deg,#101513_0%,#12100d_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#d8b56d_1px,transparent_1px),linear-gradient(180deg,#d8b56d_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <section className="relative px-4 py-6 md:py-10">
        <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <div className="max-w-xl">
            <p className="text-sm tracking-[0.22em] text-[#bfa46b]">时家奇门 · 择时起局 · 九宫读象</p>
            <h1
              className="mt-4 text-4xl font-semibold leading-tight text-[#f7f0df] md:text-6xl"
              style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif", textWrap: 'balance' }}
            >
              奇门遁甲在线排盘
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-[#c9c0ad] md:text-lg md:leading-8">
              以当前时间或指定时间起局，查看九宫盘、星门神和宫位依据；每一次判断都保留为可复盘的观察记录。
            </p>

            <form onSubmit={handleSubmit} className="mt-5 max-w-xl border border-[#8f7442] bg-[#171b17]/88 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
              <label htmlFor="home-question" className="sr-only">此刻所问何事</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="home-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={120}
                  placeholder="此刻所问何事？一盘只问一件事。"
                  className="min-h-12 flex-1 border border-[#3a4038] bg-[#0e1210] px-4 text-sm text-[#f7f0df] placeholder:text-[#8f8879] focus:border-[#c6a15a] focus:outline-none focus:ring-2 focus:ring-[#c6a15a]/20"
                />
                <button
                  type="submit"
                  className="min-h-12 border border-[#c6a15a] bg-[#c6a15a] px-6 text-sm font-semibold text-[#15130f] transition-colors hover:bg-[#d6b66d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7f0df]"
                >
                  进入排盘
                </button>
              </div>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {trustPoints.map((item) => (
                <span key={item} className="border border-[#6d5d36] bg-[#121814]/80 px-3 py-1 text-xs text-[#b8ad98]">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#9f9584]">
              <Link to="/knowledge" className="transition-colors hover:text-[#d6b66d]">先看基础知识</Link>
              <Link to="/about" className="transition-colors hover:text-[#d6b66d]">查看免责声明</Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[420px] lg:max-w-[520px]">
            <div className="absolute -inset-6 bg-[radial-gradient(circle,rgba(198,161,90,0.16),transparent_58%)] blur-2xl" />
            <div className="relative grid aspect-square grid-cols-3 border border-[#9f7e45]/55 bg-[#111511]/88 shadow-[0_22px_70px_rgba(0,0,0,0.38)]">
              {previewCells.map((cell, index) => (
                <div
                  key={cell.palace}
                  className={`group min-h-16 border-[#806537]/45 p-2 transition-colors hover:bg-[#1a211c] md:min-h-24 md:p-5 ${index % 3 !== 2 ? 'border-r' : ''} ${index < 6 ? 'border-b' : ''} ${cell.palace === '中五' ? 'bg-[#1d1a12]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#9f9584]">
                    <span>{cell.palace}</span>
                    <span>{cell.god}</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#f1ead7] md:mt-5 md:text-2xl" style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}>
                    {cell.star}
                  </div>
                  <div className="mt-2 text-sm text-[#c6a15a]">{cell.door}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-[#302a1d] bg-[#f3efe4] px-4 py-10 text-[#211b15]">
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

