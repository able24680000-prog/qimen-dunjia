import { useState, useCallback, useRef, useEffect } from 'react'
import AdvancedShijia from '../components/AdvancedShijia'
import { runQimen } from '../lib/browserEngine'
import { Link, useSearchParams } from 'react-router-dom'
import { calculate, fromLunarDate, JIU_GONG } from '../lib/qimen'
import JiuGongGrid from '../components/JiuGongGrid'

// ============================================================
// 常量定义
// ============================================================

const SHI_CHEN = [
  { label: '子时', value: 0, range: '23:00-01:00' },
  { label: '丑时', value: 1, range: '01:00-03:00' },
  { label: '寅时', value: 3, range: '03:00-05:00' },
  { label: '卯时', value: 5, range: '05:00-07:00' },
  { label: '辰时', value: 7, range: '07:00-09:00' },
  { label: '巳时', value: 9, range: '09:00-11:00' },
  { label: '午时', value: 11, range: '11:00-13:00' },
  { label: '未时', value: 13, range: '13:00-15:00' },
  { label: '申时', value: 15, range: '15:00-17:00' },
  { label: '酉时', value: 17, range: '17:00-19:00' },
  { label: '戌时', value: 19, range: '19:00-21:00' },
  { label: '亥时', value: 21, range: '21:00-23:00' },
]

const METHOD_OPTIONS = [
  { value: '时家', label: '时家奇门' },
  { value: '日家', label: '日家奇门' },
  { value: '月家', label: '月家奇门' },
  { value: '年家', label: '年家奇门' },
]

const QIJU_OPTIONS = [
  { value: '茅山法', label: '茅山法' },
  { value: '拆补法', label: '拆补法' },
]

const PURPOSE_OPTIONS = [
  { value: '综合', label: '综合分析' },
  { value: '事业', label: '事业运' },
  { value: '财运', label: '财运' },
  { value: '婚姻', label: '婚姻感情' },
  { value: '健康', label: '健康' },
  { value: '学业', label: '学业' },
  ...['官司','出行','走失','择吉','天气','风水阳宅','风水阴宅'].map(value => ({ value, label: value })),
]

const QUESTION_TEMPLATES = [
  { purpose: '事业', text: '这周是否适合主动联系客户推进合同？' },
  { purpose: '事业', text: '近期是否适合主动争取岗位或项目机会？' },
  { purpose: '财运', text: '这项投资或付款事项是否适合继续推进？' },
  { purpose: '婚姻', text: '这段关系近期是否还有修复沟通的空间？' },
  { purpose: '健康', text: '近期身体状态是否适合继续高强度工作？' },
  { purpose: '学业', text: '当前复习方式是否适合接下来的考试？' },
]

const YONGSHEN_TEMPLATES = {
  综合: { title: '综合判断', gongs: ['日干宫', '时干宫', '值符宫', '值使宫', '重点宫'], why: '先看自己、所问之事、主导力量和执行路径，再以重点宫收束。', roles: ['日干代表自己与承接能力', '时干代表所测事项', '值符看主导与背景', '值使看执行入口', '重点宫看最先复盘的现实反馈'] },
  事业: { title: '事业项目', gongs: ['日干宫', '时干宫', '值符宫', '值使宫', '开门/生门相关宫'], why: '事业先看人能不能承接，再看项目、上级意图和推进门路。', roles: ['日干看自己位置', '时干看项目或机会', '值符看领导和主导方', '值使看流程入口', '开门偏岗位与公开机会'] },
  财运: { title: '财务收益', gongs: ['日干宫', '时干宫', '生门宫', '值使宫', '庚所在宫'], why: '财务重点看收益入口、规则阻力、回款或投入是否能落地。', roles: ['生门看财源与收益', '庚看规则、对手和阻力', '时干看交易事项', '值使看执行节点'] },
  婚姻: { title: '感情关系', gongs: ['日干宫', '时干宫', '六合宫', '值使宫', '对方相关宫'], why: '关系先看双方状态，再看沟通入口、合象与隐藏阻力。', roles: ['日干看自己', '时干看关系事项', '六合看和合与中间人', '值使看沟通路径'] },
  健康: { title: '身体状态', gongs: ['日干宫', '时干宫', '天芮/病象宫', '值使宫', '四害触发宫'], why: '健康只作状态提醒，先看身体承受力、病象和是否被四害降权。', roles: ['日干看自身承受', '天芮偏病象', '四害看拖延、受困、内耗', '现实结论以医生检查为准'] },
  学业: { title: '学习考试', gongs: ['日干宫', '时干宫', '景门宫', '值使宫', '重点宫'], why: '学业重点看专注状态、表达输出、考试路径和短期反馈。', roles: ['日干看学习者', '时干看考试或任务', '景门看表达与文书', '值使看复习方法和执行节奏'] },
}

const GONG_NAMES = {
  '1': '坎一宫', '2': '坤二宫', '3': '震三宫', '4': '巽四宫',
  '5': '中五宫', '6': '乾六宫', '7': '兑七宫', '8': '艮八宫', '9': '离九宫',
}

const ELEMENT_MAP = { shui: '水', mu: '木', huo: '火', tu: '土', jin: '金' }

const JI_XIONG_COLORS = {
  da_ji: 'text-green-400',
  xiao_ji: 'text-green-300',
  ping: 'text-[#5f5144]',
  xiao_xiong: 'text-orange-400',
  da_xiong: 'text-red-400',
}

const KNOWLEDGE_QUERY_BY_LABEL = {
  九星: '九星',
  八门: '八门',
  八神: '八神',
  天盘: '天盘地盘',
  地盘: '天盘地盘',
  暗干: '暗干',
  宫性: '单宫九步断法',
  四害: '四害排查',
  主客: '主客关系',
  伏吟反吟: '伏吟反吟',
}

const KNOWLEDGE_QUERY_BY_GEJU_TYPE = {
  jiudun: '九遁',
  keying: '天盘地盘',
  ganCombo: '天盘地盘',
  ganPair: '天盘地盘',
  starDoorGe: '读象',
  fuyin: '伏吟',
  fanyin: '反吟',
  menpo: '八门',
  jixing: '格局',
  rumu: '格局',
  kongwang: '空亡',
  maxing: '驿马',
  angan: '暗干',
  yongshen: '取用神',
  zhifu: '值符值使',
  zhishi: '值符值使',
}

const FONT_SONG = "'SimSun', 'STSong', 'Noto Serif SC', serif"
const FONT_YAHEI = "'Microsoft YaHei', 'PingFang SC', sans-serif"
const REVIEW_STORAGE_KEY = 'qimen-review-records-v1'
const QUESTION_QUALITY_RULES = [
  { key: 'single', label: '一件事', desc: '不把事业、财运、感情混在一盘里。' },
  { key: 'object', label: '一个对象', desc: '写清对象，例如客户、合同、岗位、考试或某段关系。' },
  { key: 'window', label: '时间窗口', desc: '限定本周、三天内、本月或某个日期。' },
  { key: 'result', label: '可验证结果', desc: '能用是否推进、是否回复、是否成交等事实复盘。' },
]

function formatSolarDate(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getShiChenIndex(date) {
  const hour = date.getHours()
  if (hour === 23 || hour === 0) return 0
  if (hour === 1 || hour === 2) return 1
  if (hour === 3 || hour === 4) return 2
  if (hour === 5 || hour === 6) return 3
  if (hour === 7 || hour === 8) return 4
  if (hour === 9 || hour === 10) return 5
  if (hour === 11 || hour === 12) return 6
  if (hour === 13 || hour === 14) return 7
  if (hour === 15 || hour === 16) return 8
  if (hour === 17 || hour === 18) return 9
  if (hour === 19 || hour === 20) return 10
  return 11
}

function assessQuestionQuality(question) {
  const text = question.trim()
  const hasMixedTopics = /(事业|工作|项目|财运|投资|回款|感情|关系|健康|身体|考试|学业).*(事业|工作|项目|财运|投资|回款|感情|关系|健康|身体|考试|学业)/.test(text)
  const checks = {
    single: Boolean(text) && !/[、；;]/.test(text) && !/(同时|以及|还有|顺便|都怎么样)/.test(text) && !hasMixedTopics,
    object: /(客户|合同|岗位|项目|投资|付款|回款|关系|对方|身体|症状|考试|复习|offer|面试|合作|订单|结果)/i.test(text) || text.length >= 14,
    window: /(今天|明天|后天|这周|本周|下周|近期|三天|3天|七天|7天|本月|这个月|月底|年内|\d{1,2}月|\d{1,2}日)/.test(text),
    result: /(是否|能否|会不会|适合|不适合|推进|回复|成交|确认|通过|录取|恢复|改善|见面|签约|回款|上涨|下跌|完成)/.test(text),
  }
  const score = QUESTION_QUALITY_RULES.reduce((sum, item) => sum + (checks[item.key] ? 1 : 0), 0)
  const missing = QUESTION_QUALITY_RULES.filter((item) => !checks[item.key]).map((item) => item.label)
  const level = score >= 4 ? '可复盘' : score >= 3 ? '可用' : score >= 2 ? '偏散' : '需重写'
  return { score, total: QUESTION_QUALITY_RULES.length, checks, missing, level }
}

function buildQuestionRewriteHint(question) {
  const quality = assessQuestionQuality(question)
  if (quality.score >= 4) return '这个问题已经适合排盘和复盘。'
  return '建议补齐：' + quality.missing.join('、') + '。可改成“本周是否适合主动联系某客户推进合同，并以对方是否确认下一步为验证？”'
}

function loadReviewRecords() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveReviewRecords(records) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(records.slice(0, 50)))
}

