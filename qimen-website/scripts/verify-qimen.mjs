import { calculate } from '../src/lib/qimen.js'

const cases = [
  {
    name: '2026-06-16 12:00 芒种下元阳遁9局',
    date: new Date(2026, 5, 16, 12, 0, 0),
    options: { method: '时家', qijuMethod: '拆补法', purpose: '综合' },
    expected: {
      siZhu: { year: '丙午', month: '甲午', day: '辛酉', time: '甲午' },
      juShu: { jieQiName: '芒种', type: 'yang', number: '9', yuan: '下元', fullName: '阳遁9局 (下元)' },
      xunShou: '辛',
      kongWangZhi: ['辰', '巳'],
      kongWangGong: ['4', '4'],
      zhiFuXing: '天冲',
      zhiFuGong: '3',
      zhiFuYuanGong: '3',
      zhiShiMen: '伤门',
      zhiShiGong: '3',
      diPan: { '1': '己', '2': '庚', '3': '辛', '4': '壬', '5': '癸', '6': '丁', '7': '丙', '8': '乙', '9': '戊' },
      tianPan: { '1': '己', '2': '庚', '3': '辛', '4': '壬', '5': '庚', '6': '丁', '7': '丙', '8': '乙', '9': '戊' },
      displayDiPan: { '1': '己', '2': '癸、庚', '3': '辛', '4': '壬', '5': '', '6': '丁', '7': '丙', '8': '乙', '9': '戊' },
      displayTianPan: { '1': '己', '2': '庚、癸', '3': '辛', '4': '壬', '5': '', '6': '丁', '7': '丙', '8': '乙', '9': '戊' },
      ganVariants2: { tianGanList: ['庚', '癸'], diGanList: ['癸', '庚'] },
      gejuNames2Includes: ['大格', '小格'],
      jiuXing: { '1': '天蓬', '2': '天禽、天芮', '3': '天冲', '4': '天辅', '5': '', '6': '天心', '7': '天柱', '8': '天任', '9': '天英' },
      baMen: { '1': '休门', '2': '死门', '3': '伤门', '4': '杜门', '5': '', '6': '开门', '7': '惊门', '8': '生门', '9': '景门' },
      baShen: { '1': '九地', '2': '六合', '3': '值符', '4': '螣蛇', '5': '', '6': '玄武', '7': '白虎', '8': '九天', '9': '太阴' },
    },
  },
  {
    name: '2024-02-04 00:00 大寒上元阳遁3局',
    date: new Date(2024, 1, 4, 0, 0, 0),
    options: { method: '时家', qijuMethod: '拆补法', purpose: '综合' },
    expected: {
      siZhu: { year: '甲辰', month: '乙丑', day: '戊戌', time: '壬子' },
      juShu: { jieQiName: '大寒', type: 'yang', number: '3', yuan: '上元', fullName: '阳遁3局 (上元)' },
      xunShou: '壬',
      kongWangZhi: ['寅', '卯'],
      kongWangGong: ['8', '3'],
      zhiFuXing: '天柱',
      zhiFuGong: '7',
      zhiFuYuanGong: '7',
      zhiShiMen: '惊门',
      zhiShiGong: '6',
      diPan: { '1': '丙', '2': '乙', '3': '戊', '4': '己', '5': '庚', '6': '辛', '7': '壬', '8': '癸', '9': '丁' },
      tianPan: { '1': '丙', '2': '乙', '3': '戊', '4': '己', '5': '乙', '6': '辛', '7': '壬', '8': '癸', '9': '丁' },
      displayDiPan: { '1': '丙', '2': '庚、乙', '3': '戊', '4': '己', '5': '', '6': '辛', '7': '壬', '8': '癸', '9': '丁' },
      displayTianPan: { '1': '丙', '2': '乙、庚', '3': '戊', '4': '己', '5': '', '6': '辛', '7': '壬', '8': '癸', '9': '丁' },
      ganVariants2: { tianGanList: ['乙', '庚'], diGanList: ['庚', '乙'] },
      gejuNames2Includes: ['青龙逃走', '白虎猖狂'],
      jiuXing: { '1': '天蓬', '2': '天禽、天芮', '3': '天冲', '4': '天辅', '5': '', '6': '天心', '7': '天柱', '8': '天任', '9': '天英' },
      baMen: { '1': '开门', '2': '景门', '3': '生门', '4': '伤门', '5': '', '6': '惊门', '7': '死门', '8': '休门', '9': '杜门' },
      baShen: { '1': '太阴', '2': '九天', '3': '白虎', '4': '玄武', '5': '', '6': '螣蛇', '7': '值符', '8': '六合', '9': '九地' },
    },
  },
  {
    name: '2024-02-03 22:59 23点前亥时边界',
    date: new Date(2024, 1, 3, 22, 59, 0),
    options: { method: '时家', qijuMethod: '拆补法', purpose: '综合' },
    expected: {
      siZhu: { year: '癸卯', month: '乙丑', day: '丁酉', time: '辛亥' },
      juShu: { jieQiName: '大寒', type: 'yang', number: '3', yuan: '上元', fullName: '阳遁3局 (上元)' },
      xunShou: '壬',
      kongWangZhi: ['寅', '卯'],
      kongWangGong: ['8', '3'],
      zhiFuXing: '天柱',
      zhiFuGong: '6',
      zhiFuYuanGong: '7',
      zhiShiMen: '惊门',
      zhiShiGong: '2',
    },
  },
  {
    name: '2024-02-03 23:00 子时边界',
    date: new Date(2024, 1, 3, 23, 0, 0),
    options: { method: '时家', qijuMethod: '拆补法', purpose: '综合' },
    expected: {
      siZhu: { year: '癸卯', month: '乙丑', day: '戊戌', time: '壬子' },
      juShu: { jieQiName: '大寒', type: 'yang', number: '3', yuan: '上元', fullName: '阳遁3局 (上元)' },
      xunShou: '壬',
      kongWangZhi: ['寅', '卯'],
      kongWangGong: ['8', '3'],
      zhiFuXing: '天柱',
      zhiFuGong: '7',
      zhiFuYuanGong: '7',
      zhiShiMen: '惊门',
      zhiShiGong: '6',
    },
  },
  {
    name: '2024-02-04 17:00 立春后阳遁8局',
    date: new Date(2024, 1, 4, 17, 0, 0),
    options: { method: '时家', qijuMethod: '拆补法', purpose: '综合' },
    expected: {
      siZhu: { year: '甲辰', month: '丙寅', day: '戊戌', time: '辛酉' },
      juShu: { jieQiName: '立春', type: 'yang', number: '8', yuan: '上元', fullName: '阳遁8局 (上元)' },
      xunShou: '癸',
      kongWangZhi: ['子', '丑'],
      kongWangGong: ['1', '8'],
      zhiFuXing: '天辅',
      zhiFuGong: '2',
      zhiFuYuanGong: '4',
      zhiShiMen: '杜门',
      zhiShiGong: '2',
    },
  },
  {
    name: '2026-06-22 12:00 夏至后阴遁9局',
    date: new Date(2026, 5, 22, 12, 0, 0),
    options: { method: '时家', qijuMethod: '拆补法', purpose: '综合' },
    expected: {
      siZhu: { year: '丙午', month: '甲午', day: '丁卯', time: '丙午' },
      juShu: { jieQiName: '夏至', type: 'yin', number: '9', yuan: '上元', fullName: '阴遁9局 (上元)' },
      xunShou: '壬',
      kongWangZhi: ['寅', '卯'],
      kongWangGong: ['8', '3'],
      zhiFuXing: '天芮',
      zhiFuGong: '2',
      zhiFuYuanGong: '2',
      zhiShiMen: '死门',
      zhiShiGong: '9',
    },
  },
  {
    name: '2026-01-10 12:00 小寒茅山法上元阳遁2局',
    date: new Date(2026, 0, 10, 12, 0, 0),
    options: { method: '时家', qijuMethod: '茅山法', purpose: '综合' },
    expected: {
      siZhu: { year: '乙巳', month: '己丑', day: '甲申', time: '庚午' },
      juShu: { jieQiName: '小寒', type: 'yang', number: '2', yuan: '上元', fullName: '阳遁2局 (上元)' },
      xunShou: '戊',
      kongWangZhi: ['戌', '亥'],
      kongWangGong: ['6', '6'],
      zhiFuXing: '天芮',
      zhiFuGong: '4',
      zhiFuYuanGong: '2',
      zhiShiMen: '死门',
      zhiShiGong: '8',
    },
  },
]

