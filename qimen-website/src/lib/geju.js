const GAN_MEANING = {
  '甲': '核心、统领、主心骨',
  '乙': '文书、关系、柔性资源',
  '丙': '公开、曝光、热度',
  '丁': '细节、线索、证据',
  '戊': '资金、平台、存量资源',
  '己': '手续、承载、内部条件',
  '庚': '阻力、规则、竞争',
  '辛': '瑕疵、错误、精细压力',
  '壬': '流动、变化、外部信息',
  '癸': '隐情、暗线、未明信息'
};

const GAN_ACTION = {
  '甲': '先抓主线和决策权',
  '乙': '先梳理关系、文书和协商边界',
  '丙': '先确认公开表达、曝光节奏和热度来源',
  '丁': '先查证细节、证据和关键线索',
  '戊': '先核实资金、平台和存量资源',
  '己': '先疏通手续、流程和内部承载条件',
  '庚': '先处理规则、竞争和硬阻力',
  '辛': '先修正瑕疵、错误和精细问题',
  '壬': '先观察流动变化、外部消息和渠道转换',
  '癸': '先核对隐情、暗线和未明信息'
};

const GAN_TENDENCY = {
  '甲': 'ji',
  '乙': 'ji',
  '丙': 'ji',
  '丁': 'ji',
  '戊': 'mixed',
  '己': 'mixed',
  '庚': 'xiong',
  '辛': 'xiong',
  '壬': 'mixed',
  '癸': 'mixed'
};

