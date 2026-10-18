'use strict';
// Temporary music takeover. The archive remains on the pre-joke backup branch.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = __dirname;
const tracks = JSON.parse(fs.readFileSync(path.join(root, 'assets/release-tracks.json'), 'utf8'));
if (!Array.isArray(tracks) || !tracks.length) throw Error('The release needs at least one track');
const ids = new Set();
for (const track of tracks) {
  if (!/^[a-z0-9-]+$/.test(track.id) || ids.has(track.id)) throw Error('Invalid or duplicate track ID');
  ids.add(track.id);
  if (!track.title || !track.station || !track.downloadName || !track.artworkAlt || !track.sleeveNote || !Number.isFinite(track.duration) || track.duration <= 0 || !Array.isArray(track.lyrics)) throw Error('Incomplete track ' + track.id);
  for (const [key, pattern] of [['src', /^\/assets\/[a-z0-9-]+\.mp3$/], ['artwork', /^\/assets\/sleeves\/[a-z0-9-]+\.webp$/], ['thumbnail', /^\/assets\/sleeves\/[a-z0-9-]+\.webp$/]]) {
    if (!pattern.test(track[key]) || !fs.existsSync(path.join(root, track[key].slice(1)))) throw Error('Missing or unsafe ' + key + ' for ' + track.id);
  }
}
const escape = value => String(value).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const pad = value => String(value).padStart(2, '0');
const time = value => Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0');
const totalTime = time(tracks.reduce((total, track) => total + track.duration, 0));
const first = tracks[0];
const playerData = JSON.stringify(tracks.map(({lyrics, ...track}) => track)).replace(/</g, '\\u003c');
const lyricMarkup = sections => sections.map(section => `<section class="lyric-block${section.name.toLowerCase().includes('hook') ? ' lyric-hook' : ''}"><h3>${escape(section.name)}</h3><p class="lyric-note">${escape(section.note)}</p>${section.lines.length ? `<p class="lyric-lines">${section.lines.map(escape).join('<br>')}</p>` : ''}</section>`).join('');
const mark = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 6a14 14 0 0 0 0 20M24 6a14 14 0 0 1 0 20M12 10a8 8 0 0 0 0 12M20 10a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="2.5" fill="currentColor"/></svg>';
const arrow = direction => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${direction === 'left' ? 'm14 5-7 7 7 7M7 12h14' : 'm10 5 7 7-7 7M17 12H3'}" stroke="currentColor" stroke-width="1.5"/></svg>`;
const records = tracks.map((track, index) => {
  let offset = index + 1;
  if (offset > (tracks.length + 1) / 2) offset -= tracks.length + 1;
  const depth = Math.abs(offset);
  return `<article class="record-card" data-record-index="${index}" data-far="${depth > 2}" aria-hidden="true" style="--offset:${offset};--depth:${depth};--side:${Math.sign(offset)}"><div class="record-vinyl" aria-hidden="true"><div class="disc-label"><span>PLANNER FM</span><b>${pad(index + 1)}</b><i></i><span>PLANNING SESSIONS</span></div></div><a class="record-select" draggable="false" href="${escape(track.src)}" data-track-index="${index}" aria-label="Play ${escape(track.title)}" tabindex="-1"><img src="${escape(track.artwork)}" width="1254" height="1254" alt="${escape(track.artworkAlt)}" loading="lazy" draggable="false"><span class="record-catalogue" aria-hidden="true"><span>PF–001 / ${pad(index + 1)}</span><span>${track.bonus ? escape(track.bonusLabel || 'BONUS RECORD') : 'PLANNING TEAM'}</span></span><span class="record-play-mark" aria-hidden="true">▶</span></a></article>`;
}).join('');
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="theme-color" content="#0a1017">
  <meta name="description" content="Planner FM — The Planning Sessions. ${tracks.length} records, ${totalTime} on the clock. Flip a sleeve. Find your frequency.">
  <meta property="og:type" content="music.album">
  <meta property="og:title" content="Planner FM — The Planning Sessions">
  <meta property="og:description" content="${tracks.length} lyric-inspired sleeves. One very full diary. Full diary. Full volume.">
  <meta property="og:url" content="https://yoxall.net/">
  <meta property="og:image" content="https://yoxall.net/assets/planner-fm-estate-sessions.jpg">
  <meta property="og:image:alt" content="Original Planner FM intro cover">
  <meta property="og:image:width" content="1254"><meta property="og:image:height" content="1254">
  <meta name="twitter:card" content="summary_large_image">
  <title>Planner FM — The Planning Sessions</title>
  <link rel="canonical" href="https://yoxall.net/">
  <link rel="icon" href="/assets/single-icon.svg?v=crate1" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/single.css?v=coverplay1">
  <script src="/assets/single-player.js?v=coverplay1" defer></script>
  <script src="/assets/deck-visualizer.js?v=deck2" defer></script>
  <script src="/assets/meme-dancer.js?v=5" defer></script>
