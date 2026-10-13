# 奇门网站架构总览

更新日期：2026-07-07

## 1. 项目定位

本项目当前不应按普通“玄学展示站”继续扩散，而应收束为：

> 以时家奇门为核心的在线排盘、知识学习与本地复盘工具。

核心目标有三层：

1. 排盘可信：时间、节气、局数、值符值使、九宫信息有可验证基准。
2. 学习可追：排盘页能回链到知识页，用户能看懂依据。
3. 复盘可积累：预测只作为观察假设，必须通过样本记录校准。

## 2. 顶层目录

```text
qimen-all-v3/
  AGENTS.md                         项目协作入口和 Codex 记忆入口
  docs/                             项目级架构、记忆、后续计划
  qimen-website/                    正式 React/Vite 网站
  taobi-src/                        早期或参考算法来源
  *.md / *.html / *.png             历史诊断、首页方案、视觉小样和参考材料
```

## 3. 网站技术栈

`qimen-website` 当前使用：

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- lunar-javascript
- html-to-image

运行脚本：

```bash
npm run dev
npm run build
npm run lint
npm run verify:qimen
npm run verify:knowledge
npm run knowledge:update
```

## 4. 前端结构

```text
qimen-website/src/
  App.jsx                     路由、全局皮肤、标题与 meta
  main.jsx                    应用入口
  index.css                   主题变量、全局样式、概念首页样式
  pages/
    Home.jsx                  当前正式首页
    HomeConcept.jsx           概念首页/视觉实验路由
    Divination.jsx            排盘主流程，当前偏大
    Knowledge.jsx             知识页和断语规则展示
    Cases.jsx                 案例页
    About.jsx                 关于与边界说明
  components/
    ChartActions.jsx          图像导出/操作组件
    JiuGongGrid.jsx           九宫盘组件
    PalaceDetail.jsx          宫位详情组件
    TimeSelector.jsx          时间选择组件
    Navbar.jsx / Footer.jsx   可复用导航和页脚
  lib/
    qimen.js                  核心排盘与综合分析
    geju.js                   格局分析
    duxiang.js                读象/解释
    bamen.js/bashen.js/...    基础术语和象意数据
    knowledge-data.js         知识数据桥接
  knowledge/
    maidu-c*.txt              麦垛课程资料
    maidu-summary.json        课程索引
    judgement-sentence-*.json 断语规则数据
    qimen-knowledge-all.md    综合知识材料
  scripts/
    verify-qimen.mjs          排盘基准校验
    verify-knowledge.mjs      知识索引校验
    update-judgement-table.mjs 断语表更新脚本
```

## 5. 当前已经具备

- 路由框架已经完整：首页、排盘、知识、案例、关于。
- 排盘核心已经有固定基准脚本，覆盖局数、四柱、空亡、值符值使、九宫盘、格局等。
- 知识页已接入本地课程索引和断语表。
- 排盘页已有本地复盘样本、CSV 导出、知识库更新建议导出。
- 已有多套首页视觉方案和设计诊断资料。
- Vercel 配置、robots、sitemap、favicon 等基础上线文件已存在。

## 6. 主要缺失

### 6.1 项目文档缺失

- `README.md` 仍是 Vite 模板说明，无法指导后续开发。
- 缺少项目级架构文档。
- 缺少长期记忆文件，导致每次继续开发都要重新读旧文档。
- 缺少明确的“上线前检查表”和“变更验收表”。

已补充：

- `AGENTS.md`
- `docs/architecture.md`
- `docs/development-memory.md`
- `qimen-website/README.md`

### 6.2 工程结构缺失

- `Divination.jsx` 承载过多：输入、计算、盘面、复盘、导出、知识跳转、样本统计都在一个文件里。
- `App.jsx` 内仍有导航和页脚定义，同时 `src/components` 里也有对应组件，存在重复入口。
- `src/data` 目录存在但目前没有承担清晰职责。
- `dist`、日志、预览截图等产物混在项目目录内，后续若接入 git 应通过 `.gitignore` 固定排除。

### 6.3 算法与知识缺口

- 基准案例数量仍少，当前更像“核心回归样本”，不是完整测试体系。
- 节气交界、23 点子时、农历转换、茅山法/拆补法差异需要更多边界测试。
- `taobi-src` 和当前 `src/lib/qimen.js` 的关系需要固化：哪些是参考源，哪些是正式实现。
- 断语规则已经结构化，但从真实复盘回写正式知识库仍需要人工审核流程。

### 6.4 产品体验缺口

- 首页有多个方向并存：正式首页、概念页、根目录历史小样，主方向需要定稿。
- 排盘页信息密度较高，新手第一次进入容易被参数和解释淹没。
- “70%置信度”需要持续用“盘内信号集中，不代表现实保证”的口径约束。
- 高级设置应折叠：日家/月家/年家、茅山法、出生年、农历输入。

### 6.5 视觉与性能缺口

- `index.css` 包含正式主题和概念首页大量样式，后续应按页面拆分或至少分段清理。
- 知识数据和页面代码会推高包体，后续应继续路由级懒加载和知识数据延迟加载。
- 首页视觉应收束为“克制、可信、东方精密感”，避免过多视觉实验进入主流程。

## 7. 建议补充目录

后续可以按下面方式继续补：

```text
docs/
  architecture.md             已补：架构总览
  development-memory.md       已补：长期记忆
  release-checklist.md        待补：上线前检查
  algorithm-baselines.md      待补：算法基准说明
  product-decisions.md        待补：产品决策记录

qimen-website/src/
  features/
    divination/               待建：排盘页拆分后的领域模块
    knowledge/                待建：知识页数据与组件
  data/
    qimen/                    待定：若从 lib 中抽出纯数据
  styles/
    concept-home.css          待定：从 index.css 拆概念首页样式
```

## 8. 推荐下一步

优先级从高到低：

1. 跑通 `npm run build`、`npm run verify:qimen`、`npm run verify:knowledge`，确认现状。
2. 更新或清理 `README.md`，固定开发入口。
3. 将 `Divination.jsx` 按“输入、盘面、宫位详情、分析、复盘”逐步拆分。
4. 定稿首页，只保留一个主方向，概念页保留为实验路由或归档。
5. 增加算法边界基准，特别是节气交接和 23 点子时。

