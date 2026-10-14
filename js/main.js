/* =========================================================
   Mecfupi do Brasil — Interações
   ========================================================= */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Monta as engrenagens 3D (a animação é 100% CSS) ---------- */
  function buildGears() {
    var gears = document.querySelectorAll(".gear");
    gears.forEach(function (gear) {
      var rotor = gear.querySelector(".gear-rotor");
      var teeth = parseInt(gear.getAttribute("data-teeth"), 10) || 12;
      var frag = document.createDocumentFragment();

      // Camadas do corpo empilhadas no eixo Z (espessura)
      var depths = [-12, -8, -4, 0, 4, 8, 12];
      depths.forEach(function (z, i) {
        var layer = document.createElement("div");
        var isFace = i === 0 || i === depths.length - 1;
        layer.className = "gear-layer " + (isFace ? "face" : "edge");
        layer.style.transform = "translateZ(" + z + "px)" + (i === 0 ? " rotateY(180deg)" : "");
        frag.appendChild(layer);
      });

      // Dentes
      for (var t = 0; t < teeth; t++) {
        var tooth = document.createElement("div");
        tooth.className = "tooth";
        tooth.style.setProperty("--a", (360 / teeth) * t + "deg");
        var cap = document.createElement("span");
        cap.className = "tooth-cap";
        tooth.appendChild(cap);
        frag.appendChild(tooth);
      }

      rotor.appendChild(frag);
    });
  }

  /* ---------- Partículas (faíscas) no hero ---------- */
  function initParticles() {
    var canvas = document.getElementById("particles");
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var w = 0, h = 0, running = true, raf;

    function resize() {
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(70, (w * h) / 22000));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(spawn(true));
    }

    function spawn(randomY) {
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + 10,
        r: Math.random() * 1.8 + 0.4,
        vy: -(Math.random() * 0.6 + 0.2),
        vx: (Math.random() - 0.5) * 0.3,
        life: Math.random() * 0.6 + 0.4,
        hue: Math.random() < 0.75 ? "230, 57, 70" : "255, 170, 120",
        flicker: Math.random() * Math.PI * 2
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.flicker += 0.05;
        if (p.y < -10 || p.x < -10 || p.x > w + 10) particles[i] = p = spawn(false);
        var alpha = p.life * (0.55 + Math.sin(p.flicker) * 0.35) * Math.min(1, p.y / (h * 0.4));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.hue + "," + Math.max(alpha, 0) + ")";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(" + p.hue + ",0.8)";
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    }

    // Pausa quando o hero sai da tela (economia de bateria)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) { running = true; draw(); }
        else if (!visible) { running = false; cancelAnimationFrame(raf); }
      }).observe(hero);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    resize();
    draw();
  }

  /* ---------- Scroll: barra de progresso, navbar, voltar ao topo ---------- */
  function initScroll() {
    var bar = document.getElementById("scrollProgress");
    var navbar = document.getElementById("navbar");
    var backToTop = document.getElementById("backToTop");
    var ticking = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(scrollTop / max, 1) : 0;
      bar.style.transform = "scaleX(" + progress + ")";
      navbar.classList.toggle("scrolled", scrollTop > 30);
      backToTop.classList.toggle("visible", scrollTop > 300);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
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

    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); btn.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) setOpen(false);
    });
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

  /* ---------- Link ativo no menu conforme a seção ---------- */
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

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- Animações de entrada (fade-in / slide) ---------- */
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
        // Libera o transform para os efeitos de hover após a entrada
        var delay = parseInt(getComputedStyle(el).getPropertyValue("--d"), 10) || 0;
        setTimeout(function () { el.classList.add("is-done"); }, 900 + delay);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Brilho que segue o mouse nos cards de produto ---------- */
  function initCardGlow() {
    document.querySelectorAll(".product-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }

  function init() {
    buildGears();
    initParticles();
    initScroll();
    initMenu();
    initSmoothScroll();
    initActiveLink();
    initReveal();
    initCardGlow();
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
