(function () {
  "use strict";

  const body = document.body;
  const grid = document.getElementById("palaceGrid");
  const plateCanvas = document.getElementById("plateCanvas");
  const skyCanvas = document.getElementById("skyCanvas");
  const compassDial = document.getElementById("compassDial");
  const replayButton = document.getElementById("replayButton");
  const palaceNote = document.getElementById("palaceNote");
  const mobileNote = document.getElementById("mobileNote");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const staticMode = new URLSearchParams(window.location.search).get("static") === "1";
  const numberNames = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七", 8: "八", 9: "九" };

  let bureau = null;
  let introRun = 0;
  let runningAnimations = [];

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function duration(name) {
    const value = css(name);
    return value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
  }

  function register(animation) {
    runningAnimations.push(animation);
    return animation;
  }

  function cancelAnimations() {
    runningAnimations.forEach((animation) => animation.cancel());
    runningAnimations = [];
  }

  function animate(element, keyframes, options) {
    const animation = register(element.animate(keyframes, options));
    return animation.finished.catch(() => undefined);
  }

  async function animateGroup(elements, keyframes, options, stagger) {
    const jobs = elements.map((element, index) => animate(element, keyframes, {
      ...options,
      delay: (options.delay || 0) + index * stagger
    }));
    await Promise.all(jobs);
  }

  function renderBureau(data) {
    bureau = data;
    document.getElementById("bookEar").textContent = `${data.meta.dun}${numberNames[data.meta.ju]}局 · ${data.meta.cycle}`;
    document.getElementById("noteTitle").innerHTML = `${data.meta.headline[0]}<br>${data.meta.headline[1]}`;
    document.getElementById("noteSummary").textContent = data.meta.summary;
    document.getElementById("factBureau").textContent = `${data.meta.dun}${numberNames[data.meta.ju]}局`;
    document.getElementById("factStar").textContent = data.meta.dutyStar;
    document.getElementById("factDoor").textContent = data.meta.dutyDoor;

    grid.replaceChildren();
    data.palaces.forEach((palace) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `palace${palace.duty ? " is-duty" : ""}`;
      button.dataset.palace = String(palace.number);
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `${palace.trigram}${numberNames[palace.number]}宫，${palace.door}，${palace.star}，${palace.deity}`);
      button.innerHTML = `
        <span class="palace__number">${numberNames[palace.number]}</span>
        <span class="palace__trigram">${palace.trigram}</span>
        <span class="palace__layers">
          <span class="palace__stem">${palace.stem}</span>
          <span class="palace__door">${palace.door}</span>
          <span class="palace__star">${palace.star}</span>
          <span class="palace__deity">${palace.deity}</span>
        </span>
        ${palace.duty ? '<span class="palace__duty" aria-hidden="true"></span>' : ""}
      `;
      const activate = () => setActivePalace(palace, button);
      button.addEventListener("mouseenter", activate);
      button.addEventListener("focus", activate);
      button.addEventListener("click", activate);
      button.addEventListener("mouseleave", restoreDutyPalace);
      button.addEventListener("blur", restoreDutyPalace);
      grid.appendChild(button);
    });
    restoreDutyPalace();
  }

  function setActivePalace(palace, element) {
    document.querySelectorAll(".palace").forEach((cell) => cell.classList.toggle("is-active", cell === element));
    palaceNote.textContent = palace.note;
    mobileNote.textContent = `${palace.trigram}${numberNames[palace.number]}宫 · ${palace.star} · ${palace.door}`;
  }

  function restoreDutyPalace() {
    if (!bureau) return;
    const duty = bureau.palaces.find((palace) => palace.duty);
    const dutyElement = grid.querySelector(`[data-palace="${duty.number}"]`);
    setActivePalace(duty, dutyElement);
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { context, size: rect.width, center: rect.width / 2 };
  }

  function drawPlate() {
    const { context, size, center } = prepareCanvas(plateCanvas);
    context.clearRect(0, 0, size, size);
    context.strokeStyle = css("--rule");
    context.lineWidth = 1;

    [0.46, 0.39, 0.31].forEach((ratio) => {
      context.beginPath();
      context.arc(center, center, size * ratio, 0, Math.PI * 2);
      context.stroke();
    });

    context.strokeStyle = css("--celadon");
    context.globalAlpha = 0.52;
    context.lineWidth = Math.max(9, size * 0.025);
    context.beginPath();
    context.arc(center, center, size * 0.425, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;

    context.strokeStyle = css("--rule-soft");
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(center, size * 0.1);
    context.lineTo(center, size * 0.9);
    context.moveTo(size * 0.1, center);
    context.lineTo(size * 0.9, center);
    context.stroke();
  }

  function drawSky() {
    const { context, size, center } = prepareCanvas(skyCanvas);
    context.clearRect(0, 0, size, size);
    context.strokeStyle = css("--ink-soft");
    context.lineWidth = 1;
    const inner = size * 0.445;
    const outer = size * 0.465;
    for (let index = 0; index < 48; index += 1) {
      const angle = (Math.PI * 2 * index) / 48 - Math.PI / 2;
      const start = index % 6 === 0 ? inner - size * 0.012 : inner;
      context.beginPath();
      context.moveTo(center + Math.cos(angle) * start, center + Math.sin(angle) * start);
      context.lineTo(center + Math.cos(angle) * outer, center + Math.sin(angle) * outer);
      context.stroke();
    }
  }

  function drawInstrument() {
    drawPlate();
    drawSky();
  }

  function setSettled() {
    body.classList.remove("is-playing");
    body.classList.add("is-settled");
    document.querySelectorAll(".folio__frame, .folio__fold, .book-ear, .palace, .palace__layers, .palace__duty, .instrument__dial, .instrument__index, .axis").forEach((element) => {
      element.style.opacity = "";
      element.style.transform = "";
    });
  }

  async function playIntro() {
    introRun += 1;
    const run = introRun;
    cancelAnimations();
    body.classList.remove("is-settled");
    body.classList.add("is-playing");

    if (reduceMotion.matches) {
      setSettled();
      return;
    }

    const paper = duration("--stage-paper");
    const frame = duration("--stage-frame");
    const ground = duration("--stage-ground");
    const sky = duration("--stage-sky");
    const dial = duration("--stage-dial");
    const seal = duration("--stage-seal");
    const easeInk = css("--ease-ink");
    const easeSettle = css("--ease-settle");
    const easeCalibrate = css("--ease-calibrate");

    await animate(document.querySelector(".page-shell"), [
      { opacity: 0.28 },
      { opacity: 1 }
    ], { duration: paper, easing: easeInk, fill: "both" });
    if (run !== introRun) return;

    await Promise.all([
      animate(document.querySelector(".folio__frame"), [
        { opacity: 0, clipPath: "inset(0 100% 0 0)" },
        { opacity: 1, clipPath: "inset(0 0 0 0)" }
      ], { duration: frame, easing: easeInk, fill: "both" }),
      animate(document.querySelector(".folio__fold"), [
        { opacity: 0, transform: "scaleY(0)" },
        { opacity: 1, transform: "scaleY(1)" }
      ], { duration: frame, easing: easeInk, fill: "both" }),
      animate(document.querySelector(".book-ear"), [
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: frame, easing: easeInk, fill: "both" }),
      animate(compassDial, [
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: frame, easing: easeInk, fill: "both" }),
      animateGroup(Array.from(document.querySelectorAll(".instrument__ring")), [
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: frame, easing: easeInk, fill: "both" }, 90)
    ]);
    if (run !== introRun) return;

    const palaceElements = Array.from(document.querySelectorAll(".palace"));
    await animateGroup(palaceElements, [
      { opacity: 0, transform: "translateY(5px)", color: "transparent" },
      { opacity: 1, transform: "translateY(0)", color: css("--ink") }
    ], { duration: ground - 420, easing: easeInk, fill: "both" }, 52);
    if (run !== introRun) return;

    const layerElements = Array.from(document.querySelectorAll(".palace__layers"));
    await Promise.all([
      animate(compassDial, [
        { opacity: 0.32, transform: "rotate(-12deg)" },
        { opacity: 1, transform: "rotate(-4deg)" }
      ], { duration: sky, easing: easeCalibrate, fill: "both" }),
      animateGroup(layerElements, [
        { opacity: 0, transform: "translateY(4px) rotate(-3deg)" },
        { opacity: 1, transform: "translateY(0) rotate(0deg)" }
      ], { duration: sky - 420, easing: easeSettle, fill: "both" }, 45)
    ]);
    if (run !== introRun) return;

    await Promise.all([
      animate(compassDial, [
        { opacity: 1, transform: "rotate(-4deg)" },
        { opacity: 1, transform: "rotate(0.8deg)", offset: 0.82 },
        { opacity: 1, transform: "rotate(0deg)" }
      ], { duration: dial, easing: easeCalibrate, fill: "both" }),
      animate(document.querySelector(".folio__light"), [
        { opacity: 0, transform: "translateX(0) skewX(-8deg)" },
        { opacity: 0.42, offset: 0.45 },
        { opacity: 0, transform: "translateX(430%) skewX(-8deg)" }
      ], { duration: dial, easing: easeInk, fill: "both" })
    ]);
    if (run !== introRun) return;

    const dutyMark = document.querySelector(".palace__duty");
    await Promise.all([
      animate(dutyMark, [
        { opacity: 0, transform: "scale(0.74)" },
        { opacity: 1, transform: "scale(1)" }
      ], { duration: seal, easing: easeSettle, fill: "both" }),
      animate(document.querySelector(".axis"), [
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: seal, easing: easeInk, fill: "both" }),
      animate(document.querySelector(".instrument__index"), [
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: seal, easing: easeInk, fill: "both" })
    ]);

    if (run === introRun) setSettled();
  }

  async function loadBureau() {
    const response = await fetch("data/bureau.json?v=3.3");
    if (!response.ok) throw new Error(`Failed to load bureau data: ${response.status}`);
    renderBureau(await response.json());
    drawInstrument();
    if (staticMode) setSettled();
    else await playIntro();
  }

  replayButton.addEventListener("click", playIntro);
  reduceMotion.addEventListener("change", playIntro);
  window.addEventListener("resize", drawInstrument);

  loadBureau().catch((error) => {
    console.error(error);
    body.classList.add("is-settled");
    palaceNote.textContent = "局盘数据暂未载入，请稍后重试。";
  });
}());

