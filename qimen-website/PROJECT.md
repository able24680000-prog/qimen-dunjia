# 奇门遁甲网站

这是一个基于 React/Vite 的奇门遁甲在线排盘、知识学习与本地复盘工具。

产品定位：以时家奇门为核心，提供清晰盘面、结构化解释、知识回链和复盘记录。本站内容仅供学习、研究和观察参考，不构成医疗、法律、投资或其他重大决策建议。

## 技术栈

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- lunar-javascript
- html-to-image

## 目录说明

```text
src/
  App.jsx              路由、皮肤、页面 meta
  pages/               首页、排盘、知识、案例、关于
  components/          九宫盘、宫位详情、导出操作等组件
  lib/                 排盘算法、格局、读象和基础数据
  knowledge/           课程资料、断语规则和知识索引
  index.css            全局主题和页面样式
scripts/
  verify-qimen.mjs     排盘基准校验
  verify-knowledge.mjs 知识库索引校验
  update-judgement-table.mjs
public/
  robots.txt
  sitemap.xml
  favicon.svg
```

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run verify:qimen
npm run verify:knowledge
npm run knowledge:update
```

## 开发约定

- 改 `src/lib/qimen.js` 后必须跑 `npm run verify:qimen`。
- 改 `src/knowledge`、`Knowledge.jsx` 或断语表后必须跑 `npm run verify:knowledge`。
- 排盘建议必须保持可复盘口径：写清问题、依据、验证窗口和现实观察点。
- 不把参考置信度写成结果保证。
- 新功能优先服务主流程：起局、看盘、看依据、保存复盘。

## 项目记忆

更完整的架构和长期决策记录在上级目录：

- `../AGENTS.md`
- `../docs/architecture.md`
- `../docs/development-memory.md`