</head>
<body class="is-album-view">
  <a class="skip-link" href="#main">Skip to the records</a>
  <div id="ambient-art" class="ambient" aria-hidden="true"></div>
  <div class="page-shell">
    <header class="masthead"><a class="station-brand" href="/" aria-label="Planner FM home">${mark}<span>PLANNER <b>FM</b></span></a><span class="masthead-note">INDEPENDENT PLANNER RADIO</span><nav aria-label="Release navigation"><a href="#tracklist">TRACKLIST</a><a id="lyrics-nav" href="#lyrics">LYRICS</a><a class="notes-nav" href="#sleeve-notes">SLEEVE NOTES</a></nav><span class="edition"><i aria-hidden="true"></i> PF–001</span></header>
    <main id="main">
      <section class="release" aria-labelledby="release-title">
        <div class="record-column">
          <div class="crate-topline"><span>THE RECORD CRATE</span><span id="crate-position">ALBUM / ${pad(tracks.length)}</span></div>
          <div id="record-browser" class="record-browser" role="region" tabindex="0" aria-label="Browse the record sleeves" aria-roledescription="record carousel" aria-describedby="record-help"><article id="album-cover" class="record-card is-active" style="--offset:0;--depth:0;--side:0"><div class="record-vinyl" aria-hidden="true"><div class="disc-label"><span>PLANNER FM</span><b>LP</b><i></i><span>PLANNING SESSIONS</span></div></div><a id="album-play" class="record-select" draggable="false" href="${escape(first.src)}" aria-label="Play The Planning Sessions"><img src="/assets/planner-fm-estate-sessions.webp" width="1254" height="1254" alt="Original Planner FM intro cover: hooded MC at the repairs planning desk" fetchpriority="high" draggable="false"><span class="record-catalogue" aria-hidden="true"><span>PF–001 / THE ALBUM</span><span>PLANNING TEAM</span></span><span class="record-play-mark" aria-hidden="true">▶</span></a></article>${records}</div>
          <div id="record-controls" class="crate-controls" hidden><button id="record-prev" type="button" aria-label="Flip to the previous record">${arrow('left')}<span>PREVIOUS</span></button><span id="vinyl-track">THE ALBUM SLEEVE</span><button id="record-next" type="button" aria-label="Flip to the next record"><span>NEXT RECORD</span>${arrow('right')}</button></div>
          <p id="record-help" class="record-help">Pick a track below to listen.</p>
          <p id="playing-story" class="sleeve-story">From the repairs desk to the dancefloor. The diary’s full. The frequency’s open.</p>
        </div>
        <section class="release-copy" aria-labelledby="release-title">
          <div class="release-kicker"><span class="release-type">THE FULL SESSION</span><span>ESKI / PHONK / GRIME / AFTER HOURS</span></div>
          <h1 id="release-title">PLANNER <span>FM</span></h1><p class="album-title">The Planning Sessions<span>VOL. 01</span></p>
          <p class="release-intro">Repairs by day. Pirate radio after hours.</p>
          <div class="release-facts"><span>PLANNING TEAM</span><span>${tracks.length} TRACKS</span><span>${totalTime} ON THE CLOCK</span><span class="explicit-tag">EXPLICIT / SHIFT LANGUAGE</span></div>
          <section class="player" aria-label="Listen to The Planning Sessions"><div class="deck-screws" aria-hidden="true"><i></i><i></i></div><div class="player-topline"><span><i class="signal-light" aria-hidden="true"></i><span id="player-state">TRANSMISSION READY</span></span><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
            <div class="now-track"><span id="playing-number">LP</span><div><span>ON THE DECK</span><strong id="playing-title">The Planning Sessions</strong><p id="playing-subtitle">Pick a record. Find your frequency.</p></div></div>
            <div id="deck-visuals" class="deck-visuals" hidden>
              <div class="turntable"><span class="deck-speed" aria-hidden="true">PF / 001</span><button id="deck-toggle" class="platter-button" type="button" aria-label="Play The Planning Sessions" aria-pressed="false" aria-controls="release-audio"><span class="platter"><span class="platter-sheen"></span><span class="platter-label"><img id="deck-art" src="/assets/planner-fm-estate-sessions.webp" alt="Original Planner FM intro cover: hooded MC at the repairs planning desk" width="144" height="144"><span class="spindle"></span></span></span><svg class="platter-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="57"/><circle id="platter-progress" cx="60" cy="60" r="57" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg><span class="platter-play" aria-hidden="true">▶</span></button><span class="tonearm" aria-hidden="true"></span><span class="deck-etch" aria-hidden="true">THE DIARY CAN WAIT.</span></div>
              <div class="signal-rack"><div class="signal-heading"><span id="visual-state">NEEDLE UP</span><button id="visual-toggle" type="button" aria-pressed="true" aria-controls="deck-visuals">VISUALS ON</button></div><div class="signal-screen"><canvas id="signal-canvas" width="640" height="220" aria-hidden="true"></canvas><span class="signal-screen-label" aria-hidden="true">PLANNER FM / SPECTRUM</span></div><div class="band-meters" aria-hidden="true"><span>SUB<i><b id="meter-sub"></b></i></span><span>BODY<i><b id="meter-mid"></b></i></span><span>AIR<i><b id="meter-high"></b></i></span></div><div class="deck-signoff" aria-hidden="true">ICY SYNTHS. DIRTY 808s.</div></div>
            </div>
            <audio id="release-audio" src="${escape(first.src)}" preload="metadata" controls aria-label="${escape(first.title)} — Planner FM"><a href="${escape(first.src)}">Play the opening track</a></audio>
            <div id="custom-player" hidden><button id="music-toggle" class="drop-button" type="button" aria-pressed="false" aria-controls="release-audio" aria-label="Play ${escape(first.title)}"><span class="play-disc" aria-hidden="true"><svg class="play-icon" viewBox="0 0 24 24"><path d="m8 4 13 8-13 8z"/></svg><svg class="pause-icon" viewBox="0 0 24 24"><path d="M6 4h5v16H6zm8 0h5v16h-5z"/></svg></span><span class="drop-copy"><strong id="play-label">TUNE IN</strong><span id="play-hint">${escape(first.subtitle)}</span></span><span class="drop-arrow" aria-hidden="true">↗</span></button>
              <div class="seek-row"><span id="music-current">0:00</span><label class="seek-label"><span class="sr-only">Seek through the selected track</span><input id="music-seek" type="range" min="0" max="1000" step="1" value="0" aria-valuetext="0:00 of ${time(first.duration)}" disabled></label><span id="music-duration">${time(first.duration)}</span></div>
              <div class="transport"><button id="music-restart" type="button" aria-label="Restart the selected track">↶ <span>REWIND</span></button><button id="music-next" type="button" aria-label="Play the next track">↠ <span>NEXT TRACK</span></button><button id="music-loop" type="button" aria-pressed="true" aria-label="Repeat all tracks">↻ <span>LOOP ALL</span></button><button id="music-mute" type="button" aria-pressed="false">◖ <span>SOUND ON</span></button></div>
            </div><a id="music-fallback" class="fallback-link" href="${escape(first.src)}" target="_blank" rel="noopener" hidden>Open the track directly ↗</a><p id="music-status" class="sr-only" role="status" aria-live="polite"></p>
          </section>
          <div class="release-actions"><button id="share-single" type="button" hidden>PASS THE FREQUENCY ↗</button><a id="download-track" href="${escape(first.src)}" download="${escape(first.downloadName)}">TAKE THE TRACK ↓</a></div>
          <label id="share-fallback" class="share-fallback" hidden>Copy this track link<input id="share-url" type="text" value="https://yoxall.net/" readonly></label>
          <div class="release-annotation"><p class="hero-aside"><span>FULL DIARY.</span> FULL VOLUME.<small>Please hold. Your bassline is important to us.</small></p><span class="parental-advisory" role="img" aria-label="Parental advisory: explicit lyrics"><svg viewBox="0 0 100 64" aria-hidden="true" focusable="false"><rect width="100" height="64" fill="#e4e8eb"/><text x="50" y="18" text-anchor="middle" textLength="90" lengthAdjust="spacingAndGlyphs" font-family="Impact, Arial Black, sans-serif" font-weight="700" font-size="19" fill="#080a0d">PARENTAL</text><rect x="2" y="23" width="96" height="24" fill="#080a0d"/><text x="50" y="42" text-anchor="middle" textLength="88" lengthAdjust="spacingAndGlyphs" font-family="Impact, Arial Black, sans-serif" font-weight="700" font-size="23" fill="#fff">ADVISORY</text><text x="50" y="59" text-anchor="middle" textLength="90" lengthAdjust="spacingAndGlyphs" font-family="Arial, sans-serif" font-weight="700" font-size="8" fill="#080a0d">EXPLICIT LYRICS</text></svg></span></div>
        </section>
      </section>
      <div class="frequency-strip" aria-hidden="true"><span>PLANNER FM / AFTER HOURS</span><b>ESKI DNA</b><span class="frequency-bars">▂ ▅ ▃ █ ▆ ▂ ▇ ▄</span><b>PHONK PRESSURE</b><span>PLEASE HOLD FOR THE DROP.</span></div>
      <section class="tracklist" id="tracklist" aria-labelledby="tracklist-title"><div class="section-heading"><div><span class="eyebrow">THE COMPLETE COLLECTION</span><h2 id="tracklist-title">The running order.</h2></div><span>${tracks.length} TRACKS / ${totalTime}</span></div><ol>${tracks.map((track,index) => `<li><a class="track-link" href="${escape(track.src)}" data-track-index="${index}" aria-label="Play ${escape(track.title)}"><span class="track-number">${pad(index + 1)}</span><img src="${escape(track.thumbnail)}" width="72" height="72" alt="${escape(track.artworkAlt)}" loading="lazy"><span class="track-info"><strong>${escape(track.title)}${track.bonus ? ' <span class="bonus-badge">BONUS</span>' : ''}</strong><small>${escape(track.subtitle)}</small></span><span class="track-time">${time(track.duration)}</span><span class="track-indicator" aria-hidden="true">▶</span></a></li>`).join('')}</ol></section>
      <div class="session-extras">
        <details class="lyrics" id="lyrics" open><summary><span id="lyrics-heading">THE LYRIC SHEETS</span><span aria-hidden="true">+</span></summary><div class="lyrics-content"><p class="lyrics-intro">Every bar, straight from the planning team. Lyrics follow the selected record.</p>${tracks.map((track,index) => `<div data-track-lyrics="${index}"><h2 class="lyric-track-title">${pad(index + 1)} / ${escape(track.title)}</h2>${lyricMarkup(track.lyrics)}</div>`).join('')}</div></details>
        <aside class="sleeve-notes" id="sleeve-notes"><span class="eyebrow">FROM THE REPAIRS DESK TO THE DECKS</span><h2>Phones down.<br><em>Bass up.</em></h2><p>Missed calls. Full diaries. Filthy basslines.<br>The soundtrack to keeping the job board moving.</p><div class="crew-stamp"><span>PLANNING<br><b>TEAM</b></span><small>ON SHIFT<br>OFF THE DIAL</small></div><div class="liner-note"><span>NO ACTUAL RADIO LICENCE WAS HARMED</span><p>For the crew. For the group chat.<br>And, occasionally, at Darren’s expense.</p></div></aside>
      </div>
    </main>
    <footer class="release-footer"><a href="/">PLANNER FM <span>/ PLANNING SESSIONS</span></a><span>THE DIARY’S FULL. THE FREQUENCY’S OPEN.</span><span class="catalogue">PF–001 / ${tracks.length} TRANSMISSIONS</span></footer>
  <aside id="meme-dancer" class="meme-dancer" data-meme="girl" aria-label="Off-the-clock memes" hidden><div id="dancer-panel" class="dancer-panel"><span id="meme-label" class="sr-only">OFF THE CLOCK</span><button id="dancer-hide" class="dancer-close" type="button" aria-label="Hide memes" title="Hide memes">×</button><video id="dancer-video" class="meme-video" data-src="/assets/planner-fm-dancer.mp4" muted playsinline preload="none" width="320" height="320" aria-hidden="true"></video><video id="cat-video" class="meme-video meme-cat" data-src="/assets/planner-fm-vibe-cat.mp4" muted playsinline preload="none" width="320" height="320" aria-hidden="true" hidden></video><video id="ankha-video" class="meme-video" data-src="/assets/planner-fm-ankha.mp4" muted playsinline preload="none" width="320" height="320" aria-hidden="true" hidden></video></div><button id="dancer-show" class="dancer-show" type="button" hidden>SHOW MEMES ↗</button></aside>
  <a class="archive-easter-egg" href="/the-record/" aria-label="Open The Record archive" title="Some files never stay buried."><svg viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M20 2C9 2 3 10 3 20c0 11 10 23 17 26 7-3 17-15 17-26C37 10 31 2 20 2Z" fill="#183a30" stroke="#6a947a" stroke-width="1.2"/><path d="M7 19c8-1 11 5 11 13-7-1-11-6-11-13Zm26 0c-8-1-11 5-11 13 7-1 11-6 11-13Z" fill="#0a1016" stroke="#665582" stroke-width="1.3"/><path d="m18 35-1 2m5-2 1 2m-6 3c2-1 4-1 6 0" stroke="#749582" stroke-width="1.3" stroke-linecap="round"/></svg></a>
  </div><script id="track-data" type="application/json">${playerData}</script>
</body>
</html>
`;
const pages = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0').filter(file => file.endsWith('.html') && !file.startsWith('the-record/'));
if (!pages.includes('index.html') || !pages.includes('404.html')) throw Error('Expected homepage and fallback are missing');
for (const file of pages) fs.writeFileSync(path.join(root, file), page);
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://yoxall.net/</loc></url></urlset>\n');
console.log('Applied the Planner FM record crate to ' + pages.length + ' routes.');
