(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('release-audio'), stage = $('meme-dancer');
  const panel = $('dancer-panel'), hide = $('dancer-hide'), show = $('dancer-show'), label = $('meme-label');
  const clips = [
    {id: 'girl', video: $('dancer-video'), rate: 140 / 155, maxLoops: 3, label: 'OFF THE CLOCK'},
    // The uploaded cat clip’s measured nodding cadence is approximately 123 BPM.
    {id: 'cat', video: $('cat-video'), rate: 140 / 123, maxLoops: 2, label: 'CAT ON CALL'},
    {id: 'ankha', video: $('ankha-video'), rate: 140 / 110, maxLoops: 2, label: 'NILE SHIFT'}
  ];
  if (!audio || !stage || !panel || !hide || !show || clips.some(clip => !clip.video)) return;
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  // Open with exactly one girl loop; subsequent turns use each clip’s random range.
  let active = 0, remaining = 1, dismissed = false, buffering = false, attempt = 0;
  const selected = () => clips[active];
  const moving = () => !selected().failed && !buffering && !audio.error && !document.hidden && !audio.paused && !audio.ended &&
    !document.body.classList.contains('visuals-off') && (globalThis.PlannerFMVisuals || !motion || !motion.matches);
  function nextClip() {
    for (let step = 1; step <= clips.length; step++) {
      const next = (active + step) % clips.length;
      if (clips[next].failed) continue;
      active = next;
      remaining = selected().maxLoops === 1 ? 1 : 1 + Math.floor(Math.random() * selected().maxLoops);
      selected().video.currentTime = 0;
      return;
    }
  }
  function refresh() {
    const ticket = ++attempt, clip = selected(), video = clip.video, on = moving();
    stage.dataset.meme = clip.id;
    if (label) label.textContent = clip.label;
    stage.hidden = !on;
    panel.hidden = !on || dismissed;
    show.hidden = !on || !dismissed;
    clips.forEach(item => {
      item.video.hidden = item !== clip;
      if (item !== clip || !on || dismissed) item.video.pause();
    });
    if (!on || dismissed) return;
    if (!video.getAttribute('src')) video.setAttribute('src', video.dataset.src);
    video.muted = true; video.volume = 0; video.playbackRate = clip.rate;
    try {
      Promise.resolve(video.play()).then(() => {
        if (clip !== selected() || !moving() || dismissed) video.pause();
      }).catch(() => {
        if (ticket !== attempt || clip !== selected()) return;
        dismissed = true; panel.hidden = true; show.hidden = false;
      });
    } catch { dismissed = true; panel.hidden = true; show.hidden = false; }
  }
  clips.forEach((clip, index) => {
    const video = clip.video;
    video.defaultPlaybackRate = clip.rate; video.playbackRate = clip.rate;
    video.muted = true; video.defaultMuted = true; video.volume = 0;
    // End events count complete loops; native looping would suppress the handoff.
    video.loop = false; video.playsInline = true;
    video.addEventListener('ended', () => {
      if (index !== active || clip.failed) return;
      video.currentTime = 0;
      if (--remaining <= 0) nextClip();
      refresh();
    });
    video.addEventListener('error', () => {
      clip.failed = true; video.pause();
      if (index === active) nextClip();
      refresh();
    });
  });
  hide.addEventListener('click', () => { dismissed = true; refresh(); show.focus(); });
  show.addEventListener('click', () => { dismissed = false; refresh(); hide.focus(); });
  audio.addEventListener('playing', () => { buffering = false; refresh(); });
  audio.addEventListener('waiting', () => { buffering = true; refresh(); });
  for (const event of ['pause','ended','emptied','error']) audio.addEventListener(event, refresh);
  document.addEventListener('visibilitychange', refresh);
  if ($('visual-toggle')) $('visual-toggle').addEventListener('click', refresh);
  if (motion && motion.addEventListener) motion.addEventListener('change', refresh);
  refresh();
})();
