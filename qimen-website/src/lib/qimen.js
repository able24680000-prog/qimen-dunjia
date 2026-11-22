/**
 * 奇门遁甲核心计算库（修正版）
 * 基于传统奇门遁甲规则，参考 taobi 算法实现
 * 支持 茅山法 和 拆补法 两种起局方法
 */

import { Lunar, Solar } from 'lunar-javascript';
import { analyzeFuYinFanYin, analyzeGeJu } from './geju.js';
import { readXiang } from './duxiang.js';

// ========== 核心常量 ==========

// 六十甲子
const LIUSHI_JIAZI = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'
];

// 节气用局表（上元/中元/下元）
const JIEQI_JUSHU = {
  '冬至': { type: 'yang', nums: [1,7,4] },
  '小寒': { type: 'yang', nums: [2,8,5] },
  '大寒': { type: 'yang', nums: [3,9,6] },
  '立春': { type: 'yang', nums: [8,5,2] },
  '雨水': { type: 'yang', nums: [9,6,3] },
  '惊蛰': { type: 'yang', nums: [1,7,4] },
  '春分': { type: 'yang', nums: [3,9,6] },
  '清明': { type: 'yang', nums: [4,1,7] },
  '谷雨': { type: 'yang', nums: [5,2,8] },
  '立夏': { type: 'yang', nums: [4,1,7] },
  '小满': { type: 'yang', nums: [5,2,8] },
  '芒种': { type: 'yang', nums: [6,3,9] },
  '夏至': { type: 'yin', nums: [9,3,6] },
  '小暑': { type: 'yin', nums: [8,2,5] },
  '大暑': { type: 'yin', nums: [7,1,4] },
  '立秋': { type: 'yin', nums: [2,5,8] },
  '处暑': { type: 'yin', nums: [1,4,7] },
  '白露': { type: 'yin', nums: [9,3,6] },
  '秋分': { type: 'yin', nums: [7,1,4] },
  '寒露': { type: 'yin', nums: [6,9,3] },
  '霜降': { type: 'yin', nums: [5,8,2] },
  '立冬': { type: 'yin', nums: [6,9,3] },
  '小雪': { type: 'yin', nums: [5,8,2] },
  '大雪': { type: 'yin', nums: [4,7,1] }
};

// 三奇六仪
const SANQI_LIUYI = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];

// 九星（按洛书数）
const STAR_ORIGIN = {
  '1': '天蓬', '2': '天芮', '3': '天冲', '4': '天辅',
  '5': '天禽', '6': '天心', '7': '天柱', '8': '天任', '9': '天英'
};

// 八门（按洛书数）
const DOOR_ORIGIN = {
  '1': '休门', '2': '死门', '3': '伤门', '4': '杜门',
  '5': '', '6': '开门', '7': '惊门', '8': '生门', '9': '景门'
};

// 八神
const SHEN_ARR = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];

// 环宫顺序（转盘顺时针）：巽4,离9,坤2,兑7,乾6,坎1,艮8,震3
const CIRCLE = ['4','9','2','7','6','1','8','3'];

// 洛书九宫顺序（阳遁顺排）：1,2,3,4,5,6,7,8,9
const LUOSHU_ORDER = ['1','2','3','4','5','6','7','8','9'];

// 天干序号
const GAN_INDEX = {'甲':0,'乙':1,'丙':2,'丁':3,'戊':4,'己':5,'庚':6,'辛':7,'壬':8,'癸':9};
const GAN_ELEMENT = { '甲': 'mu', '乙': 'mu', '丙': 'huo', '丁': 'huo', '戊': 'tu', '己': 'tu', '庚': 'jin', '辛': 'jin', '壬': 'shui', '癸': 'shui' };

// 地支序号
const ZHI_INDEX = {'子':0,'丑':1,'寅':2,'卯':3,'辰':4,'巳':5,'午':6,'未':7,'申':8,'酉':9,'戌':10,'亥':11};

// 五鼠遁：根据日干确定子时的天干
const WU_SHU_DUN = {
  '甲': '甲', '己': '甲',
  '乙': '丙', '庚': '丙',
  '丙': '戊', '辛': '戊',
  '丁': '庚', '壬': '庚',
  '戊': '壬', '癸': '壬'
};

// 旬首遁仪映射
const XUNSHOU_MAP = {
  '甲子':'戊','甲戌':'己','甲申':'庚','甲午':'辛','甲辰':'壬','甲寅':'癸'
};

// 空亡映射
const KONGWANG_MAP = {
  '甲子':['戌','亥'],'甲戌':['申','酉'],'甲申':['午','未'],
  '甲午':['辰','巳'],'甲辰':['寅','卯'],'甲寅':['子','丑']
};

// ========== 九宫、九星、八门、八神信息（保留原有数据结构） ==========

export const JIU_GONG = {
  '1': { name: '坎', direction: '正北', element: 'shui', color: '#03A9F4', yinyang: '阴' },
  '2': { name: '坤', direction: '西南', element: 'tu', color: '#795548', yinyang: '阴' },
  '3': { name: '震', direction: '正东', element: 'mu', color: '#4CAF50', yinyang: '阳' },
  '4': { name: '巽', direction: '东南', element: 'mu', color: '#4CAF50', yinyang: '阳' },
  '5': { name: '中', direction: '中宫', element: 'tu', color: '#795548', yinyang: '阴阳' },
  '6': { name: '乾', direction: '西北', element: 'jin', color: '#FF9800', yinyang: '阳' },
  '7': { name: '兑', direction: '正西', element: 'jin', color: '#FF9800', yinyang: '阴' },
  '8': { name: '艮', direction: '东北', element: 'tu', color: '#795548', yinyang: '阳' },
  '9': { name: '离', direction: '正南', element: 'huo', color: '#F44336', yinyang: '阳' }
};

export const JIU_XING = {
  '天蓬': { alias: '贪狼', element: 'shui', type: 'xiong', color: '#03A9F4', feature: '胆大妄为，大智慧大冒险，主风险、欲望、机变。' },
  '天芮': { alias: '巨门', element: 'tu', type: 'xiong', color: '#795548', feature: '主疾病、学习、容纳、问题所在，需先查隐患。' },
  '天冲': { alias: '禄存', element: 'mu', type: 'ci_ji', color: '#4CAF50', feature: '主冲击、变化、快速，宜快不宜慢。' },
  '天辅': { alias: '文曲', element: 'mu', type: 'da_ji', color: '#4CAF50', feature: '文曲星，利教育、文化、辅佐、方案。' },
  '天禽': { alias: '廉贞', element: 'tu', type: 'da_ji', color: '#795548', feature: '元帅之星，主核心、忠诚、枢纽、厚德。' },
  '天心': { alias: '武曲', element: 'jin', type: 'da_ji', color: '#FF9800', feature: '主判断、管理、医疗、策划、决策。' },
  '天柱': { alias: '破军', element: 'jin', type: 'xiong', color: '#FF9800', feature: '主口舌、压力、破坏、独当一面。' },
  '天任': { alias: '左辅', element: 'tu', type: 'ji', color: '#795548', feature: '主稳重、责任、承载、务实、长期积累。' },
  '天英': { alias: '右弼', element: 'huo', type: 'xiong', color: '#F44336', feature: '主急躁、血光，也主文化、名声、曝光。' }
};

export const BA_MEN = {
  '休门': { feature: '为吉门，主休养、安宁、平和。适合休息与调养。', type: 'ji', element: 'shui', color: '#03A9F4' },
  '生门': { feature: '为吉门，主生发、成长、喜庆。适合开始新事物。', type: 'ji', element: 'mu', color: '#4CAF50' },
  '伤门': { feature: '为凶门，主伤害、损失、疾病。需避免冲突与伤害。', type: 'xiong', element: 'mu', color: '#4CAF50' },
  '杜门': { feature: '为凶门，主阻塞、停滞、困难。事情易受阻碍。', type: 'xiong', element: 'tu', color: '#795548' },
  '景门': { feature: '为吉门，主光明、展示、明亮。适合公开场合与展示。', type: 'ji', element: 'huo', color: '#F44336' },
  '死门': { feature: '为凶门，主衰败、结束、死亡。不宜开始重要事情。', type: 'xiong', element: 'tu', color: '#795548' },
  '惊门': { feature: '为凶门，主惊吓、变故、突发状况。需注意意外变化。', type: 'xiong', element: 'jin', color: '#FF9800' },
  '开门': { feature: '为吉门，主通达、顺畅、开始。万事顺利，有好的开端。', type: 'ji', element: 'jin', color: '#FF9800' }
};

export const BA_SHEN = {
  '值符': { feature: '为贵神，主吉庆、贵人、福星。', type: 'ji' },
  '螣蛇': { feature: '为凶神，主口舌是非、波动起伏。', type: 'xiong' },
  '太阴': { feature: '为吉神，主柔和、隐藏、内敛。', type: 'ji' },
  '六合': { feature: '为吉神，主和谐、团结、合作。', type: 'ji' },
  '白虎': { feature: '为凶神，主凶猛、伤害、灾祸。', type: 'xiong' },
  '玄武': { feature: '为凶神，主隐秘、盗窃、欺诈。', type: 'xiong' },
  '九地': { feature: '为吉神，主地利、丰收、稳固。', type: 'ji' },
  '九天': { feature: '为吉神，主高升、贵人、成功。', type: 'ji' }
};

// ========== 核心算法函数 ==========

// 获取日干支在六十甲子中的序号
function getDayGanZhiIndex(date) {
  const baseDate = new Date(1900, 0, 31);
  const baseIndex = 40; // 甲辰
  const diffDays = Math.floor((date - baseDate) / (24 * 60 * 60 * 1000));
  return ((baseIndex + diffDays) % 60 + 60) % 60;
}

// 根据日干和时辰计算时柱（五鼠遁）
function getTimeGanZhi(date) {
  try {
    const lunar = Lunar.fromDate(date);
    if (lunar.getTimeInGanZhi) return lunar.getTimeInGanZhi();
    const dayGanZhi = lunar.getDayInGanZhiExact ? lunar.getDayInGanZhiExact() : lunar.getDayInGanZhi();
    const dayGan = dayGanZhi[0];
    const hour = date.getHours();
    // 时辰序号：0=子(23-1), 1=丑(1-3), ..., 11=亥(21-23)
    let zhiIndex;
    if (hour === 23) {
      zhiIndex = 0;
    } else {
      zhiIndex = Math.floor((hour + 1) / 2);
    }
    const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][zhiIndex];
    const ziGan = WU_SHU_DUN[dayGan];
    const ganIndex = GAN_INDEX[ziGan];
    const timeGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'][(ganIndex + zhiIndex) % 10];
    return timeGan + zhi;
  } catch (e) {
    console.error('获取时柱出错:', e);
    return '甲子';
  }
}

// 获取旬首
function getXunShouByGanZhi(ganZhi) {
  const idx = LIUSHI_JIAZI.indexOf(ganZhi);
  const xunIdx = Math.floor(idx / 10) * 10;
  return LIUSHI_JIAZI[xunIdx];
}

// 获取旬首遁仪
function getXunShouDunYi(ganZhi) {
  const xunShou = getXunShouByGanZhi(ganZhi);
  return XUNSHOU_MAP[xunShou];
}

// 拆补法定元
function getYuanChaibu(date) {
  const dayIndex = getDayGanZhiIndex(date);
  return Math.floor(dayIndex / 5) % 3;
}

// 茅山法定元
function getYuanMaoshan(date, jieQiDate) {
  const diffMs = date.getTime() - jieQiDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.min(Math.floor(diffDays / 5), 2);
}

function solarToDate(solar) {
  return new Date(
    solar.getYear(),
    solar.getMonth() - 1,
    solar.getDay(),
    solar.getHour ? solar.getHour() : 0,
    solar.getMinute ? solar.getMinute() : 0,
    solar.getSecond ? solar.getSecond() : 0
  );
}

function isSameSolarDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// 计算局数
function calculateJuShu(date, method, qijuMethod) {
  const lunar = Lunar.fromDate(date);
  let jieQiName;
  let prevJieQi = null;
  let nextJieQi = null;
  if (method === '时家' || method === '日家') {
    // 时家起局必须精确到节气交接时刻，不能把当天尚未到来的节气提前计入。
    prevJieQi = lunar.getPrevJieQi(false);
    nextJieQi = lunar.getNextJieQi(false);
    jieQiName = prevJieQi.getName();
  } else if (method === '月家') {
    jieQiName = lunar.getJieQiList()[lunar.getMonth() * 2].getName();
  } else if (method === '年家') {
    const year = lunar.getYear();
    const liChun = Lunar.fromYmd(year, 2, 4).getPrevJieQi(true);
    jieQiName = liChun.getName();
  }

  const info = JIEQI_JUSHU[jieQiName];
  if (!info) {
    return { jieQiName: jieQiName, type: 'yang', number: '1', yuan: '上元', yuanIndex: 0, fullName: '阳遁1局 (上元)', formatCode: 'yang-1', qijuMethod };
  }

  let jieQiDate = null;
  if (method === '时家' || method === '日家') {
    const jieQiSolar = (prevJieQi || lunar.getPrevJieQi(false)).getSolar();
    jieQiDate = solarToDate(jieQiSolar);
  }

  let yuan;
  if (qijuMethod === '拆补法') {
    yuan = getYuanChaibu(date);
  } else {
    yuan = jieQiDate ? getYuanMaoshan(date, jieQiDate) : 0;
    if (nextJieQi) {
      const nextJieQiDate = solarToDate(nextJieQi.getSolar());
      if (date < nextJieQiDate && isSameSolarDay(date, nextJieQiDate)) {
        yuan = 0;
      }
    }
  }

  const juNumber = info.nums[yuan];

  return {
    jieQiName: jieQiName,
    type: info.type,
    number: juNumber.toString(),
    yuan: ['上元', '中元', '下元'][yuan],
    yuanIndex: yuan,
    fullName: `${info.type === 'yin' ? '阴遁' : '阳遁'}${juNumber}局 (${['上元', '中元', '下元'][yuan]})`,
    formatCode: `${info.type}-${juNumber}`,
    qijuMethod: qijuMethod
  };
}

// 排地盘
function getDiPan(type, num) {
  const result = {};
  const startGong = num.toString();
  const startIdx = LUOSHU_ORDER.indexOf(startGong);

  for (let i = 0; i < 9; i++) {
    let gongIdx;
    if (type === 'yang') {
      gongIdx = (startIdx + i) % 9;
    } else {
      gongIdx = (startIdx - i + 9) % 9;
    }
    const gong = LUOSHU_ORDER[gongIdx];
    result[gong] = SANQI_LIUYI[i];
  }
  return result;
}

// 环宫中的位置
function getCircleIndex(gong) {
  return CIRCLE.indexOf(gong);
}

// 旋转数组
function arrayRotate(arr, steps) {
  steps = ((steps % arr.length) + arr.length) % arr.length;
  return arr.slice(steps).concat(arr.slice(0, steps));
}

