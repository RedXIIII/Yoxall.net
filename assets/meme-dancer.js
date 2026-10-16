(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('release-audio'), video = $('dancer-video'), stage = $('meme-dancer');
  const panel = $('dancer-panel'), hide = $('dancer-hide'), show = $('dancer-show');
  if (!audio || !video || !stage || !panel || !hide || !show) return;
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let dismissed = false, failed = false, buffering = false, attempt = 0;
  video.muted = true; video.defaultMuted = true; video.volume = 0;
  video.loop = true; video.playsInline = true;
  const moving = () => !failed && !buffering && !audio.error && !document.hidden && !audio.paused && !audio.ended &&
    !document.body.classList.contains('visuals-off') && (globalThis.PlannerFMVisuals || !motion || !motion.matches);
  function refresh() {
    const ticket = ++attempt;
    const on = moving();
    stage.hidden = !on;
    panel.hidden = !on || dismissed;
    show.hidden = !on || !dismissed;
    if (!on || dismissed) { video.pause(); return; }
    if (!video.getAttribute('src')) video.setAttribute('src', video.dataset.src);
    video.muted = true; video.volume = 0;
    try {
      Promise.resolve(video.play()).then(() => {
        if (ticket === attempt && !moving()) video.pause();
      }).catch(() => {
        if (ticket !== attempt) return;
        dismissed = true; panel.hidden = true; show.hidden = false;
      });
    } catch { dismissed = true; panel.hidden = true; show.hidden = false; }
  }
  hide.addEventListener('click', () => { dismissed = true; refresh(); show.focus(); });
  show.addEventListener('click', () => { dismissed = false; refresh(); hide.focus(); });
  audio.addEventListener('playing', () => { buffering = false; refresh(); });
  audio.addEventListener('waiting', () => { buffering = true; refresh(); });
  for (const event of ['pause','ended','emptied','error']) audio.addEventListener(event, refresh);
  video.addEventListener('error', () => { failed = true; refresh(); });
  document.addEventListener('visibilitychange', refresh);
  if ($('visual-toggle')) $('visual-toggle').addEventListener('click', refresh);
  if (motion && motion.addEventListener) motion.addEventListener('change', refresh);
  refresh();
})();