const ELEMENT_RELATIONS = {
  generates: { mu: 'huo', huo: 'tu', tu: 'jin', jin: 'shui', shui: 'mu' },
  controls: { mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin', jin: 'mu' }
};

export function getElementRelation(fromElement, toElement) {
  if (!fromElement || !toElement) return 'unknown';
  if (fromElement === toElement) return 'same';
  if (ELEMENT_RELATIONS.generates[fromElement] === toElement) return 'sheng';
  if (ELEMENT_RELATIONS.generates[toElement] === fromElement) return 'beSheng';
  if (ELEMENT_RELATIONS.controls[fromElement] === toElement) return 'ke';
  if (ELEMENT_RELATIONS.controls[toElement] === fromElement) return 'beKe';
  return 'unknown';
}

const GAN_PAIR_RULES = {
  '乙庚': { name: '乙庚相合', tendency: 'mixed', meaning: '关系与规则相牵，既有合作机会，也要防被条件约束。', action: '把合作条件写清楚，先确认边界再推进。' },
  '丙辛': { name: '丙辛相合', tendency: 'mixed', meaning: '公开表现与细节问题并见，适合把隐患摊开处理。', action: '公开前先校对细节，避免因小失大。' },
  '丁壬': { name: '丁壬相合', tendency: 'ji', meaning: '细节线索与流动资源相接，利沟通、策划、证据补全。', action: '顺着线索沟通，可小步验证。' },
  '戊癸': { name: '戊癸相合', tendency: 'mixed', meaning: '资金平台与暗线信息相合，利资源整合，也要防账目不清。', action: '先核账，再谈资源整合。' },
  '甲己': { name: '甲己相合', tendency: 'ji', meaning: '核心意图与承载条件相合，利统筹、落地和长期安排。', action: '适合做整体统筹和长期安排。' },
  '乙辛': { name: '乙辛相冲', tendency: 'xiong', meaning: '文书关系遇到细节瑕疵，容易因合同、措辞或证据不足受阻。', action: '先补证据、补条款、补流程。' },
  '丙壬': { name: '丙壬相冲', tendency: 'xiong', meaning: '公开热度与流动变化相冲，容易先热后变、信息反复。', action: '避免仓促公开，先确认变化源。' },
  '丁癸': { name: '丁癸相冲', tendency: 'xiong', meaning: '线索与暗线相冲，容易有误会、遗漏或判断失真。', action: '重要信息必须二次核实。' },
  '戊庚': { name: '戊庚相冲', tendency: 'xiong', meaning: '资源遇规则阻力，常见成本上升、审批卡顿或竞争压力。', action: '先评估规则和成本，不宜硬推。' }
};

const SHI_GAN_KE_YING = {
  '戊+丙': { name: '青龙返首', tendency: 'ji', meaning: '百事吉，求财有利，谋为可成。', action: '可主动推进，尤其利求财、项目启动。' },
  '丙+戊': { name: '飞鸟跌穴', tendency: 'ji', meaning: '谋为可成，资源与机会能落到实处。', action: '适合主动出击，争取关键窗口。' },
  '乙+丙': { name: '奇仪顺遂', tendency: 'ji', meaning: '文书、关系、公开表达相互配合，凶事可解。', action: '利汇报、签约、沟通和方案发布。' },
  '丙+乙': { name: '日月并行', tendency: 'ji', meaning: '公私皆利，表达与关系相互照应。', action: '适合合作、展示、沟通协调。' },
  '丁+乙': { name: '玉女透关', tendency: 'ji', meaning: '细节清楚，关隘可破，利谈判与证据补全。', action: '从细节入手破局。' },
  '乙+丁': { name: '奇助文昌', tendency: 'ji', meaning: '文思顺畅，学习、策划、文书有利。', action: '利学习、写作、提案和文案。' },
  '庚+乙': { name: '白虎猖狂', tendency: 'xiong', meaning: '规则、压力伤及关系与文书，防争执、官非、损失。', action: '暂缓强推，先处理合同与责任边界。' },
  '乙+庚': { name: '青龙逃走', tendency: 'xiong', meaning: '关系受规则压制，容易散财、合作反复或对方退缩。', action: '守住关键资源，防对方变卦。' },
  '辛+乙': { name: '白虎猖狂', tendency: 'xiong', meaning: '细节瑕疵伤及文书关系，易有争执、损失、口舌或责任牵连。', action: '先补证据、补条款、补流程，暂缓强推。' },
  '丁+辛': { name: '朱雀入狱', tendency: 'xiong', meaning: '主官讼、失物、文书不利，信息容易出错。', action: '防合同纠纷，重要文件需备份。' },
  '辛+丁': { name: '狱神得奇', tendency: 'ji', meaning: '困境中有线索，问题可借细节翻转。', action: '坚持查证，会有转机。' },
  '丙+庚': { name: '荧入太白', tendency: 'xiong', meaning: '热度遇硬阻，局势急剧变化，易有冲突破耗。', action: '先防守，不宜主动挑衅。' },
  '庚+丙': { name: '太白入荧', tendency: 'xiong', meaning: '硬规则遇公开热度，防突发冲击和外部压力。', action: '提前预案，谨慎公开。' },
  '戊+己': { name: '贵人入狱', tendency: 'xiong', meaning: '资源被流程、手续、内部条件困住，公事不利。', action: '先疏通内部流程。' },
  '己+戊': { name: '犬遇青龙', tendency: 'xiong', meaning: '内部条件牵制大资源，防小人、流程拖延。', action: '防身边人事掣肘，信息不要过早外泄。' },
  '庚+癸': { name: '大格', tendency: 'xiong', meaning: '硬阻力叠加暗线，防破财、车险、官非和大额支出。', action: '出行与大额决策需谨慎。' },
  '癸+庚': { name: '小格', tendency: 'xiong', meaning: '暗线碰到规则，容易财物散失或手续不便。', action: '防遗失、拖延和细节漏洞。' },
  '壬+戊': { name: '小蛇化龙', tendency: 'mixed', meaning: '变动中带机会，但过程反复、耗时较长。', action: '小步慢走，不宜冒进。' },
  '癸+戊': { name: '天乙会合', tendency: 'mixed', meaning: '吉凶参半，财来财去，适合见好就收。', action: '设止盈止损点，不贪多。' }
};

const STAR_DOOR_GE = {
  '天蓬+惊门': { name: '惊蓬格', tendency: 'xiong', meaning: '主口舌、官非、盗骗、惊扰。', action: '防争执诉讼，重要事暂缓。' },
  '天蓬+死门': { name: '亡蓬格', tendency: 'xiong', meaning: '主大凶、损财、伤身，暗线风险重。', action: '不宜重大行动，先排险。' },
  '天芮+死门': { name: '病符格', tendency: 'xiong', meaning: '主病患、旧疾、旧问题加重。', action: '先检查隐患，再谈推进。' },
  '天芮+伤门': { name: '病伤格', tendency: 'xiong', meaning: '主因病致伤或伤后生患。', action: '注意安全防护，健康类及时检查。' },
  '天英+景门': { name: '文星格', tendency: 'ji', meaning: '主文书、考试、宣传、曝光有利。', action: '利公开展示、考试、发布。' },
  '天英+惊门': { name: '火惊格', tendency: 'xiong', meaning: '主因名声惹祸，公开场合易出错。', action: '谨慎公开言论，防舆论风险。' },
  '天辅+景门': { name: '文昌显耀', tendency: 'ji', meaning: '主文运、学习、表达、方案得力。', action: '利学业、提案、文书工作。' },
  '天辅+开门': { name: '文星入朝', tendency: 'ji', meaning: '主以文得职，面试、汇报、竞聘有利。', action: '利面试、竞聘、提案。' },
  '天心+开门': { name: '神医用门', tendency: 'ji', meaning: '主专业判断、管理决策、技术处理得法。', action: '适合做决策和专业推进。' },
  '天心+惊门': { name: '智破危局', tendency: 'ji', meaning: '以专业和判断化解突发危机。', action: '用专业能力破局。' },
  '天柱+惊门': { name: '双金克木', tendency: 'xiong', meaning: '主硬碰硬、口舌冲突、两败俱伤。', action: '避免正面冲突，退一步解决。' },
  '天柱+开门': { name: '金玉满堂', tendency: 'ji', meaning: '破旧立新，制度改革或项目开口可成。', action: '适合改革、重组、打开新通道。' },
  '天任+生门': { name: '厚土载物', tendency: 'ji', meaning: '长期积累见效，利不动产、稳定项目。', action: '利长期经营和稳健布局。' },
  '天任+死门': { name: '土崩格', tendency: 'xiong', meaning: '根基不稳，项目难以为继。', action: '先检查基础条件是否牢固。' },
  '天冲+伤门': { name: '双木争春', tendency: 'mixed', meaning: '竞争激烈，先到先得，也易冲动受伤。', action: '可抢先机，但要控节奏。' },
  '天冲+杜门': { name: '木阻格', tendency: 'xiong', meaning: '前进受阻，事倍功半。', action: '先找卡点，不宜强推。' }
};

const JIU_DUN = {
  tian: { name: '天遁', tendency: 'da_ji', condition: ({ tianGan, door, diGan }) => tianGan === '丙' && door === '生门' && diGan === '丁', meaning: '得天时之助，利融资、品牌升级、战略发布。', action: '可扩大展示，提升格局。' },
  di: { name: '地遁', tendency: 'da_ji', condition: ({ tianGan, door, diGan }) => tianGan === '乙' && door === '开门' && diGan === '己', meaning: '得地利之助，利固定资产、供应链、稳定布局。', action: '适合夯实根基和长期布置。' },
  ren: { name: '人遁', tendency: 'da_ji', condition: ({ tianGan, door, god }) => tianGan === '丁' && door === '休门' && god === '太阴', meaning: '得人和之助，利谈判、人事安排、私下协议。', action: '宜私下沟通，完成敏感协调。' },
  shen: { name: '神遁', tendency: 'da_ji', condition: ({ tianGan, door, god }) => tianGan === '丙' && door === '生门' && god === '九天', meaning: '得神助之势，利宣传造势、危机公关、行业峰会。', action: '可高举高打，塑造权威形象。' },
  gui: { name: '鬼遁', tendency: 'ji', condition: ({ tianGan, door, god }) => tianGan === '丁' && door === '杜门' && god === '九地', meaning: '得隐秘之利，利后台研发、秘密调查、隐性处置。', action: '适合低调处理关键事务。' },
  feng: { name: '风遁', tendency: 'ji', condition: ({ tianGan, gong, door }) => tianGan === '乙' && gong === '4' && ['开门', '休门', '生门'].includes(door), meaning: '得风势之助，利传播、公关、市场推广。', action: '借势传播，快速扩大影响。' },
  yun: { name: '云遁', tendency: 'ji', condition: ({ tianGan, diGan, door }) => tianGan === '乙' && diGan === '辛' && ['开门', '休门', '生门'].includes(door), meaning: '利隐蔽策划、长远布局，宜藏锋。', action: '低调布局，不宜张扬。' },
  long: { name: '龙遁', tendency: 'ji', condition: ({ tianGan, gong, door }) => tianGan === '乙' && gong === '1' && ['开门', '休门', '生门'].includes(door), meaning: '利潜藏、物流、贸易、暗中运作。', action: '暗中布局，等待时机。' },
  hu: { name: '虎遁', tendency: 'ji', condition: ({ tianGan, diGan, gong, door }) => (tianGan === '乙' && diGan === '辛' && gong === '8' && ['休门', '生门'].includes(door)) || (tianGan === '庚' && door === '开门' && gong === '7'), meaning: '利攻坚、竞争性行动、强势联合。', action: '适合建立权威，强势推进。' }
};

const JI_XING_GONG = { '戊': '3', '己': '2', '庚': '8', '辛': '9', '壬': '4', '癸': '4' };
const RU_MU_GONG = { '乙': '6', '丙': '6', '丁': '8', '戊': '6', '己': '8', '庚': '8', '辛': '4', '壬': '4', '癸': '2' };
const STAR_ORIGIN = { '天蓬': '1', '天芮': '2', '天冲': '3', '天辅': '4', '天禽': '5', '天心': '6', '天柱': '7', '天任': '8', '天英': '9' };
const DOOR_ORIGIN = { '休门': '1', '死门': '2', '伤门': '3', '杜门': '4', '开门': '6', '惊门': '7', '生门': '8', '景门': '9' };
const OPPOSITE_GONG = { '1': '9', '9': '1', '2': '8', '8': '2', '3': '7', '7': '3', '4': '6', '6': '4', '5': '5' };

export function normalizeStar(star = '') {
  return star.replace('天禽、', '') || (star.includes('天禽') ? '天禽' : star);
}

export function isFuYin({ gong, star, door, tianGan, diGan }) {
  const pureStar = normalizeStar(star);
  return Boolean(
    (pureStar && STAR_ORIGIN[pureStar] === gong) ||
    (door && DOOR_ORIGIN[door] === gong) ||
    (tianGan && diGan && tianGan === diGan)
  );
}

export function isFanYin({ gong, star, door }) {
  const pureStar = normalizeStar(star);
  return Boolean(
    (pureStar && OPPOSITE_GONG[STAR_ORIGIN[pureStar]] === gong) ||
    (door && OPPOSITE_GONG[DOOR_ORIGIN[door]] === gong)
  );
}

export function analyzeFuYinFanYin(jiuXing, baMen) {
  const starFu = {};
  const menFu = {};
  const starFan = {};
  const menFan = {};
  for (const gong in jiuXing) {
    if (gong === '5') continue;
    starFu[gong] = isFuYin({ gong, star: jiuXing[gong] });
    menFu[gong] = isFuYin({ gong, door: baMen[gong] });
    starFan[gong] = isFanYin({ gong, star: jiuXing[gong] });
    menFan[gong] = isFanYin({ gong, door: baMen[gong] });
  }
  const hasStarFu = Object.values(starFu).some(Boolean);
  const hasMenFu = Object.values(menFu).some(Boolean);
  const hasStarFan = Object.values(starFan).some(Boolean);
  const hasMenFan = Object.values(menFan).some(Boolean);

  let type = 'normal';
  let desc = '未见明显伏吟反吟，事情变化以星门神和格局为主判断。';
  if (hasStarFu && hasMenFu) {
    type = '星门俱伏';
    desc = '全面停滞，内外受困，动则招咎，宜守不宜攻。';
  } else if (hasMenFu) {
    type = '门伏星不伏';
    desc = '外在行动停住，但内在趋势仍动，事情暂缓未终结。';
  } else if (hasStarFu) {
    type = '星伏门不伏';
    desc = '表面仍忙，内在大势已定，后劲不足。';
  } else if (hasStarFan && hasMenFan) {
    type = '星门俱反';
    desc = '内外皆变，结果来得快，但容易反复翻盘。';
  } else if (hasMenFan) {
    type = '门反星不反';
    desc = '表面喧闹、行动多变，但根基未必真动。';
  } else if (hasStarFan) {
    type = '星反门不反';
    desc = '表面平静，内部趋势已变，需防后续突变。';
  }

  return { type, desc, starFu, menFu, starFan, menFan, hasFu: hasStarFu || hasMenFu, hasFan: hasStarFan || hasMenFan };
}

export function getGanPairRule(tianGan, diGan) {
  if (!tianGan || !diGan) return null;
  return GAN_PAIR_RULES[`${tianGan}${diGan}`] || GAN_PAIR_RULES[`${diGan}${tianGan}`] || null;
}

function getShiGanKeYing(tianGan, diGan) {
  if (!tianGan || !diGan) return null;
  return SHI_GAN_KE_YING[`${tianGan}+${diGan}`] || null;
}

function getGanComboRule(tianGan, diGan) {
  if (!tianGan || !diGan) return null;
  const combo = `${tianGan}加${diGan}`;
  if (tianGan === diGan) {
    return {
      combo,
      name: `${combo}伏吟`,
      tendency: tianGan === '庚' || tianGan === '辛' ? 'xiong' : 'mixed',
      meaning: `${GAN_MEANING[tianGan] || '本干'}在表里两层重复，事情容易原地循环、旧题重现，也代表该象意特别突出。`,
      action: `${GAN_ACTION[tianGan] || '先复核本干所主事项'}，不要在信息未变时重复加码。`
    };
  }

  const pairRule = getGanPairRule(tianGan, diGan);
  if (pairRule) {
    return {
      combo,
      name: `${combo}·${pairRule.name}`,
      tendency: pairRule.tendency,
      meaning: pairRule.meaning,
      action: pairRule.action
    };
  }

  const tianMeaning = GAN_MEANING[tianGan] || '显性动作';
  const diMeaning = GAN_MEANING[diGan] || '原有基础';
  const tendencyBase = GAN_TENDENCY[tianGan] === 'xiong' || GAN_TENDENCY[diGan] === 'xiong'
    ? 'mixed'
    : (GAN_TENDENCY[tianGan] === 'ji' && GAN_TENDENCY[diGan] === 'ji' ? 'ji' : 'mixed');
  return {
    combo,
    name: combo,
    tendency: tendencyBase,
    meaning: `天盘${tianGan}主${tianMeaning}，落在地盘${diGan}所主的${diMeaning}之上，表示表面动作要回到这层基础条件中验证。`,
    action: `${GAN_ACTION[tianGan] || '先看显性动作'}，同时复核${GAN_ACTION[diGan] || '原有基础'}。`
  };
}

function getStarDoorGe(star, door) {
  if (!star || !door) return null;
  return STAR_DOOR_GE[`${normalizeStar(star)}+${door}`] || null;
}

function getJiuDun(input) {
  for (const key in JIU_DUN) {
    const dun = JIU_DUN[key];
    if (dun.condition(input)) {
      return { name: dun.name, tendency: dun.tendency, meaning: dun.meaning, action: dun.action };
    }
  }
  return null;
}

function tendencyScore(tendency, ji = 2, xiong = -2, mixed = 0) {
  if (tendency === 'da_ji') return ji + 2;
  if (tendency === 'ji') return ji;
  if (tendency === 'xiong') return xiong;
  return mixed;
}

export function analyzeGeJu(input) {
  const {
    gong,
    star,
    door,
    doorRelation,
    tianGan,
    diGan,
    anGan,
    isKongWang,
    isMaStar,
    isZhiFu,
    isZhiShi,
    isRiGan,
    isShiGan,
    isNianMing
  } = input;
  const items = [];
  let score = 0;

  const jiuDun = getJiuDun(input);
  if (jiuDun) {
    items.push({ type: 'jiudun', ...jiuDun });
    score += tendencyScore(jiuDun.tendency, 4, -4);
  }

  const keYing = getShiGanKeYing(tianGan, diGan);
  if (keYing) {
    items.push({ type: 'keying', combo: `${tianGan}加${diGan}`, ...keYing });
    score += tendencyScore(keYing.tendency, 3, -3);
  } else {
    const ganCombo = getGanComboRule(tianGan, diGan);
    if (ganCombo) {
      items.push({ type: 'ganCombo', ...ganCombo });
      score += tendencyScore(ganCombo.tendency, 1, -1, 0);
    }
  }

  const starDoorGe = getStarDoorGe(star, door);
  if (starDoorGe) {
    items.push({ type: 'starDoorGe', ...starDoorGe });
    score += tendencyScore(starDoorGe.tendency, 2, -2);
  }

  if (!keYing) {
    const pairRule = getGanPairRule(tianGan, diGan);
    if (pairRule) {
      items.push({ type: 'ganPair', ...pairRule });
      score += tendencyScore(pairRule.tendency, 2, -2);
    }
  }

  if (isFuYin(input)) {
    items.push({ type: 'fuyin', name: '伏吟', tendency: 'mixed', meaning: '主停滞、重复、原地打转，适合守成、复核、等条件成熟。', action: '先复盘旧问题，不宜急推。' });
    score -= 1;
  }

  if (isFanYin(input)) {
    items.push({ type: 'fanyin', name: '反吟', tendency: 'xiong', meaning: '主反复、变动、翻盘，事情容易出现方向逆转。', action: '行动留退路，重要承诺需二次确认。' });
    score -= 3;
  }

  if (doorRelation === 'ke') {
    items.push({ type: 'menpo', name: '门迫', tendency: 'xiong', meaning: `${door || '八门'}克宫，行为压迫环境，推进易过急、过硬或有冲突。`, action: '降低推进强度，先疏通关系和条件。' });
    score -= 2;
  }

  if (tianGan && JI_XING_GONG[tianGan] === gong) {
    items.push({ type: 'jixing', name: `${tianGan}加本宫击刑`, tendency: 'xiong', meaning: `${GAN_MEANING[tianGan] || '该干'}受刑，主内耗、误伤、制度或细节卡顿。`, action: '避免硬碰硬，优先查错、查流程、查责任边界。' });
    score -= 2;
  }

  if (tianGan && RU_MU_GONG[tianGan] === gong) {
    items.push({ type: 'rumu', name: `${tianGan}入墓`, tendency: 'xiong', meaning: `${GAN_MEANING[tianGan] || '该干'}入墓，主信息被收住、资源不显、推进迟缓。`, action: '先问清隐藏条件，不急于投入大量资源。' });
    score -= 2;
  }

  if (isKongWang) {
    items.push({ type: 'kongwang', name: '空亡', tendency: 'xiong', meaning: '主虚、迟、落空，承诺和结果容易不实或暂时无力落地。', action: '所有口头信息都要落到书面、数据或实际反馈。' });
    score -= 3;
  }

  if (isMaStar) {
    items.push({ type: 'maxing', name: '驿马', tendency: 'mixed', meaning: '主移动、变动、外出、换渠道，事情会被外部变化催动。', action: '可通过拜访、换渠道、换场景来验证。' });
    score += 1;
  }

  if (anGan && tianGan && anGan !== tianGan) {
    items.push({ type: 'angan', name: `暗干${anGan}`, tendency: 'mixed', meaning: `表面天盘${tianGan}，暗藏${anGan}，表示表面之下有隐藏动机或备用路径。`, action: '先确认表面信息是否属实，再观察未公开变量。' });
    score -= 1;
  }

  if (isRiGan) {
    items.push({ type: 'yongshen', name: '日干所在', tendency: 'ji', meaning: '本宫为日干，代表求测人自身位置，优先看本宫吉凶与旺衰。', action: '重点关注本宫对应的现实事项。' });
    score += 2;
  }

  if (isShiGan) {
    items.push({ type: 'yongshen', name: '时干所在', tendency: 'ji', meaning: '本宫为时干，代表所测之事本身，直接反映事情走势。', action: '本宫吉凶直接影响事情成败。' });
    score += 2;
  }

  if (isNianMing) {
    items.push({ type: 'yongshen', name: '年命所在', tendency: 'ji', meaning: '本宫为年命用神，代表个人长期气场和承受能力。', action: '观察个人状态是否能承接此事。' });
    score += 1;
  }

  if (isZhiFu) {
    items.push({ type: 'zhifu', name: '值符临宫', tendency: 'ji', meaning: '本宫代表全局主导力量，所见象意权重较高。', action: '优先观察本宫对应的人、资源和决策信号。' });
    score += 3;
  }

  if (isZhiShi) {
    items.push({ type: 'zhishi', name: '值使临宫', tendency: 'ji', meaning: '本宫代表事情执行路径、门路和实际推进方式。', action: '行动上优先从本宫对应渠道切入。' });
    score += 2;
  }

  return {
    items,
    score,
    names: items.map(item => item.name),
    summary: items.length
      ? items.map(item => `${item.name}：${item.meaning}`).join(' ')
      : '本宫未见明显特殊格局，宜以神、星、门、干、宫位和用神匹配为主判断。',
    actions: items.map(item => item.action).filter(Boolean)
  };
}





