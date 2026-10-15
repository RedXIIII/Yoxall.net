(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('joke-song'), controls = $('custom-player'), toggle = $('music-toggle');
  if (!audio || !controls || !toggle) return;
  const state = $('player-state'), label = $('play-label'), hint = $('play-hint');
  const status = $('music-status'), fallback = $('music-fallback');
  const seek = $('music-seek'), current = $('music-current'), duration = $('music-duration');
  const loop = $('music-loop'), mute = $('music-mute'), restart = $('music-restart');
  const title = 'Darren is a Bellend!';
  function announce(text) { if (status.textContent !== text) status.textContent = text; }
  function setPlaying(playing) {
    document.body.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + title);
    label.textContent = playing ? 'PAUSE THE BANTER' : 'DROP THE TRACK';
    hint.textContent = playing ? 'A moment of silence? Couldn’t be us.' : 'Darren’s villain origin story starts here.';
  }
  function failed() {
    setPlaying(false);
    state.textContent = 'THE DECKS NEED A SECOND';
    label.textContent = 'TRY THE TRACK AGAIN';
    hint.textContent = 'Or open the audio directly below.';
    fallback.hidden = false;
    announce('The track could not load. Try again or open the audio directly.');
  }
  async function play() {
    try {
      state.textContent = 'CUEING THE BANTER…';
      if (audio.error) audio.load();
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') {
        setPlaying(false);
        state.textContent = 'TAP PLAY. LET THE BANTER COMMENCE.';
        announce('Press Drop the track to start the single.');
      } else failed();
    }
  }
  function time(value) {
    const seconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function updateTime() {
    const length = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    current.textContent = time(audio.currentTime);
    if (length) duration.textContent = time(length);
    seek.disabled = !length;
    const fraction = length ? Math.min(1, Math.max(0, audio.currentTime / length)) : 0;
    seek.value = String(Math.round(fraction * 1000));
    seek.style.setProperty('--progress', (fraction * 100) + '%');
    seek.setAttribute('aria-valuetext', time(audio.currentTime) + ' of ' + (length ? time(length) : '2:10'));
  }
  audio.addEventListener('playing', () => {
    setPlaying(true);
    state.textContent = 'NOW PLAYING / PROPER GRIME BANTER';
    fallback.hidden = true;
    announce('The single is playing.');
  });
  audio.addEventListener('pause', () => {
    setPlaying(false);
    if (audio.error) { failed(); return; }
    state.textContent = 'PAUSED / DARREN CAN BREATHE';
    announce('The single is paused.');
  });
  audio.addEventListener('ended', () => {
    setPlaying(false);
    state.textContent = 'THAT’S YOUR CUE TO RUN IT BACK';
    label.textContent = 'PLAY IT AGAIN';
    announce('The single has ended. Press Play it again to restart.');
  });
  audio.addEventListener('error', failed);
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate']) audio.addEventListener(event, updateTime);
  toggle.addEventListener('click', () => audio.paused ? play() : audio.pause());
  seek.addEventListener('input', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(1000, Number(seek.value))) / 1000 * audio.duration;
    updateTime();
  });
  restart.addEventListener('click', () => { audio.currentTime = 0; updateTime(); play(); });
  loop.addEventListener('click', () => {
    audio.loop = !audio.loop;
    loop.setAttribute('aria-pressed', String(audio.loop));
    loop.querySelector('span').textContent = audio.loop ? 'LOOP ON' : 'LOOP OFF';
    announce(audio.loop ? 'Loop is on.' : 'Loop is off.');
  });
  mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    mute.setAttribute('aria-pressed', String(audio.muted));
    mute.querySelector('span').textContent = audio.muted ? 'SOUND OFF' : 'SOUND ON';
    announce(audio.muted ? 'Sound is off.' : 'Sound is on.');
  });
  const share = $('share-single');
  if (share) {
    share.hidden = false;
    share.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('https://yoxall.net/');
        share.textContent = 'LINK COPIED. YOU KNOW WHAT TO DO. ✓';
        announce('The single link has been copied.');
      } catch {
        $('share-fallback').hidden = false;
        $('share-url').focus();
        $('share-url').select();
      }
    });
  }
  audio.volume = 0.7;
  audio.controls = false;
  audio.hidden = true;
  controls.hidden = false;
  updateTime();
  play();
})();
