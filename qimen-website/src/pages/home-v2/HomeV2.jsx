import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './home-v2.css'

const numberNames = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' }

const bureauData = {
  meta: {
    dun: '阳遁',
    ju: 7,
    cycle: '夏至下元',
    dutyStar: '天心星',
    dutyDoor: '开门',
    headline: ['先定其势', '再择其门'],
    summary: '值符天心，值使开门。事有明路，仍须审时而行。',
  },
  palaces: [
    { number: 4, trigram: '巽', door: '杜门', star: '天辅', deity: '六合', stem: '辛', note: '巽四宫：风行入木，宜梳理关系与传播路径。' },
    { number: 9, trigram: '离', door: '景门', star: '天英', deity: '九天', stem: '乙', note: '离九宫：火明于上，宜呈现成果，不宜虚张声势。' },
    { number: 2, trigram: '坤', door: '死门', star: '天芮', deity: '玄武', stem: '己', note: '坤二宫：地势厚重，宜止损整顿，先处理旧事。' },
    { number: 3, trigram: '震', door: '伤门', star: '天冲', deity: '白虎', stem: '癸', note: '震三宫：雷动而急，行动之前须留出回旋余地。' },
    { number: 5, trigram: '中', door: '中宫', star: '天禽', deity: '中正', stem: '戊', note: '中五宫：诸气会聚，先辨主次，再定用神。' },
    { number: 7, trigram: '兑', door: '惊门', star: '天柱', deity: '腾蛇', stem: '丁', note: '兑七宫：金声外显，宜辨明消息，慎防口舌与误判。' },
    { number: 8, trigram: '艮', door: '生门', star: '天任', deity: '九地', stem: '丙', note: '艮八宫：山止而成，宜守住基础，稳步增益。' },
    { number: 1, trigram: '坎', door: '休门', star: '天蓬', deity: '太阴', stem: '壬', note: '坎一宫：水行于隐，宜蓄势、研究与修整。' },
    { number: 6, trigram: '乾', door: '开门', star: '天心', deity: '值符', stem: '庚', note: '乾六宫：天心临开门，宜先定边界，再开新局。', duty: true },
  ],
}

const navItems = [
  { label: '排盘', to: '/divination' },
  { label: '知识', to: '/knowledge' },
  { label: '案例', to: '/cases' },
  { label: '关于', to: '/about' },
]

