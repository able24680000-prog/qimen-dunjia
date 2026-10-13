import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(projectRoot, '..')
const defaultCsv = path.join(repoRoot, 'qimen_case_seed_v2.csv')
const inputCsv = path.resolve(process.argv[2] || defaultCsv)
const outputMd = path.resolve(process.argv[3] || path.join(repoRoot, 'docs', 'qimen-case-seed-calibration-report.md'))
const outputJson = path.resolve(process.argv[4] || path.join(projectRoot, 'src', 'knowledge', 'case-seed-calibration-summary.json'))
const factorsPath = path.join(projectRoot, 'src', 'knowledge', 'calibration-factors.json')

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((item) => item.some(Boolean))
}

function countBy(rows, key) {
  const counts = new Map()
  for (const row of rows) {
    const value = row[key] || '未标注'
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
}

function inferOutcome(row) {
  const text = `${row.feedback || ''}${row.verdict || ''}`
  if (/不准|未验|没验|错误|反了/.test(text)) return 'miss'
  if (/部分|小验|半验|有偏差/.test(text)) return 'partial'
  if (/全验|验证|印证|吻合|神准|很准|准|全中|全都|符合|应验/.test(text)) return 'hit'
  return 'unknown'
}

function isScenarioCompatible(factorScenes, category) {
  if (!Array.isArray(factorScenes) || factorScenes.includes('通用')) return true
  return factorScenes.some((scene) => category.includes(scene) || scene.includes(category))
}

function factorHits(row, factors) {
  const text = `${row.verdict || ''}\n${row.feedback || ''}\n${row.zhifu_star || ''}\n${row.zhishi_gate || ''}`
  return factors
    .filter((factor) => isScenarioCompatible(factor.scene, row.category || ''))
    .filter((factor) => (factor.keywords || []).some((keyword) => text.includes(keyword)))
    .map((factor) => factor.id)
}

if (!fs.existsSync(inputCsv)) {
  console.error(`案例库不存在：${inputCsv}`)
  process.exit(1)
}

const raw = fs.readFileSync(inputCsv, 'utf8').replace(/^\uFEFF/, '')
const parsed = parseCsv(raw)
const headers = parsed[0]
const cases = parsed.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])))
const factors = JSON.parse(fs.readFileSync(factorsPath, 'utf8'))

const enrichedCases = cases.map((item) => ({
  ...item,
  outcome: inferOutcome(item),
  factors: factorHits(item, factors)
}))

const reviewed = enrichedCases.filter((item) => item.outcome !== 'unknown')
const outcomeScore = reviewed.reduce((sum, item) => sum + (item.outcome === 'hit' ? 1 : item.outcome === 'partial' ? 0.5 : 0), 0)

const factorStats = factors.map((factor) => {
  const rows = enrichedCases.filter((item) => item.factors.includes(factor.id))
  const known = rows.filter((item) => item.outcome !== 'unknown')
  const score = known.reduce((sum, item) => sum + (item.outcome === 'hit' ? 1 : item.outcome === 'partial' ? 0.5 : 0), 0)
  const scenes = countBy(rows, 'category').slice(0, 5)
  return {
    id: factor.id,
    label: factor.label,
    category: factor.category,
    sampleCount: rows.length,
    reviewedCount: known.length,
    hitRate: known.length ? Math.round((score / known.length) * 100) : null,
    scenes: Object.fromEntries(scenes)
  }
}).sort((a, b) => b.sampleCount - a.sampleCount || a.id.localeCompare(b.id))

const categoryStats = countBy(enrichedCases, 'category').map(([category, count]) => {
  const rows = enrichedCases.filter((item) => item.category === category)
  const known = rows.filter((item) => item.outcome !== 'unknown')
  const score = known.reduce((sum, item) => sum + (item.outcome === 'hit' ? 1 : item.outcome === 'partial' ? 0.5 : 0), 0)
  return {
    category,
    count,
    reviewedCount: known.length,
    hitRate: known.length ? Math.round((score / known.length) * 100) : null
  }
})

const sourceStats = countBy(enrichedCases, 'source').map(([source, count]) => ({ source, count }))
const workSamples = enrichedCases.filter((item) => item.category === '事业/工作').length

const summary = {
  generatedAt: new Date().toISOString().slice(0, 10),
  inputCsv,
  totalCases: enrichedCases.length,
  reviewedCases: reviewed.length,
  inferredHitRate: reviewed.length ? Math.round((outcomeScore / reviewed.length) * 100) : null,
  categoryStats,
  sourceStats,
  factorStats,
  calibrationNotes: [
    '这份种子库适合先校准通用因子、八门、四害、主客、应期候选等基础层。',
    `事业/工作样本只有 ${workSamples} 条，不足以支撑事业/项目推进的 30 条专项校准。`,
    'hitRate 来自反馈文本自动推断，只能用于样本分层和候选权重提示，不能直接写成正式命中率。',
    '后续应补充事前预测原文、验证窗口、实际最先反馈类型和人工 outcome 标注。'
  ]
}

const factorRows = factorStats
  .filter((item) => item.sampleCount > 0)
  .map((item) => `| ${item.label} | ${item.category} | ${item.sampleCount} | ${item.reviewedCount} | ${item.hitRate === null ? '待标注' : `${item.hitRate}%`} | ${Object.entries(item.scenes).map(([scene, count]) => `${scene} ${count}`).join('、')} |`)
  .join('\n')

const categoryRows = categoryStats
  .map((item) => `| ${item.category} | ${item.count} | ${item.reviewedCount} | ${item.hitRate === null ? '待标注' : `${item.hitRate}%`} |`)
  .join('\n')

const sourceRows = sourceStats
  .map((item) => `| ${item.source} | ${item.count} |`)
  .join('\n')

const markdown = `# 奇门案例种子库校准报告

生成日期：${summary.generatedAt}

输入文件：\`${inputCsv}\`

## 样本概览

- 总案例数：${summary.totalCases}
- 可从反馈文本推断结果的案例数：${summary.reviewedCases}
- 自动推断命中率：${summary.inferredHitRate === null ? '待人工标注' : `${summary.inferredHitRate}%`}
- 事业/工作样本：${workSamples} 条

## 类别分布

| 类别 | 样本数 | 可推断结果 | 自动推断命中率 |
| --- | ---: | ---: | ---: |
${categoryRows}

## 来源分布

| 来源 | 样本数 |
| --- | ---: |
${sourceRows}

## 因子覆盖

| 因子 | 类别 | 命中样本 | 可推断结果 | 自动推断命中率 | 主要场景 |
| --- | --- | ---: | ---: | ---: | --- |
${factorRows}

## 结论

1. 这份案例库可以作为第一批“通用因子校准种子”，尤其适合观察八门、四害、主客生克、应期候选在不同问题类型中的出现方式。
2. 暂时不宜把它直接用于“事业/项目推进 30 条”专项校准，因为事业/工作只有 ${workSamples} 条。
3. 当前命中率为脚本根据反馈文字自动推断，下一步应增加人工 outcome、actualFirstSignal、errorCause 字段。
4. 后续进入知识库前，应先把因子统计写入候选更新，不直接覆盖正式断语表。
`

fs.mkdirSync(path.dirname(outputMd), { recursive: true })
fs.mkdirSync(path.dirname(outputJson), { recursive: true })
fs.writeFileSync(outputMd, markdown, 'utf8')
fs.writeFileSync(outputJson, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

console.log(`案例数：${summary.totalCases}`)
console.log(`报告：${outputMd}`)
console.log(`摘要：${outputJson}`)

