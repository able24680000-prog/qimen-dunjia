import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const tablePath = path.join(root, 'src', 'knowledge', 'judgement-sentence-table.json')
const updatesPath = path.join(root, 'src', 'knowledge', 'judgement-sentence-updates.json')
const summaryPath = path.join(root, 'src', 'knowledge', 'judgement-sentence-summary.json')
const requiredFields = ['id', 'scene', 'trigger', 'judgement', 'action', 'verification', 'updateRule']

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function normalizeEntry(entry) {
  const normalized = { ...entry }
  for (const field of requiredFields) normalized[field] = String(entry[field] || '').trim()
  if (entry.sources) normalized.sources = Array.isArray(entry.sources) ? entry.sources : [String(entry.sources)]
  normalized.status = entry.status || '候选'
  normalized.reviewCount = Number(entry.reviewCount || 0)
  normalized.hitRate = entry.hitRate === null || entry.hitRate === undefined || entry.hitRate === '' ? null : Number(entry.hitRate)
  normalized.updatedAt = entry.updatedAt || new Date().toISOString().slice(0, 10)
  return normalized
}

function validateEntry(entry, index, sourceName) {
  const missing = requiredFields.filter((field) => !String(entry[field] || '').trim())
  if (missing.length) throw new Error(`${sourceName}[${index}] missing fields: ${missing.join(', ')}`)
}

function mergeById(baseEntries, updateEntries) {
  const map = new Map()
  for (const [index, entry] of baseEntries.entries()) {
    validateEntry(entry, index, 'table')
    map.set(entry.id, normalizeEntry(entry))
  }
  for (const [index, entry] of updateEntries.entries()) {
    validateEntry(entry, index, 'updates')
    const previous = map.get(entry.id) || {}
    map.set(entry.id, normalizeEntry({ ...previous, ...entry, updatedAt: new Date().toISOString().slice(0, 10) }))
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id))
}

const table = readJson(tablePath, [])
const updates = readJson(updatesPath, [])
if (!Array.isArray(table)) throw new Error('judgement-sentence-table.json must be an array')
if (!Array.isArray(updates)) throw new Error('judgement-sentence-updates.json must be an array when present')

const merged = mergeById(table, updates)
const summary = {
  updatedAt: new Date().toISOString().slice(0, 10),
  total: merged.length,
  scenes: merged.map((item) => item.scene),
  updateWorkflow: [
    '从知识库或复盘记录提炼新断语，写入 judgement-sentence-updates.json。',
    '每条记录必须包含 id、scene、trigger、judgement、action、verification、updateRule，可附 status、reviewCount、hitRate。',
    '运行 npm run knowledge:update，脚本会按 id 合并并生成摘要。',
    '再运行 npm run verify:knowledge、npm run build，确认页面和数据结构有效。'
  ]
}

fs.writeFileSync(tablePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
console.log(`断语表已更新：${merged.length} 条。摘要：src/knowledge/judgement-sentence-summary.json`)
