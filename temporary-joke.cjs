'use strict';

// Temporary EP release. The original site remains on the pre-joke backup branch.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = __dirname;
const tracks = JSON.parse(fs.readFileSync(path.join(root, 'assets/release-tracks.json'), 'utf8'));
if (!Array.isArray(tracks) || !tracks.length) throw Error('The release needs at least one track');
const trackIds = new Set();
for (const track of tracks) {
  if (!/^[a-z0-9-]+$/.test(track.id) || trackIds.has(track.id)) throw Error('Invalid or duplicate track ID');
  trackIds.add(track.id);
  if (!track.title || !track.station || !track.downloadName || !Number.isFinite(track.duration) || track.duration <= 0 || !Array.isArray(track.lyrics)) throw Error('Incomplete track ' + track.id);
  if (!/^\/assets\/[a-z0-9-]+\.mp3$/.test(track.src) || !fs.existsSync(path.join(root, track.src.slice(1)))) throw Error('Missing or unsafe audio file');
}
const escape = value => String(value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
const lyricMarkup = sections => sections.map(section => `<section class="lyric-block${section.name.toLowerCase().includes('hook') ? ' lyric-hook' : ''}"><h3>${escape(section.name)}</h3><p class="lyric-note">${escape(section.note)}</p>${section.lines.length ? `<p class="lyric-lines">${section.lines.map(escape).join('<br>')}</p>` : ''}</section>`).join('');
const time = value => Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0');
const playerData = JSON.stringify(tracks.map(({lyrics, ...track}) => track)).replace(/</g, '\\u003c');
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="theme-color" content="#0b0d10">
  <meta name="description" content="The Darren Sessions. ${tracks.length} tracks of Proper Grime Banter. One very specific target.">
  <meta property="og:type" content="music.album">
  <meta property="og:title" content="The Darren Sessions — Proper Grime Banter">
  <meta property="og:description" content="${tracks.length} tracks. One very specific target. The EP nobody asked for.">
  <meta property="og:url" content="https://yoxall.net/">
  <meta property="og:image" content="https://yoxall.net/assets/darren-bellend-cover-v2.jpg">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="1280">
  <meta name="twitter:card" content="summary_large_image">
  <title>Darren is a Bellend! — Proper Grime Banter</title>
  <link rel="canonical" href="https://yoxall.net/">
  <link rel="icon" href="/assets/single-icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/single.css?v=ep4">
  <script src="/assets/single-player.js?v=ep4" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to the EP</a>
  <div class="ambient" aria-hidden="true"></div>
  <div class="page-shell">
    <header class="masthead">
      <a class="label-brand" href="/" aria-label="Banter Records home"><span class="label-mark" aria-hidden="true">◉</span>BANTER<span>RECORDS</span></a>
      <span class="masthead-note">UNSIGNED. UNHINGED.</span>
      <span class="edition">BNT–001 <span class="edition-dot" aria-hidden="true"></span> THE DARREN SESSIONS</span>
    </header>
    <main id="main" class="release">
      <section class="visual-column" aria-label="EP artwork">
        <div class="record-display">
          <div class="vinyl" aria-hidden="true"><div class="vinyl-label"><span>BANTER RECORDS</span><strong id="vinyl-track">TRACK 01</strong><i></i><span>33⅓ / ABSOLUTE NONSENSE</span></div></div>
          <figure class="sleeve"><img src="/assets/darren-bellend-cover-v2.jpg" width="1280" height="1280" alt="Darren is a Bellend! by Proper Grime Banter: a grime crew and speakers on a rainy estate at night." fetchpriority="high"><figcaption class="advisory"><span>ADVISORY</span><strong>EXCESSIVE<br>DARREN</strong></figcaption></figure>
        </div>
        <div class="sleeve-caption"><span>THE DARREN SESSIONS</span><span>0% SUBTLETY. 100% BANTER.</span></div>
        <p class="sleeve-note">PRESS PLAY. <span>MAKE IT THE GROUP CHAT’S PROBLEM.</span></p>
      </section>
      <section class="release-copy" aria-labelledby="release-title">
        <div class="release-kicker"><span class="release-type">GRIME / BANTER</span><span>${tracks.length} TRACKS. NO RESTRAINT.</span></div>
        <h1 id="release-title"><span>Darren</span><small>is a</small><strong>Bellend!</strong></h1>
        <div class="artist-row"><span class="artist-icon" aria-hidden="true">↳</span><p>PROPER GRIME BANTER<span>A deeply unserious EP.</span></p></div>
        <section class="player" aria-label="Play the EP">
          <div class="player-topline"><span id="player-state">READY TO CAUSE A SCENE</span><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
          <div class="now-track"><span id="playing-number">01</span><div><span>ON THE DECK</span><strong id="playing-title">Darren is a Bellend!</strong><p id="playing-subtitle">The original disrespect.</p></div></div>
          <audio id="joke-song" src="/assets/darren-bellend-single.mp3" preload="metadata" controls aria-label="Darren is a Bellend! by Proper Grime Banter"><a href="/assets/darren-bellend-single.mp3">Play the original track</a></audio>
          <div id="custom-player" hidden>
            <button id="music-toggle" class="drop-button" type="button" aria-pressed="false" aria-controls="joke-song" aria-label="Play Darren is a Bellend!">
              <span class="play-disc" aria-hidden="true"><svg class="play-icon" viewBox="0 0 24 24"><path d="m8 4 13 8-13 8z"/></svg><svg class="pause-icon" viewBox="0 0 24 24"><path d="M6 4h5v16H6zm8 0h5v16h-5z"/></svg></span>
              <span class="drop-copy"><strong id="play-label">DROP THE TRACK</strong><span id="play-hint">Darren’s villain origin story starts here.</span></span><span class="drop-arrow" aria-hidden="true">↗</span>
            </button>
            <div class="seek-row"><span id="music-current">0:00</span><label class="seek-label"><span class="sr-only">Seek through the selected track</span><input id="music-seek" type="range" min="0" max="1000" step="1" value="0" aria-valuetext="0:00 of 2:10" disabled></label><span id="music-duration">2:10</span></div>
            <div class="transport"><button id="music-restart" type="button" aria-label="Restart the selected track">↶ <span>RUN IT BACK</span></button><button id="music-next" type="button" aria-label="Play the next track">↠ <span>NEXT TRACK</span></button><button id="music-loop" type="button" aria-pressed="true" aria-label="Repeat all tracks">↻ <span>LOOP ALL</span></button><button id="music-mute" type="button" aria-pressed="false">◖ <span>SOUND ON</span></button></div>
          </div>
          <a id="music-fallback" class="fallback-link" href="/assets/darren-bellend-single.mp3" target="_blank" rel="noopener" hidden>Open the track directly ↗</a>
          <p id="music-status" class="sr-only" role="status" aria-live="polite"></p>
        </section>
        <section class="tracklist" aria-labelledby="tracklist-title"><div class="tracklist-heading"><h2 id="tracklist-title">THE TRACKLIST</h2><span>${tracks.length} TRACKS / ${time(tracks.reduce((total,track) => total + track.duration,0))}</span></div><ol>${tracks.map((track,index) => `<li><a class="track-link" href="${escape(track.src)}" data-track-index="${index}" aria-label="Play ${escape(track.title)}"${index === 0 ? ' aria-current="true"' : ''}><span class="track-number">${String(index + 1).padStart(2,'0')}</span><span class="track-info"><strong>${escape(track.title)}</strong><small>${escape(track.subtitle)}</small></span><span class="track-time">${time(track.duration)}</span><span class="track-indicator" aria-hidden="true">▶</span></a></li>`).join('')}</ol></section>
        <div class="release-actions"><button id="share-single" type="button" hidden>SEND TO THE GROUP CHAT <span aria-hidden="true">↗</span></button><a id="download-track" href="/assets/darren-bellend-single.mp3" download="Darren is a Bellend!.mp3">KEEP THE EVIDENCE ↓</a></div>
        <label id="share-fallback" class="share-fallback" hidden>Copy this link<input id="share-url" type="text" value="https://yoxall.net/" readonly></label>
        <div class="liner-note"><span>LINER NOTES / 001</span><p>No bad blood. Nothing but love.<br>Absolutely no filter.</p></div>
        <details class="lyrics" id="lyrics"><summary><span id="lyrics-heading">KNOW THE BARS</span><span aria-hidden="true">+</span></summary><div class="lyrics-content"><p class="lyrics-intro">The full lyric sheets. Strong language. Strong friendship.</p>${tracks.map((track,index) => `<div data-track-lyrics="${index}"><h2 class="lyric-track-title">${String(index + 1).padStart(2,'0')} / ${escape(track.title)}</h2>${lyricMarkup(track.lyrics)}</div>`).join('')}</div></details>
      </section>
    </main>
    <footer class="release-footer"><span>${tracks.length} TRACKS. ONE VERY SPECIFIC TARGET.</span><span>BEST SERVED LOUD. <b>ALL BANTER.</b></span><span class="catalogue">BNT–001 / THE EP</span></footer>
  </div>
  <script id="track-data" type="application/json">${playerData}</script>
</body>
</html>
`;

const pages = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(file => file.endsWith('.html'));
if (!pages.includes('index.html') || !pages.includes('404.html')) throw Error('Expected homepage and fallback are missing');
for (const file of pages) fs.writeFileSync(path.join(root, file), page);
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://yoxall.net/</loc></url></urlset>\n');
console.log('Applied the EP release page to ' + pages.length + ' existing routes, including the 404 fallback.');