function getReviewStats(records) {
  const reviewed = records.filter((item) => item.outcome && item.outcome !== 'pending')
  const highConfidenceRecords = records.filter((item) => Number(item.confidence) >= 70)
  const highConfidenceReviewed = highConfidenceRecords.filter((item) => item.outcome && item.outcome !== 'pending')
  const score = reviewed.reduce((sum, item) => {
    if (item.outcome === 'hit') return sum + 1
    if (item.outcome === 'partial') return sum + 0.5
    return sum
  }, 0)
  const highConfidenceScore = highConfidenceReviewed.reduce((sum, item) => {
    if (item.outcome === 'hit') return sum + 1
    if (item.outcome === 'partial') return sum + 0.5
    return sum
  }, 0)
  const rate = reviewed.length ? Math.round((score / reviewed.length) * 100) : 0
  const highConfidenceRate = highConfidenceReviewed.length
    ? Math.round((highConfidenceScore / highConfidenceReviewed.length) * 100)
    : 0
  const calibrationStatus =
    highConfidenceReviewed.length < 30
      ? '样本不足'
      : highConfidenceRate >= 70
        ? '达到70%目标'
        : '低于70%，需调整权重'
  return {
    reviewed: reviewed.length,
    rate,
    highConfidenceTotal: highConfidenceRecords.length,
    highConfidenceReviewed: highConfidenceReviewed.length,
    highConfidenceRate,
    calibrationStatus,
  }
}

function buildReviewRecord(result) {
  const bestGong = result.analysis?.bestGong || ''
  const bestPrediction = bestGong ? result.jiuGongAnalysis?.[bestGong]?.prediction : null
  const questionQuality = assessQuestionQuality(result.basicInfo?.question || '')
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toLocaleString('zh-CN'),
    date: result.basicInfo?.date || '',
    purpose: result.basicInfo?.purpose || '综合',
    question: result.basicInfo?.question || '',
    questionQuality,
    ju: result.juShu?.fullName || '',
    bestGong,
    confidence: bestPrediction?.confidence || result.analysis?.confidence || 0,
    confidenceBand: (bestPrediction?.confidence || result.analysis?.confidence || 0) >= 70 ? 'high' : 'normal',
    decision: bestPrediction?.decision || result.analysis?.overallJiXiongText || '',
    verifyWindow: bestPrediction?.verifyWindow || '3-7天先看第一反馈。',
    checks: bestPrediction?.checks || [],
    actualFeedback: '',
    outcome: 'pending'
  }
}

