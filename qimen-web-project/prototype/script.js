/* ========================================
   奇门遁甲 · 渲染与交互
   MVP 逻辑：渲染九宫 + 基础动效 + 模式切换 + Tooltip
======================================== */

(function() {
  'use strict';

  const bureau = document.getElementById('bureau');
  const tooltip = document.getElementById('tooltip');
  const themeToggle = document.getElementById('themeToggle');
  const toggleLabel = themeToggle.querySelector('.toggle-label');

  // 当前主题
  let currentTheme = 'dark';

  /* ====== 渲染九宫格 ====== */
  function renderBureau() {
    bureau.innerHTML = '';

    BUREAU_DATA.palaces.forEach(palace => {
      const gong = createGong(palace);
      bureau.appendChild(gong);
    });
  }

  function createGong(palace) {
    const gong = document.createElement('div');
    gong.className = 'gong';
    gong.dataset.palaceId = palace.id;

    // 宫名
    const name = document.createElement('div');
    name.className = 'gong-name';
    name.textContent = `${palace.name} · ${palace.direction}`;
    gong.appendChild(name);

    // 中部：神盘 + 天盘
    const center = document.createElement('div');
    center.className = 'gong-center';

    if (palace.shenpan) {
      const shen = document.createElement('div');
      shen.className = 'shen';
      shen.style.setProperty('--shen-color', BUREAU_DATA.shenGlow[palace.shenpan] || BUREAU_DATA.shenGlow['值符']);
      shen.style.animationDelay = `${(palace.id * 0.7) % 10}s`;
      center.appendChild(shen);
    }

    if (palace.tianpan) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.setProperty('--star-color', BUREAU_DATA.wuxing[palace.element] || BUREAU_DATA.wuxing['土']);
      // 只显示一个字
      star.textContent = palace.tianpan.slice(-1);
      center.appendChild(star);
    }

    gong.appendChild(center);

    // 底部：八门 + 地盘
    const bottom = document.createElement('div');
    bottom.className = 'gong-bottom';

    if (palace.renpan) {
      const door = document.createElement('div');
      door.className = 'door';
      door.textContent = palace.renpan;
      const glowColor = BUREAU_DATA.doorGlow[palace.renpan] || 'transparent';
      door.style.setProperty('--door-glow-start', glowColor);
      door.style.setProperty('--door-glow-end', glowColor);
      door.style.setProperty('--door-color', glowColor);
      door.style.animationDelay = `${(palace.id * 0.4) % 5}s`;
      bottom.appendChild(door);
    }

    if (palace.dipan) {
      const dipan = document.createElement('div');
      dipan.className = 'dipan';
      dipan.textContent = palace.dipan;
      bottom.appendChild(dipan);
    }

    gong.appendChild(bottom);

    // 交互：悬停显示 tooltip
    gong.addEventListener('mouseenter', (e) => showTooltip(palace, e));
    gong.addEventListener('mousemove', (e) => moveTooltip(e));
    gong.addEventListener('mouseleave', () => hideTooltip());

    return gong;
  }

  /* ====== Tooltip ====== */
  function showTooltip(palace, e) {
    tooltip.innerHTML = `
      <span class="tooltip-name">${palace.name}宫 · ${palace.tianpan} · ${palace.renpan || '中宫无门'}</span>
      <div class="tooltip-meta">
        五行：${palace.element} · 吉凶：${palace.xing}
      </div>
      <div class="tooltip-desc">
        ${palace.leiXiang}
      </div>
    `;
    tooltip.classList.add('show');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const offset = 16;
    let x = e.clientX + offset;
    let y = e.clientY + offset;

    // 防止超出右边界
    if (x + 240 > window.innerWidth) {
      x = e.clientX - 240 - offset;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() {
    tooltip.classList.remove('show');
  }

  /* ====== 主题切换 ====== */
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'paper' : 'dark';
    document.querySelector('.app').dataset.theme = currentTheme;
    toggleLabel.textContent = currentTheme === 'dark' ? '暗色' : '宣纸';
  });

  /* ====== 启动 ====== */
  document.addEventListener('DOMContentLoaded', () => {
    renderBureau();
  });

})();

