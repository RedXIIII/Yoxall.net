(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('release-audio'), controls = $('custom-player'), toggle = $('music-toggle');
  if (!audio || !controls || !toggle) return;
  let tracks;
  try { tracks = JSON.parse($('track-data').textContent); } catch { return; }
  if (!Array.isArray(tracks) || !tracks.length) return;
  const state = $('player-state'), label = $('play-label'), hint = $('play-hint');
  const status = $('music-status'), fallback = $('music-fallback');
  const seek = $('music-seek'), current = $('music-current'), duration = $('music-duration');
  const loop = $('music-loop'), mute = $('music-mute'), restart = $('music-restart');
  const links = [...document.querySelectorAll('[data-track-index]')];
  const lyricPanels = [...document.querySelectorAll('[data-track-lyrics]')];
  const share = $('share-single');
  const recordBrowser = $('record-browser');
  const recordCards = [...document.querySelectorAll('[data-record-index]')];
  const albumCover = $('album-cover'), albumPlay = $('album-play');
  const lyricNav = $('lyrics-nav');
  if (lyricNav) lyricNav.addEventListener('click', () => { $('lyrics').open = true; });
  let active = -1, repeatAll = true, playAttempt = 0, metadataReady = false;
  let pointerStart = null, ignoreClickUntil = 0;
  const selected = () => tracks[Math.max(0, active)];
  const shareUrl = () => 'https://yoxall.net/' + (active >= 0 ? '?track=' + encodeURIComponent(selected().id) : '');
  function announce(text) { if (status.textContent !== text) status.textContent = text; }
  function time(value) {
    const seconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function setPlaying(playing) {
    document.body.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + (active < 0 ? 'Estate Sessions' : selected().title));
    label.textContent = playing ? 'PAUSE THE SET' : 'TUNE IN';
    hint.textContent = playing ? 'You’re locked into Planner FM.' : active < 0 ? 'Start the full session from track 01.' : selected().subtitle;
  }
  function updateTime() {
    if (active < 0) {
      current.textContent = '0:00';
      duration.textContent = time(tracks.reduce((sum, track) => sum + track.duration, 0));
      seek.disabled = true;
      seek.value = '0';
      seek.style.setProperty('--progress', '0%');
      seek.setAttribute('aria-valuetext', 'Choose a track to seek');
      return;
    }
    const length = metadataReady && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const elapsed = length ? audio.currentTime : 0;
    current.textContent = time(elapsed);
    duration.textContent = time(length || selected().duration);
    seek.disabled = !length;
    const fraction = length ? Math.min(1, Math.max(0, elapsed / length)) : 0;
    seek.value = String(Math.round(fraction * 1000));
    seek.style.setProperty('--progress', (fraction * 100) + '%');
    seek.setAttribute('aria-valuetext', time(elapsed) + ' of ' + duration.textContent);
  }
  function renderTrack() {
    const track = selected();
    document.body.classList.toggle('is-album-view', false);
    albumCover.hidden = true;
    albumPlay.tabIndex = -1;
    $('download-track').hidden = false;
    document.body.dataset.track = track.id;
    document.title = track.title + ' — Planner FM / Estate Sessions';
    $('playing-number').textContent = String(active + 1).padStart(2, '0');
    $('playing-title').textContent = track.title;
    $('playing-subtitle').textContent = track.subtitle;
    $('vinyl-track').textContent = 'RECORD ' + String(active + 1).padStart(2, '0');
    $('crate-position').textContent = String(active + 1).padStart(2, '0') + ' / ' + String(tracks.length).padStart(2, '0');
    $('playing-story').textContent = track.sleeveNote;
    recordCards.forEach(card => {
      let offset = Number(card.dataset.recordIndex) - active;
      if (offset > tracks.length / 2) offset -= tracks.length;
      if (offset < -tracks.length / 2) offset += tracks.length;
      const depth = Math.abs(offset);
      card.style.setProperty('--offset', String(offset));
      card.style.setProperty('--depth', String(depth));
      card.style.setProperty('--side', String(Math.sign(offset)));
      card.dataset.far = String(depth > 2);
      card.classList.toggle('is-active', offset === 0);
      card.setAttribute('aria-hidden', String(offset !== 0));
      card.querySelector('a').tabIndex = offset === 0 ? 0 : -1;
    });
    $('lyrics-heading').textContent = 'TRACK ' + String(active + 1).padStart(2, '0') + ' / THE LYRIC SHEET';
    audio.setAttribute('aria-label', track.title + ' — Planner FM');
    links.forEach(link => {
      if (Number(link.dataset.trackIndex) === active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    lyricPanels.forEach(panel => { panel.hidden = Number(panel.dataset.trackLyrics) !== active; });
    fallback.setAttribute('href', track.src);
    fallback.hidden = true;
    $('download-track').setAttribute('href', track.src);
    $('download-track').setAttribute('download', track.downloadName);
    $('share-url').value = shareUrl();
    if (share) share.textContent = 'PASS THE FREQUENCY ↗';
    setPlaying(false);
    updateTime();
  }
  function renderAlbum() {
    document.body.dataset.track = 'album';
    document.body.classList.toggle('is-album-view', true);
    document.title = 'Planner FM — Estate Sessions';
    albumCover.hidden = false;
    albumPlay.tabIndex = 0;
    $('playing-number').textContent = 'LP';
    $('playing-title').textContent = 'Estate Sessions';
    $('playing-subtitle').textContent = 'Pick a record. Find your frequency.';
    $('vinyl-track').textContent = 'THE ALBUM SLEEVE';
    $('crate-position').textContent = 'ALBUM / ' + String(tracks.length).padStart(2, '0');
    $('playing-story').textContent = 'From the repairs desk to the dancefloor. The diary’s full. The frequency’s open.';
    recordCards.forEach(card => {
      card.classList.toggle('is-active', false);
      card.setAttribute('aria-hidden', 'true');
      card.querySelector('a').tabIndex = -1;
    });
    links.forEach(link => link.removeAttribute('aria-current'));
    lyricPanels.forEach(panel => { panel.hidden = true; });
    $('lyrics-heading').textContent = 'THE LYRIC SHEETS / CHOOSE A TRACK';
    $('download-track').hidden = true;
    state.textContent = 'THE FULL SESSION / READY WHEN YOU ARE';
    setPlaying(false);
    updateTime();
  }
  function failed() {
    if (active < 0) return;
    setPlaying(false);
    state.textContent = 'THE DECKS NEED A SECOND';
    label.textContent = 'TRY THE TRACK AGAIN';
    hint.textContent = 'Or open the audio directly below.';
    fallback.hidden = false;
    announce('The track could not load. Try again or open the audio directly.');
  }
  async function play() {
    if (active < 0) { selectTrack(0); return; }
    const attempt = ++playAttempt;
    try {
      state.textContent = 'CUEING TRACK ' + String(active + 1).padStart(2, '0') + '…';
      if (audio.error) { metadataReady = false; audio.load(); updateTime(); }
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      if (attempt !== playAttempt || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') {
        setPlaying(false);
        state.textContent = 'TAP TUNE IN TO START THE SET';
        announce('Press Tune in to play ' + selected().title + '.');
      } else failed();
    }
  }
  function selectTrack(index, updateUrl = true, autoplay = true) {
    if (!Number.isInteger(index) || !tracks[index]) return;
    const moveRecordFocus = document.activeElement && recordBrowser.contains(document.activeElement);
    ++playAttempt;
    audio.pause();
    active = index;
    metadataReady = false;
    audio.src = selected().src;
    audio.loop = false;
    audio.load();
    renderTrack();
    if (moveRecordFocus) recordBrowser.focus({preventScroll: true});
    if (updateUrl) {
      try { history.replaceState(null, '', '/?track=' + encodeURIComponent(selected().id)); } catch {}
    }
    if (autoplay) play();
    else {
      state.textContent = 'CUED / PRESS TUNE IN';
      announce('Cued ' + selected().title + '. Press Tune in to play.');
    }
  }
  audio.addEventListener('playing', () => {
    if (audio.paused) return;
    setPlaying(true);
    state.textContent = 'ON AIR / ' + selected().station;
    fallback.hidden = true;
    announce('Now playing ' + selected().title + '.');
  });
  audio.addEventListener('pause', () => {
    if (!audio.paused) return;
    setPlaying(false);
    if (audio.error) { failed(); return; }
    state.textContent = 'ON HOLD / THE DIARY CAN WAIT';
    announce('The track is paused.');
  });
  audio.addEventListener('ended', () => {
    if (!audio.ended) return;
    setPlaying(false);
    if (active < tracks.length - 1) selectTrack(active + 1);
    else if (repeatAll) selectTrack(0);
    else {
      state.textContent = 'THAT’S YOUR CUE TO RUN IT BACK';
      label.textContent = 'PLAY IT AGAIN';
      announce('The release has ended. Press Play it again to replay this track.');
    }
  });
  audio.addEventListener('error', failed);
  audio.addEventListener('loadedmetadata', () => { metadataReady = true; updateTime(); });
  for (const event of ['durationchange', 'timeupdate']) audio.addEventListener(event, updateTime);
  toggle.addEventListener('click', () => {
    if (audio.paused) play();
    else { ++playAttempt; audio.pause(); }
  });
  albumPlay.addEventListener('click', event => {
    event.preventDefault();
    if (Date.now() < ignoreClickUntil) return;
    selectTrack(0);
  });
  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    if (Date.now() < ignoreClickUntil) return;
    const index = Number(link.dataset.trackIndex);
    if (index !== active) selectTrack(index);
    else if (audio.paused) play();
    else { ++playAttempt; audio.pause(); }
  }));
  seek.addEventListener('input', () => {
    if (!metadataReady || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(1000, Number(seek.value))) / 1000 * audio.duration;
    updateTime();
  });
  restart.addEventListener('click', () => { audio.currentTime = 0; updateTime(); play(); });
  $('music-next').addEventListener('click', () => selectTrack((active + 1) % tracks.length));
  function flipRecord(direction) {
    const next = active < 0 ? direction > 0 ? 0 : tracks.length - 1 : (active + direction + tracks.length) % tracks.length;
    selectTrack(next, true, !audio.paused);
  }
  $('record-prev').addEventListener('click', () => flipRecord(-1));
  $('record-next').addEventListener('click', () => flipRecord(1));
  recordBrowser.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    flipRecord(event.key === 'ArrowRight' ? 1 : -1);
  });
  recordBrowser.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerStart = {id: event.pointerId, x: event.clientX, y: event.clientY};
  });
  recordBrowser.addEventListener('pointerup', event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    ignoreClickUntil = Date.now() + 450;
    flipRecord(dx < 0 ? 1 : -1);
  });
  recordBrowser.addEventListener('pointercancel', () => { pointerStart = null; });
  loop.addEventListener('click', () => {
    repeatAll = !repeatAll;
    loop.setAttribute('aria-pressed', String(repeatAll));
    loop.querySelector('span').textContent = repeatAll ? 'LOOP ALL' : 'LOOP OFF';
    announce(repeatAll ? 'All tracks will repeat in order.' : 'The release will stop after the last track.');
  });
  mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    mute.setAttribute('aria-pressed', String(audio.muted));
    mute.querySelector('span').textContent = audio.muted ? 'SOUND OFF' : 'SOUND ON';
    announce(audio.muted ? 'Sound is off.' : 'Sound is on.');
  });
  if (share) {
    share.hidden = false;
    share.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl());
        share.textContent = 'FREQUENCY COPIED ✓';
        announce(active < 0 ? 'A link to the album has been copied.' : 'A link to the selected track has been copied.');
      } catch {
        $('share-fallback').hidden = false;
        $('share-url').value = shareUrl();
        $('share-url').focus();
        $('share-url').select();
      }
    });
  }
  audio.volume = 0.7;
  audio.controls = false;
  audio.hidden = true;
  audio.loop = false;
  controls.hidden = false;
  $('record-controls').hidden = false;
  $('record-help').textContent = 'FLIP A SLEEVE. TAP TO PLAY.  ← → KEYS / DRAG OR SWIPE';
  const requested = new URLSearchParams(location.search).get('track');
  const initial = tracks.findIndex(track => track.id === requested);
  if (initial >= 0) selectTrack(initial, false);
  else renderAlbum();
})();
