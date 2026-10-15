(() => {
  'use strict';
  const audio = document.getElementById('joke-song');
  const toggle = document.getElementById('music-toggle');
  const status = document.getElementById('music-status');
  const fallback = document.getElementById('music-fallback');
  if (!audio || !toggle || !status || !fallback) return;

  function announce(message) {
    if (status.textContent !== message) status.textContent = message;
  }
  function showPaused() {
    toggle.textContent = 'Play song ♪';
    toggle.setAttribute('aria-pressed', 'false');
  }
  function showFailure() {
    showPaused();
    toggle.textContent = 'Try music again ♪';
    fallback.hidden = false;
    announce('The music could not load. Try again or use Open audio.');
  }
  async function startMusic() {
    try {
      if (audio.error) audio.load();
      await audio.play();
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') {
        showPaused();
        announce('Press Play song to start the background music.');
      } else {
        showFailure();
      }
    }
  }

  audio.addEventListener('playing', () => {
    toggle.textContent = 'Pause song Ⅱ';
    toggle.setAttribute('aria-pressed', 'true');
    fallback.hidden = true;
    announce('Background music is playing.');
  });
  audio.addEventListener('pause', () => {
    showPaused();
    announce('Background music is paused.');
  });
  audio.addEventListener('error', showFailure);
  toggle.addEventListener('click', () => {
    if (audio.paused) startMusic();
    else audio.pause();
  });

  audio.volume = 0.55;
  audio.controls = false;
  audio.hidden = true;
  toggle.hidden = false;
  startMusic();
})();