function uniqueGans(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildDisplayPans(diPan, tianPan) {
  const displayDiPan = { ...diPan };
  const displayTianPan = { ...tianPan };
  const ganVariants = {};

  for (const gong of LUOSHU_ORDER) {
    ganVariants[gong] = {
      tianGanList: tianPan[gong] ? [tianPan[gong]] : [],
      diGanList: diPan[gong] ? [diPan[gong]] : []
    };
  }

  const middleDiGan = diPan['5'];
  if (middleDiGan) {
    const tianGanList = uniqueGans([tianPan['2'], middleDiGan]);
    const diGanList = uniqueGans([middleDiGan, diPan['2']]);
    displayTianPan['2'] = tianGanList.join('、');
    displayDiPan['2'] = diGanList.join('、');
    displayTianPan['5'] = '';
    displayDiPan['5'] = '';
    ganVariants['2'] = { tianGanList, diGanList };
    ganVariants['5'] = { tianGanList: [], diGanList: [] };
  }

  return { displayDiPan, displayTianPan, ganVariants };
}

function getGeJuItemScore(item) {
  if (!item) return 0;
  if (item.tendency === 'da_ji') return 3;
  if (item.tendency === 'ji') return 2;
  if (item.tendency === 'xiong') return -2;
  return 0;
}

function mergeVariantGeJu(primary, variants) {
  const mergedItems = [...(primary.items || [])];
  let extraScore = 0;
  const seen = new Set(mergedItems.map(item => `${item.type}-${item.combo || ''}-${item.name}`));

  for (const variant of variants) {
    for (const item of variant.items || []) {
      if (!['keying', 'ganCombo', 'ganPair', 'jixing', 'rumu'].includes(item.type)) continue;
      const key = `${item.type}-${item.combo || ''}-${item.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      mergedItems.push({ ...item, fromMiddlePalace: true });
      extraScore += getGeJuItemScore(item);
    }
  }

  return {
    ...primary,
    items: mergedItems,
    score: primary.score + extraScore,
    names: mergedItems.map(item => item.name),
    summary: mergedItems.length
      ? mergedItems.map(item => `${item.name}：${item.meaning}`).join(' ')
      : '暂无明显特殊格局，按星门神和天地盘基础关系判断。'
  };
}

// 计算天盘
function distributeTianPan(diPan, xunShouDunYi, shiGan) {
  let zhiFuGong = null;
  for (const g in diPan) {
    if (diPan[g] === xunShouDunYi && g !== '5') {
      zhiFuGong = g;
      break;
    }
  }
  if (!zhiFuGong) zhiFuGong = '2';

  let shiGanGong = null;
  for (const g in diPan) {
    if (diPan[g] === shiGan && g !== '5') {
      shiGanGong = g;
      break;
    }
  }
  if (!shiGanGong) shiGanGong = zhiFuGong;

  const zhiFuIdx = getCircleIndex(zhiFuGong);
  const shiGanIdx = getCircleIndex(shiGanGong);
  let offset = (zhiFuIdx - shiGanIdx + 8) % 8;

  const result = {};
  const circleGans = CIRCLE.map(g => diPan[g]);
  const rotatedGans = arrayRotate(circleGans, offset);

  for (let i = 0; i < 8; i++) {
    result[CIRCLE[i]] = rotatedGans[i];
  }
  result['5'] = result['2'];

  return result;
}

// 计算九星
function distributeJiuXing(diPan, xunShouDunYi, shiGan) {
  let zhiFuOriginGong = null;
  for (const g in diPan) {
    if (diPan[g] === xunShouDunYi && g !== '5') {
      zhiFuOriginGong = g;
      break;
    }
  }
  if (!zhiFuOriginGong) zhiFuOriginGong = '2';

  let zhiFuLuoGong = null;
  for (const g in diPan) {
    if (diPan[g] === shiGan && g !== '5') {
      zhiFuLuoGong = g;
      break;
    }
  }
  if (!zhiFuLuoGong) zhiFuLuoGong = zhiFuOriginGong;

  const originIdx = getCircleIndex(zhiFuOriginGong);
  const luoIdx = getCircleIndex(zhiFuLuoGong);
  let offset = (originIdx - luoIdx + 8) % 8;

  const jiuXing = {};
  const circleStars = CIRCLE.map(g => STAR_ORIGIN[g]);
  const rotatedStars = arrayRotate(circleStars, offset);

  for (let i = 0; i < 8; i++) {
    jiuXing[CIRCLE[i]] = rotatedStars[i];
  }

  const midGong = '2';
  if (jiuXing[midGong]) {
    jiuXing[midGong] = '天禽、' + jiuXing[midGong];
  } else {
    jiuXing[midGong] = '天禽';
  }
  jiuXing['5'] = '';

  return {
    zhiFuGong: zhiFuOriginGong,
    zhiFuLuoGong: zhiFuLuoGong,
    zhiFuXing: STAR_ORIGIN[zhiFuOriginGong],
    jiuXing
  };
}

// 计算八门
function distributeBaMen(zhiFuGong, shiGan, diPan, type, date) {
  const zhiShiMen = DOOR_ORIGIN[zhiFuGong] || '';

  const timeGanZhi = getTimeGanZhi(date || new Date());
  const xunShou = getXunShouByGanZhi(timeGanZhi);
  const hourZhi = timeGanZhi[1];
  const xunShouZhi = xunShou[1];
  const timeOffset = ((ZHI_INDEX[hourZhi] - ZHI_INDEX[xunShouZhi]) % 12 + 12) % 12;

  let zhiShiLuoGongIdx = LUOSHU_ORDER.indexOf(zhiFuGong);
  if (type === 'yang') {
    zhiShiLuoGongIdx = (zhiShiLuoGongIdx + timeOffset) % 9;
  } else {
    zhiShiLuoGongIdx = (zhiShiLuoGongIdx - timeOffset + 9) % 9;
  }
  let zhiShiLuoGong = LUOSHU_ORDER[zhiShiLuoGongIdx];
  if (zhiShiLuoGong === '5') zhiShiLuoGong = '2';
  const zhiShiCircleIdx = getCircleIndex(zhiShiLuoGong);

  const baMen = {};
  const circleDoors = CIRCLE.map(g => DOOR_ORIGIN[g]);
  const originDoorIdx = circleDoors.indexOf(zhiShiMen);
  const offset = (originDoorIdx - zhiShiCircleIdx + 8) % 8;
  const rotatedDoors = arrayRotate(circleDoors, offset);

  for (let i = 0; i < 8; i++) {
    baMen[CIRCLE[i]] = rotatedDoors[i];
  }
  baMen['5'] = '';

  return {
    zhiShiGong: zhiShiLuoGong,
    zhiShiMen,
    baMen
  };
}

// 计算八神
function distributeBaShen(zhiFuGong, type) {
  const result = {};
  const zhiFuGongIdx = getCircleIndex(zhiFuGong);

  for (let i = 0; i < 8; i++) {
    const gongIdx = type === 'yang'
      ? (zhiFuGongIdx + i) % 8
      : (zhiFuGongIdx - i + 8) % 8;
    result[CIRCLE[gongIdx]] = SHEN_ARR[i];
  }
  result['5'] = '';

  return result;
}

// ========== 辅助函数 ==========

function getMaStar(date, method) {
  let zhi = '';
  if (method === '时家') {
    zhi = getTimeGanZhi(date).substring(1);
  } else if (method === '日家') {
    const lunar = Lunar.fromDate(date);
    zhi = lunar.getDayZhi();
  } else if (method === '月家') {
    const lunar = Lunar.fromDate(date);
    zhi = lunar.getMonthZhi();
  } else if (method === '年家') {
    const lunar = Lunar.fromDate(date);
    zhi = lunar.getYearZhi();
  }

  let maZhi = '';
  if (['寅', '午', '戌'].includes(zhi)) {
    maZhi = '申';
  } else if (['申', '子', '辰'].includes(zhi)) {
    maZhi = '寅';
  } else if (['巳', '酉', '丑'].includes(zhi)) {
    maZhi = '亥';
  } else if (['亥', '卯', '未'].includes(zhi)) {
    maZhi = '巳';
  }

  const zhiToGong = {
    '子': '1', '丑': '8', '寅': '8', '卯': '3',
    '辰': '4', '巳': '4', '午': '9', '未': '2',
    '申': '2', '酉': '7', '戌': '6', '亥': '6'
  };

  return { zhi: maZhi, gong: zhiToGong[maZhi] || '' };
}

export function getKongWang(date, method) {
  try {
    let ganZhi = '';
    if (method === '时家') {
      ganZhi = getTimeGanZhi(date);
    } else if (method === '日家') {
      const lunar = Lunar.fromDate(date);
      ganZhi = lunar.getDayInGanZhi();
    } else if (method === '月家') {
      const lunar = Lunar.fromDate(date);
      ganZhi = lunar.getMonthInGanZhi();
    } else if (method === '年家') {
      const lunar = Lunar.fromDate(date);
      ganZhi = lunar.getYearInGanZhi();
    }
    const xunShou = getXunShouByGanZhi(ganZhi);
    return KONGWANG_MAP[xunShou] || [];
  } catch (e) {
    console.error('获取空亡地支出错:', e);
    return [];
  }
}

export function getKongWangGong(kongWangZhi) {
  const zhiToGong = {
    '子': '1', '丑': '8', '寅': '8', '卯': '3',
    '辰': '4', '巳': '4', '午': '9', '未': '2',
    '申': '2', '酉': '7', '戌': '6', '亥': '6'
  };
  return kongWangZhi.map(zhi => zhiToGong[zhi]).filter(gong => gong);
}

function calculateAnGan(baMen, diPan, type, zhiShiGong, shiGan) {
  const anGan = {};
  const gongOrder = LUOSHU_ORDER;
  const startGong = zhiShiGong || '1';
  const startGan = shiGan || '戊';
  const startPos = gongOrder.indexOf(startGong);
  const startGanIdx = SANQI_LIUYI.indexOf(startGan);
  const safeStartPos = startPos >= 0 ? startPos : 0;
  const safeStartGanIdx = startGanIdx >= 0 ? startGanIdx : 0;

  anGan[startGong] = startGan;
  for (let i = 1; i < 9; i++) {
    const gongIdx = type === 'yin'
      ? (safeStartPos - i + 9) % 9
      : (safeStartPos + i) % 9;
    const gong = gongOrder[gongIdx];
    const ganIdx = (safeStartGanIdx + i) % 9;
    anGan[gong] = SANQI_LIUYI[ganIdx];
  }
  return anGan;
}

function getElementRelation(fromElement, toElement) {
  if (!fromElement || !toElement) return 'unknown';
  if (fromElement === toElement) return 'same';
  const generates = { mu: 'huo', huo: 'tu', tu: 'jin', jin: 'shui', shui: 'mu' };
  const controls = { mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin', jin: 'mu' };
  if (generates[fromElement] === toElement) return 'sheng';
  if (generates[toElement] === fromElement) return 'beSheng';
  if (controls[fromElement] === toElement) return 'ke';
  if (controls[toElement] === fromElement) return 'beKe';
  return 'unknown';
}

function getSeasonElement(date) {
  try {
    const zhi = Lunar.fromDate(date).getMonthZhi();
    if (['寅', '卯', '辰'].includes(zhi)) return 'mu';
    if (['巳', '午', '未'].includes(zhi)) return 'huo';
    if (['申', '酉', '戌'].includes(zhi)) return 'jin';
    if (['亥', '子', '丑'].includes(zhi)) return 'shui';
  } catch (e) {
    console.warn('获取旺衰月令失败:', e);
  }
  return '';
}

export function getWangShuai(element, palaceElement, date) {
  const seasonElement = getSeasonElement(date);
  if (!element || !seasonElement) {
    return { level: 'unknown', score: 0, text: '月令不明，旺衰只作辅助。' };
  }

  const generates = { mu: 'huo', huo: 'tu', tu: 'jin', jin: 'shui', shui: 'mu' };
  const controls = { mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin', jin: 'mu' };
  const elementName = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' };

  const relationScore = (from, to) => {
    if (!from || !to) return 0;
    if (from === to) return 2;
    if (generates[to] === from) return 1;
    if (generates[from] === to) return 0;
    if (controls[to] === from) return -2;
    if (controls[from] === to) return -1;
    return 0;
  };
  const seasonScore = relationScore(element, seasonElement);
  const palaceScore = relationScore(element, palaceElement);
  const score = Math.max(-3, Math.min(3, Math.round(palaceScore * 0.65 + seasonScore * 0.35)));
  const level = score >= 2 ? 'wang' : score === 1 ? 'xiang' : score === 0 ? 'ping' : score === -1 ? 'qiu' : 'si';
  const textMap = {
    wang: '旺，象意明显，现实反馈更容易显现。',
    xiang: '相，有助力，但仍需条件承接。',
    ping: '平，需结合格局和用神再断。',
    qiu: '囚，能动但阻力较重。',
    si: '衰，象意受压，推进成本偏高。'
  };
  return {
    level,
    score,
    text: `${elementName[element]}在${elementName[palaceElement] || '本宫'}宫、逢${elementName[seasonElement]}月令，综合为${textMap[level]}`
  };
}

const PURPOSE_RULES = {
  '综合': {
    title: '综合局势',
    palaceHints: ['1', '5', '6', '9'],
    doors: ['开门', '生门', '休门'],
    stars: ['天心', '天辅', '天任', '天英'],
    gods: ['值符', '六合', '太阴', '九天'],
    advice: '以值符、值使、日干与时干为主线，先看整体顺逆，再决定进退。',
    verifyWindow: '3-7天先看第一反馈，复杂事项延长到15-30天。',
    realitySignals: ['明确回应', '阻力来源', '可执行机会']
  },
  '事业': {
    title: '事业推进',
    palaceHints: ['6', '9', '1', '3'],
    doors: ['开门', '景门', '生门'],
    stars: ['天心', '天英', '天辅', '天冲'],
    gods: ['值符', '九天', '六合'],
    advice: '事业以开门、值符、乾宫与离宫为重点，重视领导、公开表现和执行节奏。',
    verifyWindow: '3-7天看沟通反馈，15-30天看流程或岗位变化。',
    realitySignals: ['上级反馈', '流程推进', '公开展示', '岗位窗口']
  },
  '财运': {
    title: '财务收益',
    palaceHints: ['8', '6', '7', '1'],
    doors: ['生门', '开门', '休门'],
    stars: ['天任', '天心', '天辅'],
    gods: ['九地', '六合', '太阴'],
    advice: '财运以生门、戊己财星和资金流动宫位为重点，稳健优先，忌冲动追高。',
    verifyWindow: '短线3-7天看波动和消息兑现，回款类看15-30天。',
    realitySignals: ['现金流', '合同条款', '价格波动', '回款节点']
  },
  '婚姻': {
    title: '感情关系',
    palaceHints: ['2', '7', '4', '9'],
    doors: ['休门', '生门', '开门'],
    stars: ['天辅', '天任', '天心'],
    gods: ['六合', '太阴', '值符'],
    advice: '感情以六合、乙庚、双方落宫和沟通状态为主，先看关系是否有合象。',
    verifyWindow: '3-7天看回应态度，15天内看关系是否缓和或反复。',
    realitySignals: ['沟通意愿', '关系缓和', '第三方干扰', '现实压力']
  },
  '健康': {
    title: '健康调养',
    palaceHints: ['2', '8', '1', '9'],
    doors: ['休门', '生门'],
    stars: ['天芮', '天任', '天心'],
    gods: ['太阴', '九地'],
    advice: '健康以天芮、死伤门、坤艮土宫和休养之象为主，只作调养提醒，不替代诊疗。',
    verifyWindow: '1-7天看症状变化，必要时立即做正规检查。',
    realitySignals: ['症状变化', '睡眠饮食', '检查结果', '恢复速度']
  },
  '学业': {
    title: '学习考试',
    palaceHints: ['4', '9', '3', '1'],
    doors: ['景门', '开门', '休门'],
    stars: ['天辅', '天英', '天心'],
    gods: ['值符', '九天', '太阴'],
    advice: '学业以天辅、景门、文书宫和专注状态为主，重在复盘、表达和节奏。',
    verifyWindow: '7天看执行状态，15-30天看模拟成绩和错题变化。',
    realitySignals: ['专注时长', '错题减少', '表达反馈', '模拟成绩']
  }
};

const PALACE_REALITY = {
  '1': '坎宫落到现实里多看流动、隐伏、资金周转、信息暗线和情绪压力。',
  '2': '坤宫落到现实里多看承载关系、家庭后勤、长期资源、女性长辈或稳定条件。',
  '3': '震宫落到现实里多看启动、行动、突发变化、争执和快速推进。',
  '4': '巽宫落到现实里多看文书、传播、方案、谈判、学习和柔性策略。',
  '5': '中宫落到现实里多看自身核心状态、全局压力和中转节点，需结合寄宫再断。',
  '6': '乾宫落到现实里多看领导、规则、授权、高层资源、父辈与刚性制度。',
  '7': '兑宫落到现实里多看口舌、谈判、合同、兑现、收益出口和表达方式。',
  '8': '艮宫落到现实里多看门槛、停止、积累、不动产、沉淀和卡点。',
  '9': '离宫落到现实里多看曝光、名声、证照、考试、展示和公开表现。'
};

const PALACE_NATURE = {
  '1': { label: '坎宫', keywords: '波折、变化、曲折、忧患', summary: '事情多有流动和暗线，容易先不明朗，再慢慢显形。', implication: '先查隐患、资金流和真实反馈，不急着把口头消息当结论。' },
  '2': { label: '坤宫', keywords: '包容、杂乱、问题多、慢', summary: '事情承载面宽，但杂项多，推进节奏偏慢。', implication: '先整理条件、责任和后勤资源，避免被琐事拖住。' },
  '3': { label: '震宫', keywords: '突发、大起大落、启动', summary: '事情启动性强，常见突然变化或先动后乱。', implication: '适合小步试探，忌情绪化硬冲。' },
  '4': { label: '巽宫', keywords: '犹豫、徘徊、左右摇摆', summary: '事情容易进退不定，信息、方案或态度反复。', implication: '先统一口径和边界，再谈推进。' },
  '5': { label: '中宫', keywords: '核心、压力、中转', summary: '事情落在全局枢纽，常代表压力集中或多方牵连。', implication: '不宜孤立单断，需结合寄宫、日干、值符值使。' },
  '6': { label: '乾宫', keywords: '事大、重要、心高、规则', summary: '事情规格较高，常牵涉权力、规则或关键负责人。', implication: '先确认授权、规则和决策人，避免越级或硬碰硬。' },
  '7': { label: '兑宫', keywords: '口舌、破坏、意外、兑现', summary: '事情多落在表达、谈判、兑现和破损处。', implication: '先管住话术、合同和承诺，防口舌及临时变更。' },
  '8': { label: '艮宫', keywords: '停滞、慢、等待、诚信', summary: '事情偏慢，容易卡在门槛、资格或固定条件上。', implication: '适合守成和补条件，不宜频繁变招。' },
  '9': { label: '离宫', keywords: '轰烈、虎头蛇尾、有始无终', summary: '事情显眼、热度高，但容易先热后散。', implication: '先确认后续承接，不被表面声势带偏。' }
};

const PURPOSE_METHODS = {
  '综合': '先定一个具体问题，再以值符、值使、日干、时干为主线，所有宫位只作辅助验证。',
  '事业': '事业盘先看开门和值符，再看乾宫领导规则、离宫公开表现、值使执行路径。',
  '财运': '财运盘先看生门和资金干，再看合同通道、现金流、退出条件和玄武空亡的信息风险。',
  '婚姻': '感情盘先看六合、乙庚双方落宫，再看休门沟通、玄武隐情和杜死门阻隔。',
  '健康': '健康盘只做风险提醒，先看天芮、死伤门、坤艮土宫和恢复条件，不能替代医疗诊断。',
  '学业': '学业盘先看天辅、景门、巽离文书表达，再用错题、模拟成绩和专注时长验证。'
};

function analyzeGong(gongNumber, jiuXing, baMen, baShen) {
  const gongStr = gongNumber.toString();
  const xing = jiuXing[gongStr] || '';
  const men = baMen[gongStr] || '';
  const shen = baShen[gongStr] || '';

  const gongInfo = JIU_GONG[gongStr] || {};
  const xingInfo = xing ? JIU_XING[xing.replace('天禽、', '')] || JIU_XING[xing] || {} : {};
  const menInfo = men ? BA_MEN[men] || {} : {};
  const shenInfo = shen ? BA_SHEN[shen] || {} : {};

  let jiXiongScore = 0;

  if (men && menInfo.type === 'ji') jiXiongScore += 2;
  if (men && menInfo.type === 'xiong') jiXiongScore -= 2;
  if (shen && shenInfo.type === 'ji') jiXiongScore += 3;
  if (shen && shenInfo.type === 'xiong') jiXiongScore -= 3;
  if (xingInfo.type === 'da_ji') jiXiongScore += 2;
  else if (xingInfo.type === 'ji' || xingInfo.type === 'ci_ji') jiXiongScore += 1;
  else if (xingInfo.type === 'xiong') jiXiongScore -= 1;

  const doorElement = menInfo.element || '';
  const palaceElement = gongInfo.element || '';
  const doorRelation = getElementRelation(doorElement, palaceElement);
  if (doorRelation === 'same' || doorRelation === 'sheng') jiXiongScore += 1;
  if (doorRelation === 'beKe') jiXiongScore -= 1;

  const jiXiong =
    jiXiongScore >= 3 ? 'da_ji'
      : jiXiongScore >= 1 ? 'xiao_ji'
        : jiXiongScore === 0 ? 'ping'
          : jiXiongScore >= -2 ? 'xiao_xiong'
            : 'da_xiong';

  return {
    gongNumber: gongStr,
    gongName: gongInfo.name || '',
    direction: gongInfo.direction || '',
    element: gongInfo.element || '',
    xing,
    xingAlias: xingInfo.alias || '',
    xingFeature: xingInfo.feature || '',
    men,
    menFeature: menInfo.feature || '',
    shen,
    shenFeature: shenInfo.feature || '',
    relation: doorRelation,
    score: jiXiongScore,
    jiXiong,
    jiXiongText: {
      da_ji: '大吉', xiao_ji: '小吉', ping: '平', xiao_xiong: '小凶', da_xiong: '大凶'
    }[jiXiong],
    explain: generateGongExplanation(gongStr, gongInfo, xing, xingInfo, men, menInfo, shen, shenInfo, jiXiong, doorRelation)
  };
}

function getJiXiongByScore(score) {
  if (score >= 5) return 'da_ji';
  if (score >= 2) return 'xiao_ji';
  if (score >= -1) return 'ping';
  if (score >= -4) return 'xiao_xiong';
  return 'da_xiong';
}

const RELATION_LABEL = {
  same: '比和',
  sheng: '我生彼',
  beSheng: '彼生我',
  ke: '我克彼',
  beKe: '彼克我',
  unknown: '关系不明'
};

function formatRelation(subject, object, relation) {
  const relationText = {
    same: `${subject}与${object}同气，力量可互相承接。`,
    sheng: `${subject}生${object}，${subject}的力量外泄去成就${object}。`,
    beSheng: `${object}生${subject}，${subject}得到承接。`,
    ke: `${subject}克${object}，主动压制强，易有冲突。`,
    beKe: `${object}克${subject}，${subject}受制，推进成本高。`,
    unknown: `${subject}与${object}关系不明，先看其他信号。`
  };
  return relationText[relation] || relationText.unknown;
}

function buildHostGuest(tianGan, diGan) {
  const relation = getElementRelation(GAN_ELEMENT[tianGan], GAN_ELEMENT[diGan]);
  const verdict = {
    same: '主客同气，双方条件接近。',
    sheng: '天盘生地盘，客生主，利主守成。',
    beSheng: '地盘生天盘，主生客，利客推进。',
    ke: '天盘克地盘，客压主，外力较强。',
    beKe: '地盘克天盘，主制客，守方较有力。',
    unknown: '主客关系不足，先看星门神。'
  };
  return {
    tianGan,
    diGan,
    relation,
    label: RELATION_LABEL[relation] || RELATION_LABEL.unknown,
    verdict: verdict[relation] || verdict.unknown,
    text: tianGan && diGan
      ? `天盘${tianGan}为客，地盘${diGan}为主。${verdict[relation] || verdict.unknown}`
      : '天地盘干不全，主客只作辅助。'
  };
}

function hasGejuType(geju, type) {
  return Boolean((geju?.items || []).some((item) => item.type === type));
}

function buildFourHarms(geju, isKongWang) {
  const configs = [
    ['kongwang', '空亡', 80, '虚、迟、落空，本宫信息只作低权重参考。', '先补现实证据，避免只凭承诺推进。'],
    ['rumu', '入墓', 80, '力量被藏住或困住，有力也难直接发挥。', '先找被卡住的人、钱、流程或文件。'],
    ['jixing', '击刑', 50, '矛盾别扭，容易内耗、受伤或反复。', '先降冲突，修正姿态和细节。'],
    ['menpo', '门迫', 50, '门克宫，行动拆自己的台，易急躁内斗。', '先缓一步，换路径，不宜硬推。']
  ];
  return configs.map(([type, label, lossPercent, meaning, action]) => ({
    type,
    label,
    lossPercent,
    active: type === 'kongwang' ? Boolean(isKongWang || hasGejuType(geju, type)) : hasGejuType(geju, type),
    meaning,
    action
  }));
}

function buildInnerOuter(gong, juType, fuYinFanYin) {
  const yangInner = ['1', '8', '3', '4'];
  const yinInner = ['9', '2', '7', '6'];
  const innerSet = juType === 'yin' ? yinInner : yangInner;
  const scope = gong === '5' ? 'center' : innerSet.includes(gong) ? 'inner' : 'outer';
  const hasFu = Boolean(fuYinFanYin?.starFu?.[gong] || fuYinFanYin?.menFu?.[gong]);
  const hasFan = Boolean(fuYinFanYin?.starFan?.[gong] || fuYinFanYin?.menFan?.[gong]);
  const baseText = scope === 'center'
    ? '中宫为枢纽，远近快慢需结合寄宫和用神。'
    : scope === 'inner'
      ? '内盘，事情较近，反馈相对快。'
      : '外盘，事情较远，反馈相对慢。';
  const rhythm = hasFu ? '伏吟，近而慢，迟滞重复。' : hasFan ? '反吟，远而快，变化反复。' : '未见本宫明显伏吟反吟。';
  return {
    scope,
    scopeText: scope === 'center' ? '中宫' : scope === 'inner' ? '内盘' : '外盘',
    hasFu,
    hasFan,
    rhythm,
    text: `${baseText}${rhythm}`
  };
}

function buildSinglePalaceAnalysis(base, context, geju, duxiang, wangShuai, tianGan, diGan, anGan, starElement, doorElement) {
  const gong = base.gongNumber;
  const palaceNature = PALACE_NATURE[gong] || { label: `${base.gongName}宫`, keywords: '宫性不明', summary: PALACE_REALITY[gong] || '先结合星门神断。', implication: '先看本宫可验证信号。' };
  const starRelation = getElementRelation(starElement, base.element);
  const doorRelation = getElementRelation(doorElement, base.element);
  const hostGuest = buildHostGuest(tianGan, diGan);
  const fourHarms = buildFourHarms(geju, context.kongWangGong?.includes(gong));
  const activeHarms = fourHarms.filter((item) => item.active);
  const innerOuter = buildInnerOuter(gong, context.juShuType, context.fuYinFanYin);
  const fuYinFanYin = {
    hasFu: innerOuter.hasFu,
    hasFan: innerOuter.hasFan,
    type: context.fuYinFanYin?.type || 'normal',
    text: innerOuter.rhythm
  };
  const transferHint = (context.kongWangGong?.includes(gong) || innerOuter.hasFu)
    ? '本宫逢空或伏吟时，当前信息需降权；本轮先提示需转宫参考，不强行重算转宫。'
    : '';
  const prioritySummary = [
    `宫性：${palaceNature.keywords}`,
    activeHarms.length ? `四害：${activeHarms.map((item) => item.label).join('、')}` : '四害：未见明显触发',
    hostGuest.verdict
  ];

  return {
    palaceNature,
    verticalLayers: [
      { key: 'god', label: '神定性', value: base.shen || '无', text: base.shen ? `${base.shen}定事件底色。${base.shenFeature || ''}` : '本宫无八神信息。' },
      { key: 'star', label: '星定势', value: base.xing || '无', text: base.xing ? `${base.xing}看天时、环境与资源。${base.xingFeature || ''}` : '本宫无九星信息。' },
      { key: 'door', label: '门定行', value: base.men || '无', text: base.men ? `${base.men}看行动入口。${base.menFeature || ''}` : '本宫无八门信息。' },
      { key: 'gan', label: '干定事', value: [tianGan, diGan].filter(Boolean).join('加') || '无', text: anGan ? `天盘${tianGan || '-'}、地盘${diGan || '-'}，暗干${anGan}补看隐藏动机。` : `天盘${tianGan || '-'}、地盘${diGan || '-'}。` }
    ],
    relations: {
      starToPalace: { relation: starRelation, text: formatRelation(`九星${base.xing || ''}`, `${base.gongName}宫`, starRelation) },
      doorToPalace: { relation: doorRelation, text: formatRelation(`八门${base.men || ''}`, `${base.gongName}宫`, doorRelation) },
      hostGuest
    },
    fourHarms,
    prosperity: {
      level: wangShuai?.level || 'unknown',
      text: wangShuai?.text || '旺衰不明，先看格局与现实反馈。',
      note: '本轮按当前可验证的星门五行、落宫和月令综合提示；完整十二长生转宫表后续再接入。'
    },
    innerOuter,
    fuYinFanYin,
    transferHint,
    prioritySummary,
    steps: [
      { label: '宫性打底', text: `${palaceNature.label}主${palaceNature.keywords}。${palaceNature.summary}${palaceNature.implication}` },
      { label: '神定性', text: base.shen ? `${base.shen}定底色。${base.shenFeature || '先看外部助阻和人事状态。'}` : '本宫无八神信息。' },
      { label: '星定势', text: base.xing ? `${base.xing}看环境与资源。${base.xingFeature || '再看天时趋势。'}` : '本宫无九星信息。' },
      { label: '门定行', text: base.men ? `${base.men}看行动入口。${base.menFeature || '再看现实路径。'}` : '本宫无八门信息。' },
      { label: '干定事', text: `天盘${tianGan || '-'}为客，地盘${diGan || '-'}为主${anGan ? `，暗干${anGan}看隐藏信息` : ''}。` },
      { label: '生克量化', text: `${formatRelation(`九星${base.xing || ''}`, `${base.gongName}宫`, starRelation)}${formatRelation(`八门${base.men || ''}`, `${base.gongName}宫`, doorRelation)}${hostGuest.text}` },
      { label: '四害排查', text: activeHarms.length ? activeHarms.map((item) => `${item.label}减${item.lossPercent}%：${item.meaning}${item.action}`).join(' ') : '未见空亡、入墓、击刑、门迫明显触发，仍需结合用神验证。' },
      { label: '旺衰定级', text: `${wangShuai?.text || '旺衰不明。'}${activeHarms.length ? ` 四害已触发${activeHarms.length}项，需降低本宫权重。` : ''}` },
      { label: '远近定速', text: `${innerOuter.text}${transferHint ? ` ${transferHint}` : ''}` }
    ]
  };
}

function analyzeGongByGeJu(gongNumber, jiuXing, baMen, baShen, context) {
  const gong = gongNumber.toString();
  const base = analyzeGong(gongNumber, jiuXing, baMen, baShen);
  const rawTianGan = context.tianPan?.[gong] || '';
  const rawDiGan = context.diPan?.[gong] || '';
  const tianGan = context.displayTianPan?.[gong] ?? rawTianGan;
  const diGan = context.displayDiPan?.[gong] ?? rawDiGan;
  const tianGanList = context.ganVariants?.[gong]?.tianGanList?.length ? context.ganVariants[gong].tianGanList : (rawTianGan ? [rawTianGan] : []);
  const diGanList = context.ganVariants?.[gong]?.diGanList?.length ? context.ganVariants[gong].diGanList : (rawDiGan ? [rawDiGan] : []);
  const anGan = context.anGan?.[gong] || '';
  const starElement = JIU_XING[base.xing.replace('天禽、', '')]?.element || JIU_XING[base.xing]?.element || '';
  const doorElement = BA_MEN[base.men]?.element || '';
  const wangShuai = getWangShuai(starElement || doorElement || base.element, base.element, context.date);
  const isRiGan = Boolean(context.riGan && tianGanList.includes(context.riGan));
  const isShiGan = Boolean(context.shiGan && tianGanList.includes(context.shiGan));
  const isNianMing = Boolean(context.nianMing && tianGanList.includes(context.nianMing));
  const gejuInput = {
    gong,
    star: base.xing,
    door: base.men,
    god: base.shen,
    doorRelation: base.relation,
    tianGan: tianGanList[0] || rawTianGan,
    diGan: diGanList[0] || rawDiGan,
    anGan,
    isKongWang: context.kongWangGong?.includes(gong),
    isMaStar: context.maStar?.gong === gong,
    isZhiFu: gong === context.zhiFuGong,
    isZhiShi: gong === context.zhiShiGong,
    isRiGan,
    isShiGan,
    isNianMing
  };
  const primaryGeju = analyzeGeJu(gejuInput);
  const variantGeju = tianGanList.slice(1).map((gan, index) => analyzeGeJu({
    ...gejuInput,
    tianGan: gan,
    diGan: diGanList[index + 1] || diGanList[index] || rawDiGan,
    isRiGan: Boolean(context.riGan && context.riGan === gan),
    isShiGan: Boolean(context.shiGan && context.shiGan === gan),
    isNianMing: Boolean(context.nianMing && context.nianMing === gan)
  }));
  const geju = mergeVariantGeJu(primaryGeju, variantGeju);
  const duxiang = readXiang({
    gong,
    star: base.xing,
    door: base.men,
    god: base.shen,
    tianGan,
    diGan,
    rawTianGan,
    rawDiGan,
    tianGanList,
    diGanList,
    anGan,
    doorRelation: base.relation,
    wangShuai,
    purpose: context.purpose,
    geju,
    riGan: context.riGan,
    shiGan: context.shiGan,
    nianMing: context.nianMing
  });
  const singlePalaceAnalysis = buildSinglePalaceAnalysis(base, context, geju, duxiang, wangShuai, tianGan, diGan, anGan, starElement, doorElement);
  const score = base.score + geju.score + wangShuai.score;
  const jiXiong = getJiXiongByScore(score);
  const jiXiongText = {
    da_ji: '大吉', xiao_ji: '小吉', ping: '平', xiao_xiong: '小凶', da_xiong: '大凶'
  }[jiXiong];

  return {
    ...base,
    tianGan,
    diGan,
    rawTianGan,
    rawDiGan,
    tianGanList,
    diGanList,
    anGan,
    isRiGan,
    isShiGan,
    isNianMing,
    fuYinFanYin: context.fuYinFanYin,
    wangShuai,
    singlePalaceAnalysis,
    geju,
    duxiang,
    score,
    jiXiong,
    jiXiongText,
    explain: `${base.explain} ${duxiang.summary}`
  };
}

function generateGongExplanation(gongStr, gongInfo, xing, xingInfo, men, menInfo, shen, shenInfo, jiXiong, doorRelation) {
  const gongExplain = {
    '1': '坎宫主水，常看流动、风险、资金周转、隐伏信息。',
    '2': '坤宫主土，常看关系承载、家庭、女性长辈、稳定资源。',
    '3': '震宫主木，常看启动、行动、变化、突发推进。',
    '4': '巽宫主木，常看文书、传播、沟通、女性与柔性策略。',
    '5': '中宫为枢纽，常看自身核心状态、全局压力与中转。',
    '6': '乾宫主金，常看领导、规则、权力、父辈与高层资源。',
    '7': '兑宫主金，常看口舌、谈判、合同、少女与收益兑现。',
    '8': '艮宫主土，常看停止、门槛、积累、少男与不动产。',
    '9': '离宫主火，常看名声、曝光、证照、眼目与公开表现。'
  };

  const relationText = {
    same: '门与宫五行同气，事情有落地基础。',
    sheng: '门生宫，外部条件对该宫有助力。',
    beSheng: '宫生门，容易消耗自身资源去成就此事。',
    ke: '门克宫，动作较强，宜主动但要防过激。',
    beKe: '宫克门，阻力较重，推进成本偏高。',
    unknown: ''
  }[doorRelation] || '';

  let explanation = gongExplain[gongStr] || '此宫位信息缺失。';
  if (xing) explanation += ` ${xing}${xingInfo.alias ? '(' + xingInfo.alias + ')' : ''}临宫，${xingInfo.feature || '主该类星象之事'}。`;
  if (men) explanation += ` ${men}临宫，${menInfo.feature || '需结合所问事项判断'}。`;
  if (shen) explanation += ` ${shen}临宫，${shenInfo.feature || '体现神盘助阻'}。`;
  if (relationText) explanation += ` ${relationText}`;

  switch (jiXiong) {
    case 'da_ji': explanation += ' 星门神多同向为吉，可作为优先方位或优先策略。'; break;
    case 'xiao_ji': explanation += ' 吉象较多但仍有条件限制，宜稳步推进。'; break;
    case 'ping': explanation += ' 吉凶参半，需看用神和现实条件后再定进退。'; break;
    case 'xiao_xiong': explanation += ' 阻力较明显，宜先处理风险，再谈推进。'; break;
    case 'da_xiong': explanation += ' 凶象集中，不宜强行启动重要事项。'; break;
  }
  return explanation.replace(/。{2,}/g, '。');
}

function getPurposeFit(gong, analysis, context) {
  const rule = PURPOSE_RULES[context.purpose] || PURPOSE_RULES['综合'];
  let fit = 0;
  if (rule.palaceHints.includes(gong)) fit += 1;
  if (rule.doors.includes(analysis.men)) fit += 2;
  if (rule.stars.some(s => analysis.xing.includes(s))) fit += 1;
  if (rule.gods.includes(analysis.shen)) fit += 1;
  return fit;
}

function getDisplayLevel(confidence) {
  if (confidence >= 72) return { value: 'strong', label: '强参考', tone: '盘内信号集中，可作为重点观察宫。' };
  if (confidence >= 58) return { value: 'medium', label: '中参考', tone: '盘内信号可用，但需要现实反馈确认。' };
  return { value: 'weak', label: '弱参考', tone: '盘内信号分散，只适合作辅助观察。' };
}

function uniqueLimit(items, limit) {
  return [...new Set(items.filter(Boolean).map(item => item.replace(/。{2,}/g, '。').trim()))].slice(0, limit);
}

function getGanGeju(analysis) {
  return (analysis.geju?.items || []).find(item => item.type === 'keying' || item.type === 'ganCombo') || null;
}

function formatGanGejuLine(item) {
  if (!item) return '';
  const prefix = item.type === 'keying' ? '十干克应' : '天地盘格局';
  const combo = item.combo ? `${item.combo}，` : '';
  return `${prefix}：${combo}${item.name}，${item.meaning || '需结合现实验证。'}${item.action ? ` 建议：${item.action}` : ''}`;
}

function buildCoreVerdict(decision, analysis, rule, confidenceText) {
  const doorText = analysis.men ? `以${analysis.men}定行动入口` : '先定行动入口';
  const godText = analysis.shen ? `${analysis.shen}定心理与外部变量` : '再看心理与外部变量';
  const ganGeju = getGanGeju(analysis);
  const gejuText = ganGeju
    ? `此宫先看${ganGeju.combo || `${analysis.tianGan || '-'}加${analysis.diGan || '-'}`}，${ganGeju.name}主${ganGeju.meaning}`
    : (analysis.geju?.names?.length ? `关键看${analysis.geju.names.slice(0, 2).join('、')}` : `${rule.title}按用神和现实反馈落地`);
  return `${decision}。按“${rule.title}”取象，${doorText}，${godText}，${gejuText}，当前为${confidenceText}。`;
}

function buildPredictionDisplay(gong, analysis, context, {
  confidence,
  confidenceText,
  decision,
  rule,
  evidence,
  risks,
  actions,
  checks,
  palaceReality,
  method,
  observationSentence,
  accuracyNote
}) {
  const level = getDisplayLevel(confidence);
  const roleLines = uniqueLimit([
    analysis.isRiGan ? '本宫为日干宫，代表求测人自身状态、承接能力和主观选择。' : '',
    analysis.isShiGan ? '本宫为时干宫，代表所测之事的当前状态和客观走势。' : '',
    analysis.isNianMing ? '本宫为年命宫，代表个人根基、长期承受力和惯性模式。' : '',
    gong === context.zhiFuGong ? '本宫为值符落宫，先看战略、大势、主导力是否支持。' : '',
    gong === context.zhiShiGong ? '本宫为值使落宫，先看执行路径、流程门路和推进过程。' : ''
  ], 5);
  const ganGeju = getGanGeju(analysis);
  const gejuPriority = ['jiudun', 'keying', 'ganCombo', 'starDoorGe', 'fuyin', 'fanyin', 'menpo', 'jixing', 'rumu', 'kongwang', 'maxing', 'angan', 'yongshen', 'zhifu', 'zhishi'];
  const gejuLines = uniqueLimit((analysis.geju?.items || [])
    .slice()
    .sort((a, b) => gejuPriority.indexOf(a.type) - gejuPriority.indexOf(b.type))
    .map(item => {
      if (item.type === 'keying' || item.type === 'ganCombo') return formatGanGejuLine(item);
      const prefix = item.type === 'jiudun' ? '九遁' :
        item.type === 'starDoorGe' ? '星门格' :
        item.type === 'fuyin' || item.type === 'fanyin' ? '伏吟反吟' :
        item.type === 'menpo' ? '门宫关系' :
        item.type === 'jixing' ? '击刑' :
        item.type === 'rumu' ? '入墓' :
        item.type === 'kongwang' ? '空亡' :
        item.type === 'maxing' ? '驿马' :
        item.type === 'angan' ? '暗干' :
        item.type === 'yongshen' ? '用神' : '格局';
      return `${prefix}：${item.name}，${item.meaning || item.action || '需结合现实验证。'}`;
    }), 4);
  const signalLines = uniqueLimit([
    analysis.wangShuai?.text ? `旺衰：${analysis.wangShuai.text}` : '',
    (analysis.doorRelation || analysis.relation) ? (analysis.duxiang?.lines || []).find(line => line.includes('门迫') || line.includes('宫制') || line.includes('门和') || line.includes('比和')) : '',
    analysis.shen ? `心理/外力：${analysis.shen}主${analysis.shenFeature || '人事底色'}。` : '',
    analysis.xing ? `环境：${analysis.xing}主${analysis.xingFeature || '趋势场'}。` : '',
    analysis.men ? `行动：${analysis.men}主${analysis.menFeature || '现实入口'}。` : '',
    analysis.anGan ? `暗干：${analysis.anGan}提示台面下的动机、备选路径或隐藏变量。` : ''
  ], 4);

  const keyEvidence = uniqueLimit([
    ...gejuLines.filter(line => line.startsWith('九遁') || line.startsWith('十干克应') || line.startsWith('天地盘格局')),
    ...roleLines,
    ...gejuLines.filter(line => !line.startsWith('九遁') && !line.startsWith('十干克应') && !line.startsWith('天地盘格局')),
    ...evidence,
    ...signalLines
  ], 3);
  const actionPoints = uniqueLimit([
    `${rule.title}：${rule.advice}`,
    ...actions,
    ...risks.map(item => `先防：${item}`)
  ], 2);
  const verifyPoints = uniqueLimit(checks, 2);
  return {
    displayLevel: level.value,
    displayLabel: level.label,
    displayTone: level.tone,
    coreVerdict: buildCoreVerdict(decision, analysis, rule, confidenceText),
    keyEvidence,
    actionPoints,
    verifyPoints,
    expertDetails: {
      roles: roleLines,
      palaceReality,
      geju: gejuLines,
      ganGeju,
      ganGejuText: formatGanGejuLine(ganGeju),
      duxiang: analysis.duxiang?.lines || [],
      inference: analysis.duxiang?.inference || [],
      method,
      observation: `${observationSentence} ${accuracyNote}`,
      wangShuai: analysis.wangShuai?.text || '',
      anGan: analysis.anGan ? `暗干${analysis.anGan}：看隐藏动机、备选方案和未公开变量。` : '',
      gan: `天盘${analysis.tianGan || '-'}加地盘${analysis.diGan || '-'}，看表层行动与底层条件如何组合成具体格局。`
    }
  };
}

function buildPalacePrediction(gong, analysis, context) {
  const rule = PURPOSE_RULES[context.purpose] || PURPOSE_RULES['综合'];
  const evidence = [...(analysis.duxiang?.lines || [])];
  const risks = [];
  const actions = [...(analysis.geju?.actions || [])];
  const checks = [];
  const confidenceFactors = [];
  let confidence = 46;
  confidenceFactors.push({ label: '基础参考', value: 46, desc: '先以读象完整度为基础，再按用神、格局、旺衰和值符值使修正。' });

  const fit = getPurposeFit(gong, analysis, context);
  const fitDelta = fit * 6;
  const scoreDelta = Math.max(-16, Math.min(16, analysis.score * 3));
  const gejuDelta = Math.max(-14, Math.min(14, (analysis.geju?.score || 0) * 3));
  const wangDelta = (analysis.wangShuai?.score || 0) * 3;
  confidence += fitDelta;
  confidence += scoreDelta;
  confidence += gejuDelta;
  confidence += wangDelta;
  confidenceFactors.push({ label: '用神匹配', value: fitDelta, desc: `与“${rule.title}”匹配度为${fit}，用神越贴合，越能进入重点观察。` });
  confidenceFactors.push({ label: '读象合参', value: scoreDelta, desc: `本宫星、门、神、宫位与旺衰合参分为${analysis.score}。` });
  confidenceFactors.push({ label: '格局修正', value: gejuDelta, desc: analysis.geju?.names?.length ? `特殊格局：${analysis.geju.names.join('、')}。` : '未见明显特殊格局，按普通星门神象意判断。' });
  confidenceFactors.push({ label: '旺衰修正', value: wangDelta, desc: analysis.wangShuai?.text || '旺衰不明，暂不修正。' });

  if (gong === context.zhiFuGong) {
    evidence.push('本宫为值符落宫，代表全局主导力量，权重较高。');
    confidence += 8;
    confidenceFactors.push({ label: '值符权重', value: 8, desc: '值符代表全局主导力量，落本宫时提高参考权重。' });
  }
  if (gong === context.zhiShiGong) {
    evidence.push('本宫为值使落宫，代表事情执行路径与门路。');
    confidence += 8;
    confidenceFactors.push({ label: '值使权重', value: 8, desc: '值使代表事情门路和执行路径，落本宫时提高行动参考。' });
  }
  if (context.kongWangGong?.includes(gong)) {
    evidence.push('本宫逢空亡，事情容易落空、延迟或条件不实。');
    risks.push('关键承诺需复核，不宜只凭口头信息推进。');
    confidence -= 10;
    confidenceFactors.push({ label: '空亡扣分', value: -10, desc: '空亡主虚、迟、落空，核心宫逢空不能轻易进入高置信。' });
  }
  if (context.maStar?.gong === gong) {
    evidence.push('本宫临驿马，主变动、出行、转移、快速推进。');
    actions.push('若需要推进，可考虑通过移动、拜访、换渠道来打开局面。');
    checks.push('观察是否出现临时移动、拜访、改期、换渠道或外部催动。');
    confidence += 4;
    confidenceFactors.push({ label: '驿马动象', value: 4, desc: '驿马提示变化和外部催动，适合观察行动是否被触发。' });
  }

  if (analysis.tianGan || analysis.diGan) {
    evidence.push(`天盘${analysis.tianGan || '-'}加地盘${analysis.diGan || '-'}，先看显性动作能否落到原有基础上。`);
  }
  if (analysis.duxiang?.inference?.length) evidence.push(...analysis.duxiang.inference);

  if (fit >= 3) evidence.push(`与“${rule.title}”的用神匹配度较高，可重点参考。`);
  else if (fit === 0) risks.push(`本宫不是“${rule.title}”的主要用神宫，适合作辅助信息，不宜单独定论。`);

  if (['伤门', '杜门', '死门', '惊门'].includes(analysis.men)) {
    risks.push(`${analysis.men}临宫，先防阻滞、损耗、口舌或突发变化。`);
    checks.push('验证窗口内若先出现拖延、争执、损耗或突发变化，应降低推进强度。');
  }
  if (['白虎', '玄武', '螣蛇'].includes(analysis.shen)) {
    risks.push(`${analysis.shen}临宫，需防伤害、隐瞒、反复或虚惊。`);
    checks.push('重点核对信息来源、合同细节、身体安全或对方真实态度。');
  }
  if (analysis.geju?.items?.some(item => item.tendency === 'xiong')) {
    risks.push(`本宫见${analysis.geju.items.filter(item => item.tendency === 'xiong').map(item => item.name).slice(0, 3).join('、')}，要先化解结构性阻力。`);
  }

  if (['开门', '生门', '休门'].includes(analysis.men)) {
    actions.push(`${analysis.men}为可用之门，适合从沟通、启动、修复或资源整合处入手。`);
    checks.push('若现实反馈出现明确回应、资源到位或关系缓和，可视作盘面吉象被验证。');
  }
  if (analysis.jiXiong === 'da_ji' || analysis.jiXiong === 'xiao_ji') {
    actions.push('可小步推进，并设置复盘节点，观察现实反馈是否与盘面一致。');
  } else if (analysis.jiXiong === 'ping') {
    actions.push('宜先收集证据、确认条件，再决定是否投入资源。');
  } else {
    actions.push('宜暂缓重大决策，优先化解风险、补足信息或换时间再测。');
  }

  if (context.purpose === '事业') {
    actions.push('事业类问题优先看上级态度、流程门槛、公开表达和可交付成果。');
    checks.push('3-7天内观察是否有上级反馈、流程推进、岗位信息或公开展示机会。');
  }
  if (context.purpose === '财运') {
    actions.push('财运类问题优先控制仓位、现金流和合同细节，不以单盘替代投资判断。');
    checks.push('先核对回款、合同、价格波动和退出条件，再判断收益信号是否落地。');
  }
  if (context.purpose === '婚姻') {
    actions.push('感情类问题优先验证沟通意愿、第三方干扰和双方现实压力。');
    checks.push('观察对方是否愿意回应、关系是否缓和，以及隐瞒或冷处理是否减少。');
  }
  if (context.purpose === '健康') {
    actions.push('健康类问题只作调养提醒；如有不适，应以正规医疗检查为准。');
    checks.push('以睡眠、饮食、症状变化和正规检查为验证，不用盘面替代诊断。');
  }
  if (context.purpose === '学业') {
    actions.push('学业类问题优先调整复习计划、表达训练和错题复盘。');
    checks.push('用一周内的专注时长、错题减少、模拟成绩或表达反馈来复盘。');
  }
  if (context.purpose === '综合') {
    checks.push('先设一个明确观察窗口，记录现实中最先出现的反馈、阻力和可执行机会。');
  }

  if (!context.question) confidence -= 8;
  if (analysis.geju?.items?.some(item => ['kongwang', 'fanyin', 'rumu'].includes(item.type))) confidence -= 5;
  const hasCoreSignal = fit >= 2 || gong === context.zhiFuGong || gong === context.zhiShiGong;
  const cap = hasCoreSignal && context.question ? 88 : 76;
  confidence = Math.max(35, Math.min(cap, Math.round(confidence)));
  const confidenceText = confidence >= 72 ? '较高' : confidence >= 58 ? '中等' : '偏低';
  const decision =
    confidence >= 72 && (analysis.jiXiong === 'da_ji' || analysis.jiXiong === 'xiao_ji')
      ? '可以小步推进'
      : confidence >= 58 && !analysis.jiXiong.includes('xiong')
        ? '先验证再推进'
        : '暂缓或换路径';
  const observation = (rule.realitySignals || []).map(signal => `观察“${signal}”是否在验证窗口内出现。`);
  const palaceReality = PALACE_REALITY[gong] || '此宫现实取象需结合所问事项、星门神和用神综合判断。';
  const method = [
    PURPOSE_METHODS[context.purpose] || PURPOSE_METHODS['综合'],
    analysis.duxiang?.inference?.slice(0, 2).join(' '),
    analysis.geju?.names?.length ? `格局优先看${analysis.geju.names.slice(0, 3).join('、')}。` : ''
  ].filter(Boolean).join(' ');
  const observationSentence = `验证时先看${rule.realitySignals?.slice(0, 2).join('、') || '现实反馈'}，再看本宫风险是否先出现。`;
  const accuracyNote = confidence >= 72
    ? '盘内信号较集中，可以作为重点观察宫，但仍需按验证窗口复盘。'
    : confidence >= 58
      ? '盘内信号有参考价值，建议先拿现实反馈校验后再扩大行动。'
      : '盘内信号不够集中，不宜用本宫单独下结论。';
  const display = buildPredictionDisplay(gong, analysis, context, {
    confidence,
    confidenceText,
    decision,
    rule,
    evidence,
    risks,
    actions,
    checks: [...checks, ...observation],
    palaceReality,
    method,
    observationSentence,
    accuracyNote
  });

  return {
    purposeTitle: rule.title,
    purposeFit: fit,
    confidence,
    confidenceText,
    confidenceFactors,
    ...display,
    method,
    palaceReality,
    gejuSummary: analysis.geju?.summary || '',
    duxiangSummary: analysis.duxiang?.summary || '',
    inference: analysis.duxiang?.inference || [],
    observationSentence,
    accuracyNote,
    evidence: [...new Set(evidence)].slice(0, 7),
    risks: risks.slice(0, 3),
    actions: [...new Set(actions)].slice(0, 5),
    checks: [...new Set([...checks, ...observation])].slice(0, 5),
    decision,
    verifyWindow: rule.verifyWindow,
    predictionSummary: `${rule.title}：${decision}。${analysis.geju?.names?.length ? `本宫先看${analysis.geju.names.slice(0, 2).join('、')}，` : ''}${rule.advice}`
  };
}

function enhanceGongPredictions(jiuGongAnalysis, context) {
  const enhanced = {};
  for (const gong in jiuGongAnalysis) {
    enhanced[gong] = {
      ...jiuGongAnalysis[gong],
      prediction: buildPalacePrediction(gong, jiuGongAnalysis[gong], context)
    };
  }
  return enhanced;
}

function findGongByGan(jiuGongAnalysis, gan) {
  if (!gan) return null;
  for (const gong in jiuGongAnalysis) {
    if (gong !== '5' && (jiuGongAnalysis[gong]?.tianGanList || [jiuGongAnalysis[gong]?.tianGan]).includes(gan)) return gong;
  }
  return null;
}

function relationAnalysis(fromName, toName, rel, mode) {
  const label = RELATION_LABEL[rel] || RELATION_LABEL.unknown || '关系不明';
  const maps = mode === 'personThing'
    ? {
        sheng: '人能推动事，主动有利，但也会费力。',
        beSheng: '事来推人，过程较被动，容易被现实牵着走。',
        ke: '人克事，自己有主动权，但要防压力过大。',
        beKe: '事克人，事情超出当前承接能力，宜暂缓或换路径。',
        same: '人与事同气，顺势而为较稳。'
      }
    : {
        sheng: '前者支持后者，目标与执行有承接。',
        beSheng: '后者反向补前者，执行能反哺目标。',
        ke: '前者压制后者，目标强但执行受压。',
        beKe: '后者制约前者，执行路径偏离目标。',
        same: '两者同气，协同度较高。'
      };
  return `${fromName}与${toName}为${label}：${maps[rel] || '关系不明，需结合现实反馈。'}`;
}

function relationMeta(rel, mode) {
  const strategy = {
    sheng: { label: '前者生后者', plainMeaning: '目标支持执行', action: '可以推进，但要确认执行资源不要被消耗过度。' },
    beSheng: { label: '后者生前者', plainMeaning: '执行反哺目标', action: '先从执行反馈里找机会，再回推目标是否要调整。' },
    ke: { label: '前者克后者', plainMeaning: '目标压制执行', action: '先降任务强度，确认人手、预算和流程是否承接得住。' },
    beKe: { label: '后者克前者', plainMeaning: '执行制约目标', action: '先查执行路径是否跑偏，必要时换入口。' },
    same: { label: '同气', plainMeaning: '目标与执行同向', action: '按既定节奏推进，并保留复盘节点。' }
  };
  const personThing = {
    sheng: { label: '我生对方', plainMeaning: '人推事', action: '可以主动推进，但不要一次投入过满。' },
    beSheng: { label: '对方生我', plainMeaning: '事推人', action: '顺势接住机会，同时保留主动权。' },
    ke: { label: '我克对方', plainMeaning: '人克事', action: '你有控制力，但要防压力和成本过高。' },
    beKe: { label: '对方克我', plainMeaning: '事克人', action: '先暂缓或换路径，优先处理风险。' },
    same: { label: '同气', plainMeaning: '人与事同频', action: '顺势推进，重点看现实反馈是否持续。' }
  };
  return (mode === 'personThing' ? personThing : strategy)[rel] || {
    label: RELATION_LABEL[rel] || '关系不明',
    plainMeaning: '需要结合现实反馈',
    action: '先补证据，再下判断。'
  };
}

function uniqueGongs(gongs) {
  return [...new Set((gongs || []).filter(Boolean).map(String))];
}

function formatGongBrief(jiuGongAnalysis, gongs) {
  return uniqueGongs(gongs).map(gong => `${jiuGongAnalysis[gong]?.gongName || ''}${gong}宫`).join('、');
}

function analyzeYingQi(jiuGongAnalysis, context) {
  const results = [];
  const allGongs = Object.keys(jiuGongAnalysis);
  const wangGongs = allGongs.filter(gong => jiuGongAnalysis[gong]?.wangShuai?.level === 'wang');
  const gengGongs = allGongs.filter(gong => (jiuGongAnalysis[gong]?.tianGanList || [jiuGongAnalysis[gong]?.tianGan]).includes('庚'));
  const ruMuGongs = allGongs.filter(gong => (jiuGongAnalysis[gong]?.singlePalaceAnalysis?.fourHarms || []).some(item => item.type === 'rumu' && item.active));
  const fuGongs = allGongs.filter(gong => jiuGongAnalysis[gong]?.singlePalaceAnalysis?.fuYinFanYin?.hasFu);
  const fanGongs = allGongs.filter(gong => jiuGongAnalysis[gong]?.singlePalaceAnalysis?.fuYinFanYin?.hasFan);
  const outerGongs = allGongs.filter(gong => jiuGongAnalysis[gong]?.singlePalaceAnalysis?.innerOuter?.scope === 'outer');

  if (context.maStar?.gong || fanGongs.length) {
    const maText = context.maStar?.gong ? `驿马在${formatGongBrief(jiuGongAnalysis, [context.maStar.gong])}` : '';
    const fanText = fanGongs.length ? `反吟在${formatGongBrief(jiuGongAnalysis, fanGongs.slice(0, 3))}` : '';
    results.push({
      method: '最快反馈',
      detail: [maText, fanText].filter(Boolean).join('；') || '盘中有动象，先看突然变化。',
      action: '先观察移动、拜访、改期、换渠道、突然回复或局势反转，这些多是最早应事信号。'
    });
  }

  if (gengGongs.length || context.zhiShiGong) {
    const gengText = gengGongs.length
      ? `庚在${formatGongBrief(jiuGongAnalysis, gengGongs.slice(0, 4))}，主规则、对手、阻力或转折点。`
      : '';
    const zhiShiText = context.zhiShiGong ? `值使落${formatGongBrief(jiuGongAnalysis, [context.zhiShiGong])}，看执行过程的节点。` : '';
    results.push({
      method: '主要触发',
      detail: `${gengText}${zhiShiText}`,
      action: '把庚日、庚时、规则变化、审批反馈和执行节点作为主要触发候选，不再重复列多个庚格。'
    });
  }

  if (context.kongWangGong?.length || ruMuGongs.length || wangGongs.length) {
    const kongText = context.kongWangGong?.length ? `空亡宫${formatGongBrief(jiuGongAnalysis, context.kongWangGong)}需等填实或冲实。` : '';
    const ruMuText = ruMuGongs.length ? `入墓在${formatGongBrief(jiuGongAnalysis, ruMuGongs.slice(0, 3))}，需等冲墓或条件打开。` : '';
    const wangText = wangGongs.length ? `旺相在${formatGongBrief(jiuGongAnalysis, wangGongs.slice(0, 3))}，更容易先显象。` : '';
    results.push({
      method: '状态转换',
      detail: [kongText, ruMuText, wangText].filter(Boolean).join(' '),
      action: '空亡填实、入墓冲开、旺相当令时，再确认承诺是否落地。'
    });
  }

  if (fuGongs.length || outerGongs.length) {
    const fuText = fuGongs.length ? `伏吟在${formatGongBrief(jiuGongAnalysis, fuGongs.slice(0, 3))}，主慢、重复、内部消耗。` : '';
    const outerText = outerGongs.length ? '外盘宫较多时，事项偏远偏慢。' : '';
    results.push({
      method: '慢反馈',
      detail: [fuText, outerText].filter(Boolean).join(' '),
      action: '这类信号不适合急断，先设复盘窗口，等现实反馈稳定后再加码。'
    });
  }

  return results.slice(0, 4);
}

function analyzeMultiGong(jiuGongAnalysis, context) {
  const { riGan, shiGan, nianMing, zhiFuGong, zhiShiGong } = context;
  const riGanGong = findGongByGan(jiuGongAnalysis, riGan);
  const shiGanGong = findGongByGan(jiuGongAnalysis, shiGan);
  const nianMingGong = findGongByGan(jiuGongAnalysis, nianMing);
  const contradictions = [];

  if (zhiFuGong && zhiShiGong && jiuGongAnalysis[zhiFuGong] && jiuGongAnalysis[zhiShiGong]) {
    const zf = jiuGongAnalysis[zhiFuGong];
    const zs = jiuGongAnalysis[zhiShiGong];
    const rel = getElementRelation(zf.element, zs.element);
    const meta = relationMeta(rel, 'strategy');
    contradictions.push({
      type: '符使',
      name: '值符 vs 值使',
      detail: `值符（战略/主导）在${zf.gongName}${zhiFuGong}宫，值使（执行/门路）在${zs.gongName}${zhiShiGong}宫。`,
      relation: rel,
      relationLabel: meta.label,
      plainMeaning: meta.plainMeaning,
      action: meta.action,
      analysis: relationAnalysis('值符', '值使', rel, 'strategy')
    });
  }

  if (riGanGong && shiGanGong && jiuGongAnalysis[riGanGong] && jiuGongAnalysis[shiGanGong]) {
    const ri = jiuGongAnalysis[riGanGong];
    const shi = jiuGongAnalysis[shiGanGong];
    const rel = getElementRelation(ri.element, shi.element);
    const meta = relationMeta(rel, 'personThing');
    contradictions.push({
      type: '日时',
      name: '日干 vs 时干',
      detail: `日干（自己）在${ri.gongName}${riGanGong}宫，时干（所测之事）在${shi.gongName}${shiGanGong}宫。`,
      relation: rel,
      relationLabel: meta.label,
      plainMeaning: meta.plainMeaning,
      action: meta.action,
      analysis: relationAnalysis('日干', '时干', rel, 'personThing')
    });
  }

  if (nianMingGong && shiGanGong && jiuGongAnalysis[nianMingGong] && jiuGongAnalysis[shiGanGong]) {
    const nm = jiuGongAnalysis[nianMingGong];
    const shi = jiuGongAnalysis[shiGanGong];
    const rel = getElementRelation(nm.element, shi.element);
    const meta = relationMeta(rel, 'personThing');
    contradictions.push({
      type: '年命',
      name: '年命 vs 时干',
      detail: `年命（个人承受力）在${nm.gongName}${nianMingGong}宫，时干（所测之事）在${shi.gongName}${shiGanGong}宫。`,
      relation: rel,
      relationLabel: meta.label,
      plainMeaning: meta.plainMeaning,
      action: meta.action,
      analysis: relationAnalysis('年命', '时干', rel, 'personThing')
    });
  }

  const bestGong = Object.keys(jiuGongAnalysis).sort((a, b) => (jiuGongAnalysis[b]?.prediction?.confidence || 0) - (jiuGongAnalysis[a]?.prediction?.confidence || 0))[0];
  const bestPrediction = bestGong ? jiuGongAnalysis[bestGong]?.prediction : null;
  const bestRisk = bestGong ? (jiuGongAnalysis[bestGong]?.singlePalaceAnalysis?.fourHarms || []).find(item => item.active)?.advice : '';
  const logicChain = {
    cause: zhiFuGong ? `起因看值符${jiuGongAnalysis[zhiFuGong]?.gongName}${zhiFuGong}宫：${jiuGongAnalysis[zhiFuGong]?.duxiang?.summary || '主导力量不明。'}` : '起因宫不明。',
    process: zhiShiGong ? `经过看值使${jiuGongAnalysis[zhiShiGong]?.gongName}${zhiShiGong}宫：${jiuGongAnalysis[zhiShiGong]?.prediction?.decision || '需先验证门路。'}` : '经过宫不明。',
    result: bestGong ? `结果优先观察${jiuGongAnalysis[bestGong]?.gongName}${bestGong}宫：${jiuGongAnalysis[bestGong]?.prediction?.coreVerdict || jiuGongAnalysis[bestGong]?.prediction?.predictionSummary || '等待现实反馈。'}` : '结果宫需复盘后确认。'
  };
  const yingQi = analyzeYingQi(jiuGongAnalysis, context);
  const firstTrigger = yingQi.find(item => item.method === '主要触发') || yingQi[0];
  const primaryConflict = contradictions.find(item => item.type === '日时') || contradictions[0];
  const decisionCard = {
    mainVerdict: bestPrediction?.coreVerdict || bestPrediction?.decision || (primaryConflict ? primaryConflict.analysis : '先看盘面概览，待问题明确后再下主断。'),
    maxRisk: bestRisk || primaryConflict?.plainMeaning || '暂未见集中风险，仍需按现实反馈校验。',
    firstSignal: firstTrigger ? `${firstTrigger.method}：${firstTrigger.detail}` : '先看所问事项是否出现明确反馈。',
    yingQiCandidate: firstTrigger ? firstTrigger.action : '未形成清晰应期候选，先设3-7天观察窗口。',
    nextAction: primaryConflict?.action || bestPrediction?.actions?.[0] || '先补充问题，再按重点宫位复盘。'
  };

  return {
    keyGongs: { riGanGong, shiGanGong, nianMingGong, zhiFuGong, zhiShiGong, bestGong },
    contradictions,
    logicChain,
    yingQi,
    decisionCard,
    summary: contradictions.length
      ? `本盘重点看${contradictions.map(item => item.name).join('、')}，再以起因、经过、结果三段复盘。`
      : '本盘关键宫位关系较少，优先用值符、值使和重点宫位验证。'
  };
}

function overallAnalysis(jiuGongAnalysis, zhiFuGong, zhiShiGong, purpose, riGan, shiGan) {
  const zhiFuJiXiong = jiuGongAnalysis[zhiFuGong] ? jiuGongAnalysis[zhiFuGong].jiXiong : 'ping';
  const zhiShiJiXiong = jiuGongAnalysis[zhiShiGong] ? jiuGongAnalysis[zhiShiGong].jiXiong : 'ping';

  let overallJiXiong;
  if (zhiFuJiXiong === 'da_ji' && zhiShiJiXiong === 'da_ji') overallJiXiong = 'da_ji';
  else if (zhiFuJiXiong.includes('ji') && zhiShiJiXiong.includes('ji')) overallJiXiong = 'xiao_ji';
  else if (zhiFuJiXiong.includes('xiong') && zhiShiJiXiong.includes('xiong')) overallJiXiong = 'da_xiong';
  else if (zhiFuJiXiong.includes('xiong') || zhiShiJiXiong.includes('xiong')) overallJiXiong = 'xiao_xiong';
  else overallJiXiong = 'ping';

  let bestGong = '';
  let bestScore = -99;
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const gong in jiuGongAnalysis) {
    const analysis = jiuGongAnalysis[gong];
    let score = analysis.score || 0;
    score += (analysis.prediction?.purposeFit || 0) * 2;
    if (analysis.prediction?.confidence) {
      confidenceSum += analysis.prediction.confidence;
      confidenceCount++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestGong = gong;
    }
  }

  const rule = PURPOSE_RULES[purpose] || PURPOSE_RULES['综合'];
  const baseConfidence = confidenceCount ? Math.round(confidenceSum / confidenceCount) : 55;
  const coreConfidence = Math.round(((jiuGongAnalysis[zhiFuGong]?.prediction?.confidence || baseConfidence) + (jiuGongAnalysis[zhiShiGong]?.prediction?.confidence || baseConfidence)) / 2);
  const confidence = Math.max(38, Math.min(88, Math.round((baseConfidence + coreConfidence) / 2)));
  let confidenceLevel;
  if (confidence >= 75) confidenceLevel = '强烈';
  else if (confidence >= 60) confidenceLevel = '明显';
  else if (confidence >= 45) confidenceLevel = '参考';
  else confidenceLevel = '观望';

  const suggestions = [];
  suggestions.push(`本次按“${rule.title}”取象：${rule.advice}`);
  suggestions.push(`预测参考：${confidenceLevel}（星门神一致性、值符值使、空亡驿马与用神匹配度综合）`);

  switch (overallJiXiong) {
    case 'da_ji':
      suggestions.push('值符和值使同向偏吉，可以主动推进，但仍需保留现实校验节点。');
      break;
    case 'xiao_ji':
      suggestions.push('整体有可用之处，适合小步推进、边做边验，不宜一次性押注。');
      break;
    case 'ping':
      suggestions.push('整体吉凶参半，先收集证据、确认条件，再决定投入强度。');
      break;
    case 'xiao_xiong':
      suggestions.push('阻力信号偏多，宜守不宜攻，先处理风险和信息缺口。');
      break;
    case 'da_xiong':
      suggestions.push('核心信号偏凶，不宜强行启动重大事项，可换时间或换方案再评估。');
      break;
  }

  if (bestGong) {
    const bestGongInfo = jiuGongAnalysis[bestGong];
    suggestions.push(`当前最值得观察的宫位是${bestGongInfo.direction}方（${bestGongInfo.gongName}宫），建议优先查看该宫的依据、风险和行动建议。`);
  }

  const riGanGong = findGongByGan(jiuGongAnalysis, riGan);
  const shiGanGong = findGongByGan(jiuGongAnalysis, shiGan);
  if (riGanGong && shiGanGong) {
    const rel = getElementRelation(JIU_GONG[riGanGong]?.element || '', JIU_GONG[shiGanGong]?.element || '');
    suggestions.push(relationAnalysis(`日干宫（${jiuGongAnalysis[riGanGong]?.gongName}宫）`, `时干宫（${jiuGongAnalysis[shiGanGong]?.gongName}宫）`, rel, 'personThing'));
  }

  suggestions.push('断盘建议遵循：先定所问，再取用神；先看值符值使与日时干，再看星门神组合；最后用现实反馈校验。');

  return {
    overallJiXiong,
    overallJiXiongText: {
      da_ji: '大吉', xiao_ji: '小吉', ping: '平', xiao_xiong: '小凶', da_xiong: '大凶'
    }[overallJiXiong],
    confidence,
    confidenceText: confidence >= 70 ? '较高' : confidence >= 58 ? '中等' : '偏低',
    bestGong,
    suggestions
  };
}
export function fromLunarDate(lunarYear, lunarMonth, lunarDay, hour, isLeapMonth = false) {
  const lunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay, isLeapMonth ? 1 : 0);
  const solar = lunar.getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), hour || 0, 0, 0);
}

// ========== 主计算函数 ==========

export function calculate(date, options = {}) {
  const defaultOptions = {
    type: '四柱',
    method: '时家',
    qijuMethod: '茅山法',
    purpose: '综合',
    question: '',
    birthYear: '',
    location: '默认位置'
  };

  const opts = { ...defaultOptions, ...options };
  let nianMing = '';
  if (opts.birthYear) {
    try {
      const birthYearNumber = parseInt(opts.birthYear);
      if (birthYearNumber >= 1900 && birthYearNumber <= 2100) {
        const birthLunar = Lunar.fromDate(new Date(birthYearNumber, 6, 1));
        const birthGanZhi = birthLunar.getYearInGanZhiByLiChun
          ? birthLunar.getYearInGanZhiByLiChun()
          : (birthLunar.getYearInGanZhiExact ? birthLunar.getYearInGanZhiExact() : birthLunar.getYearInGanZhi());
        nianMing = birthGanZhi[0] || '';
      }
    } catch {
      nianMing = '';
    }
  }

  try {
    const lunar = Lunar.fromDate(date);
    const solar = Solar.fromDate(date);
    const timeGanZhi = getTimeGanZhi(date);

    const siZhu = {
      // 年柱和月柱均按真实交节时刻切换；ByLiChun 按日期切换，会在立春当日提前换年。
      year: lunar.getYearInGanZhiExact ? lunar.getYearInGanZhiExact() : (lunar.getYearInGanZhiByLiChun ? lunar.getYearInGanZhiByLiChun() : lunar.getYearInGanZhi()),
      month: lunar.getMonthInGanZhiExact ? lunar.getMonthInGanZhiExact() : lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhiExact ? lunar.getDayInGanZhiExact() : lunar.getDayInGanZhi(),
      time: timeGanZhi
    };

    const juShu = calculateJuShu(date, opts.method, opts.qijuMethod);

    const timeXunShouGanZhi = getXunShouByGanZhi(timeGanZhi);
    const xunShouDunYi = getXunShouDunYi(timeGanZhi);
    const dayGanZhi = lunar.getDayInGanZhiExact ? lunar.getDayInGanZhiExact() : lunar.getDayInGanZhi();
    const dayXunShou = getXunShouDunYi(dayGanZhi);

    const shiGan = timeGanZhi[0];

    const kongWangZhi = KONGWANG_MAP[timeXunShouGanZhi] || [];
    const kongWangGong = getKongWangGong(kongWangZhi);
    const maStar = getMaStar(date, opts.method);

    const diPan = getDiPan(juShu.type, parseInt(juShu.number));
    const tianPan = distributeTianPan(diPan, xunShouDunYi, shiGan);
    const { displayDiPan, displayTianPan, ganVariants } = buildDisplayPans(diPan, tianPan);
    const sanQiLiuYi = tianPan;
    const jiuXingResult = distributeJiuXing(diPan, xunShouDunYi, shiGan);
    const baMenResult = distributeBaMen(jiuXingResult.zhiFuGong, shiGan, diPan, juShu.type, date);
    const baShen = distributeBaShen(jiuXingResult.zhiFuLuoGong || jiuXingResult.zhiFuGong, juShu.type);
    const anGan = calculateAnGan(baMenResult.baMen, diPan, juShu.type, baMenResult.zhiShiGong, shiGan);
    const zhiFuFinalGong = jiuXingResult.zhiFuLuoGong || jiuXingResult.zhiFuGong;
    const fuYinFanYin = analyzeFuYinFanYin(jiuXingResult.jiuXing, baMenResult.baMen);

    let jiuGongAnalysis = {};
    for (let i = 1; i <= 9; i++) {
      jiuGongAnalysis[i] = analyzeGongByGeJu(i, jiuXingResult.jiuXing, baMenResult.baMen, baShen, {
        date,
        purpose: opts.purpose,
        juShuType: juShu.type,
        tianPan,
        diPan,
        displayTianPan,
        displayDiPan,
        ganVariants,
        anGan,
        zhiFuGong: zhiFuFinalGong,
        zhiShiGong: baMenResult.zhiShiGong,
        kongWangGong,
        maStar,
        riGan: siZhu.day[0],
        shiGan,
        nianMing,
        fuYinFanYin
      });
    }

    jiuGongAnalysis = enhanceGongPredictions(jiuGongAnalysis, {
      purpose: opts.purpose,
      question: opts.question,
      zhiFuGong: zhiFuFinalGong,
      zhiShiGong: baMenResult.zhiShiGong,
      kongWangGong,
      maStar,
      tianPan,
      diPan,
      displayTianPan,
      displayDiPan,
      ganVariants,
      riGan: siZhu.day[0],
      shiGan,
      nianMing
    });

    const multiGong = analyzeMultiGong(jiuGongAnalysis, {
      riGan: siZhu.day[0],
      shiGan,
      nianMing,
      zhiFuGong: zhiFuFinalGong,
      zhiShiGong: baMenResult.zhiShiGong,
      tianPan,
      diPan,
      displayTianPan,
      displayDiPan,
      ganVariants,
      kongWangGong,
      maStar,
      date
    });

    const analysis = overallAnalysis(jiuGongAnalysis, zhiFuFinalGong, baMenResult.zhiShiGong, opts.purpose, siZhu.day[0], shiGan);
    if (opts.question) {
      analysis.suggestions.unshift(`本盘围绕“${opts.question}”判断，后续复盘也应只按这个问题的现实反馈记录。`);
    } else {
      analysis.suggestions.unshift('当前未填写具体问题，建议补充“一盘一问”的事项，否则宫位建议只能作泛化参考。');
    }

    return {
      basicInfo: {
        date: solar.toFullString(),
        lunarDate: lunar.toString(),
        type: opts.type,
        method: opts.method,
        qijuMethod: opts.qijuMethod,
        purpose: opts.purpose,
        question: opts.question || '',
        birthYear: opts.birthYear || '',
        nianMing,
        location: opts.location
      },
      siZhu,
      juShu,
      xunShou: xunShouDunYi,
      dayXunShou,
      luoGongGan: shiGan,
      sanQiLiuYi,
      tianPan,
      displayTianPan,
      jiuXing: jiuXingResult.jiuXing,
      baMen: baMenResult.baMen,
      baShen,
      diPan,
      displayDiPan,
      ganVariants,
      anGan,
      zhiFuGong: zhiFuFinalGong,
      zhiFuYuanGong: jiuXingResult.zhiFuGong,
      zhiFuXing: jiuXingResult.zhiFuXing,
      zhiShiGong: baMenResult.zhiShiGong,
      zhiShiMen: baMenResult.zhiShiMen,
      kongWangZhi,
      kongWangGong,
      maStar,
      jiuGongAnalysis,
      multiGong,
      analysis
    };
  } catch (e) {
    console.error('奇门遁甲计算出错:', e);
    return {
      error: true,
      message: e.message,
      basicInfo: {
        date: date.toLocaleString(),
        type: opts.type,
        method: opts.method,
        qijuMethod: opts.qijuMethod,
        purpose: opts.purpose,
        question: opts.question || '',
        birthYear: opts.birthYear || '',
        location: opts.location
      }
    };
  }
}