export default function HomeV2() {
  const pageRef = useRef(null)
  const plateCanvasRef = useRef(null)
  const skyCanvasRef = useRef(null)
  const compassDialRef = useRef(null)
  const folioLightRef = useRef(null)
  const folioFrameRef = useRef(null)
  const folioFoldRef = useRef(null)
  const bookEarRef = useRef(null)
  const instrumentIndexRef = useRef(null)
  const axisRef = useRef(null)
  const ringRefs = useRef([])
  const palaceRefs = useRef([])
  const layerRefs = useRef([])
  const dutyMarkRef = useRef(null)
  const introRunRef = useRef(0)
  const replayRef = useRef(null)
  const animationsRef = useRef([])

  const [activePalace, setActivePalace] = useState(null)
  const navigate = useNavigate()

  const dutyPalace = bureauData.palaces.find((p) => p.duty)
  const current = activePalace || dutyPalace

  useEffect(() => {
  function css(name) {
    return getComputedStyle(pageRef.current).getPropertyValue(name).trim()
  }

  function duration(name) {
    const value = css(name)
    return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000
  }

  function register(animation) {
    animationsRef.current.push(animation)
    return animation
  }

  function cancelAnimations() {
    animationsRef.current.forEach((a) => a.cancel())
    animationsRef.current = []
  }

  function animate(element, keyframes, options) {
    const animation = register(element.animate(keyframes, options))
    return animation.finished.catch(() => undefined)
  }

  async function animateGroup(elements, keyframes, options, stagger) {
    const jobs = elements.map((el, i) =>
      animate(el, keyframes, { ...options, delay: (options.delay || 0) + i * stagger })
    )
    await Promise.all(jobs)
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(rect.width * ratio)
    canvas.height = Math.round(rect.height * ratio)
    const context = canvas.getContext('2d')
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    return { context, size: rect.width, center: rect.width / 2 }
  }

  function drawPlate() {
    const canvas = plateCanvasRef.current
    if (!canvas) return
    const { context, size, center } = prepareCanvas(canvas)
    context.clearRect(0, 0, size, size)
    context.strokeStyle = css('--hv2-rule')
    context.lineWidth = 1

    ;[0.46, 0.39, 0.31].forEach((ratio) => {
      context.beginPath()
      context.arc(center, center, size * ratio, 0, Math.PI * 2)
      context.stroke()
    })

    context.strokeStyle = css('--hv2-celadon')
    context.globalAlpha = 0.52
    context.lineWidth = Math.max(9, size * 0.025)
    context.beginPath()
    context.arc(center, center, size * 0.425, 0, Math.PI * 2)
    context.stroke()
    context.globalAlpha = 1

    context.strokeStyle = css('--hv2-rule-soft')
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(center, size * 0.1)
    context.lineTo(center, size * 0.9)
    context.moveTo(size * 0.1, center)
    context.lineTo(size * 0.9, center)
    context.stroke()
  }

  function drawSky() {
    const canvas = skyCanvasRef.current
    if (!canvas) return
    const { context, size, center } = prepareCanvas(canvas)
    context.clearRect(0, 0, size, size)
    context.strokeStyle = css('--hv2-ink-soft')
    context.lineWidth = 1
    const inner = size * 0.445
    const outer = size * 0.465
    for (let i = 0; i < 48; i++) {
      const angle = (Math.PI * 2 * i) / 48 - Math.PI / 2
      const start = i % 6 === 0 ? inner - size * 0.012 : inner
      context.beginPath()
      context.moveTo(center + Math.cos(angle) * start, center + Math.sin(angle) * start)
      context.lineTo(center + Math.cos(angle) * outer, center + Math.sin(angle) * outer)
      context.stroke()
    }
  }

  function drawInstrument() {
    drawPlate()
    drawSky()
  }

  function setSettled() {
    const page = pageRef.current
    if (!page) return
    page.classList.remove('is-playing')
    page.classList.add('is-settled')
    const selectors = [
      '.hv2-folio__frame', '.hv2-folio__fold', '.hv2-book-ear',
      '.hv2-palace', '.hv2-palace__layers', '.hv2-palace__duty',
      '.hv2-instrument__dial', '.hv2-instrument__index', '.hv2-axis',
    ]
    page.querySelectorAll(selectors.join(', ')).forEach((el) => {
      el.style.opacity = ''
      el.style.transform = ''
    })
  }

  async function playIntro() {
    introRunRef.current += 1
    const run = introRunRef.current
    cancelAnimations()
    const page = pageRef.current
    page.classList.remove('is-settled')
    page.classList.add('is-playing')

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setSettled()
      return
    }

    const paper = duration('--hv2-stage-paper')
    const frame = duration('--hv2-stage-frame')
    const ground = duration('--hv2-stage-ground')
    const sky = duration('--hv2-stage-sky')
    const dial = duration('--hv2-stage-dial')
    const seal = duration('--hv2-stage-seal')
    const easeInk = css('--hv2-ease-ink')
    const easeSettle = css('--hv2-ease-settle')
    const easeCalibrate = css('--hv2-ease-calibrate')

    await animate(page, [{ opacity: 0.28 }, { opacity: 1 }], { duration: paper, easing: easeInk, fill: 'both' })
    if (run !== introRunRef.current) return

    await Promise.all([
      animate(folioFrameRef.current, [
        { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)' },
      ], { duration: frame, easing: easeInk, fill: 'both' }),
      animate(folioFoldRef.current, [
        { opacity: 0, transform: 'scaleY(0)' },
        { opacity: 1, transform: 'scaleY(1)' },
      ], { duration: frame, easing: easeInk, fill: 'both' }),
      animate(bookEarRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: frame, easing: easeInk, fill: 'both' }),
      animate(compassDialRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: frame, easing: easeInk, fill: 'both' }),
      animateGroup(ringRefs.current, [{ opacity: 0 }, { opacity: 1 }], { duration: frame, easing: easeInk, fill: 'both' }, 90),
    ])
    if (run !== introRunRef.current) return

    const palaceElements = palaceRefs.current.filter(Boolean)
    await animateGroup(palaceElements, [
      { opacity: 0, transform: 'translateY(5px)', color: 'transparent' },
      { opacity: 1, transform: 'translateY(0)', color: css('--hv2-ink') },
    ], { duration: ground - 420, easing: easeInk, fill: 'both' }, 52)
    if (run !== introRunRef.current) return

    const layerElements = layerRefs.current.filter(Boolean)
    await Promise.all([
      animate(compassDialRef.current, [
        { opacity: 0.32, transform: 'rotate(-12deg)' },
        { opacity: 1, transform: 'rotate(-4deg)' },
      ], { duration: sky, easing: easeCalibrate, fill: 'both' }),
      animateGroup(layerElements, [
        { opacity: 0, transform: 'translateY(4px) rotate(-3deg)' },
        { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
      ], { duration: sky - 420, easing: easeSettle, fill: 'both' }, 45),
    ])
    if (run !== introRunRef.current) return

    await Promise.all([
      animate(compassDialRef.current, [
        { opacity: 1, transform: 'rotate(-4deg)' },
        { opacity: 1, transform: 'rotate(0.8deg)', offset: 0.82 },
        { opacity: 1, transform: 'rotate(0deg)' },
      ], { duration: dial, easing: easeCalibrate, fill: 'both' }),
      animate(folioLightRef.current, [
        { opacity: 0, transform: 'translateX(0) skewX(-8deg)' },
        { opacity: 0.42, offset: 0.45 },
        { opacity: 0, transform: 'translateX(430%) skewX(-8deg)' },
      ], { duration: dial, easing: easeInk, fill: 'both' }),
    ])
    if (run !== introRunRef.current) return

    await Promise.all([
      animate(dutyMarkRef.current, [
        { opacity: 0, transform: 'scale(0.74)' },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: seal, easing: easeSettle, fill: 'both' }),
      animate(axisRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: seal, easing: easeInk, fill: 'both' }),
      animate(instrumentIndexRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: seal, easing: easeInk, fill: 'both' }),
    ])

    if (run === introRunRef.current) setSettled()
  }

    replayRef.current = playIntro
    drawInstrument()
    playIntro()

    const handleResize = () => drawInstrument()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      introRunRef.current += 1
      replayRef.current = null
      cancelAnimations()
    }
  }, [])

  const handlePalaceEnter = (palace) => setActivePalace(palace)
  const handlePalaceLeave = () => setActivePalace(null)

  return (
    <div className="hv2-root">
      <main className="hv2-page" ref={pageRef} aria-label="奇门遁甲宋版活盘首页">
        <header className="hv2-topbar">
          <Link className="hv2-brand" to="/" aria-label="奇门遁甲首页">
            <span className="hv2-brand__mark" aria-hidden="true">中</span>
            <span className="hv2-brand__text">
              <strong>奇门遁甲</strong>
              <small>QIMEN DUNJIA</small>
            </span>
          </Link>
          <nav className="hv2-nav" aria-label="主导航">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ))}
          </nav>
        </header>

        <section className="hv2-hero" aria-labelledby="hv2-hero-title">
          <aside className="hv2-title-rail">
            <h1 className="hv2-title-rail__main" id="hv2-hero-title"><span>奇</span>门遁甲</h1>
            <p className="hv2-title-rail__note">观天时 · 察地利 · 定人事</p>
          </aside>

          <article className="hv2-folio" aria-label="今日奇门局盘">
            <span className="hv2-folio__frame" ref={folioFrameRef} aria-hidden="true" />
            <span className="hv2-folio__fold" ref={folioFoldRef} aria-hidden="true" />
            <span className="hv2-folio__light" ref={folioLightRef} aria-hidden="true" />
            <span className="hv2-book-ear" ref={bookEarRef}>
              {bureauData.meta.dun}{numberNames[bureauData.meta.ju]}局 · {bureauData.meta.cycle}
            </span>

            <div className="hv2-instrument">
              <canvas className="hv2-instrument__base" ref={plateCanvasRef} aria-hidden="true" />
              <div className="hv2-instrument__dial" ref={compassDialRef} aria-hidden="true">
                <canvas className="hv2-instrument__sky" ref={skyCanvasRef} />
                <span className="hv2-instrument__ring hv2-instrument__ring--outer"
                  ref={(el) => { ringRefs.current[0] = el }} />
                <span className="hv2-bearing hv2-bearing--south">南</span>
                <span className="hv2-bearing hv2-bearing--west">西</span>
                <span className="hv2-bearing hv2-bearing--north">北</span>
                <span className="hv2-bearing hv2-bearing--east">东</span>
                <span className="hv2-instrument__zero" />
              </div>
              <span className="hv2-instrument__ring hv2-instrument__ring--middle"
                ref={(el) => { ringRefs.current[1] = el }} aria-hidden="true" />
              <span className="hv2-instrument__ring hv2-instrument__ring--inner"
                ref={(el) => { ringRefs.current[2] = el }} aria-hidden="true" />
              <span className="hv2-instrument__index" ref={instrumentIndexRef} aria-hidden="true" />

              <div className="hv2-palace-grid" role="grid" aria-label="九宫四层盘">
                {bureauData.palaces.map((palace, idx) => (
                  <button
                    key={palace.number}
                    type="button"
                    className={`hv2-palace${palace.duty ? ' is-duty' : ''}`}
                    ref={(el) => { palaceRefs.current[idx] = el }}
                    data-palace={palace.number}
                    role="gridcell"
                    aria-label={`${palace.trigram}${numberNames[palace.number]}宫，${palace.door}，${palace.star}，${palace.deity}`}
                    onMouseEnter={() => handlePalaceEnter(palace)}
                    onFocus={() => handlePalaceEnter(palace)}
                    onMouseLeave={handlePalaceLeave}
                    onBlur={handlePalaceLeave}
                  >
                    <span className="hv2-palace__number">{numberNames[palace.number]}</span>
                    <span className="hv2-palace__trigram">{palace.trigram}</span>
                    <span className="hv2-palace__layers" ref={(el) => { layerRefs.current[idx] = el }}>
                      <span className="hv2-palace__stem">{palace.stem}</span>
                      <span className="hv2-palace__door">{palace.door}</span>
                      <span className="hv2-palace__star">{palace.star}</span>
                      <span className="hv2-palace__deity">{palace.deity}</span>
                    </span>
                    {palace.duty && <span className="hv2-palace__duty" ref={dutyMarkRef} aria-hidden="true" />}
                  </button>
                ))}
              </div>

              <span className="hv2-axis" ref={axisRef} aria-hidden="true" />
            </div>

            <footer className="hv2-folio__actions">
              <button className="hv2-text-command" type="button" onClick={() => replayRef.current?.()}>重演</button>
              <button
                className="hv2-entry-link"
                type="button"
                onClick={() => navigate('/divination')}
              >
                入局
              </button>
            </footer>
          </article>

          <aside className="hv2-bureau-note" aria-labelledby="hv2-note-title">
            <span className="hv2-bureau-note__kicker">今日局注</span>
            <h2 id="hv2-note-title">
              {bureauData.meta.headline[0]}<br />{bureauData.meta.headline[1]}
            </h2>
            <p className="hv2-bureau-note__summary">{bureauData.meta.summary}</p>
            <dl className="hv2-bureau-note__facts">
              <div>
                <dt>局式</dt>
                <dd>{bureauData.meta.dun}{numberNames[bureauData.meta.ju]}局</dd>
              </div>
              <div>
                <dt>值符</dt>
                <dd>{bureauData.meta.dutyStar}</dd>
              </div>
              <div>
                <dt>值使</dt>
                <dd>{bureauData.meta.dutyDoor}</dd>
              </div>
            </dl>
            <p className="hv2-bureau-note__palace" aria-live="polite">
              {current ? current.note : ''}
            </p>
          </aside>
        </section>

        <p className="hv2-mobile-note">
          {current ? `${current.trigram}${numberNames[current.number]}宫 · ${current.star} · ${current.door}` : ''}
        </p>

        <section className="hv2-next-band" aria-label="今日时局导读">
          <span>卷一 · 今日时局</span>
          <strong>由盘入局，由象见势</strong>
          <span>下阅局注</span>
        </section>
      </main>
    </div>
  )
}
