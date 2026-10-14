/* =========================================================
   Mecfupi do Brasil — Interações
   ========================================================= */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var WA = "https://wa.me/5511998249580?text=";

  function svgEl(tag, attrs, parent) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function mod(a, n) { return ((a % n) + n) % n; }

  /* Observa visibilidade para pausar animações fora da tela */
  function whenVisible(el, cb) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }, { threshold: 0.05 }).observe(el);
  }

  /* =========================================================
     Engrenagens: gerador de perfil (polígono de dentes)
     ========================================================= */
  function gearPath(z, rRoot, rTip) {
    var pa = (Math.PI * 2) / z, d = "";
    for (var i = 0; i < z; i++) {
      var c = i * pa;
      var pts = [[rRoot, c - pa * 0.27], [rTip, c - pa * 0.13], [rTip, c + pa * 0.13], [rRoot, c + pa * 0.27]];
      pts.forEach(function (p, j) {
        var x = (p[0] * Math.cos(p[1])).toFixed(2), y = (p[0] * Math.sin(p[1])).toFixed(2);
        d += (i === 0 && j === 0 ? "M" : "L") + x + " " + y + " ";
      });
    }
    return d + "Z";
  }
  function circlePath(r) { return "M" + r + " 0 A" + r + " " + r + " 0 1 0 " + -r + " 0 A" + r + " " + r + " 0 1 0 " + r + " 0 Z"; }

  /*
    Conjunto planetário: solar (Zs=30), 3 satélites (Zp=15), coroa interna (Zr=60), módulo 4.
    Relação de Willis: ωs·Zs + ωr·Zr = ωc·(Zs+Zr)  →  ωr = 1,5·ωc − 0,5·ωs
  */
  var ZS = 30, ZP = 15, ZR = 60, M = 4;
  var RS = ZS * M / 2, RP = ZP * M / 2, RR = ZR * M / 2, RC = RS + RP;

  function buildPlanetary(svg, withDefs) {
    if (withDefs) {
      var defs = svgEl("defs", {}, svg);
      var g1 = svgEl("radialGradient", { id: "gSun", cx: "40%", cy: "35%", r: "70%" }, defs);
      svgEl("stop", { offset: "0%", "stop-color": "#ff8a93" }, g1);
      svgEl("stop", { offset: "55%", "stop-color": "#e63946" }, g1);
      svgEl("stop", { offset: "100%", "stop-color": "#7a1219" }, g1);
      var g2 = svgEl("radialGradient", { id: "gMetal", cx: "35%", cy: "30%", r: "80%" }, defs);
      svgEl("stop", { offset: "0%", "stop-color": "#f4f4f8" }, g2);
      svgEl("stop", { offset: "50%", "stop-color": "#a8a8b3" }, g2);
      svgEl("stop", { offset: "100%", "stop-color": "#4a4a55" }, g2);
      var g3 = svgEl("linearGradient", { id: "gRing", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
      svgEl("stop", { offset: "0%", "stop-color": "#5d5d6b" }, g3);
      svgEl("stop", { offset: "50%", "stop-color": "#2b2b35" }, g3);
      svgEl("stop", { offset: "100%", "stop-color": "#4d4d5a" }, g3);
    }

    // Coroa
    var ringG = svgEl("g", {}, svg);
    svgEl("path", { class: "pl-ring", "fill-rule": "evenodd", d: circlePath(RR + 22) + " " + gearPath(ZR, RR + 1.25 * M, RR - M) }, ringG);
    for (var k = 0; k < 6; k++) {
      var a = k * Math.PI / 3;
      svgEl("circle", { class: "pl-mark", cx: ((RR + 12) * Math.cos(a)).toFixed(2), cy: ((RR + 12) * Math.sin(a)).toFixed(2), r: 3 }, ringG);
    }
    svgEl("circle", { class: "pl-glow pl-glow-ring", r: RR + 27 }, svg);

    // Porta-satélites (placa atrás dos satélites)
    var carrierG = svgEl("g", {}, svg);
    var tri = [0, 1, 2].map(function (i) {
      var t = (i * 120 - 90) * Math.PI / 180;
      return (RC * Math.cos(t)).toFixed(2) + " " + (RC * Math.sin(t)).toFixed(2);
    });
    svgEl("path", { class: "pl-carrier", d: "M" + tri.join(" L") + " Z", "stroke-linejoin": "round", style: "stroke-width:34;stroke-opacity:.4" }, carrierG);
    svgEl("circle", { class: "pl-glow pl-glow-carrier", r: RC }, svg);

    // Satélites
    var planets = [];
    var planetD = gearPath(ZP, RP - 1.25 * M, RP + M);
    for (var i = 0; i < 3; i++) {
      var pg = svgEl("g", {}, svg);
      svgEl("path", { class: "pl-planet", d: planetD }, pg);
      svgEl("circle", { class: "pl-pin", r: 7 }, pg);
      svgEl("circle", { class: "pl-mark", cx: 17, cy: 0, r: 2.5 }, pg);
      var theta = i * 120 - 90;
      // fase inicial para os dentes engrenarem com a solar
      var psi = theta + 168 + 2 * mod(theta, 12);
      planets.push({ el: pg, theta: theta, psi: psi });
    }

    // Solar
    var sunG = svgEl("g", {}, svg);
    svgEl("path", { class: "pl-sun", d: gearPath(ZS, RS - 1.25 * M, RS + M) }, sunG);
    svgEl("circle", { class: "pl-hub", r: 18 }, sunG);
    for (var s = 0; s < 3; s++) {
      var b = s * 2 * Math.PI / 3;
      svgEl("circle", { class: "pl-mark", cx: (38 * Math.cos(b)).toFixed(2), cy: (38 * Math.sin(b)).toFixed(2), r: 3.5 }, sunG);
    }

    // fase da coroa para engrenar com o satélite 0
    var p0 = planets[0];
    var delta = mod(p0.theta - p0.psi, 360 / ZP);
    var ringPhase = p0.theta + ((360 / ZP) / 2 - delta) * (RP / RR);

    return function render(S, C, R, P) {
      sunG.setAttribute("transform", "rotate(" + S.toFixed(2) + ")");
      ringG.setAttribute("transform", "rotate(" + (R + ringPhase).toFixed(2) + ")");
      carrierG.setAttribute("transform", "rotate(" + C.toFixed(2) + ")");
      for (var j = 0; j < 3; j++) {
        var p = planets[j], t = (p.theta + C) * Math.PI / 180;
        p.el.setAttribute("transform", "translate(" + (RC * Math.cos(t)).toFixed(2) + " " + (RC * Math.sin(t)).toFixed(2) + ") rotate(" + (p.psi + P).toFixed(2) + ")");
      }
    };
  }

  /* =========================================================
     Simulador do câmbio automático
     ========================================================= */
  function initSimulator() {
    var svg = document.getElementById("planetary");
    if (!svg) return;
    var render = buildPlanetary(svg, true);

    var sim = document.getElementById("sim");
    var shifter = sim.querySelector(".shifter");
    var btns = Array.prototype.slice.call(sim.querySelectorAll(".shift-btn"));
    var pedal = document.getElementById("pedal");
    var elGear = document.getElementById("simGear");
    var elSpeed = document.getElementById("simSpeed");
    var elRpm = document.getElementById("simRpm");
    var needle = document.getElementById("tachNeedle");
    var elStatus = document.getElementById("simStatus");
    var elTag = document.getElementById("simModeTag");
    var lockBadge = document.getElementById("lockBadge");
    var lockText = document.getElementById("lockText");
    var stSun = document.getElementById("stSun"), stCarrier = document.getElementById("stCarrier"), stRing = document.getElementById("stRing");

    var MODES = ["P", "R", "N", "D"];
    var RATIOS = [3.0, 2.05, 1.45, 1.0, 0.78, 0.64];
    var ACCEL = [15, 11, 8, 6, 4.5, 3.2];
    var OUT_PER_KMH = 8.547 * 4.1; // rpm na saída do câmbio por km/h (pneu 1,95 m, diferencial 4,1)
    var IDLE = 800, SHIFT_UP = 3200, SHIFT_DOWN = 1150, VMAX = 125, K = 0.09;
    var SWEEP = 108.4; // meia abertura do conta-giros em graus

    var st = { mode: "P", gear: 1, v: 0, rpm: IDLE, throttle: false, S: 0, C: 0, R: 0, P: 0, demo: !reduceMotion, msg: "", msgKind: "", msgUntil: 0, lastKey: "" };

    // Conta-giros: marcações e faixa vermelha
    var ticks = document.getElementById("tachTicks");
    function tachPoint(rpm, r) {
      var a = (-SWEEP + 2 * SWEEP * rpm / 7000) * Math.PI / 180;
      return [100 + r * Math.sin(a), 82 - r * Math.cos(a)];
    }
    for (var t = 0; t <= 7; t++) {
      var p1 = tachPoint(t * 1000, 70), p2 = tachPoint(t * 1000, 78), pl = tachPoint(t * 1000, 58);
      svgEl("line", { class: "tach-tick", x1: p1[0].toFixed(1), y1: p1[1].toFixed(1), x2: p2[0].toFixed(1), y2: p2[1].toFixed(1) }, ticks);
      svgEl("text", { class: "tach-num", x: pl[0].toFixed(1), y: (pl[1] + 4).toFixed(1), "text-anchor": "middle" }, ticks).textContent = t;
    }
    var rs = tachPoint(6000, 82), re = tachPoint(7000, 82);
    sim.querySelector(".tach-red").setAttribute("d", "M " + rs[0].toFixed(1) + " " + rs[1].toFixed(1) + " A 82 82 0 0 1 " + re[0].toFixed(1) + " " + re[1].toFixed(1));

    var STATUS = {
      P: "P · Estacionamento: a trava bloqueia a saída do câmbio. O motor gira a solar, mas nada chega às rodas.",
      R: "R · Ré: o porta-satélites é travado e a coroa passa a girar ao contrário. O carro anda para trás.",
      N: "N · Neutro: nenhum elemento é travado. As engrenagens giram soltas e a força não chega às rodas.",
      D0: "D · Parado: o conversor de torque desliza. O motor gira, o câmbio espera. Segure o acelerador.",
      D1: "1ª · Coroa travada pelo freio: redução máxima (3,0:1), muita força para sair.",
      D2: "2ª · Embreagens deixam a coroa girar devagar: redução menor (2,05:1).",
      D3: "3ª · Coroa mais rápida, menos redução (1,45:1). O carro ganha velocidade.",
      D4: "4ª · Embreagem une solar e coroa: tudo gira junto (1:1), transmissão direta.",
      D5: "5ª · Overdrive: a saída gira mais rápido que o motor (0,78:1). Economia na estrada.",
      D6: "6ª · Overdrive máximo (0,64:1): giro baixo em velocidade de cruzeiro."
    };

    function setMode(m) {
      st.mode = m;
      if (m === "D") st.gear = 1;
      shifter.style.setProperty("--pos", MODES.indexOf(m));
      btns.forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.mode === m)); });
    }

    function showMsg(text, kind) {
      st.msg = text;
      st.msgKind = kind || "warn";
      st.msgUntil = performance.now() + 2800;
    }

    function requestMode(m) {
      if (m === st.mode) return;
      var moving = st.v > 3;
      if (moving && (m === "P" || m === "R" || st.mode === "R")) {
        showMsg("Atenção: nunca engate P ou R com o carro andando. Pare totalmente antes.");
        shifter.classList.remove("shake"); void shifter.offsetWidth; shifter.classList.add("shake");
        return;
      }
      setMode(m);
    }

    function stopDemo() {
      if (!st.demo) return;
      st.demo = false;
      st.throttle = false;
      pedal.classList.remove("is-pressed");
      sim.classList.add("is-live");
      elTag.textContent = "VOCÊ NO CONTROLE";
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () { stopDemo(); requestMode(b.dataset.mode); });
    });
    shifter.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault(); stopDemo();
      var i = MODES.indexOf(st.mode) + (e.key === "ArrowDown" ? 1 : -1);
      i = Math.max(0, Math.min(3, i));
      requestMode(MODES[i]);
      btns[MODES.indexOf(st.mode)].focus();
    });

    function press(on) {
      st.throttle = on;
      pedal.classList.toggle("is-pressed", on);
    }

    // Acelerador do visitante: em P/N o carro não anda, então engatamos o D e avisamos
    var pressedAt = 0;
    function pedalDown() {
      stopDemo();
      if ((st.mode === "P" || st.mode === "N") && st.v < 3) {
        setMode("D");
        showMsg("Engatamos o D para você. Continue segurando para acelerar!", "hint");
      }
      pressedAt = performance.now();
      press(true);
    }
    function pedalUp() {
      if (st.demo || !st.throttle) return;
      press(false);
      if (performance.now() - pressedAt < 350) showMsg("Segure o botão pressionado: quanto mais tempo, mais o carro acelera.", "hint");
    }
    pedal.addEventListener("pointerdown", function (e) {
      pedalDown();
      try { pedal.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) {
      pedal.addEventListener(ev, pedalUp);
    });
    pedal.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    pedal.addEventListener("keydown", function (e) {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); pedalDown(); }
    });
    pedal.addEventListener("keyup", function (e) {
      if (e.key === " " || e.key === "Enter") pedalUp();
    });
    sim.addEventListener("pointerdown", stopDemo);

    // Roteiro da demonstração automática
    var DEMO = [
      { m: "P", t: false, d: 1600 }, { m: "D", t: true, d: 11000 }, { m: "D", t: false, d: 9800 },
      { m: "N", t: true, d: 1400 }, { m: "N", t: false, d: 1000 }, { m: "R", t: true, d: 2200 }, { m: "R", t: false, d: 1800 }
    ];
    var demoIdx = -1, demoUntil = 0;
    function runDemo(now) {
      if (!st.demo || now < demoUntil) return;
      demoIdx = (demoIdx + 1) % DEMO.length;
      var step = DEMO[demoIdx];
      requestMode(step.m);
      press(step.t);
      demoUntil = now + step.d;
    }

    function physics(dt) {
      var target, ws, wc;
      if (st.mode === "D") {
        if (st.throttle) st.v = Math.min(VMAX, st.v + ACCEL[st.gear - 1] * dt);
        else st.v = Math.max(0, st.v - 12 * dt);
        var out = st.v * OUT_PER_KMH;
        var turbine = out * RATIOS[st.gear - 1];
        if (turbine > SHIFT_UP && st.gear < 6) { st.gear++; turbine = out * RATIOS[st.gear - 1]; }
        if (!st.throttle && turbine < SHIFT_DOWN && st.gear > 1) { st.gear--; turbine = out * RATIOS[st.gear - 1]; }
        if (st.v < 1) st.gear = 1;
        target = st.throttle ? Math.max(turbine * 1.04, 1850) : Math.max(turbine, IDLE);
        ws = turbine; wc = out;
      } else if (st.mode === "R") {
        if (st.throttle) st.v = Math.min(15, st.v + 4 * dt);
        else st.v = Math.max(0, st.v - 6 * dt);
        var outR = st.v * OUT_PER_KMH;
        ws = outR * (ZR / ZS); wc = 0;
        target = st.throttle ? Math.max(ws, 1850) : Math.max(ws, IDLE);
      } else {
        st.v = Math.max(0, st.v - 3 * dt);
        target = st.throttle ? 4300 : IDLE;
        wc = st.mode === "N" ? st.v * OUT_PER_KMH : 0;
        ws = null;
      }
      var k = target > st.rpm ? (st.mode === "D" || st.mode === "R" ? 10 : 3) : 3;
      st.rpm += (target - st.rpm) * Math.min(1, dt * k);
      if (ws === null) ws = st.rpm; // em P/N a solar gira com o motor, sem carga
      var wr = 1.5 * wc - 0.5 * ws;
      var wp = wc - (ZS / ZP) * (ws - wc);
      st.S = mod(st.S + ws * K * dt, 360);
      st.C = mod(st.C + wc * K * dt, 360);
      st.R = mod(st.R + wr * K * dt, 360);
      st.P = mod(st.P + wp * K * dt, 360);
    }

    function updateUi(now) {
      render(st.S, st.C, st.R, st.P);
      var moving = st.v >= 1;
      var gearLabel = st.mode === "D" ? (moving || st.throttle ? "D" + st.gear : "D") : st.mode;
      elGear.textContent = gearLabel;
      elSpeed.textContent = Math.round(st.v);
      var rpmShown = Math.round(st.rpm / 50) * 50;
      elRpm.textContent = fmt(rpmShown) + " RPM";
      var ang = -SWEEP + 2 * SWEEP * Math.min(st.rpm, 7000) / 7000;
      needle.setAttribute("transform", "rotate(" + ang.toFixed(1) + " 100 82)");

      var key = st.mode === "D" ? (moving || st.throttle ? "D" + st.gear : "D0") : st.mode;
      var msg = now < st.msgUntil ? st.msg : "";
      var fullKey = key + "|" + msg;
      if (fullKey === st.lastKey) return;
      st.lastKey = fullKey;

      elStatus.classList.toggle("warn", !!msg && st.msgKind === "warn");
      elStatus.classList.toggle("hint", !!msg && st.msgKind === "hint");
      elStatus.textContent = msg || STATUS[key];

      var held = "none", lock = "";
      var sun = "girando", carrier = "parado", ring = "livre";
      if (st.mode === "P") { held = "carrier"; lock = "Trava de estacionamento"; carrier = "travado"; }
      else if (st.mode === "R") { held = "carrier"; lock = "Porta-satélites travado"; sun = "entrada"; carrier = "travado"; ring = "saída (ré)"; }
      else if (st.mode === "N") { carrier = st.v > 1 ? "gira com as rodas" : "parado"; }
      else {
        sun = "entrada"; carrier = "saída";
        if (key === "D0") { sun = "parada"; carrier = "parado"; ring = "parada"; }
        else if (st.gear === 1) { held = "ring"; lock = "Coroa travada"; ring = "travada"; }
        else if (st.gear === 4) { lock = "Conjunto travado 1:1"; ring = "acoplada"; }
        else ring = st.gear > 4 ? "acelerada" : "controlada";
      }
      svg.setAttribute("data-held", held);
      lockBadge.classList.toggle("show", !!lock);
      if (lock) lockText.textContent = lock;
      stSun.textContent = sun; stCarrier.textContent = carrier; stRing.textContent = ring;
      stCarrier.classList.toggle("is-held", carrier === "travado");
      stRing.classList.toggle("is-held", ring === "travada");
    }

    var running = false, last = 0, raf;
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      runDemo(now);
      physics(dt);
      updateUi(now);
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); if (!st.demo) press(false); }

    setMode("P");
    updateUi(performance.now());
    if (st.demo) sim.classList.remove("is-live"); else { sim.classList.add("is-live"); elTag.textContent = "VOCÊ NO CONTROLE"; }
    whenVisible(sim, function (v) { if (v && !document.hidden) start(); else stop(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });

    // Inclinação 3D acompanhando o mouse
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
      var wrap = sim.parentElement;
      wrap.addEventListener("pointermove", function (e) {
        var r = wrap.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        sim.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
        sim.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
      });
      wrap.addEventListener("pointerleave", function () {
        sim.style.setProperty("--ry", "0deg"); sim.style.setProperty("--rx", "0deg");
      });
    }
  }

  /* =========================================================
     Raio-X do câmbio
     ========================================================= */
  var PARTS = [
    { id: "conversor", name: "Conversor de torque", what: "Faz a ligação hidráulica entre o motor e o câmbio. Multiplica a força na saída e permite que o carro fique parado engatado em D sem morrer.", signs: ["Trepidação em velocidade constante", "Carro \"sem força\" na saída", "Superaquecimento do câmbio"] },
    { id: "bomba", name: "Bomba de óleo", what: "Gera a pressão hidráulica que comanda as trocas e lubrifica todo o câmbio. Sem pressão, nada funciona.", signs: ["Zumbido que acompanha o giro do motor", "Demora para engatar D ou R", "Trocas fracas ou patinando"] },
    { id: "embreagens", name: "Pacotes de embreagens", what: "Conjuntos de discos de fricção que acoplam e soltam partes do conjunto planetário para formar cada marcha.", signs: ["Câmbio patinando: o giro sobe e o carro não acompanha", "Cheiro de queimado", "Marcha que \"some\" em subida"] },
    { id: "planetario", name: "Conjuntos planetários", what: "Solar, satélites e coroa. Combinando qual elemento gira e qual fica travado, o câmbio forma todas as marchas, inclusive a ré.", signs: ["Ruído metálico ou zumbido em marchas específicas", "Vibração anormal", "Limalha no óleo"] },
    { id: "valvulas", name: "Corpo de válvulas", what: "O \"cérebro hidráulico\" do câmbio: um labirinto de canais e válvulas que direciona o óleo para cada embreagem na hora certa.", signs: ["Trancos nas trocas", "Trocas fora de hora ou bruscas", "Engate de ré com pancada"] },
    { id: "solenoides", name: "Solenoides", what: "Válvulas elétricas comandadas pelo módulo. Controlam a pressão e o momento exato de cada troca de marcha.", signs: ["Luz de falha no painel", "Câmbio preso em uma marcha (modo de emergência)", "Trocas irregulares"] },
    { id: "modulo", name: "Módulo eletrônico (TCM)", what: "O computador do câmbio. Lê velocidade, giro, posição do acelerador e temperatura para decidir cada troca.", signs: ["Falhas intermitentes", "Modo de emergência sem motivo aparente", "Trocas erráticas"] },
    { id: "trava", name: "Trava de estacionamento", what: "Uma lingueta que encaixa numa engrenagem do eixo de saída quando você coloca em P, segurando o carro parado.", signs: ["Alavanca dura para sair do P em ladeira", "Estalo forte ao sair do P", "Carro se movendo em P"] },
    { id: "oleo", name: "Óleo ATF", what: "Não é só lubrificante: transmite força no conversor, aciona as embreagens e refrigera o câmbio. Cada câmbio pede uma especificação.", signs: ["Óleo escuro ou com cheiro de queimado", "Manchas de vazamento no chão", "Trancos que pioram com o câmbio quente"] }
  ];

  function initXray() {
    var board = document.querySelector(".xray-board");
    if (!board) return;
    var panel = document.getElementById("xrayPanel");
    var elName = document.getElementById("xrayName"), elWhat = document.getElementById("xrayWhat"), elSigns = document.getElementById("xraySigns");
    var elCount = document.getElementById("xrayCount"), cta = document.getElementById("xrayCta");
    var idx = 0, touched = false, timer;

    function select(i, user) {
      idx = mod(i, PARTS.length);
      if (user) touched = true;
      var p = PARTS[idx];
      board.querySelectorAll("[data-part]").forEach(function (el) { el.classList.toggle("active", el.getAttribute("data-part") === p.id); });
      board.querySelectorAll(".hotspot").forEach(function (h) { h.setAttribute("aria-pressed", String(h.getAttribute("data-part") === p.id)); });
      elName.textContent = p.name;
      elWhat.textContent = p.what;
      elSigns.innerHTML = "";
      p.signs.forEach(function (s) { var li = document.createElement("li"); li.textContent = s; elSigns.appendChild(li); });
      elCount.textContent = String(idx + 1).padStart(2, "0") + " / " + String(PARTS.length).padStart(2, "0");
      cta.href = WA + encodeURIComponent("Olá! Vi no Raio-X do site a parte sobre " + p.name.toLowerCase() + " e acho que meu carro está com esses sinais. Podem avaliar?");
      panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    }

    board.addEventListener("click", function (e) {
      var t = e.target.closest("[data-part]");
      if (!t) return;
      var id = t.getAttribute("data-part");
      for (var i = 0; i < PARTS.length; i++) if (PARTS[i].id === id) select(i, true);
    });
    document.getElementById("xrayPrev").addEventListener("click", function () { select(idx - 1, true); });
    document.getElementById("xrayNext").addEventListener("click", function () { select(idx + 1, true); });

    select(0, false);
    // Avança sozinho enquanto o visitante só observa
    whenVisible(board, function (v) {
      clearInterval(timer);
      if (v && !touched && !reduceMotion) timer = setInterval(function () { if (touched) clearInterval(timer); else select(idx + 1, false); }, 5000);
    });
  }

  /* =========================================================
     Tipos de câmbio: abas + animações
     ========================================================= */
  function initTypes() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".type-tab"));
    if (!tabs.length) return;
    var current = "conv";

    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      current = tab.id.replace("tab-", "");
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          activate(tabs[mod(i + (e.key === "ArrowRight" ? 1 : -1), tabs.length)], true);
        }
      });
    });

    // Convencional: mini conjunto planetário (1ª marcha, coroa travada)
    var convSvg = document.getElementById("typeConv");
    var renderConv = buildPlanetary(convSvg, false);
    convSvg.setAttribute("data-held", "ring");
    convSvg.classList.add("planetary");
    var conv = { S: 0, C: 0, P: 0 };

    // CVT: duas polias de diâmetro variável e correia
    var cvtSvg = document.getElementById("typeCvt");
    var defs = svgEl("defs", {}, cvtSvg);
    var gm = svgEl("radialGradient", { id: "gMetalC", cx: "35%", cy: "30%", r: "80%" }, defs);
    svgEl("stop", { offset: "0%", "stop-color": "#e9e9f1" }, gm);
    svgEl("stop", { offset: "60%", "stop-color": "#8a8a96" }, gm);
    svgEl("stop", { offset: "100%", "stop-color": "#3d3d48" }, gm);
    var AX = 95, BX = 265, CY = 112, SUM = 112;
    var pulA = svgEl("circle", { class: "cvt-pulley", cx: AX, cy: CY }, cvtSvg);
    var pulB = svgEl("circle", { class: "cvt-pulley", cx: BX, cy: CY }, cvtSvg);
    var belt = svgEl("path", { class: "cvt-belt" }, cvtSvg);
    var spokeA = svgEl("path", { class: "cvt-hub", d: "M-10 0 H10 M0 -10 V10", "stroke-width": "3" }, cvtSvg);
    var spokeB = svgEl("path", { class: "cvt-hub", d: "M-10 0 H10 M0 -10 V10", "stroke-width": "3" }, cvtSvg);
    svgEl("circle", { class: "cvt-hub", cx: AX, cy: CY, r: 12 }, cvtSvg);
    svgEl("circle", { class: "cvt-hub", cx: BX, cy: CY, r: 12 }, cvtSvg);
    cvtSvg.appendChild(spokeA); cvtSvg.appendChild(spokeB);
    svgEl("text", { class: "cvt-label", x: AX, y: 222, "text-anchor": "middle" }, cvtSvg).textContent = "POLIA DO MOTOR";
    svgEl("text", { class: "cvt-label", x: BX, y: 222, "text-anchor": "middle" }, cvtSvg).textContent = "POLIA DAS RODAS";
    var cvtRatio = document.getElementById("cvtRatio");
    var cvt = { t: 0, a: 0, b: 0, off: 0 };

    function drawCvt(rA, rB) {
      pulA.setAttribute("r", (rA + 9).toFixed(1));
      pulB.setAttribute("r", (rB + 9).toFixed(1));
      var d = BX - AX, phi = Math.asin((rA - rB) / d), sn = Math.sin(phi), cs = Math.cos(phi);
      var a1 = [AX + rA * sn, CY - rA * cs], b1 = [BX + rB * sn, CY - rB * cs];
      var b2 = [BX + rB * sn, CY + rB * cs], a2 = [AX + rA * sn, CY + rA * cs];
      var largeA = phi > 0 ? 1 : 0, largeB = phi > 0 ? 0 : 1;
      belt.setAttribute("d",
        "M" + a1[0].toFixed(1) + " " + a1[1].toFixed(1) + " L" + b1[0].toFixed(1) + " " + b1[1].toFixed(1) +
        " A" + rB.toFixed(1) + " " + rB.toFixed(1) + " 0 " + largeB + " 1 " + b2[0].toFixed(1) + " " + b2[1].toFixed(1) +
        " L" + a2[0].toFixed(1) + " " + a2[1].toFixed(1) +
        " A" + rA.toFixed(1) + " " + rA.toFixed(1) + " 0 " + largeA + " 1 " + a1[0].toFixed(1) + " " + a1[1].toFixed(1) + " Z");
    }

    // Dupla embreagem
    var dctSvg = document.getElementById("typeDct");
    var clutch1 = svgEl("circle", { class: "dct-clutch", cx: 52, cy: 72, r: 30 }, dctSvg);
    var clutch2 = svgEl("circle", { class: "dct-clutch", cx: 52, cy: 168, r: 30 }, dctSvg);
    svgEl("text", { class: "dct-label", x: 52, y: 32, "text-anchor": "middle" }, dctSvg).textContent = "EMBREAGEM 1";
    svgEl("text", { class: "dct-label", x: 52, y: 222, "text-anchor": "middle" }, dctSvg).textContent = "EMBREAGEM 2";
    svgEl("rect", { class: "dct-shaft", x: 82, y: 68, width: 262, height: 8, rx: 4 }, dctSvg);
    svgEl("rect", { class: "dct-shaft", x: 82, y: 164, width: 262, height: 8, rx: 4 }, dctSvg);
    svgEl("text", { class: "dct-label", x: 344, y: 54, "text-anchor": "end" }, dctSvg).textContent = "ÍMPARES";
    svgEl("text", { class: "dct-label", x: 344, y: 204, "text-anchor": "end" }, dctSvg).textContent = "PARES";
    var dGears = {};
    [1, 3, 5, 2, 4, 6].forEach(function (g) {
      var odd = g % 2 === 1, col = odd ? (g - 1) / 2 : g / 2 - 1;
      var x = 130 + col * 72, y = odd ? 72 : 168, h = 70 - col * 12;
      var r = svgEl("rect", { class: "dct-gear", x: x - 18, y: y - h / 2, width: 36, height: h, rx: 6 }, dctSvg);
      var tx = svgEl("text", { class: "dct-num", x: x, y: y + 5, "text-anchor": "middle" }, dctSvg);
      tx.textContent = g;
      dGears[g] = { r: r, t: tx };
    });
    var dctReadout = document.getElementById("dctReadout");
    var dct = { gear: 1, dir: 1, next: 0 };
    function drawDct() {
      var g = dct.gear, pre = g + dct.dir;
      if (pre < 1 || pre > 6) pre = g - dct.dir;
      for (var k in dGears) {
        var n = +k;
        dGears[k].r.setAttribute("class", "dct-gear" + (n === g ? " on" : n === pre ? " pre" : ""));
        dGears[k].t.setAttribute("class", "dct-num" + (n === g ? " on" : ""));
      }
      clutch1.setAttribute("class", "dct-clutch" + (g % 2 === 1 ? " on" : ""));
      clutch2.setAttribute("class", "dct-clutch" + (g % 2 === 0 ? " on" : ""));
      dctReadout.innerHTML = "Marcha <b>" + g + "</b> engatada · <b>" + pre + "ª</b> pré-selecionada";
    }

    var visible = false, last = 0, raf;
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (current === "conv") {
        var ws = 1600;
        var wc = ws / 3; // coroa travada → 3,0:1
        conv.S = mod(conv.S + ws * 0.09 * dt, 360);
        conv.C = mod(conv.C + wc * 0.09 * dt, 360);
        conv.P = mod(conv.P + (wc - 2 * (ws - wc)) * 0.09 * dt, 360);
        renderConv(conv.S, conv.C, 0, conv.P);
      } else if (current === "cvt") {
        cvt.t += dt;
        var ph = (Math.sin(cvt.t * 0.7 - Math.PI / 2) + 1) / 2;
        var rA = 30 + 46 * ph, rB = SUM - rA;
        drawCvt(rA, rB);
        cvt.a = mod(cvt.a + 260 * dt, 360);
        cvt.b = mod(cvt.b + 260 * (rA / rB) * dt, 360);
        cvt.off -= 60 * dt;
        belt.style.strokeDashoffset = cvt.off.toFixed(1);
        spokeA.setAttribute("transform", "translate(" + AX + " " + CY + ") rotate(" + cvt.a.toFixed(1) + ")");
        spokeB.setAttribute("transform", "translate(" + BX + " " + CY + ") rotate(" + cvt.b.toFixed(1) + ")");
        cvtRatio.textContent = (rB / rA).toFixed(2).replace(".", ",") + " : 1";
      } else if (current === "dct" && now > dct.next) {
        var n = dct.gear + dct.dir;
        if (n > 6 || n < 1) { dct.dir = -dct.dir; n = dct.gear + dct.dir; }
        dct.gear = n;
        drawDct();
        dct.next = now + (dct.gear === 6 || dct.gear === 1 ? 1800 : 1100);
      }
      if (visible) raf = requestAnimationFrame(frame);
    }
    renderConv(0, 0, 0, 0);
    drawCvt(30, SUM - 30);
    drawDct();
    if (reduceMotion) return;
    whenVisible(document.getElementById("tipos"), function (v) {
      visible = v;
      cancelAnimationFrame(raf);
      if (v) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }

  /* =========================================================
     Pré-diagnóstico
     ========================================================= */
  var SYMPTOMS = {
    tranco: { w: 2, label: "Trancos nas trocas", areas: ["Corpo de válvulas", "Solenoides", "Óleo ATF"] },
    patina: { w: 3, label: "Câmbio patinando", areas: ["Embreagens", "Pressão hidráulica", "Óleo ATF"] },
    demora: { w: 2, label: "Demora para engatar D ou R", areas: ["Pressão hidráulica", "Bomba de óleo", "Corpo de válvulas"] },
    luz: { w: 2, label: "Luz de falha no painel", areas: ["Módulo TCM", "Sensores", "Solenoides"] },
    emergencia: { w: 3, label: "Preso em uma marcha / modo de emergência", areas: ["Módulo TCM", "Solenoides", "Pressão hidráulica"] },
    trepida: { w: 2, label: "Trepidação", areas: ["Conversor de torque", "Óleo ATF"] },
    ruido: { w: 2, label: "Ruído ou zumbido", areas: ["Bomba de óleo", "Rolamentos", "Conjunto planetário"] },
    vazamento: { w: 2, label: "Vazamento de óleo", areas: ["Retentores e juntas", "Cárter", "Óleo ATF"] },
    queimado: { w: 3, label: "Cheiro de queimado", areas: ["Superaquecimento", "Embreagens", "Óleo ATF"] },
    naoanda: { w: 5, label: "Não engata / carro não anda", areas: ["Pressão hidráulica", "Embreagens", "Conversor de torque"] }
  };
  var LEVELS = [
    { name: "Aguardando", text: "Marque pelo menos um sintoma para ver a orientação." },
    { name: "Atenção", text: "Sinal inicial. Vale agendar uma avaliação logo: no começo, o problema costuma ser simples de resolver." },
    { name: "Prioridade", text: "Seu câmbio está pedindo ajuda. Não espere piorar: quanto antes a avaliação, menor tende a ser o reparo." },
    { name: "Urgente", text: "Situação séria. Rode o mínimo possível e fale com o especialista antes de voltar a usar o carro." }
  ];

  function initDiagnosis() {
    var form = document.getElementById("diagForm");
    if (!form) return;
    var meter = document.getElementById("diagMeter"), fill = document.getElementById("meterFill");
    var elLevel = document.getElementById("diagLevel"), elText = document.getElementById("diagText");
    var areasWrap = document.getElementById("diagAreasWrap"), areasList = document.getElementById("diagAreas");
    var cta = document.getElementById("diagCta");
    var car = document.getElementById("diagCar"), year = document.getElementById("diagYear"), km = document.getElementById("diagKm");

    function update() {
      var checked = Array.prototype.slice.call(form.querySelectorAll('input[name="s"]:checked')).map(function (i) { return i.value; });
      var score = 0, areas = [], severe = false;
      checked.forEach(function (k) {
        var s = SYMPTOMS[k];
        score += s.w;
        if (k === "naoanda" || k === "queimado") severe = true;
        s.areas.forEach(function (a) { if (areas.indexOf(a) < 0) areas.push(a); });
      });
      var level = !checked.length ? 0 : (severe || score >= 6) ? 3 : score >= 3 ? 2 : 1;
      meter.setAttribute("data-level", level);
      fill.style.strokeDashoffset = level ? (100 - Math.min(100, 20 + score * 11)).toFixed(0) : 100;
      elLevel.textContent = LEVELS[level].name;
      elText.textContent = LEVELS[level].text;

      areasWrap.hidden = !areas.length;
      areasList.innerHTML = "";
      areas.slice(0, 6).forEach(function (a, i) {
        var li = document.createElement("li"); li.textContent = a; li.style.animationDelay = i * 60 + "ms"; areasList.appendChild(li);
      });

      cta.classList.toggle("is-disabled", !checked.length);
      cta.setAttribute("aria-disabled", String(!checked.length));
      var carTxt = [car.value.trim(), year.value.trim()].filter(Boolean).join(" ") || "não informado";
      var msg = "Olá! Fiz o pré-diagnóstico no site da Mecfupi.\n\n" +
        "Carro: " + carTxt + "\n" +
        (km.value.trim() ? "Km: " + km.value.trim() + "\n" : "") +
        "Sintomas:\n" + checked.map(function (k) { return "• " + SYMPTOMS[k].label; }).join("\n") +
        "\n\nResultado do site: " + LEVELS[level].name + ". Podem avaliar meu câmbio?";
      cta.href = WA + encodeURIComponent(msg);
    }

    form.addEventListener("change", update);
    form.addEventListener("input", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    year.addEventListener("input", function () { year.value = year.value.replace(/\D/g, "").slice(0, 4); });
    update();
  }

  /* ---------- Mitos ---------- */
  function initMyths() {
    document.querySelectorAll(".myth").forEach(function (card) {
      card.addEventListener("click", function () {
        card.setAttribute("aria-pressed", String(card.getAttribute("aria-pressed") !== "true"));
      });
    });
  }

  /* =========================================================
     Partículas (faíscas) no hero
     ========================================================= */
  function initParticles() {
    var canvas = document.getElementById("particles");
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [], w = 0, h = 0, running = false, raf;

    function spawn(randomY) {
      return {
        x: Math.random() * w, y: randomY ? Math.random() * h : h + 10,
        r: Math.random() * 1.8 + 0.4, vy: -(Math.random() * 0.6 + 0.2), vx: (Math.random() - 0.5) * 0.3,
        life: Math.random() * 0.6 + 0.4, hue: Math.random() < 0.75 ? "230, 57, 70" : "255, 170, 120",
        flicker: Math.random() * Math.PI * 2
      };
    }
    function resize() {
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(70, (w * h) / 22000));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(spawn(true));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.flicker += 0.05;
        if (p.y < -10 || p.x < -10 || p.x > w + 10) particles[i] = p = spawn(false);
        var alpha = p.life * (0.55 + Math.sin(p.flicker) * 0.35) * Math.min(1, p.y / (h * 0.4));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.hue + "," + Math.max(alpha, 0) + ")";
        ctx.shadowBlur = 8; ctx.shadowColor = "rgba(" + p.hue + ",0.8)";
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    }
    var resizeTimer;
    window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    resize();
    whenVisible(hero, function (v) {
      if (v && !running) { running = true; draw(); }
      else if (!v) { running = false; cancelAnimationFrame(raf); }
    });
  }

  /* =========================================================
     Scroll: progresso, navbar, voltar ao topo, HUD de marcha
     ========================================================= */
  function initScroll() {
    var bar = document.getElementById("scrollProgress");
    var navbar = document.getElementById("navbar");
    var backToTop = document.getElementById("backToTop");
    var hud = document.getElementById("scrollHud"), hudGear = document.getElementById("hudGear"), hudRpm = document.getElementById("hudRpm");
    var ticking = false;

    function update() {
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(y / max, 1) : 0;
      bar.style.transform = "scaleX(" + p + ")";
      navbar.classList.toggle("scrolled", y > 30);
      backToTop.classList.toggle("visible", y > 300);

      // Rolar a página = acelerar: P no topo, D1…D6 até o fim
      hud.classList.toggle("visible", y > window.innerHeight * 0.6);
      var g = p < 0.02 ? "P" : "D" + (1 + Math.floor(Math.min(p, 0.999) * 6));
      hudGear.textContent = g;
      var rpm = g === "P" ? 800 : 1100 + ((p * 6) % 1) * 2300;
      hudRpm.textContent = fmt(Math.round(rpm / 50) * 50);
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    window.addEventListener("resize", update);
    update();
    backToTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    var btn = document.getElementById("hamburger");
    var menu = document.getElementById("navMenu");
    function setOpen(open) {
      menu.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("menu-open", open);
    }
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); btn.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setOpen(false); });
  }

  /* ---------- Smooth scroll com compensação da navbar ---------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = id === "#inicio" ? 0 : 64;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
        if (history.replaceState) history.replaceState(null, "", id);
      });
    });
  }

  /* ---------- Link ativo no menu ---------- */
  function initActiveLink() {
    if (!("IntersectionObserver" in window)) return;
    var links = document.querySelectorAll(".nav-link");
    var map = {};
    links.forEach(function (l) { map[l.getAttribute("href").slice(1)] = l; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && map[entry.target.id]) {
          links.forEach(function (l) { l.classList.remove("active"); });
          map[entry.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) observer.observe(el); });
  }

  /* ---------- Animações de entrada ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-visible", "is-done"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        observer.unobserve(el);
        var delay = parseInt(getComputedStyle(el).getPropertyValue("--d"), 10) || 0;
        setTimeout(function () { el.classList.add("is-done"); }, 900 + delay);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Brilho que segue o mouse nos cards ---------- */
  function initCardGlow() {
    document.querySelectorAll(".product-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }

  /* =========================================================
     Abertura animada
     ========================================================= */
  function initIntro(done) {
    var root = document.documentElement, intro = document.getElementById("intro");
    if (!intro || !root.classList.contains("intro-on")) { done(); return; }
    var rpm = document.getElementById("introRpm"), finished = false;

    var called = false;
    function once() { if (!called) { called = true; done(); } }
    // as animações do hero começam enquanto a tela se abre (2,2 s)
    var doneTimer = setTimeout(once, 2300);
    var endTimer = setTimeout(function () { finish(0); }, 2950);

    function finish(delay) {
      if (finished) return;
      finished = true;
      clearTimeout(endTimer);
      try { sessionStorage.setItem("mecfupi-intro", "1"); } catch (e) { /* ignora */ }
      setTimeout(function () {
        root.classList.remove("intro-on");
        if (intro.parentNode) intro.parentNode.removeChild(intro);
      }, delay);
      if (!called) { clearTimeout(doneTimer); setTimeout(once, Math.max(0, delay - 300)); }
    }
    function skip() {
      if (finished) return;
      intro.classList.add("intro-leave");
      finish(550);
    }

    // conta-giros: acompanha a barra animada em CSS (marcha lenta até o D, depois dispara)
    var bar = intro.querySelector(".intro-rev span");
    (function tick(now) {
      if (finished) return;
      var m = getComputedStyle(bar).transform, sx = 0.11;
      if (m && m !== "none") sx = parseFloat(m.slice(7)) || sx;
      var v = sx <= 0.115 ? 800 + Math.sin(now / 110) * 40 : 800 + 6200 * (sx - 0.11) / 0.89;
      rpm.textContent = fmt(Math.round(v / 50) * 50);
      requestAnimationFrame(tick);
    })(performance.now());

    intro.addEventListener("click", skip);
    document.getElementById("introSkip").addEventListener("click", skip);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { skip(); document.removeEventListener("keydown", onKey); }
    });
  }

  function init() {
    var steps = [initSimulator, initXray, initTypes, initDiagnosis, initMyths, initParticles, initScroll, initMenu, initSmoothScroll, initActiveLink, initCardGlow];
    steps.forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.error("[mecfupi]", fn.name, err); }
    });
    // as animações de entrada do hero esperam a abertura terminar
    try { initIntro(initReveal); } catch (err) { initReveal(); }
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
