import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import Home from './pages/Home'

const HomeConcept = lazy(() => import('./pages/HomeConcept'))
const HomeV2 = lazy(() => import('./pages/home-v2/HomeV2'))
const Divination = lazy(() => import('./pages/Divination'))
const Knowledge = lazy(() => import('./pages/Knowledge'))
const Cases = lazy(() => import('./pages/Cases'))
const About = lazy(() => import('./pages/About'))

const routeMeta = {
  '/': {
    title: '奇门遁甲在线排盘｜时家奇门起局与九宫解读',
    description: '奇门遁甲在线排盘工具，支持时家奇门起局、九宫盘解读、基础知识学习与本地复盘记录。',
  },
  '/divination': {
    title: '在线排盘｜时家奇门、拆补法、九宫盘',
    description: '按当前时间或指定时间起局，查看九宫盘、值符值使、空亡、星门神与复盘观察点。',
  },
  '/knowledge': {
    title: '奇门遁甲基础知识｜三奇六仪、八门九星八神',
    description: '学习奇门遁甲基础术语、起局依据、三奇六仪、八门九星八神、四层盘与复盘方法。',
  },
  '/cases': {
    title: '奇门案例分析｜取用神、验证窗口与复盘',
    description: '通过事业、财运、感情、出行、健康和学业案例，学习取用神、判断依据与复盘口径。',
  },
  '/about': {
    title: '关于本站｜奇门排盘学习工具与免责声明',
    description: '了解本站定位、算法边界、本地数据保存方式、隐私提醒与免责声明。',
  },
}

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/divination', label: '排盘' },
  { path: '/knowledge', label: '知识' },
  { path: '/cases', label: '案例' },
  { path: '/about', label: '关于' },
]

const skinOptions = [
  { value: 'paper', label: '宣纸', title: '温润、古籍、适合传统文化感' },
  { value: 'jade', label: '玄青', title: '沉稳、理性、适合排盘推演' },
]

function setMetaDescription(description) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', description)
}

function getStoredSkin() {
  if (typeof window === 'undefined') return 'paper'
  const stored = window.localStorage.getItem('qimen-skin')
  return skinOptions.some((item) => item.value === stored) ? stored : 'paper'
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Navbar({ skin, onSkinChange }) {
  const location = useLocation()

  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--qm-border)] backdrop-blur-sm"
      style={{ backgroundColor: 'var(--qm-nav-bg)' }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2">
          <Link
            to="/"
            className="shrink-0 text-lg font-semibold tracking-[0.16em] text-[var(--qm-primary)] transition-colors hover:text-[var(--qm-primary-hover)]"
            style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
          >
            奇门遁甲
          </Link>
          <div className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1 sm:justify-end">
            {navLinks.map((link) => {
              const isActive = link.path === '/'
                ? location.pathname === '/'
                : location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors md:px-4 ${
                    isActive
                      ? 'bg-[var(--qm-primary)] text-[var(--qm-surface)]'
                      : 'text-[var(--qm-ink-soft)] hover:bg-[var(--qm-surface-2)] hover:text-[var(--qm-secondary)]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
          <div className="flex shrink-0 items-center border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] p-0.5">
            {skinOptions.map((option) => {
              const isActive = skin === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.title}
                  onClick={() => onSkinChange(option.value)}
                  className={`whitespace-nowrap px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--qm-secondary)] text-[var(--qm-surface)]'
                      : 'text-[var(--qm-muted)] hover:bg-[var(--qm-surface-2)] hover:text-[var(--qm-secondary)]'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--qm-border)] bg-[var(--qm-bg)] py-7">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div
              className="text-base font-semibold tracking-[0.16em] text-[var(--qm-primary)]"
              style={{ fontFamily: "'Noto Serif SC', 'SimSun', 'STSong', serif" }}
            >
              奇门遁甲
            </div>
            <p className="mt-2 text-xs text-[var(--qm-muted)]">
              在线排盘系统，仅供学习、研究与参考，不构成任何决策建议。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm text-[var(--qm-ink-soft)] transition-colors hover:text-[var(--qm-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function PageFallback() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center px-4 text-sm text-[var(--qm-muted)]">
      正在载入...
    </div>
  )
}

function App() {
  const [skin, setSkin] = useState(getStoredSkin)
  const location = useLocation()
  const isConceptRoute = location.pathname === '/home-concept'

  useEffect(() => {
    document.documentElement.dataset.qimenSkin = skin
    window.localStorage.setItem('qimen-skin', skin)
  }, [skin])

  useEffect(() => {
    const metaPath = Object.keys(routeMeta)
      .filter((path) => path !== '/' && location.pathname.startsWith(`${path}/`))
      .sort((a, b) => b.length - a.length)[0]
    const meta = routeMeta[location.pathname] || routeMeta[metaPath] || routeMeta['/']
    document.title = meta.title
    setMetaDescription(meta.description)
  }, [location.pathname])

  return (
    <div
      data-qimen-skin={skin}
      className="flex min-h-screen flex-col bg-transparent text-[var(--qm-ink)]"
      style={{ fontFamily: "system-ui, 'Microsoft YaHei', 'PingFang SC', sans-serif" }}
    >
      <ScrollToTop />
      {!isConceptRoute && <Navbar skin={skin} onSkinChange={setSkin} />}
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home skin={skin} />} />
            <Route path="/home-concept" element={<HomeConcept />} />
            <Route path="/home-v2" element={<HomeV2 />} />
            <Route path="/divination" element={<Divination />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/knowledge/:sectionId" element={<Knowledge />} />
            <Route path="/knowledge/course/:courseId" element={<Knowledge />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:caseId" element={<Cases />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </main>
      {!isConceptRoute && <Footer />}
    </div>
  )
}

export default App

