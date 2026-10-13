const fs = require('fs');
const path = require('path');
const out = 'E:/+trae solo/qimen-all-v3/qimen-website/public/color-mockups';

const cells = [
  ['巽四','九天','天辅','杜门'], ['离九','值符','天英','景门'], ['坤二','腾蛇','天芮','死门'],
  ['震三','六合','天冲','伤门'], ['中五','太阴','寄宫','中宫'], ['兑七','白虎','天柱','惊门'],
  ['艮八','玄武','天任','生门'], ['坎一','九地','天蓬','休门'], ['乾六','太常','天心','开门']
];

const themes = [
  { file: '01-ink-jade.svg', name: '方向一：墨玉夜盘', subtitle: '专业排盘工作台，克制、准确、长期耐看', bg: '#06100e', bg2: '#0b1a16', panel: '#0e211d', panel2: '#102c25', line: '#31574d', strong: '#7fd1bd', gold: '#d9b45f', text: '#f5ead0', muted: '#b6c6bd', dim: '#78958b', primaryText: '#06100e', pattern: '#7fd1bd', stamp: '墨玉夜盘' },
  { file: '02-paper-copper.svg', name: '方向二：月白铜墨', subtitle: '古籍学习气质，明亮、文雅、适合知识与案例', bg: '#d9d5c6', bg2: '#ece6d4', panel: '#f0eadb', panel2: '#e4dcc8', line: '#a89575', strong: '#1f6157', gold: '#6b241f', text: '#1f1913', muted: '#554a3f', dim: '#7f725f', primaryText: '#f8f2e4', pattern: '#6b241f', stamp: '月白铜墨' },
  { file: '03-ziwei-blue.svg', name: '方向三：紫微星野', subtitle: '天文历法推演感，现代、清晰、偏星盘工具', bg: '#050814', bg2: '#091b35', panel: '#0e1a31', panel2: '#132845', line: '#345474', strong: '#78c8e8', gold: '#d4b166', text: '#f5fbff', muted: '#aec0d0', dim: '#768aa0', primaryText: '#050814', pattern: '#78c8e8', stamp: '紫微星野' }
];

function cellSvg(theme) {
  return cells.map((c, i) => {
    const x = 760 + (i % 3) * 150;
    const y = 252 + Math.floor(i / 3) * 128;
    const fill = c[0] === '中五' ? theme.panel2 : theme.panel;
    return `<rect x="${x}" y="${y}" width="150" height="128" fill="${fill}" stroke="${theme.line}"/>
<text x="${x+14}" y="${y+25}" fill="${theme.dim}" font-size="16">${c[0]}</text>
<text x="${x+104}" y="${y+25}" fill="${theme.dim}" font-size="15">${c[1]}</text>
<text x="${x+18}" y="${y+75}" fill="${theme.text}" font-size="27" font-weight="800">${c[2]}</text>
<text x="${x+20}" y="${y+104}" fill="${theme.gold}" font-size="17" font-weight="700">${c[3]}</text>`;
  }).join('\n');
}

