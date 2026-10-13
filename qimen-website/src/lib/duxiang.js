const STAR_XIANG = {
  '天蓬': '信息暗线、欲望、风险和机变并存，利谋划但忌贪进。',
  '天芮': '病符、瑕疵、旧问题和承载压力明显，要先处理隐患。',
  '天冲': '启动、冲击、行动和突发变化强，事情来得快也容易急。',
  '天辅': '学习、文书、贵人辅佐和方案能力较强，利沟通整理。',
  '天禽': '枢纽、核心、统筹和中转之象，需看全局承压点。',
  '天心': '判断、技术、规则、医疗和决策之象，利专业处理。',
  '天柱': '口舌、压力、制度、支撑和僵持之象，需防硬碰硬。',
  '天任': '责任、积累、土地、稳定资源和慢变量，利长期经营。',
  '天英': '曝光、名声、表现、审美和文案之象，利公开展示。'
};

const DOOR_XIANG = {
  '休门': '缓和、修复、休整、沟通和养息。',
  '生门': '生发、收益、机会、资源增长和现实回报。',
  '伤门': '损耗、冲突、速度、伤害和执行压力。',
  '杜门': '阻隔、保密、封闭、门槛和暂时不通。',
  '景门': '曝光、表达、证照、考试、宣传和可见度。',
  '死门': '结束、沉滞、旧账、病灶和不宜新启。',
  '惊门': '口舌、突发、惊扰、谈判和不稳定消息。',
  '开门': '打开、授权、职位、项目入口和正式通道。'
};

const GOD_XIANG = {
  '值符': '有主导者、贵人、权威或关键资源，定性偏主导。',
  '螣蛇': '有反复、纠结、想象过度或虚惊，定性偏缠绕。',
  '太阴': '有暗助、女性、细节、隐藏资源或私下安排，定性偏隐柔。',
  '六合': '有合作、关系、撮合、合同或中间人，定性偏合和。',
  '白虎': '有强硬、伤害、冲突、风险或高压，定性偏刚猛。',
  '玄武': '有隐瞒、欺诈、暗线、遗漏或信息不透明，定性偏暗昧。',
  '九地': '有稳定、沉淀、基层、土地或长期积累，定性偏稳守。',
  '九天': '有上升、远方、公开扩张、目标抬高或外部机会，定性偏高举。'
};

const GAN_XIANG = {
  '甲': '核心目标、主心骨、统领线索',
  '乙': '关系、文书、柔性资源、协商',
  '丙': '公开、热度、曝光、明显变化',
  '丁': '细节、灵感、证据、细小机会',
  '戊': '钱、平台、存量资源、大额条件',
  '己': '手续、承载、内部流程、旧条件',
  '庚': '阻力、竞争、规则、硬条件',
  '辛': '瑕疵、错误、精细问题、代价',
  '壬': '流动、变化、外部消息、大水势',
  '癸': '隐情、暗线、小变化、未明信息'
};

const PALACE_XIANG = {
  '1': '坎宫主流动、隐伏、资金周转、情绪和风险。',
  '2': '坤宫主承载、后勤、家庭、稳定条件和女性长辈。',
  '3': '震宫主启动、行动、突发、争执和快速推进。',
  '4': '巽宫主文书、传播、方案、谈判、学习和柔性策略。',
  '5': '中宫主核心压力、全局枢纽和中转状态。',
  '6': '乾宫主领导、规则、授权、高层资源和刚性制度。',
  '7': '兑宫主口舌、谈判、合同、兑现和收益出口。',
  '8': '艮宫主门槛、停止、积累、不动产和卡点。',
  '9': '离宫主曝光、名声、证照、考试、展示和公开表现。'
};

const PURPOSE_FOCUS = {
  '综合': '综合盘要先问“最先出现的反馈是什么”，再看是否能落到行动。',
  '事业': '事业盘重点把象意落到上级态度、职位机会、流程门槛和交付成果。',
  '财运': '财运盘重点把象意落到现金流、合同条款、回款节点和风险退出。',
  '婚姻': '感情盘重点把象意落到回应意愿、第三方干扰、现实压力和关系修复。',
  '健康': '健康盘只作风险与调养提醒，最终以正规检查和症状变化为准。',
  '学业': '学业盘重点把象意落到专注时间、错题复盘、表达反馈和考试表现。'
};

