// Happy Birthday (public domain) played as a soft plucked qanun-like melody.
(function () {
  const NOTE = { F2: 87.31, G2: 98.0, C3: 130.81, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G4: 392, G5: 783.99 };
  // [note, beats]
  const MELODY = [
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 1],
    ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3],
  ];
  // [note, start beat, beats]
  const BASS = [["C3", 1, 3], ["G2", 4, 3], ["G2", 7, 3], ["C3", 10, 3], ["C3", 13, 3], ["F2", 16, 3], ["G2", 19, 3], ["C3", 22, 3]];
  const BEAT = 0.58;
  const LOOP_BEATS = 28;

  let ctx = null, master = null, timer = null, playing = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function pluck(freq, t, dur) {
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(freq * 6, t);
    lp.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.6);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "triangle"; o1.frequency.value = freq;
    o2.type = "sawtooth"; o2.frequency.value = freq * 2.003;
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    o1.connect(lp); o2.connect(g2).connect(lp);
    lp.connect(g).connect(master);
    const len = Math.max(0.6, dur * BEAT + 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o1.start(t); o2.start(t); o1.stop(t + len + 0.05); o2.stop(t + len + 0.05);
  }

  function bass(freq, t, dur) {
    const g = ctx.createGain();
    const o = ctx.createOscillator();
    o.type = "sine"; o.frequency.value = freq;
    o.connect(g).connect(master);
    const len = dur * BEAT;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.start(t); o.stop(t + len + 0.05);
  }

  function tick(t, accent) {
    // soft riq-like tap
    const n = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000;
    const g = ctx.createGain(); g.gain.value = accent ? 0.09 : 0.04;
    src.connect(hp).connect(g).connect(master);
    src.start(t);
  }

  function scheduleLoop(start) {
    let beat = 0;
    for (const [n, b] of MELODY) { pluck(NOTE[n], start + beat * BEAT, b); beat += b; }
    for (const [n, s, b] of BASS) bass(NOTE[n], start + s * BEAT, b);
    for (let b = 1; b < 25; b++) tick(start + b * BEAT, (b - 1) % 3 === 0);
  }

  function loop() {
    if (!playing) return;
    const start = ctx.currentTime + 0.08;
    scheduleLoop(start);
    timer = setTimeout(loop, LOOP_BEATS * BEAT * 1000);
  }

  window.BirthdayMusic = {
    unlock() { return ensure(); },
    get context() { return ensure(); },
    get playing() { return playing; },
    play() {
      if (!ensure() || playing) return;
      playing = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.4);
      loop();
    },
    stop() {
      if (!ctx || !playing) return;
      playing = false;
      clearTimeout(timer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    },
  };
})();