function make(theme, idx) {
  const isPaper = idx === 1;
  const gridOpacity = isPaper ? 0.16 : 0.22;
  const starOpacity = idx === 2 ? 0.45 : 0;
  const positionText = idx === 0 ? '最适合主站：可信、克制、工具感强。' : idx === 1 ? '适合知识库：明亮、文雅、阅读舒服。' : '适合推演功能：现代、天文、时间模型感。';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.bg}"/><stop offset="1" stop-color="${theme.bg2}"/></linearGradient>
    <radialGradient id="halo" cx="22%" cy="22%" r="42%"><stop offset="0" stop-color="${theme.strong}" stop-opacity="0.20"/><stop offset="1" stop-color="${theme.strong}" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M70 0H0V70" fill="none" stroke="${theme.pattern}" stroke-opacity="${gridOpacity}"/></pattern>
    <pattern id="stars" width="86" height="86" patternUnits="userSpaceOnUse"><circle cx="16" cy="19" r="1.3" fill="#fff" opacity="${starOpacity}"/><circle cx="62" cy="44" r="1" fill="#fff" opacity="${starOpacity}"/></pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity="${isPaper ? 0.18 : 0.34}"/></filter>
  </defs>
  <rect width="1440" height="900" fill="url(#bg)"/>
  <rect width="1440" height="900" fill="url(#halo)"/>
  <rect width="1440" height="900" fill="url(#grid)" opacity="${isPaper ? 0.45 : 0.72}"/>
  <rect width="1440" height="900" fill="url(#stars)"/>
  <text x="72" y="86" fill="${theme.dim}" font-size="18" font-weight="700">${theme.name}</text>
  <text x="72" y="160" fill="${theme.text}" font-size="54" font-family="SimSun, Noto Serif SC, serif" font-weight="800">奇门遁甲在线排盘</text>
  <text x="72" y="204" fill="${theme.muted}" font-size="22">${theme.subtitle}</text>
  <text x="72" y="257" fill="${theme.muted}" font-size="18">背景、盘面、按钮与信息色独立规划，不再只是暗底加金色。</text>
  <rect x="72" y="305" width="182" height="48" fill="${theme.gold}"/>
  <text x="112" y="336" fill="${theme.primaryText}" font-size="18" font-weight="800">进入当前排盘</text>
  <rect x="274" y="305" width="168" height="48" fill="none" stroke="${theme.strong}"/>
  <text x="309" y="336" fill="${theme.strong}" font-size="18" font-weight="700">查看起局依据</text>
  <g transform="translate(72 410)"><rect width="520" height="96" fill="${theme.panel}" stroke="${theme.line}"/><text x="24" y="38" fill="${theme.strong}" font-size="18" font-weight="800">定位</text><text x="24" y="70" fill="${theme.muted}" font-size="18">${positionText}</text></g>
  <g transform="translate(72 536)"><rect width="122" height="70" fill="${theme.bg}" stroke="${theme.line}"/><text x="18" y="44" fill="${theme.muted}" font-size="16">背景</text><rect x="140" width="122" height="70" fill="${theme.panel}" stroke="${theme.line}"/><text x="158" y="44" fill="${theme.muted}" font-size="16">面板</text><rect x="280" width="122" height="70" fill="${theme.strong}" stroke="${theme.line}"/><text x="298" y="44" fill="${theme.primaryText}" font-size="16" font-weight="800">信息</text><rect x="420" width="122" height="70" fill="${theme.gold}" stroke="${theme.line}"/><text x="438" y="44" fill="${theme.primaryText}" font-size="16" font-weight="800">强调</text></g>
  <g filter="url(#shadow)"><rect x="700" y="92" width="620" height="674" fill="${theme.panel}" stroke="${theme.line}"/><rect x="700" y="92" width="620" height="64" fill="${theme.bg}" opacity="0.78" stroke="${theme.line}"/><text x="730" y="132" fill="${theme.gold}" font-size="24" font-family="SimSun, Noto Serif SC, serif" font-weight="800" letter-spacing="4">奇门遁甲</text><text x="1110" y="132" fill="${theme.dim}" font-size="16">首页　排盘　知识</text><text x="730" y="210" fill="${theme.text}" font-size="30" font-family="SimSun, Noto Serif SC, serif" font-weight="800">时家奇门盘</text><text x="730" y="238" fill="${theme.muted}" font-size="17">当前时间 · 夏至 · 阴遁三局 · 拆补法</text><rect x="1134" y="196" width="136" height="34" fill="none" stroke="${theme.strong}"/><text x="1162" y="219" fill="${theme.gold}" font-size="16">值符值使</text>${cellSvg(theme)}<rect x="760" y="656" width="116" height="54" fill="${theme.bg}" opacity="0.55" stroke="${theme.line}"/><text x="778" y="679" fill="${theme.strong}" font-size="15" font-weight="800">四柱</text><text x="778" y="701" fill="${theme.muted}" font-size="15">丙午 甲午</text><rect x="890" y="656" width="116" height="54" fill="${theme.bg}" opacity="0.55" stroke="${theme.line}"/><text x="908" y="679" fill="${theme.strong}" font-size="15" font-weight="800">局数</text><text x="908" y="701" fill="${theme.muted}" font-size="15">阴遁三局</text><rect x="1020" y="656" width="116" height="54" fill="${theme.bg}" opacity="0.55" stroke="${theme.line}"/><text x="1038" y="679" fill="${theme.strong}" font-size="15" font-weight="800">节气</text><text x="1038" y="701" fill="${theme.muted}" font-size="15">夏至</text><rect x="1150" y="656" width="116" height="54" fill="${theme.bg}" opacity="0.55" stroke="${theme.line}"/><text x="1168" y="679" fill="${theme.strong}" font-size="15" font-weight="800">空亡</text><text x="1168" y="701" fill="${theme.muted}" font-size="15">寅卯</text></g>
  <text x="1170" y="836" fill="${theme.dim}" font-size="20" letter-spacing="8">${theme.stamp}</text>
</svg>`;
}

themes.forEach((theme, idx) => fs.writeFileSync(path.join(out, theme.file), make(theme, idx), 'utf8'));

