/* ========================================
   奇门遁甲 · 数据
   示例：阳遁一局（演示用）
   按戊→己→庚→辛→壬→癸→丁→丙→乙 顺布（从巽4宫起）
======================================== */

const BUREAU_DATA = {
  meta: {
    name: "阳遁一局",
    type: "yang",
    bureau: 1,
    description: "演示用示例局，阳遁一局"
  },

  // 9 宫位定义（按九宫格 3x3 排列，左上到右下）
  // 布局: [4,5,2] / [3,9,7] / [8,1,6]
  palaces: [
    {
      // 巽4宫 (东南)
      id: 4,
      pos: { row: 0, col: 0 },
      name: "巽",
      direction: "东南",
      element: "木",
      dipan: "戊",      // 地盘天干
      tianpan: "天辅",   // 天盘九星
      renpan: "杜门",    // 人盘八门
      shenpan: "太阴",   // 神盘八神
      xing: "大吉",
      leiXiang: "文曲/文化教育/考试"
    },
    {
      // 中5宫
      id: 5,
      pos: { row: 0, col: 1 },
      name: "中",
      direction: "中央",
      element: "土",
      dipan: "己",
      tianpan: "天禽",
      renpan: "",
      shenpan: "六合",
      xing: "大吉",
      leiXiang: "忠厚/中正（寄坤2）"
    },
    {
      // 坤2宫 (西南)
      id: 2,
      pos: { row: 0, col: 2 },
      name: "坤",
      direction: "西南",
      element: "土",
      dipan: "庚",
      tianpan: "天芮",
      renpan: "死门",
      shenpan: "白虎",
      xing: "凶",
      leiXiang: "疾病/孕妇/学生"
    },
    {
      // 震3宫 (东)
      id: 3,
      pos: { row: 1, col: 0 },
      name: "震",
      direction: "东",
      element: "木",
      dipan: "辛",
      tianpan: "天冲",
      renpan: "伤门",
      shenpan: "玄武",
      xing: "次吉",
      leiXiang: "雷厉风行/冒失粗鲁"
    },
    {
      // 离9宫 (南)
      id: 9,
      pos: { row: 1, col: 1 },
      name: "离",
      direction: "南",
      element: "火",
      dipan: "癸",
      tianpan: "天英",
      renpan: "景门",
      shenpan: "九地",
      xing: "中平",
      leiXiang: "右弼/性躁/光明"
    },
    {
      // 兑7宫 (西)
      id: 7,
      pos: { row: 1, col: 2 },
      name: "兑",
      direction: "西",
      element: "金",
      dipan: "丁",
      tianpan: "天柱",
      renpan: "惊门",
      shenpan: "九天",
      xing: "凶",
      leiXiang: "破军/军警/律师"
    },
    {
      // 艮8宫 (东北)
      id: 8,
      pos: { row: 2, col: 0 },
      name: "艮",
      direction: "东北",
      element: "土",
      dipan: "丙",
      tianpan: "天任",
      renpan: "生门",
      shenpan: "值符",
      xing: "大吉",
      leiXiang: "左辅/忠厚/财运"
    },
    {
      // 坎1宫 (北)
      id: 1,
      pos: { row: 2, col: 1 },
      name: "坎",
      direction: "北",
      element: "水",
      dipan: "乙",
      tianpan: "天蓬",
      renpan: "休门",
      shenpan: "腾蛇",
      xing: "凶",
      leiXiang: "胆大妄为/大智慧者"
    },
    {
      // 乾6宫 (西北)
      id: 6,
      pos: { row: 2, col: 2 },
      name: "乾",
      direction: "西北",
      element: "金",
      dipan: "壬",
      tianpan: "天心",
      renpan: "开门",
      shenpan: "腾蛇",
      xing: "大吉",
      leiXiang: "武曲/领导/医生"
    }
  ],

  // 五行映射（颜色）
  wuxing: {
    "木": "#5fa777",
    "火": "#d96f4e",
    "土": "#c8a96a",
    "金": "#c4c4d4",
    "水": "#5d7ba8"
  },

  // 八门吉凶映射（光晕色）
  doorGlow: {
    "开门": "rgba(217, 175, 110, 0.25)",  // 吉
    "休门": "rgba(217, 175, 110, 0.25)",  // 吉
    "生门": "rgba(217, 175, 110, 0.25)",  // 吉
    "伤门": "rgba(120, 140, 180, 0.2)",  // 凶
    "杜门": "rgba(180, 180, 200, 0.15)", // 平
    "景门": "rgba(180, 180, 200, 0.15)", // 平
    "死门": "rgba(120, 140, 180, 0.2)",  // 凶
    "惊门": "rgba(120, 140, 180, 0.2)"   // 凶
  },

  // 八神光晕
  shenGlow: {
    "值符": "rgba(217, 175, 110, 0.4)",
    "腾蛇": "rgba(160, 100, 180, 0.35)",
    "太阴": "rgba(140, 170, 200, 0.3)",
    "六合": "rgba(180, 200, 140, 0.3)",
    "白虎": "rgba(180, 180, 180, 0.2)",
    "玄武": "rgba(100, 120, 160, 0.3)",
    "九地": "rgba(180, 160, 120, 0.25)",
    "九天": "rgba(200, 180, 140, 0.3)"
  }
};