const DOOR_RELATION_TEXT = {
  ke: '【门迫】门克宫，行动主动但环境受压，宜主动防过激。',
  beKe: '【宫制】宫克门，外部阻力明显，推进成本偏高。',
  sheng: '【门和】门生宫，行动滋养环境，顺势而为。',
  beSheng: '【宫义】宫生门，环境支持行动，但也容易消耗自身。',
  same: '【比和】门宫同气，行为与环境协调。',
  unknown: ''
};

function normalizeStar(star = '') {
  return star.replace('天禽、', '') || (star.includes('天禽') ? '天禽' : star);
}

function compact(list) {
  return list.filter(Boolean);
}

export function readXiang({
  gong,
  star,
  door,
  god,
  tianGan,
  diGan,
  anGan,
  doorRelation,
  wangShuai,
  purpose,
  geju,
  riGan,
  shiGan,
  nianMing
}) {
  const pureStar = normalizeStar(star);
  const yongShenLines = compact([
    riGan && tianGan === riGan ? '【用神】本宫为日干所在，代表求测人自身位置。' : '',
    shiGan && tianGan === shiGan ? '【用神】本宫为时干所在，代表所测之事本身。' : '',
    nianMing && tianGan === nianMing ? '【用神】本宫为年命所在，代表个人长期承受力和气场。' : ''
  ]);
  const ganLine = anGan && anGan !== tianGan
    ? `【暗藏】暗干${anGan}，表面${tianGan || '不显'}之下有${GAN_XIANG[anGan] || '隐藏信息'}。`
    : '';

  const lines = compact([
    god ? `【基调】${god}：${GOD_XIANG[god] || '看人事助阻与外部状态。'}` : '',
    pureStar ? `【天时】${pureStar}：${STAR_XIANG[pureStar] || '看资源、趋势和长期状态。'}` : '',
    wangShuai ? `【旺衰】${wangShuai.text}` : '',
    door ? `【行为】${door}：${DOOR_XIANG[door] || '看现实门路和执行路径。'}` : '',
    doorRelation ? DOOR_RELATION_TEXT[doorRelation] : '',
    tianGan ? `【事态】天盘${tianGan}主${GAN_XIANG[tianGan] || '当前显现的信息'}。` : '',
    diGan ? `【根基】地盘${diGan}主${GAN_XIANG[diGan] || '原有基础条件'}。` : '',
    ganLine,
    geju?.summary,
    ...yongShenLines,
    PALACE_XIANG[gong]
  ]);

  const inference = compact([
    purpose ? PURPOSE_FOCUS[purpose] || PURPOSE_FOCUS['综合'] : PURPOSE_FOCUS['综合'],
    god ? `先以${god}定人事底色，再看星门是否能承接这个底色。` : '',
    door && pureStar ? `以${pureStar}看环境趋势，以${door}定行动入口，二者合参判断事情能否落地。` : '',
    tianGan && diGan ? `天盘${tianGan}压在地盘${diGan}上，显性动作要落到“${GAN_XIANG[diGan] || diGan}”这个基础条件上验证。` : '',
    anGan && anGan !== tianGan ? `暗干${anGan}提示隐藏变量，复盘时要看未公开的动机、备用方案或暗线消息。` : '',
    riGan && shiGan && tianGan === riGan ? '日干在此宫，应与时干宫对照，看“人能否承接事”。' : '',
    geju?.names?.length ? `特殊格局先看${geju.names.slice(0, 3).join('、')}，这些信号优先于普通吉凶分。` : ''
  ]);

  const reality = compact([
    `现实中先找${PALACE_XIANG[gong]?.replace(/。$/, '') || '本宫对应事项'}的反馈。`,
    door ? `行动入口看${door.replace('门', '')}象：${DOOR_XIANG[door]}` : '',
    god ? `人事状态看${god}：${GOD_XIANG[god]}` : '',
    ...yongShenLines
  ]);

  return {
    lines,
    inference,
    reality,
    summary: lines.slice(0, 5).join(' ')
  };
}

