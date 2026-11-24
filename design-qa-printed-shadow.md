# Printed Shadow 首页预览设计 QA

source visual truth path: `E:\+trae solo\qimen-all-v3\printed-shadow-source.png`

implementation: 曾使用独立预览文件 `首页预览-PrintedShadow融合版.html`（过程稿已移除；本记录保留作历史参考）。

viewport: desktop first, responsive rules included for tablet/mobile

state: default hero state, hover on版心入口 supported

final result: blocked

## Findings

- [P1] 源图的真实材质感仍未完全复现  
  Location: `.folio`, `.instrument`  
  Evidence: 源图更像真实纸面中压入一枚日影仪器，当前实现仍能看出是 CSS 画出的圆盘和纸框。  
  Impact: 高级感的关键在材质真实度，CSS 版若太干净，会回到“代码画图”的感觉。  
  Fix: 下一轮应引入一张专门生成的低对比纸纹/压印仪器底图，CSS 只负责交互与排版。

- [P1] 日影盘的空间透视还不够自然  
  Location: `.instrument`, `.gnomon`, `.shadow`  
  Evidence: 当前圆盘用 `rotateX` 模拟俯视，刻度和影针仍有平面感。  
  Impact: 日影盘方向是否高级，取决于它像不像真实测时器，而不是网页装饰图形。  
  Fix: 调整圆盘为更扁的椭圆透视，减少完整圆的“仪表盘”感，让影针阴影更柔、更偏真实光照。

- [P2] 右侧说明文字偏“解释页面”，不够像源图里的边注  
  Location: `.notes`  
  Evidence: 源图右侧更像校勘、刻度、边注，当前是产品说明段落。  
  Impact: 会削弱“宋版书页”的沉浸感。  
  Fix: 将右侧说明改为更短的边注式短句，或只保留刻度/时辰/宫位式信息。

- [P2] 顶部导航仍偏普通网页  
  Location: `.nav`, `.time-tag`  
  Evidence: 当前导航是常规横排链接，源图更像页面边界上的轻量标记。  
  Impact: 品牌气质被常规网站结构拉回现实。  
  Fix: 正式落地时可把导航弱化为右上小字或折叠菜单，首屏只保留“排盘”主入口。

## Required Fidelity Surfaces

- Fonts and typography: 使用系统宋体族模拟，方向正确，但需要后续确定正式字体；建议网页正式版使用本地可用的思源宋体/霞鹜文楷/宋刻风格标题字，不要依赖浏览器默认宋体。
- Spacing and layout rhythm: 三栏结构、左题名、中央版心、右边注已对齐源图逻辑；移动端已改为横排标题与版心主导。
- Colors and visual tokens: 冷纸色、石灰、石墨线、朱砂点已建立；后续应继续降低暖米色倾向。
- Image quality and asset fidelity: 当前无图片资产，完全 CSS 生成；这也是最大差距。下一轮建议生成一张低对比仪器版心底图作为真实材质资产。
- Copy and content: “循影入局”保留了入口感；右侧说明仍可继续更克制。

## Implementation Checklist

1. 打开 HTML 检查桌面首屏整体气质。
2. 若方向认可，生成一张“纸面压印日影盘”背景资产，替换 CSS 圆盘底层。
3. 弱化右侧说明文字，改成边注/刻度式信息。
4. 调整日影盘透视，让圆盘更像被印入版心。
5. 将选定版本迁移到 `qimen-website/src/pages/HomeConcept.jsx` 或正式首页。

## Follow-up Polish

- 增加非常轻的鼠标视差，只作用于红点和影线。
- 让红点根据当前时辰轻微移动，形成“择时”的真实感。
- 移动端保留版心，不要降级成普通按钮页。