function escapeCsvCell(value) {
  const text = Array.isArray(value) ? value.join('；') : String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function downloadReviewCsv(records, stats) {
  if (typeof window === 'undefined' || records.length === 0) return
  const headers = [
    '记录时间',
    '问题',
    '问题质量',
    '缺失项',
    '目的',
    '局数',
    '重点宫',
    '参考置信度',
    '是否高置信',
    '推测结论',
    '验证窗口',
    '验证点',
    '实际反馈',
    '复盘结果',
  ]
  const rows = records.map((item) => [
    item.createdAt,
    item.question || '未填写',
    item.questionQuality ? `${item.questionQuality.score}/${item.questionQuality.total} ${item.questionQuality.level}` : '',
    item.questionQuality?.missing?.join('、') || '',
    item.purpose,
    item.ju,
    GONG_NAMES[item.bestGong] || item.bestGong || '',
    `${item.confidence}%`,
    Number(item.confidence) >= 70 ? '是' : '否',
    item.decision,
    item.verifyWindow,
    item.checks,
    item.actualFeedback || '',
    { pending: '待验证', hit: '命中', partial: '部分命中', miss: '未命中' }[item.outcome] || item.outcome,
  ])
  const summary = [
    ['样本总数', records.length],
    ['已复盘样本', stats.reviewed],
    ['当前命中率', stats.reviewed ? `${stats.rate}%` : '待复盘'],
    ['高置信样本', stats.highConfidenceTotal],
    ['高置信已复盘', stats.highConfidenceReviewed],
    ['高置信命中率', stats.highConfidenceReviewed ? `${stats.highConfidenceRate}%` : '待复盘'],
    ['校准状态', stats.calibrationStatus],
  ]
  const csv = [
    '奇门复盘样本统计',
    ...summary.map((row) => row.map(escapeCsvCell).join(',')),
    '',
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `qimen-review-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function buildKnowledgeUpdateSuggestions(records, stats) {
  const reviewed = records.filter((item) => item.outcome && item.outcome !== 'pending')
  const highConfidence = reviewed.filter((item) => Number(item.confidence) >= 70)
  const groups = new Map()
  for (const item of highConfidence) {
    const key = item.purpose || '综合'
    const current = groups.get(key) || { total: 0, score: 0, examples: [] }
    current.total += 1
    current.score += item.outcome === 'hit' ? 1 : item.outcome === 'partial' ? 0.5 : 0
    if (current.examples.length < 3) current.examples.push(item.question || item.decision || '未填写问题')
    groups.set(key, current)
  }
  const today = new Date().toISOString().slice(0, 10)
  const suggestions = []
  for (const [purpose, group] of groups.entries()) {
    const rate = group.total ? Math.round((group.score / group.total) * 100) : 0
    suggestions.push({
      id: `review-${purpose}-${today}`.toLowerCase(),
      scene: `${purpose}复盘候选`,
      trigger: `来自${group.total}条70%以上高置信已复盘样本，当前命中率${rate}%`,
      judgement: group.total >= 30 && rate >= 70 ? `${purpose}类断语可进入候选验证。` : `${purpose}类样本不足或命中率未稳定，只作为候选观察。`,
      action: '先放入 judgement-sentence-updates.json 人工审核，不直接覆盖正式知识库。',
      verification: `继续累计到30条高置信已复盘样本后再判断。样例：${group.examples.join('；')}`,
      updateRule: '命中、部分命中、未命中必须按事前验证点记录；低于70%时回看取用神、四害、应期和主客权重。',
      reviewStats: { sampleCount: group.total, hitRate: rate, globalReviewed: stats.reviewed, globalRate: stats.rate },
      status: group.total >= 30 && rate >= 70 ? '已验证' : '候选',
      updatedAt: today
    })
  }
  if (!suggestions.length) suggestions.push({ id: `review-empty-${today}`, scene: '复盘候选', trigger: '暂未形成70%以上高置信已复盘样本组', judgement: '当前只生成迭代提醒，不进入正式断语表。', action: '继续保存有明确问题、明确验证窗口、明确结果的样本。', verification: '累计至少30条同类高置信已复盘样本后再更新知识库。', updateRule: '样本不足时不自动更新正式知识库。', reviewStats: { sampleCount: 0, globalReviewed: stats.reviewed, globalRate: stats.rate }, status: '候选', updatedAt: today })
  return suggestions
}

function downloadKnowledgeUpdateJson(records, stats) {
  if (typeof window === 'undefined') return
  const updates = buildKnowledgeUpdateSuggestions(records, stats)
  const blob = new Blob([JSON.stringify(updates, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `judgement-sentence-updates-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// ============================================================
// 内联 TimeSelector 组件
// ============================================================

function TimeSelector({ onSubmit, loading, initialQuestion = '' }) {
  const [calendarType, setCalendarType] = useState('solar')
  const [qijuMethod, setQijuMethod] = useState('拆补法')
  const [method, setMethod] = useState('时家')
  const [purpose, setPurpose] = useState('综合')
  const [question, setQuestion] = useState(() => initialQuestion)
  const [birthYear, setBirthYear] = useState('')
  const [outcome, setOutcome] = useState('')
  const [ziHour, setZiHour] = useState(() => beijingClock().getHours() === 23 ? 23 : 0)
  const [exactTime, setExactTime] = useState(() => stamp(beijingClock()).slice(11))
  const [manual, setManual] = useState(false)
  const [manualGanzhi, setManualGanzhi] = useState('')
  const [horizon, setHorizon] = useState('')
  const [urgency, setUrgency] = useState('待核')
  const [firstMover, setFirstMover] = useState('待核')
  const [trueSolar, setTrueSolar] = useState(false)
  const [longitude, setLongitude] = useState('')
  const [ziMode, setZiMode] = useState('change')
  const [manualJu, setManualJu] = useState('')
  const [gender, setGender] = useState('')
  const [topic, setTopic] = useState('')
  const [primary, setPrimary] = useState('')
  const [stage, setStage] = useState('')
  const [asker, setAsker] = useState('')
  const [subject, setSubject] = useState('')

  // 公历
  const [solarDate, setSolarDate] = useState(() => formatSolarDate(beijingClock()))
  const [shiChenIndex, setShiChenIndex] = useState(() => getShiChenIndex(beijingClock()))

// 农历
  const [lunarYear, setLunarYear] = useState('')
  const [lunarMonth, setLunarMonth] = useState('')
  const [lunarDay, setLunarDay] = useState('')
  const [isLeapMonth, setIsLeapMonth] = useState(false)
const handleUseCurrentTime = useCallback(() => {
    const now = beijingClock()
    setCalendarType('solar')
    setSolarDate(formatSolarDate(now))
    setShiChenIndex(getShiChenIndex(now))
    setZiHour(now.getHours() === 23 ? 23 : 0)
    setExactTime(stamp(now).slice(11))
    const questionText = question.trim()
    onSubmit(now, { method, qijuMethod, manual, manualGanzhi, purpose, question: questionText, yearLife: birthYear.trim(), outcome, horizon, urgency, firstMover, trueSolar, longitude, ziMode, manualJu, gender, topic, primary, stage, asker, subject })
  }, [method, qijuMethod, purpose, question, birthYear, manual, manualGanzhi, ziHour, exactTime, outcome, horizon, urgency, firstMover, trueSolar, longitude, ziMode, manualJu, gender, topic, primary, stage, asker, subject, onSubmit])

  const handleSubmit = useCallback(() => {
    let date

    if (calendarType === 'solar') {
      if (!solarDate) return
      const [year, month, day] = solarDate.split('-').map(Number)
      const [hour, minute] = exactTime.split(':').map(Number)
      date = new Date(year, month - 1, day, hour, minute, 0)
    } else {
      if (!lunarYear || !lunarMonth || !lunarDay) return
      try {
        const [hour, minute] = exactTime.split(':').map(Number)
        date = fromLunarDate(
          parseInt(lunarYear),
          parseInt(lunarMonth),
          parseInt(lunarDay),
          hour,
          isLeapMonth
        )
        date.setMinutes(minute)
      } catch {
        alert('农历转换失败，请检查输入')
        return
      }
    }

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      alert('日期无效，请检查输入')
      return
    }

    if (!exactTime || !/^\d{2}:\d{2}$/.test(exactTime)) { alert('请选择有效时间'); return }
    const questionText = question.trim()

    onSubmit(date, { method, qijuMethod, manual, manualGanzhi, purpose, question: questionText, yearLife: birthYear.trim(), outcome, horizon, urgency, firstMover, trueSolar, longitude, ziMode, manualJu, gender, topic, primary, stage, asker, subject })
  }, [calendarType, solarDate, shiChenIndex, lunarYear, lunarMonth, lunarDay, isLeapMonth, qijuMethod, method, purpose, question, birthYear, manual, manualGanzhi, ziHour, exactTime, outcome, horizon, urgency, firstMover, trueSolar, longitude, ziMode, manualJu, gender, topic, primary, stage, asker, subject, onSubmit])

  const inputClass = 'w-full bg-[var(--qm-bg)] border border-[var(--qm-border)] rounded-lg px-4 py-3 text-[var(--qm-ink)] focus:border-[var(--qm-primary)] focus:outline-none focus:ring-1 focus:ring-[rgba(107,36,31,0.3)] transition-colors'
  const labelClass = 'block text-[var(--qm-primary)] text-sm font-bold mb-2'

  return (
    <div className="space-y-5">
      {/* 历法类型切换 */}
      <div>
        <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>历法类型</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCalendarType('solar')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              calendarType === 'solar'
                ? 'bg-[var(--qm-primary)] text-[var(--qm-surface)]'
                : 'bg-[var(--qm-bg)] text-[var(--qm-ink-soft)] border border-[var(--qm-border)] hover:border-[var(--qm-primary)] hover:text-[var(--qm-primary)]'
            }`}
            style={{ fontFamily: FONT_YAHEI }}
          >
            公历
          </button>
          <button
            type="button"
            onClick={() => setCalendarType('lunar')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              calendarType === 'lunar'
                ? 'bg-[var(--qm-primary)] text-[var(--qm-surface)]'
                : 'bg-[var(--qm-bg)] text-[var(--qm-ink-soft)] border border-[var(--qm-border)] hover:border-[var(--qm-primary)] hover:text-[var(--qm-primary)]'
            }`}
            style={{ fontFamily: FONT_YAHEI }}
          >
            农历
          </button>
        </div>
      </div>

      {/* 公历日期输入 */}
      {calendarType === 'solar' && (
        <div>
          <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>排盘日期</label>
          <input
            type="date"
            value={solarDate}
            onChange={(e) => setSolarDate(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {/* 农历日期输入 */}
      {calendarType === 'lunar' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>农历年</label>
            <input
              type="number"
              placeholder="如 2024"
              value={lunarYear}
              onChange={(e) => setLunarYear(e.target.value)}
              className={inputClass}
              min="1900"
              max="2100"
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>农历月</label>
            <input
              type="number"
              placeholder="1-12"
              value={lunarMonth}
              onChange={(e) => setLunarMonth(e.target.value)}
              className={inputClass}
              min="1"
              max="12"
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>农历日</label>
            <input
              type="number"
              placeholder="1-30"
              value={lunarDay}
              onChange={(e) => setLunarDay(e.target.value)}
              className={inputClass}
              min="1"
              max="30"
            />
          </div>
          <div className="col-span-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLeapMonth}
                onChange={(e) => setIsLeapMonth(e.target.checked)}
                className="w-4 h-4 accent-[var(--qm-primary)]"
              />
              <span className="text-sm text-[#5f5144]">闰月</span>
            </label>
          </div>
        </div>
      )}

      {/* 时辰选择 */}
      <div>
        <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>时辰</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {SHI_CHEN.map((sc, index) => (
            <button
              key={sc.label}
              type="button"
              onClick={() => { setShiChenIndex(index); setExactTime(`${String(index === 0 ? ziHour : sc.value).padStart(2,'0')}:00`) }}
              className={`py-2 px-1 rounded-lg text-sm transition-colors ${
                shiChenIndex === index
                  ? 'bg-[var(--qm-primary)] text-[var(--qm-surface)] font-bold'
                  : 'bg-[var(--qm-bg)] text-[var(--qm-ink-soft)] border border-[var(--qm-border)] hover:border-[var(--qm-primary)] hover:text-[var(--qm-primary)]'
              }`}
              style={{ fontFamily: FONT_YAHEI }}
            >
              <div className="font-bold">{sc.label}</div>
              <div className="text-xs opacity-70 hidden sm:block">{sc.range}</div>
            </button>
          ))}
        </div>
      </div>

      {shiChenIndex === 0 && <label className="block text-sm">子时具体时间<select className={inputClass} value={ziHour} onChange={e => { const h=Number(e.target.value); setZiHour(h); setExactTime(`${String(h).padStart(2,'0')}:00`) }}><option value={0}>当日 00:00–00:59</option><option value={23}>当日 23:00–23:59</option></select></label>}
      <label className="block text-sm">精确时间（北京时间）<input type="time" className={inputClass} value={exactTime} onChange={e => {setExactTime(e.target.value); const [h,m]=e.target.value.split(':').map(Number); if(Number.isFinite(h) && Number.isFinite(m)) {const d=new Date(2000,0,1,h,m);setShiChenIndex(getShiChenIndex(d));setZiHour(h===23?23:0)}}}/></label>
      <p className="text-xs text-[var(--qm-ink-soft)]">可选择时辰后再调整分钟；子时可区分 23 点与 0 点。</p>
      {/* 分析目的 */}
      <div>
        <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>分析目的</label>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full bg-[var(--qm-bg)] border border-[var(--qm-border)] rounded-lg px-4 py-3 text-[var(--qm-ink)] focus:border-[var(--qm-primary)] focus:outline-none transition-colors"
        >
          {PURPOSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 具体问题 */}
      <div>
        <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>具体所问事项</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={120}
          placeholder="例如：这周是否适合主动联系客户推进合同？一盘尽量只问一件事。"
          className="w-full resize-none bg-[var(--qm-bg)] border border-[var(--qm-border)] rounded-lg px-4 py-3 text-[var(--qm-ink)] placeholder:text-[#8a7c6b] focus:border-[var(--qm-primary)] focus:outline-none transition-colors"
        />
        <div className="mt-2 flex justify-between gap-3 text-xs leading-5 text-[#7f725f]">
          <span>问题越具体，宫位建议和复盘口径越容易校准。</span>
          <span>{question.length}/120</span>
        </div>
        {question.trim() && <p className="mt-2 text-xs text-[var(--qm-ink-soft)]">{buildQuestionRewriteHint(question)}</p>}
        <label className="mt-4 block text-sm font-bold text-[var(--qm-primary)]">可观察结果（进行预测时填写）</label>
        <input className={inputClass} value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="例如：收到合同尾款" maxLength={200} />
        <label className="mt-3 block text-sm font-bold text-[var(--qm-primary)]">观察期限（可选）</label>
        <input className={inputClass} value={horizon} onChange={e => setHorizon(e.target.value)} placeholder="例如：月底前" maxLength={80} />
        <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-sm">事项急缓<select className={inputClass} value={urgency} onChange={e => setUrgency(e.target.value)}>{['待核','急','缓'].map(x => <option key={x}>{x}</option>)}</select></label><label className="text-sm">行动先后<select className={inputClass} value={firstMover} onChange={e => setFirstMover(e.target.value)}>{['待核','本人','对方','双方未动','同动'].map(x => <option key={x}>{x}</option>)}</select></label></div>
        <details className="mt-4 border border-[var(--qm-border)] bg-[var(--qm-surface-2)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[var(--qm-primary)] marker:content-none">
            <span>高级设置</span>
            <span className="text-xs font-normal text-[var(--qm-ink-soft)]">起局法、排盘方式、年命、问题模板</span>
          </summary>
          <div className="grid gap-5 border-t border-[var(--qm-border-soft)] p-4">
            <div>
              <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>
                年命干支（可选，如庚戌）
              </label>
              <input
                type="text"
                placeholder="如 庚戌"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className={inputClass}
                maxLength={2}
              />
              <p className="mt-1 text-xs leading-5 text-[#7f725f]">请填写已核对的年命干支；不填写则标为未知。</p>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>起局方式</label>
              <div className="flex gap-2">
                {QIJU_OPTIONS.filter((opt) => opt.value === '拆补法').map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQijuMethod(opt.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                      qijuMethod === opt.value
                        ? 'bg-[var(--qm-primary)] text-[var(--qm-surface)]'
                        : 'bg-[var(--qm-bg)] text-[var(--qm-ink-soft)] border border-[var(--qm-border)] hover:border-[var(--qm-primary)] hover:text-[var(--qm-primary)]'
                    }`}
                    style={{ fontFamily: FONT_YAHEI }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: FONT_YAHEI }}>排盘方法</label>
              <div className="grid grid-cols-2 gap-2">
                {METHOD_OPTIONS.filter((opt) => opt.value === '时家').map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMethod(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      method === opt.value
                        ? 'bg-[var(--qm-primary)] text-[var(--qm-surface)] border-[var(--qm-primary)]'
                        : 'bg-[var(--qm-bg)] text-[var(--qm-ink-soft)] border-[var(--qm-border)] hover:border-[rgba(107,36,31,0.5)]'
                    }`}
                    style={{ fontFamily: FONT_YAHEI }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <label className="flex gap-2"><input type="checkbox" checked={manual} onChange={e => setManual(e.target.checked)} />手工输入四柱和局式</label>
              {manual && <label>四柱<input className={inputClass} value={manualGanzhi} onChange={e => setManualGanzhi(e.target.value)} placeholder="丙午年 甲午月 丁卯日 丙午时" /><span className="text-xs">请同时填写下方手工局式；该模式仅用于事件预测。</span></label>}
              <label className="flex gap-2"><input type="checkbox" checked={trueSolar} onChange={e => setTrueSolar(e.target.checked)} />按经度校正真太阳时</label>
              {trueSolar && <label>起局地经度（东经为正）<input className={inputClass} type="number" min="-180" max="180" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} /></label>}
              <label>子时换日<select className={inputClass} value={ziMode} onChange={e => setZiMode(e.target.value)}><option value="change">23点换日</option><option value="keep">0点换日</option></select></label>
              <label>手工局式（可选）<input className={inputClass} value={manualJu} onChange={e => setManualJu(e.target.value)} placeholder="如 阴遁九局" /></label>
              <label>性别（可选）<select className={inputClass} value={gender} onChange={e => setGender(e.target.value)}><option value="">未提供</option><option>男</option><option>女</option></select></label>
              {[[topic,setTopic,'明确问项'],[primary,setPrimary,'指定主用神'],[stage,setStage,'事项阶段'],[asker,setAsker,'问者（代问时）'],[subject,setSubject,'所测人（代问时）']].map(([value,setter,label]) => <label key={label}>{label}<input className={inputClass} value={value} onChange={e => setter(e.target.value)} /></label>)}
            </div>
            <div className="grid gap-2">
              <div className="text-xs font-bold text-[var(--qm-secondary)]">常用问题模板</div>
              <div className="flex flex-wrap gap-2">
            {QUESTION_TEMPLATES.map((item) => (
              <button
                key={item.text}
                type="button"
                onClick={() => {
                  setPurpose(item.purpose)
                  setQuestion(item.text)
                }}
                className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] px-3 py-1.5 text-xs leading-5 text-[#5f5144] transition-colors hover:border-[var(--qm-secondary)] hover:text-[var(--qm-secondary)]"
              >
                {item.purpose} · {item.text}
              </button>
            ))}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleUseCurrentTime}
          className="flex-1 py-3 border-2 border-[var(--qm-primary)] text-[var(--qm-primary)] font-bold rounded-lg text-sm hover:bg-[rgba(107,36,31,0.1)] transition-colors"
          style={{ fontFamily: FONT_YAHEI }}
        >
          使用当前时间
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 bg-[var(--qm-primary)] text-[var(--qm-surface)] font-bold rounded-lg text-base hover:bg-[var(--qm-primary-hover)] transition-colors shadow-lg shadow-[rgba(107,36,31,0.12)] disabled:opacity-50 disabled:cursor-not-allowed gold-glow"
          style={{ fontFamily: FONT_YAHEI }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              排盘中...
            </span>
          ) : '立即排盘'}
        </button>
      </div>
    </div>
  )
}

function CurrentDecisionCard({ result }) {
  const question = result.basicInfo?.question || ''
  const purpose = result.basicInfo?.purpose || '综合'
  const unsupported = /天气|下雨|降雨|温度|气温|刮风|台风|下雪|晴天|阴天|气象/.test(question)
  const card = result?.multiGong?.decisionCard
  return (
    <section className="bg-[var(--qm-surface)] rounded-xl p-5 border border-[var(--qm-border)]">
      <h3 className="text-lg font-bold text-[var(--qm-primary)]">预测与盘面线索</h3>
      <p className="mt-3 text-sm leading-7 text-[#3e3429]">所问：{question}</p>
      {unsupported ? (
        <p className="mt-3 text-sm leading-7 text-[#3e3429]">当前系统还不能针对天气问题自动形成可靠判断。请以当地气象预报为准；下方盘面仅供研究。</p>
      ) : purpose === '综合' ? (
        <p className="mt-3 text-sm leading-7 text-[#3e3429]">当前系统不能可靠识别具体事项并自动回答。请在左侧选择与问题相符的分析目的并重新排盘，或展开依据自行研判。</p>
      ) : (
        <div className="mt-3 border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
          <p className="text-sm leading-7 text-[#3e3429]">当前按“{purpose}”展示传统盘面线索，尚不能保证自动理解问题或直接给出可靠答案。</p>
          {card?.maxRisk && <p className="mt-2 text-sm leading-7 text-[#3e3429]">需留意：{card.maxRisk}</p>}
        </div>
      )}
      <p className="mt-3 text-xs leading-6 text-[#7f725f]">传统文化分析仅供参考，不能替代现实信息或专业意见。</p>
    </section>
  )
}

function QuestionCalibrationCard({ result }) {
  const question = result?.basicInfo?.question || ''
  const quality = assessQuestionQuality(question)
  const card = result?.multiGong?.decisionCard
  const bestGong = result?.analysis?.bestGong
  const bestPrediction = bestGong ? result?.jiuGongAnalysis?.[bestGong]?.prediction : null
  const checks = bestPrediction?.checks?.length ? bestPrediction.checks : [card?.firstSignal, card?.yingQiCandidate].filter(Boolean)
  return (
    <section className="bg-[var(--qm-surface)] rounded-xl p-5 border border-[var(--qm-border)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--qm-primary)]" style={{ fontFamily: FONT_YAHEI }}>问事质量与复盘口径</h3>
          <p className="mt-2 text-sm leading-7 text-[#5f5144]">先固定问题，再固定验证方式。后续样本只按事前口径判断命中、部分命中或未命中。</p>
        </div>
        <span className="w-fit border border-[rgba(31,97,87,0.3)] bg-[#edf5ef] px-3 py-1 text-xs font-bold text-[var(--qm-secondary)]">{quality.score}/{quality.total} · {quality.level}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {QUESTION_QUALITY_RULES.map((rule) => (
          <div key={rule.key} className={`border p-3 ${quality.checks[rule.key] ? 'border-[rgba(31,97,87,0.3)] bg-[#edf5ef]' : 'border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)]'}`}>
            <div className="text-xs font-bold text-[var(--qm-secondary)]">{rule.label}</div>
            <p className="mt-2 text-xs leading-5 text-[#5f5144]">{quality.checks[rule.key] ? '已满足，可纳入复盘。' : rule.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
          <div className="text-xs font-bold text-[var(--qm-primary)]">验证窗口</div>
          <p className="mt-2 text-sm leading-7 text-[#3e3429]">{bestPrediction?.verifyWindow || card?.yingQiCandidate || '先设定3-7天观察窗口，再记录第一现实反馈。'}</p>
        </div>
        <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4">
          <div className="text-xs font-bold text-[var(--qm-primary)]">验证指标</div>
          <p className="mt-2 text-sm leading-7 text-[#3e3429]">{checks.length ? checks.join('；') : '用实际回复、合同节点、行动结果或数据变化复盘，不用事后解释替代事实。'}</p>
        </div>
      </div>
    </section>
  )
}

function QuestionGate({ result }) {
  const template = YONGSHEN_TEMPLATES[result?.basicInfo?.purpose] || YONGSHEN_TEMPLATES.综合
  return (
    <section className="bg-[var(--qm-surface)] rounded-xl p-5 border border-[var(--qm-border)]">
      <h3 className="text-sm font-bold text-[var(--qm-primary)]" style={{ fontFamily: FONT_YAHEI }}>盘面概览</h3>
      <p className="mt-2 text-sm leading-7 text-[#5f5144]">当前未填写具体问题，只显示盘面结构。补充“一盘一问”后，再输出主断、风险、应期和复盘口径。</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4"><div className="text-xs text-[#7f725f]">值符</div><p className="mt-2 text-sm font-bold text-[var(--qm-primary)]">{result.zhiFuXing} · {GONG_NAMES[result.zhiFuGong] || result.zhiFuGong + '宫'}</p></div>
        <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4"><div className="text-xs text-[#7f725f]">值使</div><p className="mt-2 text-sm font-bold text-[var(--qm-primary)]">{result.zhiShiMen} · {GONG_NAMES[result.zhiShiGong] || result.zhiShiGong + '宫'}</p></div>
        <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4"><div className="text-xs text-[#7f725f]">用神模板</div><p className="mt-2 text-sm font-bold text-[var(--qm-primary)]">{template.title}</p></div>
      </div>
    </section>
  )
}

function YongShenTemplateCard({ purpose }) {
  const template = YONGSHEN_TEMPLATES[purpose] || YONGSHEN_TEMPLATES.综合
  return (
    <section className="bg-[var(--qm-surface)] rounded-xl p-5 border border-[var(--qm-border)]">
      <h3 className="text-sm font-bold text-[#7f725f] mb-3" style={{ fontFamily: FONT_YAHEI }}>用神模板卡</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4"><div className="text-xs font-bold text-[var(--qm-secondary)]">本问题主要看</div><p className="mt-2 text-sm leading-7 text-[#3e3429]">{template.gongs.join('、')}</p></div>
        <div className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-4"><div className="text-xs font-bold text-[var(--qm-secondary)]">为什么这样看</div><p className="mt-2 text-sm leading-7 text-[#3e3429]">{template.why}</p></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{template.roles.map((role) => <span key={role} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-3 py-1.5 text-xs leading-5 text-[#5f5144]">{role}</span>)}</div>
    </section>
  )
}

function MultiGongPanel({ multiGong }) {
  if (!multiGong) return null

  const keyItems = [
    ['日干', multiGong.keyGongs?.riGanGong],
    ['时干', multiGong.keyGongs?.shiGanGong],
    ['年命', multiGong.keyGongs?.nianMingGong],
    ['值符', multiGong.keyGongs?.zhiFuGong],
    ['值使', multiGong.keyGongs?.zhiShiGong],
    ['重点', multiGong.keyGongs?.bestGong]
  ].filter(([, gong]) => gong)

  function getDecisionAdvice(multiGong) {
    const { contradictions, yingQi } = multiGong || {}
    if (!contradictions?.length && !yingQi?.length) return null
    const shiKeRi = contradictions?.find(c => c.type === '日时' && c.relation === 'beKe')
    if (shiKeRi) return '事克人，当前条件超出能力范围，建议暂缓，先评估风险再动。'
    const fuKeShi = contradictions?.find(c => c.type === '符使' && c.relation === 'ke')
    if (fuKeShi) return '战略压制执行，领导意志过强但执行层跟不上，先确认资源到位再推。'
    const shiShengRi = contradictions?.find(c => c.type === '日时' && c.relation === 'beSheng')
    if (shiShengRi) return '事推人，事情在推着你走，顺势而为但要保持主动权。'
    const fuShengShi = contradictions?.find(c => c.type === '符使' && c.relation === 'sheng')
    if (fuShengShi) return '战略支持执行，有上级支撑，可以推进。'
    if (yingQi?.length > 0) {
      const triggerYing = yingQi.find(y => y.method === '主要触发' || y.method === '状态转换')
      if (triggerYing) return '先看应期候选里的主要触发和状态转换，不要被单一日期牵着走。'
    }
    const riShengShi = contradictions?.find(c => c.type === '日时' && c.relation === 'sheng')
    if (riShengShi) return '人推事，自己能主导，但需防投入过大。'
    if (!contradictions?.length) return '盘面无明显冲突，按常规节奏推进即可。'
    return null
  }

  const advice = getDecisionAdvice(multiGong)

  return (
    <div className="bg-[var(--qm-surface)] rounded-xl p-5 border border-[var(--qm-border)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#7f725f]" style={{ fontFamily: FONT_YAHEI }}>
            多宫联动分析
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#3e3429]">{multiGong.summary}</p>
        </div>
        {keyItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keyItems.map(([label, gong]) => (
              <span key={`${label}-${gong}`} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-2 py-1 text-xs font-bold text-[var(--qm-primary)]">
                {label}：{GONG_NAMES[gong] || `${gong}宫`}
              </span>
            ))}
          </div>
        )}
      </div>

      {multiGong.contradictions?.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold text-[var(--qm-secondary)]">核心矛盾</div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {multiGong.contradictions.slice(0, 2).map((item, index) => (
            <div key={`${item.name}-${index}`} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[var(--qm-primary)]">{item.name}</span>
                <span className="text-xs text-[#7f725f]">关系：{item.relationLabel || item.plainMeaning || '关系不明'}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#3e3429]">{item.detail}</p>
              <p className="mt-1 text-sm leading-7 text-[#29443e]">{item.analysis}</p>
              {item.action && <p className="mt-1 text-sm leading-7 text-[#7a4a25]">动作：{item.action}</p>}
            </div>
            ))}
          </div>
        </div>
      )}

      {multiGong.logicChain && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ['起因', multiGong.logicChain.cause],
            ['当前状态', multiGong.logicChain.process],
            ['可能结果', multiGong.logicChain.result]
          ].map(([label, text]) => (
            <div key={label} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-3">
              <div className="text-xs font-bold text-[var(--qm-secondary)]">{label}</div>
              <p className="mt-2 text-sm leading-7 text-[#3e3429]">{text}</p>
            </div>
          ))}
        </div>
      )}

      {multiGong.yingQi?.length > 0 && (
        <div className="mt-4 border border-[rgba(31,97,87,0.3)] bg-[#edf5ef] p-4">
          <div className="text-xs font-bold text-[var(--qm-secondary)]">应期候选</div>
          <div className="mt-3 space-y-2">
            {multiGong.yingQi.slice(0, 3).map((item, index) => (
              <div key={`${item.method}-${index}`} className="text-sm leading-7 text-[#29443e]">
                <span className="font-bold">{item.method}：</span>
                {item.detail}
                <span className="font-bold"> {item.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {advice && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--qm-accent)]/10 border border-[var(--qm-accent)]/20">
          <div className="text-xs font-bold text-[var(--qm-accent)]">可用破局路径</div>
          <div className="mt-1 text-sm font-medium text-[var(--qm-accent)]">{advice}</div>
        </div>
      )}
    </div>
  )
}

function makeKnowledgeUrl(query) {
  return `/knowledge?q=${encodeURIComponent(query)}`
}

function addKnowledgeLink(links, seen, label, query) {
  if (!query || seen.has(query)) return
  seen.add(query)
  links.push({ label, query })
}

function buildKnowledgeLinks(palaceTags, analysis, expert) {
  const links = []
  const seen = new Set()

  for (const [label, value] of palaceTags) {
    const query = KNOWLEDGE_QUERY_BY_LABEL[label]
    addKnowledgeLink(links, seen, value || label, query)
  }

  for (const item of analysis?.geju?.items || []) {
    addKnowledgeLink(links, seen, item.name || item.type, KNOWLEDGE_QUERY_BY_GEJU_TYPE[item.type])
  }

  if (analysis?.singlePalaceAnalysis) {
    addKnowledgeLink(links, seen, '单宫九步', '单宫九步断法')
    addKnowledgeLink(links, seen, '宫性', '宫性')
    addKnowledgeLink(links, seen, '四害', '四害排查')
    addKnowledgeLink(links, seen, '主客', '主客关系')
  }

  if (expert?.ganGeju) addKnowledgeLink(links, seen, expert.ganGeju.name || '天地盘格局', '天盘地盘')
  if (analysis?.fuYinFanYin?.hasFu) addKnowledgeLink(links, seen, '伏吟', '伏吟')
  if (analysis?.fuYinFanYin?.hasFan) addKnowledgeLink(links, seen, '反吟', '反吟')
  if (analysis?.isRiGan || analysis?.isShiGan || analysis?.isNianMing) addKnowledgeLink(links, seen, '取用神', '取用神')

  return links.slice(0, 8)
}

function KnowledgeLink({ label, query }) {
  return (
    <Link
      to={makeKnowledgeUrl(query)}
      className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-2 py-1 text-xs font-bold text-[var(--qm-secondary)] transition-colors hover:border-[var(--qm-secondary)] hover:bg-[#edf5ef]"
    >
      {label}
    </Link>
  )
}

function compactText(text, maxLength = 78) {
  const clean = String(text || '')
    .replace(/^(九遁|十干克应|天地盘格局|星门格|伏吟反吟|门宫关系|击刑|入墓|空亡|驿马|暗干|用神|格局)：/, '')
    .replace(/建议：.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean
}

function uniqueCompact(items, limit = 2) {
  const seen = new Set()
  const result = []
  for (const item of items || []) {
    const text = compactText(item)
    if (!text || seen.has(text)) continue
    seen.add(text)
    result.push(text)
    if (result.length >= limit) break
  }
  return result
}

function getPrimarySignal(palace, analysis, expert) {
  if (expert?.ganGeju?.name) return expert.ganGeju.name
  const firstGeju = analysis?.geju?.items?.find((item) => !['yongshen', 'zhifu', 'zhishi'].includes(item.type))
  if (firstGeju?.name) return firstGeju.name
  return [palace.xing, palace.men, palace.shen].filter(Boolean).join('、') || '本宫组合'
}

function buildPlainReading(palace, analysis, prediction, expert) {
  const signal = getPrimarySignal(palace, analysis, expert)
  const verdict = prediction.decision || prediction.coreVerdict?.split('。')[0] || '先观察再判断'
  const confidence = prediction.confidence ? `${prediction.confidence}% · ${prediction.confidenceText || '参考'}` : prediction.confidenceText || '参考'
  const method = analysis?.singlePalaceAnalysis
  const basis = uniqueCompact([
    ...(method?.prioritySummary || []),
    expert?.ganGejuText,
    ...(prediction.keyEvidence || []),
    ...(expert?.geju || []),
  ], 3)
  const action = compactText(prediction.actionPoints?.[0] || prediction.actions?.[0] || expert?.ganGeju?.action || '先小步验证，不一次性押注。', 70)
  const verify = compactText(prediction.verifyPoints?.[0] || `验证窗口：${prediction.verifyWindow || '3-7天先看第一反馈。'}`, 72)
  const risk = compactText(prediction.risks?.[0] || (analysis?.isKongWang ? '本宫逢空，先防承诺落空或反馈延迟。' : ''), 64)

  return { signal, verdict, confidence, basis, action, verify, risk }
}

function findExpertLine(lines, keyword) {
  return (lines || []).find((line) => line.includes(keyword)) || ''
}

function buildExpertSteps(palace, analysis, expert) {
  const steps = analysis?.singlePalaceAnalysis?.steps
  if (steps?.length) return steps.map((step) => [step.label, compactText(step.text, 150)])
  return [
    ['神定性', palace.shen ? `${palace.shen}先定事件底色。${compactText(findExpertLine(expert?.duxiang, palace.shen), 62)}` : '本宫无八神信息。'],
    ['星定势', palace.xing ? `${palace.xing}看环境与资源。${compactText(findExpertLine(expert?.duxiang, palace.xing), 62)}` : '本宫无九星信息。'],
    ['门定行', palace.men ? `${palace.men}看行动入口。${compactText(findExpertLine(expert?.duxiang, palace.men), 62)}` : '本宫无八门信息。'],
    ['干定事', expert?.ganGejuText ? compactText(expert.ganGejuText, 86) : compactText(expert?.gan || '天地盘信息不足，先看星门神。', 86)],
  ]
}

// ============================================================
// 内联 PalaceDetail 弹窗组件
// ============================================================

function PalaceDetail({ palace, onClose }) {
  const [showExpert, setShowExpert] = useState(false)
  if (!palace) return null

  const analysis = palace.analysis
  const gongInfo = JIU_GONG[palace.gongKey] || {}
  const prediction = analysis?.prediction || {}
  const expert = prediction.expertDetails || {}
  const palaceTags = [
    palace.xing && ['九星', palace.xing],
    palace.men && ['八门', palace.men],
    palace.shen && ['八神', palace.shen],
    palace.tianGan && ['天盘', palace.tianGan],
    palace.diGan && ['地盘', palace.diGan],
    analysis?.anGan && ['暗干', analysis.anGan]
  ].filter(Boolean)
  const roleTags = [
    analysis?.isRiGan && '日干',
    analysis?.isShiGan && '时干',
    analysis?.isNianMing && '年命'
  ].filter(Boolean)
  const knowledgeLinks = buildKnowledgeLinks(palaceTags, analysis, expert)
  const plain = buildPlainReading(palace, analysis, prediction, expert)
  const expertSteps = buildExpertSteps(palace, analysis, expert)
  const evidenceList = plain.basis.length ? plain.basis : ['本宫信息较少，先结合所问事项和现实反馈判断。']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[84vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[var(--qm-border)] bg-[var(--qm-surface)] p-5 animate-fadeIn md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-[var(--qm-primary)]" style={{ fontFamily: FONT_SONG }}>
                {gongInfo.name}{palace.gongKey}宫
              </h3>
              <span className={`text-xs font-bold ${JI_XIONG_COLORS[analysis?.jiXiong]}`}>
                {analysis?.jiXiongText || '待断'}
              </span>
              <span className="border border-[rgba(31,97,87,0.28)] bg-[#edf5ef] px-2 py-0.5 text-xs font-bold text-[var(--qm-secondary)]">
                {plain.confidence}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-[#5f5144]">
              <span>{gongInfo.direction}</span>
              <span>{ELEMENT_MAP[gongInfo.element] || ''}</span>
              {roleTags.map((tag) => (
                <span key={tag} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-1.5 py-0.5 text-[var(--qm-primary)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-[#7f725f] transition-colors hover:text-[#3e3429]" aria-label="关闭宫位详情">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {palaceTags.map(([label, value]) => (
            <span key={`${label}-${value}`} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] px-2 py-1 text-xs text-[#3e3429]">
              <span className="font-bold text-[var(--qm-primary)]">{label}</span> {value}
            </span>
          ))}
        </div>

        <section className="mt-5 border border-[rgba(31,97,87,0.28)] bg-[#edf5ef] p-4">
          <div className="text-xs font-bold text-[var(--qm-secondary)]">主断</div>
          <p className="mt-2 text-lg font-bold leading-8 text-[#29443e]">{plain.verdict}</p>
          <p className="mt-2 text-sm leading-7 text-[#3e3429]">
            先看 <span className="font-bold text-[var(--qm-primary)]">{plain.signal}</span>。不要把本宫单独当结论，按验证窗口看现实反馈。
          </p>
        </section>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <section className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-3">
            <div className="text-xs font-bold text-[var(--qm-secondary)]">关键三点</div>
            <ol className="mt-2 space-y-1.5">
              {evidenceList.map((item, index) => (
                <li key={`${index}-${item}`} className="text-sm leading-7 text-[#3e3429]">
                  <span className="mr-1.5 font-bold text-[var(--qm-primary)]">{index + 1}.</span>{item}
                </li>
              ))}
            </ol>
          </section>

          <section className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-3">
            <div className="text-xs font-bold text-[var(--qm-secondary)]">下一步</div>
            <p className="mt-2 text-sm leading-7 text-[#29443e]">{plain.action}</p>
            {plain.risk && <p className="mt-2 text-sm leading-7 text-[#7a4a25]">风险：{plain.risk}</p>}
          </section>
        </div>

        <section className="mt-4 border border-[var(--qm-border-soft)] bg-[var(--qm-surface-3)] p-3">
          <div className="text-xs font-bold text-[var(--qm-secondary)]">复盘点</div>
          <p className="mt-2 text-sm leading-7 text-[#3e3429]">{plain.verify}</p>
          <p className="mt-1 text-xs leading-6 text-[#7f725f]">到期后只按事前写下的观察指标复盘，不事后改解释。</p>
        </section>

        {knowledgeLinks.length > 0 && (
          <section className="mt-4 border border-[var(--qm-border-soft)] bg-[var(--qm-surface)] p-3">
            <div className="text-xs font-bold text-[#7f725f]">关联知识</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {knowledgeLinks.map((item) => (
                <KnowledgeLink key={`${item.query}-${item.label}`} label={item.label} query={item.query} />
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={() => setShowExpert((value) => !value)}
          className="mt-5 w-full border border-[var(--qm-border)] bg-[var(--qm-surface-2)] px-4 py-2.5 text-sm font-bold text-[var(--qm-primary)] transition-colors hover:border-[var(--qm-primary)]"
          style={{ fontFamily: FONT_YAHEI }}
        >
          {showExpert ? '收起专业断法' : '展开九步专业断法'}
        </button>

        {showExpert && (
          <section className="mt-4 border-t border-[var(--qm-border-soft)] pt-4">
            <div className="mb-3 text-xs font-bold text-[#7f725f]">按知识库“单宫九步断法”：宫性打底，四步定性，生克量化，四害排查，旺衰定级，远近定速。</div>
            <div className="grid gap-2">
              {expertSteps.map(([label, text]) => (
                <div key={label} className="border border-[var(--qm-border-soft)] bg-[var(--qm-surface-2)] p-3">
                  <div className="text-xs font-bold text-[var(--qm-secondary)]">{label}</div>
                  <p className="mt-1 text-sm leading-7 text-[#3e3429]">{text}</p>
                </div>
              ))}
            </div>
            {expert.geju?.length > 0 && (
              <div className="mt-3 border border-[rgba(31,97,87,0.28)] bg-[#edf5ef] p-3">
                <div className="text-xs font-bold text-[var(--qm-secondary)]">只保留最重要格局</div>
                <ul className="mt-2 space-y-1.5">
                  {expert.geju.slice(0, 2).map((item, index) => {
                    const gejuItem = analysis?.geju?.items?.[index]
                    const query = KNOWLEDGE_QUERY_BY_GEJU_TYPE[gejuItem?.type] || '格局'
                    return (
                      <li key={`${index}-${item}`} className="text-sm leading-7 text-[#29443e]">
                        {compactText(item, 86)}
                        <span className="ml-2 inline-flex align-middle"><KnowledgeLink label="查知识" query={query} /></span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
// ============================================================
// 内联 ChartActions 组件（含复制 + 保存图片）
// ============================================================

function ChartActions({ result, gridRef }) {
  const [copyStatus, setCopyStatus] = useState('idle')
  const [saving, setSaving] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!result) return
    try {
      const text = [
        '========== 奇门遁甲排盘结果 ==========',
        '',
        `【基本信息】`,
        `公历: ${result.basicInfo?.date || ''}`,
        `农历: ${result.basicInfo?.lunarDate || ''}`,
        `所问: ${result.basicInfo?.question || '未填写具体问题'}`,
        `四柱: 年${result.siZhu?.year} 月${result.siZhu?.month} 日${result.siZhu?.day} 时${result.siZhu?.time}`,
        `局数: ${result.juShu?.fullName || ''}`,
        `起局: ${result.basicInfo?.qijuMethod || ''}`,
        `方法: ${result.basicInfo?.method || ''}`,
        ...(result.basicInfo?.birthYear ? [`年命: ${result.basicInfo.birthYear}年 · ${result.basicInfo.nianMing || '-'}`] : []),
        '',
        `【值符值使】`,
        `值符: ${result.zhiFuXing || ''} (落${GONG_NAMES[result.zhiFuGong] || result.zhiFuGong + '宫'})`,
        `值使: ${result.zhiShiMen || ''} (落${GONG_NAMES[result.zhiShiGong] || result.zhiShiGong + '宫'})`,
        '',
        ...(result.kongWangGong?.length > 0 ? [`【空亡宫位】 ${result.kongWangGong.join('宫、')}宫`, ''] : []),
        '【九宫详情】',
        '----------------------------------------',
        ...Object.entries(result.jiuGongAnalysis || {}).map(([key, info]) => {
          const prediction = info.prediction || {}
          const evidence = prediction.keyEvidence?.length ? `\n  关键依据: ${prediction.keyEvidence.join('；')}` : ''
          const ganGeju = prediction.expertDetails?.ganGejuText ? `\n  天地盘格局: ${prediction.expertDetails.ganGejuText}` : ''
          const actions = prediction.actionPoints?.length ? `\n  行动建议: ${prediction.actionPoints.join('；')}` : ''
          const checks = prediction.verifyPoints?.length ? `\n  验证点: ${prediction.verifyPoints.join('；')}` : ''
          return `${GONG_NAMES[key]} [${info.jiXiongText} · ${prediction.displayLabel || prediction.confidenceText || '参考'}]\n  天盘: ${result.displayTianPan?.[key] ?? result.tianPan?.[key] ?? '-'}  地盘: ${result.displayDiPan?.[key] ?? result.diPan?.[key] ?? '-'}\n  九星: ${result.jiuXing?.[key] || '-'}  八门: ${result.baMen?.[key] || '-'}  八神: ${result.baShen?.[key] || '-'}\n  断语: ${prediction.coreVerdict || prediction.decision || '-'}  窗口: ${prediction.verifyWindow || '-'}${ganGeju}${evidence}${actions}${checks}`
        }),
        '----------------------------------------',
        ...(result.multiGong ? [
          '',
          '【多宫联动】',
          result.multiGong.summary || '',
          ...(result.multiGong.contradictions || []).map(item => `- ${item.name}: ${item.detail} ${item.analysis}`),
          `起因: ${result.multiGong.logicChain?.cause || ''}`,
          `经过: ${result.multiGong.logicChain?.process || ''}`,
          `结果: ${result.multiGong.logicChain?.result || ''}`,
          ...(result.multiGong.yingQi?.length ? ['【应期候选】', ...result.multiGong.yingQi.map(item => `- ${item.method}: ${item.detail} ${item.action}`)] : [])
        ] : []),
        ...(result.analysis?.suggestions ? ['', '【综合建议】', `总体吉凶: ${result.analysis.overallJiXiongText || ''}`, ...result.analysis.suggestions.map(s => `- ${s}`)] : []),
        '',
        '========================================',
        '仅供参考和学习之用，不构成任何决策建议',
      ].join('\n')

      await navigator.clipboard.writeText(text)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }, [result])

  const handleSaveImage = useCallback(async () => {
    if (!gridRef?.current) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(gridRef.current, {
        backgroundColor: '#e7eeee',
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `奇门遁甲排盘_${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('保存图片失败:', e)
    } finally {
      setSaving(false)
    }
  }, [gridRef])

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {/* 复制排盘结果 */}
      <button
        onClick={handleCopy}
        disabled={copyStatus === 'success'}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${
          copyStatus === 'success'
            ? 'border-green-500 text-green-500 bg-green-500/10'
            : copyStatus === 'error'
              ? 'border-red-500 text-red-500 bg-red-500/10'
              : 'border-[var(--qm-primary)] text-[var(--qm-primary)] hover:bg-[rgba(107,36,31,0.1)] hover:shadow-[0_4px_10px_rgba(107,36,31,0.14)]'
        }`}
        style={{ fontFamily: FONT_YAHEI }}
      >
        {copyStatus === 'success' ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            已复制
          </>
        ) : copyStatus === 'error' ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            复制失败
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制排盘结果
          </>
        )}
      </button>

      {/* 保存为图片 */}
      <button
        onClick={handleSaveImage}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all border-2 border-[var(--qm-primary)] text-[var(--qm-primary)] hover:bg-[rgba(107,36,31,0.1)] hover:shadow-[0_4px_10px_rgba(107,36,31,0.14)] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: FONT_YAHEI }}
      >
        {saving ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            保存中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            保存为图片
          </>
        )}
      </button>
    </div>
  )
}

// ============================================================
// 主页面组件
// ============================================================

function getInitialResult(initialQuestion = '') {
  try {
    return calculate(new Date(), {
      method: '时家',
      qijuMethod: '拆补法',
      purpose: '综合',
      question: initialQuestion,
    })
  } catch (e) {
    return { error: true, message: e.message || '排盘计算失败' }
  }
}
function beijingClock() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).formatToParts(new Date())
  const v = key => p.find(item => item.type === key)?.value
  return new Date(Number(v('year')), Number(v('month')) - 1, Number(v('day')), Number(v('hour')), Number(v('minute')))
}
function stamp(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
function asGrid(cells) {
  const data = { displayTianPan:{}, displayDiPan:{}, jiuXing:{}, baMen:{}, baShen:{}, kongWangGong:[], maStar:{}, jiuGongAnalysis:{} }
  cells.forEach(c => { const k=String(c.palace); data.displayTianPan[k]=c.heaven.join('、');data.displayDiPan[k]=c.earth.join('、');data.jiuXing[k]=c.star === '芮禽' ? '天芮、天禽' : c.star;data.baMen[k]=c.gate;data.baShen[k]=c.god;if(c.void)data.kongWangGong.push(k);if(c.horse)data.maStar.gong=k })
  return data
}
const categoryMap = {事业:'事业官运',财运:'求财',婚姻:'婚姻',健康:'健康',学业:'考试',官司:'官司',出行:'出行',走失:'走失',择吉:'择吉',天气:'天气',风水阳宅:'风水阳宅',风水阴宅:'风水阴宅'}
const panel = 'bg-[var(--qm-surface)] rounded-xl p-5 border border-[var(--qm-border)]'
export default function Divination() {
  const [params] = useSearchParams()
  const [result,setResult] = useState(null)
  const [error,setError] = useState('')
  const [loading,setLoading] = useState(false)
  const [selected,setSelected] = useState(null)
  const [extra,setExtra] = useState('cases')
  const [legacyRecords] = useState(loadReviewRecords)
  const [saved,setSaved] = useState(false)
  const gridRef=useRef(null)
  const request=useRef(0)
  const initialQuestion=(params.get('question') || '').slice(0,120)
  const calculate=useCallback(async (date,options={}) => {
    const seq=++request.current
    const question=(options.question || '').trim(); const outcome=(options.outcome || '').trim()
    const category=categoryMap[options.purpose]
    if (options.manual && !question) { setLoading(false); setResult(null); setError('手工四柱起局请填写具体问题、可观察结果与局式。'); return }
    if (question && (!category || !outcome)) { setLoading(false); setResult(null); setError(!category ? '请选择具体的分析目的，才能进行预测。' : '请填写可观察结果，以明确预测和复盘口径。'); return }
    setLoading(true);setError('');setSelected(null);setSaved(false)
    const payload={ ...options,mode: question ? (options.manual ? 'manual' : 'event'):'chart', category,question,outcome,time:stamp(date),longitude:options.trueSolar && options.longitude !== '' ? Number(options.longitude) : null }
    try {
      const data=await runQimen(payload)
      if(seq===request.current) setResult({...data,question,outcome,time:payload.time,category})
    } catch(e) {if(seq===request.current){setResult(null);setError(e.message || '无法连接排盘服务。')}} finally {if(seq===request.current)setLoading(false)}
  },[])
  useEffect(()=>{ calculate(beijingClock()) },[calculate])
  const copy=async()=>{try{await navigator.clipboard.writeText([result.header.ganzhi,result.header.ju_name,result.timeConvention,result.question,result.report].filter(Boolean).join('\n'));alert('已复制盘面与分析')}catch{alert('复制失败，请检查浏览器权限。')}}
  const image=async()=>{try{const {toPng}=await import('html-to-image');const url=await toPng(gridRef.current,{pixelRatio:2,cacheBust:true});const a=document.createElement('a');a.href=url;a.download='qimen-chart.png';a.click()}catch{alert('保存图片失败，请重试。')}}
  const save=()=>{try{const key='shijia-v26-casebook';const records=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(records))throw Error();records.unshift({id:crypto.randomUUID(),kind:'事前判断',source:'在线排盘',chart:`${result.time} ${result.header.ganzhi} ${result.header.ju_name}`,question:result.question,prediction:result.report,observation:result.outcome,window:result.scope?.观察期限 || '未提供',invalid:'待补充',createdAt:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(records));setSaved(true)}catch{alert('保存失败，请检查浏览器存储空间。')}}
  return <div className="min-h-[80vh] px-4 py-8 md:py-12 animate-fadeIn"><h1 className="text-center text-3xl font-bold tracking-wider text-[var(--qm-primary)] md:text-5xl" style={{fontFamily:FONT_SONG}}>在线排盘</h1><p className="mx-auto mb-10 mt-3 max-w-xl text-center text-[var(--qm-ink-soft)]">时家阳盘 · 拆补法。盘面与预测使用同一套规则；时间按北京时间输入。</p>
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12"><div className="order-2 lg:order-1 lg:col-span-4"><div className={`${panel} sticky top-20`}><h2 className="mb-5 text-lg font-bold text-[var(--qm-primary)]">排盘参数</h2><TimeSelector onSubmit={calculate} loading={loading} initialQuestion={initialQuestion}/><p className="mt-4 text-xs leading-5 text-[var(--qm-ink-soft)]">排盘在当前浏览器内计算。首次使用需要加载计算组件；仅支持时家阳盘拆补，未填写问题时只显示盘面。</p></div></div>
    <div className="order-1 space-y-5 lg:order-2 lg:col-span-8">{error && <div role="alert" className={`${panel} text-sm text-red-700`}>{error}</div>}{loading && <p className={panel}>正在排盘…</p>}
    {result && !loading && <><div className={panel}><h2 className="font-bold text-[var(--qm-primary)]">盘面信息</h2><p className="mt-2 text-sm leading-7">{result.header.ganzhi}　{result.header.ju_name}　{result.header.term || ''}<br/>旬首 {result.header.旬首}　旬空 {result.header.旬空地支}<br/>值符 {result.header.值符.join(' · ')}　值使 {result.header.值使.join(' · ')}<br/>{result.timeConvention}</p><p className="mt-3 border-t border-[var(--qm-border-soft)] pt-3 text-sm">本盘所问：{result.question || '未填写，当前仅展示盘面。'}</p></div>
    <div ref={gridRef} className={panel}><JiuGongGrid limitedMarkers result={asGrid(result.cells)} onPalaceClick={k=>setSelected(result.cells.find(c=>String(c.palace)===k))}/>{selected && <div className="mt-4 border-t border-[var(--qm-border-soft)] pt-3 text-sm leading-7"><strong>{GONG_NAMES[String(selected.palace)] || `${selected.palace}宫`}</strong>　{selected.god || '—'} · {selected.star || '—'} · {selected.gate || '—'}<br/>天盘 {selected.heaven.join('、') || '—'}　地盘 {selected.earth.join('、') || '—'}　{selected.void ? '空亡 ' : ''}{selected.horse ? '驿马' : ''}<p className="text-xs text-[var(--qm-ink-soft)]">具体吉凶需结合用神、旺衰与其他宫位，不能单凭一宫下结论。</p></div>}</div>
    <div className="flex flex-wrap gap-2"><button onClick={copy} className="border border-[var(--qm-border)] px-4 py-2 text-sm">复制结果</button><button onClick={image} className="border border-[var(--qm-border)] px-4 py-2 text-sm">保存盘面图片</button>{result.report && <button onClick={save} disabled={saved} className="border border-[var(--qm-primary)] px-4 py-2 text-sm text-[var(--qm-primary)]">{saved?'已保存本盘':'保存本盘复盘'}</button>}</div>
    {result.report ? <div className={panel}><h2 className="text-lg font-bold text-[var(--qm-primary)]">预测与分析依据</h2><p className="mt-2 text-sm leading-6 text-[var(--qm-ink-soft)]">以下是规则给出的盘面线索与倾向，分数及信心属于内部信号，不代表经过验证的预测概率；应结合反证和现实反馈复核。</p>{result.timingNote && <p className="mt-2 text-sm">{result.timingNote}</p>}<div className="mt-4 border border-[var(--qm-border-soft)] p-3 text-sm leading-7"><b>本问与取用神</b><p>{result.scope?.问项} · 主用神 {result.scope?.主用神}</p><p>{result.scope?.取用依据}</p><p>观察：{result.outcome}；期限：{result.scope?.观察期限}</p></div><pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7">{result.report.replace(/信心高/g, '信号较集中').replace(/信心中/g, '信号有分歧').replace(/信心低/g, '信号不足').replace(/由 LLM 复核/g, '需进一步复核')}</pre><p className="mt-5 border-t border-[var(--qm-border-soft)] pt-4 text-xs leading-6">以上内容属于传统文化与时空决策模型的分析参考，不构成绝对预测；涉及健康、法律、投资和重大人生决定时，请结合现实信息与专业意见。</p></div> : <div className={`${panel} text-sm leading-7`}>补充具体问题、分析目的和可观察结果后，可查看预测依据与复盘线索。</div>}
    {result.cases && <details className={panel}><summary className="cursor-pointer font-bold">同类书例参照</summary><p className="mt-2 text-xs">仅供方法参考，不能套用结局。</p>{result.cases.书例?.map(item=><div className="mt-3 text-sm" key={item.编号}><b>{item.标题}</b><p>{item.断法要点}</p></div>)}</details>}
    </>}
    <details className={panel}><summary className="cursor-pointer font-bold text-[var(--qm-primary)]">深入分析与案例复盘</summary><div className="mt-4 flex flex-wrap gap-2">{[['cases','案例复盘'],['lifetime','终身局'],['review','截图核盘'],['compare','转宫比较']].map(([id,label])=><button key={id} type="button" onClick={()=>setExtra(id)} className={`border border-[var(--qm-border)] px-3 py-2 text-sm ${extra===id?'bg-[var(--qm-primary)] text-[var(--qm-surface)]':''}`}>{label}</button>)}</div><AdvancedShijia key={extra} mode={extra} initialTime={(result?.time || stamp(beijingClock())).replace(' ','T')}/></details>
    {legacyRecords.length>0 && <details className={panel}><summary className="cursor-pointer font-bold">原有复盘记录（{legacyRecords.length}）</summary><p className="mt-2 text-xs">历史记录保留原计算口径，不与新规则的结果混算。</p>{legacyRecords.map((item,i)=><div key={item.id || i} className="mt-3 border-t border-[var(--qm-border-soft)] pt-2 text-sm">{item.question || '未填写问题'} · {item.date || item.createdAt || ''}</div>)}<button onClick={()=>downloadReviewCsv(legacyRecords,getReviewStats(legacyRecords))} className="mt-3 border border-[var(--qm-border)] px-3 py-2 text-sm">导出原有记录</button></details>}
    </div></div></div>
}
