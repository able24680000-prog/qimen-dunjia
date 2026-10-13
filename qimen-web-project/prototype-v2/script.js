(function () {
  "use strict";

  const page = document.querySelector(".page");
  const instrument = document.getElementById("instrument");
  const grid = document.getElementById("qimenGrid");
  const cells = Array.from(document.querySelectorAll(".qimen-grid__cell"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const luoshuPath = [4, 9, 2, 7, 6, 1, 8, 3];
  const palacePosition = {
    4: { x: 1 / 6, y: 1 / 6, angle: -44 },
    9: { x: 3 / 6, y: 1 / 6, angle: -8 },
    2: { x: 5 / 6, y: 1 / 6, angle: 28 },
    7: { x: 5 / 6, y: 3 / 6, angle: 72 },
    6: { x: 5 / 6, y: 5 / 6, angle: 122 },
    1: { x: 3 / 6, y: 5 / 6, angle: 176 },
    8: { x: 1 / 6, y: 5 / 6, angle: -136 },
    3: { x: 1 / 6, y: 3 / 6, angle: -88 }
  };

  let activeIndex = 0;
  let timer = null;
  let stepDuration = 3000;

  function setActivePalace(palace) {
    const position = palacePosition[palace];
    const rect = grid.getBoundingClientRect();
    const x = rect.width * position.x;
    const y = rect.height * position.y;

    grid.style.setProperty("--dot-x", `${x}px`);
    grid.style.setProperty("--dot-y", `${y}px`);
    instrument.style.setProperty("--needle-angle", `${position.angle}deg`);

    cells.forEach((cell) => {
      cell.classList.toggle("is-lit", Number(cell.dataset.palace) === palace);
    });
  }

  function advanceLuoshu() {
    activeIndex = (activeIndex + 1) % luoshuPath.length;
    setActivePalace(luoshuPath[activeIndex]);
  }

  function syncActivePosition() {
    setActivePalace(luoshuPath[activeIndex]);
  }

  function startMotion() {
    syncActivePosition();

    if (reduceMotion) {
      return;
    }

    const rootStyle = window.getComputedStyle(document.documentElement);
    const configuredStep = rootStyle.getPropertyValue("--luoshu-step").trim();
    const parsedStep = Number.parseFloat(configuredStep);

    if (Number.isFinite(parsedStep) && configuredStep.endsWith("ms")) {
      stepDuration = parsedStep;
    }

    timer = window.setInterval(advanceLuoshu, stepDuration);
  }

  function stopMotion() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  window.addEventListener("load", () => {
    page.classList.add("is-ready");
    startMotion();
  });

  window.addEventListener("resize", syncActivePosition);
  window.addEventListener("beforeunload", stopMotion);
})();

