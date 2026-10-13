# 奇门遁甲交互可视化网页 · 项目启动包

> 这是一套完整的项目启动资产，配上 `codex-mastery` Skill 一起用，让 Codex 高效地产出有设计感的奇门遁甲交互网页。

## 📁 文件结构

```
qimen-web-project/
├── prompts/
│   └── 01-启动Prompt.md          # 完整 Codex 启动 Prompt（五要素齐全）
├── docs/
│   └── AGENTS.md                 # 项目规则文件（项目宪法）
├── prototype/                    # 视觉参考锚点（可运行）
│   ├── index.html                # 入口
│   ├── style.css                 # 配色 + 动效
│   ├── data.js                   # 示例局数据
│   ├── script.js                 # 渲染逻辑
│   └── README.md                 # 原型使用说明
└── README.md                     # 本文件
```

## 🚀 三步上手

### Step 1 · 看原型
打开 `prototype/index.html`（或运行 `python3 -m http.server` 启动本地服务），
对照上一条消息里的设计思路看视觉效果。

重点确认：
- 配色方向（暗色 + 宣纸双模式）
- 宫位布局（3×3 九宫）
- 动效节奏（呼吸光晕、门扇开合、神盘漂浮）
- 整体气质（克制、留白、不像 AI 模板）

> **如果对原型有修改意见，先在这里调，再让 Codex 实现。**

### Step 2 · 复制 Prompt 给 Codex
把 `prompts/01-启动Prompt.md` 里的 Prompt 整段复制，发给 Codex（CLI/Web/IDE 插件都行）。
同时把 `docs/AGENTS.md` 放到项目根目录，让 Codex 读取项目规则。

### Step 3 · 走视觉闭环
Codex 第一轮只输出：理解 + 计划 + 依赖 + 疑问（不超过 3 个）。
**确认计划后再让它写代码**。

之后每完成一个动效就用 Playwright 截屏（桌面+移动），Vision 审查：
- 层级/间距/对比度
- 动效速度是否过快
- 移动端是否可读
- 配色是否克制

## 🎯 配合 codex-mastery Skill 的使用流程

| 阶段 | 用的框架 | 说明 |
|------|----------|------|
| 启动 | F1（五要素提示词） | 直接用 `01-启动Prompt.md` |
| 审美 | F4（审美注入） | 严格遵守 Prompt 里的审美方向 |
| 视觉 | F3（视觉反馈闭环） | 构建→运行→截屏→Vision 审查→迭代 |
| 扩展 | F5（参考驱动） | 已有 prototype 作为参考锚点 |
| 质量 | F7（工程纪律） | `AGENTS.md` 是硬性规则 |

## 📊 当前进度

- [x] 完整设计思路整理
- [x] Codex 启动 Prompt 编写
- [x] 项目规则 AGENTS.md 编写
- [x] 视觉参考锚点 prototype 完成
- [ ] 启动 Codex 让它读 prototype + 输出计划
- [ ] 计划确认后开始实现 MVP
- [ ] 视觉闭环多轮迭代
- [ ] 响应式 + 交互层完善
- [ ] （可选）排盘算法集成

## 🔧 给 Codex 装什么 Skill

按 `codex-mastery` 推荐的"按需装配"原则，本项目建议装：

1. **frontend-design** — 审美相关
2. **webapp-testing** — Playwright 截屏对比
3. **superpowers**（可选）— TDD 纪律

不堆砌。

## 💡 后续可扩展方向

1. **排盘功能**：用 JS 实现阳盘/阴盘起局算法（参考 qimen-dunjia Skill）
2. **断局分析**：基于六维分析法（竖看/横看/远近/高低/全面/同步）做交互式断局
3. **历史记录**：本地保存用户排过的局
4. **多主题**：暗色/宣纸之外增加"水墨""敦煌"等
5. **可分享**：局 URL 分享（参数化局数据）

---

> 本启动包由小茉协助整理，基于 codex-mastery Skill + qimen-dunjia Skill。
> 任何调整都先回这里对齐方向，再让 Codex 实现。

