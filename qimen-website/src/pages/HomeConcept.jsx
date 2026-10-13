import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/concept-home.css'

const stages = [
  { name: '河图', latin: 'HETU', type: 'dots' },
  { name: '洛书', latin: 'LUOSHU', type: 'grid' },
  { name: '八卦', latin: 'BAGUA', type: 'bagua' },
  { name: '奇门盘', latin: 'QIMEN PAN', type: 'disc' },
]

const navItems = [
  { label: '探索', to: '/home-concept' },
  { label: '排盘', to: '/divination' },
  { label: '知识', to: '/knowledge' },
  { label: '案例', to: '/cases' },
  { label: '关于', to: '/about' },
]

const particles = Array.from({ length: 46 }, (_, index) => {
  const column = index % 7
  const row = Math.floor(index / 7)
  return {
    id: index,
    x: 34 + column * 5 + (row % 2) * 2.5,
    y: 2 + row * 13,
    delay: `${(index % 12) * -0.42}s`,
    scale: 0.58 + ((index * 7) % 8) / 10,
  }
})

function BrandMark() {
  return (
    <Link to="/" className="concept-brand" aria-label="返回首页">
      <span className="concept-brand__seal" aria-hidden="true">
        <span />
      </span>
      <span>
        <strong>奇门遁甲</strong>
        <small>QIMEN DUNJIA</small>
      </span>
    </Link>
  )
}

function StageIcon({ type }) {
  if (type === 'dots') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="2.8" />
        {[12, 22, 42, 52].map((x, index) => (
          <circle key={x} cx={x} cy={index < 2 ? 18 : 46} r="2" />
        ))}
        {[18, 46].map((y) => (
          <line key={y} x1="14" y1={y} x2="50" y2={64 - y} />
        ))}
        <circle cx="32" cy="12" r="1.8" />
        <circle cx="32" cy="52" r="1.8" />
      </svg>
    )
  }

  if (type === 'grid') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {[16, 32, 48].map((x) => (
          <line key={`v-${x}`} x1={x} y1="10" x2={x} y2="54" />
        ))}
        {[16, 32, 48].map((y) => (
          <line key={`h-${y}`} x1="10" y1={y} x2="54" y2={y} />
        ))}
        {[14, 32, 50].map((x, i) => (
          <circle key={x} cx={x} cy={i === 1 ? 32 : 18 + i * 14} r="2" />
        ))}
      </svg>
    )
  }

  if (type === 'bagua') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="10" />
        <path d="M32 22a10 10 0 0 1 0 20 5 5 0 0 1 0-10 5 5 0 0 0 0-10Z" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 32 32)`}>
            <line x1="30" y1="6" x2="34" y2="6" />
            <line x1="27" y1="11" x2="37" y2="11" />
          </g>
        ))}
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="16" />
      <circle cx="32" cy="32" r="7" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line key={deg} x1="32" y1="8" x2="32" y2="14" transform={`rotate(${deg} 32 32)`} />
      ))}
    </svg>
  )
}

function StageList() {
  return (
    <aside className="concept-stages" aria-label="演化序列">
      {stages.map((stage) => (
        <div className="concept-stage" key={stage.name}>
          <span className="concept-stage__pin" aria-hidden="true" />
          <div>
            <strong>{stage.name}</strong>
            <small>{stage.latin}</small>
          </div>
          <StageIcon type={stage.type} />
        </div>
      ))}
    </aside>
  )
}

function ParticleColumn() {
  return (
    <div className="concept-particles" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: particle.delay,
            '--particle-scale': particle.scale,
          }}
        />
      ))}
    </div>
  )
}

function QimenDisc() {
  const rings = Array.from({ length: 36 }, (_, index) => index)
  return (
    <div className="concept-disc" aria-hidden="true">
      <div className="concept-disc__face">
        {rings.map((ring) => (
          <span key={ring} style={{ transform: `rotate(${ring * 10}deg)` }} />
        ))}
        <b />
      </div>
    </div>
  )
}

export default function HomeConcept() {
  const sceneRef = useRef(null)

  useEffect(() => {
    const scene = sceneRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!scene || reduceMotion) return undefined

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handlePointerMove = (event) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2
      targetY = (event.clientY / window.innerHeight - 0.5) * 2
    }

    const tick = () => {
      currentX += (targetX - currentX) * 0.055
      currentY += (targetY - currentY) * 0.055
      scene.style.setProperty('--concept-parallax-x', currentX.toFixed(3))
      scene.style.setProperty('--concept-parallax-y', currentY.toFixed(3))
      frame = window.requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    frame = window.requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section ref={sceneRef} className="concept-home" aria-label="奇门遁甲数字艺术馆首页样稿">
      <div className="concept-room" aria-hidden="true">
        <span className="concept-room__oculus" />
        <span className="concept-room__left-shadow" />
        <span className="concept-room__right-shadow" />
        <span className="concept-room__horizon" />
      </div>

      <header className="concept-nav">
        <BrandMark />
        <nav className="concept-nav__links" aria-label="样稿导航">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
          <button type="button" aria-label="打开菜单" className="concept-menu">
            <span />
            <span />
          </button>
        </nav>
      </header>

      <div className="concept-left-copy">
        <h1>心起，则局生</h1>
        <p>探索时间与空间的隐秘秩序</p>
      </div>

      <main className="concept-center" aria-label="一念生万局">
        <div className="concept-energy">
          <ParticleColumn />
          <div className="concept-sphere" aria-hidden="true">
            <span />
          </div>
          <div className="concept-matrix" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <QimenDisc />
          <div className="concept-water" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>

      <StageList />

      <Link to="/divination" className="concept-enter">
        <span>进入排局</span>
        <small>ENTER</small>
        <i aria-hidden="true" />
      </Link>
    </section>
  )
}