function getPathValue(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value)
}

function assertDeepEqual(actual, expected, label, failures) {
  const actualJson = JSON.stringify(actual)
  const expectedJson = JSON.stringify(expected)
  if (actualJson !== expectedJson) {
    failures.push(`${label}\n  expected: ${expectedJson}\n  actual:   ${actualJson}`)
  }
}

function assertIncludesAll(actual, expectedItems, label, failures) {
  const missing = expectedItems.filter((item) => !actual.includes(item))
  if (missing.length) failures.push(`${label}\n  missing: ${missing.join('、')}\n  actual:  ${actual.join('、')}`)
}

function verifyCase(testCase) {
  const result = calculate(testCase.date, testCase.options)
  const failures = []

  for (const key of ['siZhu', 'xunShou', 'kongWangZhi', 'kongWangGong', 'zhiFuXing', 'zhiFuGong', 'zhiFuYuanGong', 'zhiShiMen', 'zhiShiGong', 'diPan', 'tianPan', 'displayDiPan', 'displayTianPan', 'jiuXing', 'baMen', 'baShen']) {
    if (Object.hasOwn(testCase.expected, key)) {
      assertDeepEqual(result[key], testCase.expected[key], `${testCase.name} ${key}`, failures)
    }
  }

  if (Object.hasOwn(testCase.expected, 'ganVariants2')) {
    assertDeepEqual(result.ganVariants?.['2'], testCase.expected.ganVariants2, `${testCase.name} ganVariants.2`, failures)
  }
  if (Object.hasOwn(testCase.expected, 'gejuNames2Includes')) {
    assertIncludesAll(result.jiuGongAnalysis?.['2']?.geju?.names || [], testCase.expected.gejuNames2Includes, `${testCase.name} 坤二宫寄干格局`, failures)
  }

  if (testCase.name.includes('2026-06-16')) {
    const palace4 = result.jiuGongAnalysis?.['4']?.singlePalaceAnalysis
    if (!palace4) failures.push(`${testCase.name} 巽四宫 missing singlePalaceAnalysis`)
    if (palace4?.palaceNature?.label !== '巽宫') failures.push(`${testCase.name} 巽四宫 palaceNature should be 巽宫`)
    assertIncludesAll((palace4?.fourHarms || []).filter((item) => item.active).map((item) => item.label), ['空亡', '入墓', '击刑'], `${testCase.name} 巽四宫四害`, failures)
    if (palace4?.innerOuter?.scope !== 'inner') failures.push(`${testCase.name} 巽四宫 should be inner disk for 阳遁`)
    if (!palace4?.fuYinFanYin?.hasFu) failures.push(`${testCase.name} 巽四宫 should include fu-yin signal`)
    if (!palace4?.transferHint) failures.push(`${testCase.name} 巽四宫 should include transferHint`)
    assertIncludesAll((palace4?.steps || []).map((item) => item.label), ['宫性打底', '生克量化', '四害排查', '旺衰定级', '远近定速'], `${testCase.name} 巽四宫九步断法`, failures)
    const yingQiMethods = result.multiGong?.yingQi?.map((item) => item.method) || []
    assertIncludesAll(yingQiMethods, ['最快反馈', '主要触发', '状态转换', '慢反馈'], testCase.name + ' 应期候选', failures)
    if (yingQiMethods.includes('庚格应期')) failures.push(testCase.name + ' 应期不应再重复输出庚格应期')
    const decisionCard = result.multiGong?.decisionCard || {}
    for (const key of ['mainVerdict', 'maxRisk', 'firstSignal', 'yingQiCandidate', 'nextAction']) {
      if (!decisionCard[key]) failures.push(`${testCase.name} decisionCard missing ${key}`)
    }
    const rawRelationCodes = ['same', 'sheng', 'beSheng', 'ke', 'beKe']
    for (const item of result.multiGong?.contradictions || []) {
      if (!item.relationLabel || rawRelationCodes.includes(item.relationLabel)) failures.push(`${testCase.name} contradiction relationLabel should be human readable`)
      if (!item.plainMeaning || !item.action) failures.push(`${testCase.name} contradiction missing plainMeaning/action`)
      if (item.analysis?.includes(`关系为${item.relation}`)) failures.push(`${testCase.name} analysis should not expose raw relation code`)
    }
  }

  for (const key of ['jieQiName', 'type', 'number', 'yuan', 'fullName']) {
    assertDeepEqual(getPathValue(result, `juShu.${key}`), testCase.expected.juShu[key], `${testCase.name} juShu.${key}`, failures)
  }

  if (result.error) failures.push(`${testCase.name} returned error: ${result.message}`)
  return failures
}

const allFailures = []
for (const testCase of cases) {
  const failures = verifyCase(testCase)
  if (failures.length) {
    allFailures.push(...failures)
    console.error(`FAIL ${testCase.name}`)
  } else {
    console.log(`PASS ${testCase.name}`)
  }
}

if (allFailures.length) {
  console.error('\n奇门排盘基准校验失败：')
  for (const failure of allFailures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`\n奇门排盘基准校验通过：${cases.length} 个案例。`)


