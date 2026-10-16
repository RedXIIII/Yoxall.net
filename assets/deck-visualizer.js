(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('release-audio'), canvas = $('signal-canvas'), deck = $('deck-visuals');
  const toggle = $('visual-toggle'), state = $('visual-state');
  if (!audio || !canvas || !deck || !toggle || !state) return;
  let paint;
  try { paint = canvas.getContext('2d'); } catch {}
  if (!paint) { state.textContent = 'VINYL ONLY'; toggle.hidden = true; return; }
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let enabled = !(motion && motion.matches), context, source, analyser, spectrum, wave;
  let pending = false, unavailable = false, frame = 0, lastFrame = 0, visible = true;
  let width = 320, height = 110, bass = 0;
  const meters = [$('meter-sub'), $('meter-mid'), $('meter-high')];
  const canDraw = () => enabled && visible && !document.hidden && !audio.paused && !audio.ended && !audio.muted && analyser;
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; lastFrame = 0; }
  function pressure(values) {
    deck.style.setProperty('--bass', String(values[0]));
    meters.forEach((meter, index) => { if (meter) meter.style.setProperty('--level', String(values[index])); });
  }
  function grid() {
    paint.clearRect(0, 0, width, height);
    paint.strokeStyle = '#527a8b26'; paint.lineWidth = 1;
    paint.beginPath();
    for (let row = 1; row < 4; row++) { paint.moveTo(0, height * row / 4); paint.lineTo(width, height * row / 4); }
    for (let col = 1; col < 8; col++) { paint.moveTo(width * col / 8, 0); paint.lineTo(width * col / 8, height); }
    paint.stroke();
  }
  function rest() {
    bass = 0; pressure([0, 0, 0]); grid();
    paint.strokeStyle = '#82d8ed55'; paint.beginPath();
    paint.moveTo(0, height * .52); paint.lineTo(width, height * .52); paint.stroke();
    canvas.dataset.signal = 'idle';
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width || 320); height = Math.max(1, rect.height || 110);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    paint.setTransform(ratio, 0, 0, ratio, 0, 0); rest();
  }
  function average(from, to) {
    const nyquist = context.sampleRate / 2;
    const start = Math.max(1, Math.floor(from / nyquist * spectrum.length));
    const end = Math.min(spectrum.length, Math.max(start + 1, Math.ceil(to / nyquist * spectrum.length)));
    let total = 0;
    for (let bin = start; bin < end; bin++) total += spectrum[bin];
    return Math.min(1, total / Math.max(1, end - start) / 255);
  }
  function draw(now) {
    frame = 0;
    if (!canDraw()) return;
    if (now - lastFrame >= 32) {
      lastFrame = now;
      analyser.getByteFrequencyData(spectrum); analyser.getByteTimeDomainData(wave);
      grid();
      const levels = [average(30, 180), average(180, 2400), average(2400, 14000)];
      bass += (levels[0] - bass) * .35; pressure([bass, levels[1], levels[2]]);
      const count = 40, step = width / count;
      const colour = paint.createLinearGradient(0, height, 0, 0);
      colour.addColorStop(0, '#4cb9d5'); colour.addColorStop(.6, '#b1e9ff'); colour.addColorStop(1, '#b37cff');
      paint.fillStyle = colour;
      for (let bar = 0; bar < count; bar++) {
        const lo = 35 * Math.pow(18000 / 35, bar / count);
        const hi = 35 * Math.pow(18000 / 35, (bar + 1) / count);
        const amount = Math.pow(average(lo, hi), 1.45) * (height - 17);
        paint.globalAlpha = .68;
        paint.fillRect(bar * step + 1, height - amount, Math.max(1, step - 3), amount);
        if (amount > 1) { paint.globalAlpha = 1; paint.fillRect(bar * step + 1, height - amount - 2, Math.max(1, step - 3), 1); }
      }
      paint.globalAlpha = 1; paint.strokeStyle = '#dbb6ff'; paint.lineWidth = 1.1; paint.beginPath();
      for (let point = 0; point < wave.length; point += 2) {
        const x = point / (wave.length - 1) * width;
        const y = height * .48 + (wave[point] - 128) / 128 * height * .31;
        if (!point) paint.moveTo(x, y); else paint.lineTo(x, y);
      }
      paint.stroke(); canvas.dataset.signal = 'live';
    }
    frame = requestAnimationFrame(draw);
  }
  function refresh() {
    stop();
    document.body.classList.toggle('visuals-off', !enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'VISUALS ON' : 'VISUALS OFF';
    state.textContent = !enabled ? 'LOW MOTION' : audio.muted ? 'SOUND OFF' : audio.paused || audio.ended ? 'NEEDLE UP' : analyser ? 'LIVE SIGNAL' : 'VINYL ONLY';
    rest();
    if (canDraw()) frame = requestAnimationFrame(draw);
  }
  // The audio always connects directly to the output. The analyser is a side branch;
  // visual effects never insert an EQ, compressor, gain change or second output path.
  function connect() {
    if (context.state !== 'running' || unavailable) return;
    if (!source) { source = context.createMediaElementSource(audio); source.connect(context.destination); }
    if (!analyser) {
      analyser = context.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = .78;
      source.connect(analyser);
      spectrum = new Uint8Array(analyser.frequencyBinCount); wave = new Uint8Array(analyser.fftSize);
    }
  }
  function unlock() {
    if (!enabled || pending || unavailable) return;
    if (!context && typeof navigator !== 'undefined' && navigator.userActivation && !navigator.userActivation.isActive && audio.paused) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { unavailable = true; refresh(); return; }
      if (!context) context = new Audio();
      if (context.state === 'running') { connect(); refresh(); return; }
      pending = true;
      Promise.resolve(context.resume()).then(() => { pending = false; connect(); refresh(); }).catch(() => { pending = false; refresh(); });
    } catch {
      pending = false; unavailable = true; analyser = null; refresh();
    }
  }
  globalThis.PlannerFMVisuals = {unlock};
  audio.addEventListener('playing', () => { unlock(); refresh(); });
  for (const event of ['pause', 'ended', 'error', 'emptied', 'volumechange']) audio.addEventListener(event, refresh);
  audio.addEventListener('waiting', () => { stop(); rest(); state.textContent = enabled ? 'CUEING SIGNAL' : 'LOW MOTION'; });
  toggle.addEventListener('click', () => { enabled = !enabled; if (enabled) unlock(); refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !audio.paused) unlock(); refresh(); });
  if (motion && motion.addEventListener) motion.addEventListener('change', () => { enabled = !motion.matches; if (enabled && !audio.paused) unlock(); refresh(); });
  window.addEventListener('resize', resize);
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas);
  if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => { visible = entries[0].isIntersecting; refresh(); }).observe(deck);
  resize(); refresh(); if (!audio.paused) unlock();
})();
