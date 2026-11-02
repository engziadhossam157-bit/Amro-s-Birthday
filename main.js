(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const PALETTE = ["#B8232F", "#18215C", "#F4B731", "#2E9C9A", "#E8798F", "#2F7D4F", "#F6EEDC"];

  const body = document.body;
  const music = window.BirthdayMusic;
  let lenis = null;

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     Text splitting: whole words only, so Arabic letters stay joined
  ------------------------------------------------------------------ */
  function splitWords(el, masked) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    el.setAttribute("aria-label", words.join(" "));
    words.forEach((word, i) => {
      const w = document.createElement("span");
      w.className = "w";
      w.setAttribute("aria-hidden", "true");
      w.textContent = word;
      if (masked) {
        const m = document.createElement("span");
        m.className = "wm";
        m.appendChild(w);
        el.appendChild(m);
      } else {
        el.appendChild(w);
      }
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return $$(".w", el);
  }
  $$("[data-words]").forEach((el) => splitWords(el, true));
  const loveWords = splitWords($("#love-text"), false);

  /* ------------------------------------------------------------------
     Bunting (zeena) flags
  ------------------------------------------------------------------ */
  $$("[data-bunting]").forEach((row) => {
    const n = window.innerWidth < 600 ? 11 : 19;
    for (let i = 0; i < n; i++) {
      const f = document.createElement("span");
      f.className = "flag";
      const mid = (n - 1) / 2;
      const sag = 26 * (1 - Math.pow((i - mid) / mid, 2));
      f.style.cssText = `--c:${PALETTE[i % 6]};--sag:${sag.toFixed(1)};--d:${(-i * 0.37).toFixed(2)}s`;
      row.appendChild(f);
    }
  });

  /* ------------------------------------------------------------------
     Confetti: cloth scraps cut from the same star geometry
  ------------------------------------------------------------------ */
  const confetti = (() => {
    const cv = $("#confetti");
    const cx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, parts = [], running = false, last = 0;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    function make(x, y, vx, vy) {
      return {
        x, y, vx, vy,
        r: rand(0, Math.PI * 2), vr: rand(-0.2, 0.2),
        s: rand(7, 15), c: PALETTE[(Math.random() * PALETTE.length) | 0],
        shape: ["tri", "sq", "star", "tri"][(Math.random() * 4) | 0],
        flip: rand(0, Math.PI * 2), vf: rand(0.08, 0.2),
        life: 0, max: rand(160, 260),
      };
    }
    function drawShape(p) {
      const s = p.s;
      cx.beginPath();
      if (p.shape === "tri") {
        cx.moveTo(-s / 2, -s / 2); cx.lineTo(s / 2, -s / 2); cx.lineTo(0, s / 2); cx.closePath();
      } else if (p.shape === "sq") {
        cx.rect(-s / 2, -s / 3, s, s * 0.66);
      } else {
        const a = s * 0.42;
        cx.rect(-a, -a, a * 2, a * 2);
        cx.save(); cx.rotate(Math.PI / 4); cx.rect(-a, -a, a * 2, a * 2); cx.restore();
      }
      cx.fill();
    }
    function frame(t) {
      const dt = Math.min(2.5, (t - last) / 16.67 || 1);
      last = t;
      cx.clearRect(0, 0, W, H);
      parts = parts.filter((p) => p.y < H + 40 && p.life < p.max);
      for (const p of parts) {
        p.life += dt;
        p.vx *= Math.pow(0.985, dt);
        p.vy = p.vy * Math.pow(0.985, dt) + 0.22 * dt;
        p.x += p.vx * dt + Math.sin(p.flip) * 0.6;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        p.flip += p.vf * dt;
        cx.save();
        cx.translate(p.x, p.y);
        cx.rotate(p.r);
        cx.scale(1, Math.cos(p.flip));
        cx.globalAlpha = Math.min(1, (p.max - p.life) / 40);
        cx.fillStyle = p.c;
        drawShape(p);
        cx.restore();
      }
      if (parts.length) requestAnimationFrame(frame);
      else { running = false; cx.clearRect(0, 0, W, H); }
    }
    function start() {
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    }
    return {
      burst(x, y, n = 80, power = 14) {
        if (reduced) return;
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2), v = rand(power * 0.35, power);
          parts.push(make(x, y, Math.cos(a) * v, Math.sin(a) * v - power * 0.35));
        }
        start();
      },
      rain(n = 140) {
        if (reduced) return;
        for (let i = 0; i < n; i++) {
          const p = make(rand(0, W), rand(-H * 0.6, -10), rand(-1.5, 1.5), rand(1, 4));
          p.max = 420;
          parts.push(p);
        }
        start();
      },
    };
  })();

  /* ------------------------------------------------------------------
     Sound toggle
  ------------------------------------------------------------------ */
  const soundBtn = $("#sound-btn");
  function syncSound() {
    const on = !!(music && music.playing);
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.setAttribute("aria-label", on ? "اقفل الموسيقى" : "شغّل الموسيقى");
  }
  soundBtn.addEventListener("click", () => {
    if (!music) return;
    music.playing ? music.stop() : music.play();
    syncSound();
  });

  /* ------------------------------------------------------------------
     Gate: the candle
  ------------------------------------------------------------------ */
  const gate = $("#gate");
  const cake = $("#cake");
  const flame = $("#flame");
  const smoke = $("#smoke");
  const glow = $(".cake__glow");
  const hint = $("#gate-hint");
  const title = $("#gate-title");
  const micBtn = $("#mic-btn");
  const tapBtn = $("#tap-btn");
  const meter = $(".meter");
  const meterFill = $("#meter-fill");

  // wrapper that leans with the breath, separate from the CSS flicker
  const lean = document.createElementNS(SVG_NS, "g");
  lean.style.transformOrigin = "150px 50px";
  lean.style.transformBox = "view-box";
  flame.parentNode.insertBefore(lean, flame);
  lean.appendChild(flame);

  let blown = false, encore = false, micStream = null, micRaf = 0;

  function stopMic() {
    cancelAnimationFrame(micRaf);
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
    meter.classList.remove("is-on");
    micBtn.classList.remove("is-listening");
  }

  async function listen() {
    if (blown) return;
    music && music.unlock();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      hint.textContent = "المايك مش متاح هنا، دوس على الشمعة بإيدك";
      return;
    }
    micBtn.disabled = true;
    hint.textContent = "استنى ثانية…";
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      micBtn.disabled = false;
      hint.textContent = "مفيش إذن للمايك، مش مشكلة، دوس على الشمعة بإيدك";
      return;
    }
    micBtn.disabled = false;
    micBtn.classList.add("is-listening");
    meter.classList.add("is-on");
    hint.textContent = "يلا انفخ جامد في المايك";
    const ac = music.context;
    const src = ac.createMediaStreamSource(micStream);
    const an = ac.createAnalyser();
    an.fftSize = 1024;
    src.connect(an);
    const data = new Float32Array(an.fftSize);
    let strong = 0;
    const read = () => {
      an.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, rms / 0.18);
      meterFill.style.transform = `scaleX(${level.toFixed(2)})`;
      lean.style.transform = `skewX(${(-level * 28).toFixed(1)}deg) scale(${(1 - level * 0.25).toFixed(2)}, ${(1 - level * 0.35).toFixed(2)})`;
      strong = rms > 0.12 ? strong + 1 : Math.max(0, strong - 1);
      if (strong > 9) { blowOut(); return; }
      micRaf = requestAnimationFrame(read);
    };
    read();
  }

  function cakeCenter() {
    const r = cake.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.15 };
  }

  function blowOut() {
    if (blown) return;
    blown = true;
    music && music.unlock();
    stopMic();
    cake.classList.add("is-out");
    hint.textContent = "كل سنة وانت طيب يا عمرو";
    title.textContent = "يعيش يعيش يعيش!";
    micBtn.hidden = true; tapBtn.hidden = true;

    if (hasGSAP) {
      gsap.to(lean, { scaleY: 0, scaleX: 0.3, opacity: 0, duration: 0.35, ease: "power2.in" });
      gsap.to(glow, { opacity: 0, duration: 0.5 });
      gsap.fromTo(smoke, { opacity: 0.9, y: 0 }, { opacity: 0, y: -40, duration: 2.2, ease: "power1.out" });
      gsap.fromTo(title, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: "back.out(3)" });
    } else {
      flame.style.display = "none";
      glow.style.display = "none";
    }

    setTimeout(() => {
      const c = cakeCenter();
      confetti.burst(c.x, c.y, 120, 16);
      confetti.rain(120);
      if (music) { music.play(); syncSound(); }
    }, 380);

    setTimeout(encore ? closeEncore : openTent, reduced ? 600 : 1500);
  }

  cake.addEventListener("click", blowOut);
  cake.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blowOut(); }
  });
  tapBtn.addEventListener("click", blowOut);
  micBtn.addEventListener("click", listen);

  /* ------------------------------------------------------------------
     Opening the tent
  ------------------------------------------------------------------ */
  const flapStart = $(".flap--start");
  const flapEnd = $(".flap--end");

  function unlockPage() {
    gate.style.display = "none";
    body.classList.remove("is-locked");
    body.classList.add("is-open");
    window.scrollTo(0, 0);
    if (lenis) lenis.start();
  }

  function openTent() {
    if (!hasGSAP || reduced) {
      unlockPage();
      heroIntro();
      initScroll();
      return;
    }
    // RTL: the start flap lives on the right
    gsap.set(flapStart, { xPercent: 102, visibility: "visible" });
    gsap.set(flapEnd, { xPercent: -102, visibility: "visible" });
    const tl = gsap.timeline();
    tl.to([flapStart, flapEnd], { xPercent: 0, duration: 0.75, ease: "power3.inOut" })
      .add(() => { unlockPage(); initScroll(); })
      .to(flapStart, { xPercent: 104, skewY: -4, duration: 1.5, ease: "power4.inOut" }, "+=0.15")
      .to(flapEnd, { xPercent: -104, skewY: 4, duration: 1.5, ease: "power4.inOut" }, "<")
      .add(heroIntro, "-=0.9")
      .set([flapStart, flapEnd], { visibility: "hidden" });
  }

  function relightCandle() {
    blown = false;
    cake.classList.remove("is-out");
    title.textContent = "اتمنى أمنية وطفيها تاني";
    hint.textContent = "انفخ في المايك… أو دوس على الشمعة";
    micBtn.hidden = false; tapBtn.hidden = false;
    lean.style.transform = "";
    if (hasGSAP) {
      gsap.set(lean, { clearProps: "all" });
      lean.style.transformOrigin = "150px 50px";
      lean.style.transformBox = "view-box";
      gsap.set(glow, { opacity: 1 });
    } else {
      flame.style.display = "";
      glow.style.display = "";
    }
  }

  function openEncore() {
    encore = true;
    relightCandle();
    gate.style.display = "";
    body.classList.add("is-locked");
    if (lenis) lenis.stop();
    if (hasGSAP) gsap.fromTo(gate, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    cake.focus({ preventScroll: true });
  }

  function closeEncore() {
    const done = () => {
      gate.style.display = "none";
      body.classList.remove("is-locked");
      if (lenis) lenis.start();
      $("#encore-btn").focus({ preventScroll: true });
    };
    if (hasGSAP) gsap.to(gate, { opacity: 0, duration: 0.6, onComplete: done });
    else done();
  }
  $("#encore-btn").addEventListener("click", openEncore);

  /* ------------------------------------------------------------------
     Hero: the sketch draws itself in
  ------------------------------------------------------------------ */
  const scribbleGroup = $("#scribbles");
  const cover = $("#scribble-cover");
  const pencil = $("#pencil");
  const scribbles = [];
  (function buildScribbles() {
    const W = 1280, H = 720, rows = 7, step = H / rows, seg = 11, amp = step * 0.75;
    for (let r = 0; r < rows; r++) {
      const y0 = step * r + step / 2;
      const pts = [];
      for (let k = 0; k <= seg; k++) {
        const t = k / seg;
        const x = r % 2 === 0 ? W + 40 - t * (W + 80) : -40 + t * (W + 80);
        const y = y0 + (k % 2 ? amp : -amp) * 0.6 + rand(-12, 12);
        pts.push(`${x.toFixed(0)} ${y.toFixed(0)}`);
      }
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", "M" + pts.join(" L"));
      p.setAttribute("stroke-width", String(step * 1.25));
      scribbleGroup.appendChild(p);
      scribbles.push(p);
    }
  })();

  // pre-hide hero bits so they don't flash under the opening flaps
  if (hasGSAP && !reduced) {
    gsap.set(".hero__title .w", { yPercent: 115, rotate: 8 });
    gsap.set(".banner", { opacity: 0, y: 60, scale: 0.92, rotate: -3 });
    gsap.set(".hero__opener .w", { opacity: 0, y: 18 });
    gsap.set([".hero__lede", ".scroll-cue"], { opacity: 0, y: 20 });
    gsap.set(".hero .flag", { y: -90 });
  }

  function heroIntro() {
    if (!hasGSAP || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".hero .flag", { y: 0, duration: 1.2, ease: "bounce.out", stagger: { each: 0.04, from: "center" } }, 0)
      .to(".hero__title .w", { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.08 }, 0.1)
      .to(".banner", { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 1.4, ease: "back.out(1.4)" }, 0.35)
      .add(drawSketch(), 0.8)
      .to(".hero__opener .w", { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 1.4)
      .to([".hero__lede", ".scroll-cue"], { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 }, 2.2);
  }

  function drawSketch() {
    const tl = gsap.timeline();
    tl.set(cover, { attr: { opacity: 0 } })
      .set(pencil, { opacity: 1 });
    scribbles.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      const st = { v: 0 };
      tl.to(st, {
        v: 1, duration: 0.42, ease: "none",
        onUpdate() {
          p.style.strokeDashoffset = len * (1 - st.v);
          const pt = p.getPointAtLength(len * st.v);
          pencil.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
        },
      });
    });
    tl.to(pencil, { opacity: 0, duration: 0.3 })
      .to(cover, { attr: { opacity: 1 }, duration: 0.8, ease: "power1.inOut" }, "<");
    return tl;
  }

  /* ------------------------------------------------------------------
     Stitched borders on the quilt panels
  ------------------------------------------------------------------ */
  let stitchId = 0;
  function addStitch(panel) {
    const id = "st" + stitchId++;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "stitch");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML =
      `<defs><mask id="${id}" maskUnits="userSpaceOnUse"><rect class="m" fill="none" stroke="#fff" stroke-width="8"/></mask></defs>` +
      `<rect class="s" fill="none" stroke-width="2" stroke-dasharray="8 6" stroke-linecap="round" mask="url(#${id})"/>`;
    panel.appendChild(svg);
    const m = svg.querySelector(".m");
    const s = svg.querySelector(".s");
    s.style.stroke = getComputedStyle(panel).getPropertyValue("--accent").trim() || "#B8232F";
    const state = { p: reduced || !hasGSAP ? 1 : 0, len: 0 };
    function layout() {
      const w = panel.clientWidth, h = panel.clientHeight, inset = 12;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      for (const r of [m, s]) {
        r.setAttribute("x", inset); r.setAttribute("y", inset);
        r.setAttribute("width", Math.max(0, w - inset * 2)); r.setAttribute("height", Math.max(0, h - inset * 2));
        r.setAttribute("rx", 6);
      }
      state.len = 2 * (w + h - inset * 4);
      m.style.strokeDasharray = state.len;
      paint();
    }
    function paint() { m.style.strokeDashoffset = state.len * (1 - state.p); }
    layout();
    if (window.ResizeObserver) new ResizeObserver(layout).observe(panel);
    return { state, paint };
  }
  const stitches = new Map();
  $$("[data-panel]").forEach((p) => { if (p.classList.contains("panel")) stitches.set(p, addStitch(p)); });

  /* ------------------------------------------------------------------
     Scroll choreography
  ------------------------------------------------------------------ */
  let scrollReady = false;
  function initScroll() {
    if (scrollReady) return;
    scrollReady = true;
    if (!hasGSAP || !window.ScrollTrigger || reduced) {
      loveWords.forEach((w) => w.style.setProperty("--lit", 1));
      return;
    }

    // section titles: words rise out of their seam
    $$(".section-title").forEach((t) => {
      gsap.from($$(".w", t), {
        yPercent: 115, rotate: 7, duration: 1.1, ease: "expo.out", stagger: 0.07,
        scrollTrigger: { trigger: t, start: "top 85%" },
      });
    });

    // quilt panels: pinned in, then stitched
    $$("[data-panel]").forEach((panel) => {
      const marks = $$("mark.thread", panel);
      marks.forEach((m) => m.style.setProperty("--mark", "0%"));
      const st = stitches.get(panel);
      const tl = gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 88%" } });
      tl.from(panel, {
        y: 90, opacity: 0, rotation: rand(-7, 7), transformOrigin: "50% 0%",
        duration: 1.2, ease: "back.out(1.5)",
      });
      if (st) tl.to(st.state, { p: 1, duration: 1.6, ease: "power2.inOut", onUpdate: st.paint }, 0.35);
      if (marks.length) tl.to(marks, { "--mark": "100%", duration: 0.9, ease: "power2.out", stagger: 0.35 }, 0.9);
    });

    // tiled grounds drift a little slower than the page
    $$(".tiled").forEach((sec) => {
      gsap.fromTo(sec, { "--para": "-40px" }, {
        "--para": "40px", ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    distanceScene();
    galleryScene();
    duaaScene();
    loveScene();
    signatureScene();
    progressThread();

    ScrollTrigger.refresh();
  }

  function distanceScene() {
    const maskPath = $("#thread-mask-path");
    const needle = $("#needle");
    const len = maskPath.getTotalLength();
    maskPath.style.strokeDasharray = len;
    maskPath.style.strokeDashoffset = len;
    const st = { p: 0 };
    const place = () => {
      maskPath.style.strokeDashoffset = len * (1 - st.p);
      const a = maskPath.getPointAtLength(len * st.p);
      const b = maskPath.getPointAtLength(Math.min(len, len * st.p + 1));
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      needle.setAttribute("transform", `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${(ang - 90).toFixed(1)})`);
    };
    place();
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".distance__stage", start: "top top", end: "+=130%", scrub: 0.8, pin: true },
    });
    tl.from(".pin--ziad path", { scale: 0, duration: 0.15, ease: "back.out(3)" })
      .from(".map__tag:not(.map__tag--light)", { opacity: 0, y: 10, duration: 0.1 }, "<")
      .to(st, { p: 1, duration: 1, ease: "none", onUpdate: place })
      .from(".pin--amro path", { scale: 0, duration: 0.15, ease: "back.out(3)" })
      .from(".map__tag--light", { opacity: 0, y: 10, duration: 0.1 }, "<")
      .to(".pin path", { scale: 1.35, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" });
  }

  function galleryScene() {
    const track = $("#gallery-track");
    const photos = $$(".photo", track);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const swing = photos.map((p) => gsap.quickTo(p, "rotation", { duration: 0.8, ease: "elastic.out(1, 0.35)" }));
      gsap.to(track, {
        x: () => dist(), ease: "none",
        scrollTrigger: {
          trigger: ".gallery__pin", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate(self) {
            const v = gsap.utils.clamp(-10, 10, self.getVelocity() / 140);
            swing.forEach((s) => s(v));
          },
          onScrubComplete() { swing.forEach((s) => s(0)); },
        },
      });
      gsap.from(photos, {
        y: -140, rotation: -14, opacity: 0, duration: 1.4, ease: "elastic.out(1, 0.5)", stagger: 0.12,
        scrollTrigger: { trigger: ".gallery", start: "top 60%" },
      });
    });
    mm.add("(max-width: 899px)", () => {
      photos.forEach((p, i) => {
        gsap.from(p, {
          y: 80, rotation: i % 2 ? 14 : -14, opacity: 0, duration: 1.5, ease: "elastic.out(1, 0.45)",
          scrollTrigger: { trigger: p, start: "top 88%" },
        });
      });
    });
  }

  function duaaScene() {
    const box = $("#duaa-stars");
    const n = window.innerWidth < 600 ? 14 : 26;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "rise";
      s.style.cssText = `left:${rand(2, 96).toFixed(1)}%;--s:${rand(10, 26).toFixed(0)}px;--t:${rand(8, 15).toFixed(1)}s;--d:${(-rand(0, 14)).toFixed(1)}s;--o:${rand(0.35, 0.85).toFixed(2)}`;
      box.appendChild(s);
    }
    ScrollTrigger.create({ trigger: "#duaa", start: "top bottom", end: "bottom top", toggleClass: "is-live" });
    gsap.from(".duaa__text p", {
      opacity: 0, y: 40, filter: "blur(10px)", duration: 1.6, ease: "expo.out",
      scrollTrigger: { trigger: ".duaa__text", start: "top 82%" },
    });
  }

  function loveScene() {
    loveWords.forEach((w) => w.style.setProperty("--lit", 0.13));
    const st = { p: 0 };
    gsap.to(st, {
      p: 1, ease: "none",
      scrollTrigger: { trigger: ".love__pin", start: "top top", end: "+=140%", scrub: 0.4, pin: true },
      onUpdate() {
        const lit = st.p * (loveWords.length + 1);
        loveWords.forEach((w, i) => w.style.setProperty("--lit", Math.min(1, Math.max(0.13, lit - i)).toFixed(2)));
      },
    });
  }

  function signatureScene() {
    const text = $("#signature text");
    text.style.strokeDasharray = "1600";
    text.style.strokeDashoffset = "1600";
    text.style.fillOpacity = "0";
    gsap.timeline({ scrollTrigger: { trigger: "#signature", start: "top 80%" } })
      .to(text, { strokeDashoffset: 0, duration: 2.6, ease: "power1.inOut" })
      .to(text, { fillOpacity: 1, duration: 0.8 }, "-=0.6")
      .add(() => {
        const r = $("#signature").getBoundingClientRect();
        confetti.burst(r.left + r.width / 2, r.top + r.height / 2, 60, 11);
      });
    gsap.from(".pennant", {
      clipPath: "polygon(0 0, 100% 0, 100% 0%, 50% 0%, 0 0%)", duration: 1.4, ease: "expo.inOut",
      scrollTrigger: { trigger: ".pennant", start: "top 80%" },
    });
    gsap.from(".footer p", { y: 30, opacity: 0, duration: 1, scrollTrigger: { trigger: ".footer", start: "top 95%" } });
  }

  function progressThread() {
    const fill = $("#progress-fill");
    const needle = $("#progress-needle");
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate(self) {
        fill.style.transform = `scaleY(${self.progress.toFixed(4)})`;
        needle.style.top = (self.progress * 100).toFixed(2) + "%";
      },
    });
  }

  /* ------------------------------------------------------------------
     Smooth scroll
  ------------------------------------------------------------------ */
  if (hasGSAP && window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.stop();
    if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $(".scroll-cue").addEventListener("click", (e) => {
    e.preventDefault();
    const target = $("#more");
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });

  /* ------------------------------------------------------------------
     Lightbox
  ------------------------------------------------------------------ */
  const lb = $("#lightbox");
  const lbImg = $("#lightbox-img");
  $$(".photo__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const img = $("img", btn);
      lbImg.src = btn.dataset.full;
      lbImg.alt = img.alt;
      if (typeof lb.showModal === "function") lb.showModal();
      else window.open(btn.dataset.full, "_blank");
      if (lenis) lenis.stop();
    });
  });
  $("#lightbox-close").addEventListener("click", () => lb.close());
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("close", () => { if (lenis) lenis.start(); });

  /* ------------------------------------------------------------------
     Tap anywhere for a handful of scraps
  ------------------------------------------------------------------ */
  let lastTap = 0;
  document.addEventListener("pointerdown", (e) => {
    if (!body.classList.contains("is-open") || body.classList.contains("is-locked")) return;
    if (e.target.closest("button, a, dialog, mark")) return;
    const now = performance.now();
    if (now - lastTap < 250) return;
    lastTap = now;
    confetti.burst(e.clientX, e.clientY, 18, 7);
  });

  // when fonts or images land, measurements change
  if (hasGSAP && window.ScrollTrigger) {
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }
})();
