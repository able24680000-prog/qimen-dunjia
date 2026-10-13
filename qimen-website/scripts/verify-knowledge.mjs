import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const summaryPath = path.join(root, 'src', 'knowledge', 'maidu-summary.json')
const knowledgePagePath = path.join(root, 'src', 'pages', 'Knowledge.jsx')
const divinationPagePath = path.join(root, 'src', 'pages', 'Divination.jsx')
const judgementTablePath = path.join(root, 'src', 'knowledge', 'judgement-sentence-table.json')
const updateScriptPath = path.join(root, 'scripts', 'update-judgement-table.mjs')
const courses = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
const judgementTable = JSON.parse(fs.readFileSync(judgementTablePath, 'utf8'))
const failures = []

function fail(message) {
  failures.push(message)
}

if (!Array.isArray(courses)) fail('maidu-summary.json must export an array')
if (courses.length !== 10) fail(`expected 10 courses, got ${courses.length}`)

if (!Array.isArray(judgementTable)) fail('judgement-sentence-table.json must export an array')
for (const [index, item] of (Array.isArray(judgementTable) ? judgementTable : []).entries()) {
  for (const key of ['id', 'scene', 'trigger', 'judgement', 'action', 'verification', 'updateRule']) {
    if (!item[key]) fail(`judgement table row ${index} missing ${key}`)
  }
}
if (!fs.existsSync(updateScriptPath)) fail('update-judgement-table.mjs is missing')
const requiredScenes = ['九星', '八门', '八神', '十干克应', '宫性', '四害', '主客', '应期', '转宫', '九遁运筹']
const scenes = new Set(judgementTable.map((item) => item.scene))
for (const scene of requiredScenes) {
  if (!scenes.has(scene)) fail(`judgement table missing scene: ${scene}`)
}
for (const [index, item] of (Array.isArray(judgementTable) ? judgementTable : []).entries()) {
  if (!item.status) fail(`judgement table row ${index} missing status`)
  if (item.reviewCount === undefined) fail(`judgement table row ${index} missing reviewCount`)
  if (!['候选', '已验证', '暂停使用'].includes(item.status)) fail(`judgement table row ${index} invalid status: ${item.status}`)
}

const ids = new Set()
for (const course of courses) {
  if (!course.id || ids.has(course.id)) fail(`duplicate or missing course id: ${course.id || '(empty)'}`)
  ids.add(course.id)

  for (const key of ['title', 'desc', 'focus', 'file']) {
    if (!course[key]) fail(`${course.id || '(unknown)'} missing ${key}`)
  }

  const filePath = path.join(root, 'src', 'knowledge', course.file || '')
  if (!fs.existsSync(filePath)) {
    fail(`${course.id} source file not found: ${course.file}`)
    continue
  }

  const source = fs.readFileSync(filePath, 'utf8')
  const titleLead = course.title.split('：').at(-1).slice(0, 6)
  if (!source.includes(titleLead)) {
    fail(`${course.id} source file does not appear to match title: ${course.file}`)
  }
}

const pageSource = fs.readFileSync(knowledgePagePath, 'utf8')
for (const required of [
  "import courses from '../knowledge/maidu-summary.json'",
  "import judgementSentenceTable from '../knowledge/judgement-sentence-table.json'",
  "import { useSearchParams } from 'react-router-dom'",
  "searchParams.get('q')",
  '麦垛十课索引',
  'COURSE_KEYWORDS',
  'STUDY_PATHS',
  '断语数据表与迭代规则',
  '单宫九步断法',
  '四害排查',
  '主客关系',
]) {
  if (!pageSource.includes(required)) fail(`Knowledge.jsx missing required marker: ${required}`)
}

const divinationSource = fs.readFileSync(divinationPagePath, 'utf8')
for (const required of [
  "import { Link, useSearchParams } from 'react-router-dom'",
  'KNOWLEDGE_QUERY_BY_LABEL',
  'KNOWLEDGE_QUERY_BY_GEJU_TYPE',
  'buildKnowledgeLinks',
  '关联知识',
  '展开九步专业断法',
  '单宫九步断法',
  '应期候选',
  '四害排查',
  '主客关系',
  "to={makeKnowledgeUrl(query)}",
]) {
  if (!divinationSource.includes(required)) fail(`Divination.jsx missing knowledge-link marker: ${required}`)
}

if (failures.length) {
  console.error('知识库索引校验失败：')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`知识库索引校验通过：${courses.length} 节课程，${judgementTable.length} 条断语规则。`)
