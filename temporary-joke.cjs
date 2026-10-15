'use strict';

// Temporary music takeover. The archive remains on the pre-joke backup branch.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
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
const escape = value => String(value).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const lyricMarkup = sections => sections.map(section => `<section class="lyric-block${section.name.toLowerCase().includes('hook') ? ' lyric-hook' : ''}"><h3>${escape(section.name)}</h3><p class="lyric-note">${escape(section.note)}</p>${section.lines.length ? `<p class="lyric-lines">${section.lines.map(escape).join('<br>')}</p>` : ''}</section>`).join('');
const time = value => Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0');
const totalTime = time(tracks.reduce((total, track) => total + track.duration, 0));
const first = tracks[0];
const playerData = JSON.stringify(tracks.map(({lyrics, ...track}) => track)).replace(/</g, '\\u003c');
const radioMark = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 6a14 14 0 0 0 0 20M24 6a14 14 0 0 1 0 20M12 10a8 8 0 0 0 0 12M20 10a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="2.5" fill="currentColor"/></svg>';
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="theme-color" content="#0b1016">
  <meta name="description" content="Planner FM — Estate Sessions. ${tracks.length} tracks from the repairs desk to the pirate-radio dial. No slots. Full volume.">
  <meta property="og:type" content="music.album">
  <meta property="og:title" content="Planner FM — Estate Sessions">
  <meta property="og:description" content="${tracks.length} transmissions. ${totalTime} on the clock. Repairs by day. Pirate radio after hours.">
  <meta property="og:url" content="https://yoxall.net/">
  <meta property="og:image" content="https://yoxall.net/assets/planner-fm-estate-sessions.jpg">
  <meta property="og:image:alt" content="Planner FM — Estate Sessions: the estate crew, speakers and repairs kit on a rain-soaked rooftop.">
  <meta property="og:image:width" content="1254">
  <meta property="og:image:height" content="1254">
  <meta name="twitter:card" content="summary_large_image">
  <title>Planner FM — Estate Sessions</title>
  <link rel="canonical" href="https://yoxall.net/">
  <link rel="icon" href="/assets/single-icon.svg?v=planner1" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/single.css?v=planner1">
  <script src="/assets/single-player.js?v=planner1" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to the EP</a>
  <div class="ambient" aria-hidden="true"></div>
  <div class="page-shell">
    <header class="masthead">
      <a class="station-brand" href="/" aria-label="Planner FM home">${radioMark}<span>PLANNER <b>FM</b></span></a>
      <span class="masthead-note">INDEPENDENT ESTATE RADIO</span>
      <nav aria-label="Release navigation"><a href="#tracklist">TRACKLIST</a><a id="lyrics-nav" href="#lyrics">LYRICS</a><a href="#sleeve-notes">SLEEVE NOTES</a></nav>
      <span class="edition"><i aria-hidden="true"></i> PF–001</span>
    </header>
    <main id="main" class="release">
      <section class="visual-column" aria-label="Estate Sessions cover artwork">
        <div class="record-display">
          <div class="vinyl" aria-hidden="true"><div class="vinyl-label"><span>PLANNER FM</span><strong id="vinyl-track">TRACK 01</strong><i></i><span>ESTATE SESSIONS / 001</span></div></div>
          <figure class="sleeve"><img src="/assets/planner-fm-estate-sessions.webp" width="1254" height="1254" alt="Planner FM — Estate Sessions: a hooded repairs crew, speaker stacks, a thermal camera and job sheets on a rain-soaked estate rooftop." fetchpriority="high"><figcaption class="advisory"><span>EXPLICIT</span><strong>SHIFT<br>LANGUAGE</strong></figcaption></figure>
        </div>
        <div class="sleeve-caption"><span>PF–001 / THE ESTATE SESSIONS EP</span><span>ESTATE CREW</span></div>
        <div class="sleeve-notes" id="sleeve-notes"><span class="eyebrow">FROM THE REPAIRS DESK TO THE DECKS</span><h2>No slots.<br><em>Full volume.</em></h2><p>Missed calls. Full diaries. Filthy basslines.<br>The soundtrack to keeping the estate moving.</p><div class="crew-stamp"><span>ESTATE<br><b>CREW</b></span><small>ON SHIFT<br>OFF THE DIAL</small></div><p class="small-print">Please hold. Your bassline is important to us.</p></div>
      </section>
      <section class="release-copy" aria-labelledby="release-title">
        <div class="release-kicker"><span class="release-type">THE NEW EP</span><span>GRIME / PIRATE RADIO / ESTATE LIFE</span></div>
        <h1 id="release-title">PLANNER <span>FM</span></h1>
        <p class="album-title">Estate Sessions<span>VOL. 01</span></p>
        <p class="release-intro">Repairs by day. Pirate radio after hours.</p>
        <div class="release-facts"><span>ESTATE CREW</span><span>${tracks.length} TRACKS</span><span>${totalTime} ON THE CLOCK</span><span class="explicit-tag">EXPLICIT</span></div>
        <section class="player" aria-label="Listen to Estate Sessions">
          <div class="deck-screws" aria-hidden="true"><i></i><i></i></div>
          <div class="player-topline"><span><i class="signal-light" aria-hidden="true"></i><span id="player-state">TRANSMISSION READY</span></span><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
          <div class="now-track"><span id="playing-number">01</span><div><span>CUED ON THE DECK</span><strong id="playing-title">${escape(first.title)}</strong><p id="playing-subtitle">${escape(first.subtitle)}</p></div></div>
          <audio id="release-audio" src="${escape(first.src)}" preload="metadata" controls aria-label="${escape(first.title)} — Planner FM"><a href="${escape(first.src)}">Play the opening track</a></audio>
          <div id="custom-player" hidden>
            <button id="music-toggle" class="drop-button" type="button" aria-pressed="false" aria-controls="release-audio" aria-label="Play ${escape(first.title)}">
              <span class="play-disc" aria-hidden="true"><svg class="play-icon" viewBox="0 0 24 24"><path d="m8 4 13 8-13 8z"/></svg><svg class="pause-icon" viewBox="0 0 24 24"><path d="M6 4h5v16H6zm8 0h5v16h-5z"/></svg></span><span class="drop-copy"><strong id="play-label">TUNE IN</strong><span id="play-hint">${escape(first.subtitle)}</span></span><span class="drop-arrow" aria-hidden="true">↗</span>
            </button>
            <div class="seek-row"><span id="music-current">0:00</span><label class="seek-label"><span class="sr-only">Seek through the selected track</span><input id="music-seek" type="range" min="0" max="1000" step="1" value="0" aria-valuetext="0:00 of ${time(first.duration)}" disabled></label><span id="music-duration">${time(first.duration)}</span></div>
            <div class="transport"><button id="music-restart" type="button" aria-label="Restart the selected track">↶ <span>REWIND</span></button><button id="music-next" type="button" aria-label="Play the next track">↠ <span>NEXT TRACK</span></button><button id="music-loop" type="button" aria-pressed="true" aria-label="Repeat all tracks">↻ <span>LOOP ALL</span></button><button id="music-mute" type="button" aria-pressed="false">◖ <span>SOUND ON</span></button></div>
          </div>
          <a id="music-fallback" class="fallback-link" href="${escape(first.src)}" target="_blank" rel="noopener" hidden>Open the track directly ↗</a>
          <p id="music-status" class="sr-only" role="status" aria-live="polite"></p>
        </section>
        <section class="tracklist" id="tracklist" aria-labelledby="tracklist-title"><div class="tracklist-heading"><h2 id="tracklist-title">THE RUNNING ORDER</h2><span>${tracks.length} TRACKS / ${totalTime}</span></div><ol>${tracks.map((track,index) => `<li><a class="track-link" href="${escape(track.src)}" data-track-index="${index}" aria-label="Play ${escape(track.title)}"${index === 0 ? ' aria-current="true"' : ''}><span class="track-number">${String(index + 1).padStart(2,'0')}</span><span class="track-info"><strong>${escape(track.title)}</strong><small>${escape(track.subtitle)}</small></span><span class="track-time">${time(track.duration)}</span><span class="track-indicator" aria-hidden="true">▶</span></a></li>`).join('')}</ol></section>
        <div class="release-actions"><button id="share-single" type="button" hidden>PASS THE FREQUENCY <span aria-hidden="true">↗</span></button><a id="download-track" href="${escape(first.src)}" download="${escape(first.downloadName)}">TAKE THE TRACK ↓</a></div>
        <label id="share-fallback" class="share-fallback" hidden>Copy this track link<input id="share-url" type="text" value="https://yoxall.net/" readonly></label>
        <details class="lyrics" id="lyrics"><summary><span id="lyrics-heading">TRACK 01 / THE LYRIC SHEET</span><span aria-hidden="true">+</span></summary><div class="lyrics-content"><p class="lyrics-intro">Every bar, straight from the crew. Lyrics follow the selected track.</p>${tracks.map((track,index) => `<div data-track-lyrics="${index}"><h2 class="lyric-track-title">${String(index + 1).padStart(2,'0')} / ${escape(track.title)}</h2>${lyricMarkup(track.lyrics)}</div>`).join('')}</div></details>
        <div class="liner-note"><span>PLEASE NOTE / NO ACTUAL RADIO LICENCE WAS HARMED</span><p>For the crew. For the group chat.<br>And, occasionally, at Darren’s expense.</p></div>
      </section>
    </main>
    <footer class="release-footer"><a href="/">PLANNER FM <span>/ ESTATE SESSIONS</span></a><span>THE DIARY’S FULL. THE FREQUENCY’S OPEN.</span><span class="catalogue">PF–001 / ${tracks.length} TRANSMISSIONS</span></footer>
  </div>
  <script id="track-data" type="application/json">${playerData}</script>
</body>
</html>
`;

const pages = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'})
  .split('\0').filter(file => file.endsWith('.html'));
if (!pages.includes('index.html') || !pages.includes('404.html')) throw Error('Expected homepage and fallback are missing');
for (const file of pages) fs.writeFileSync(path.join(root, file), page);
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://yoxall.net/</loc></url></urlset>\n');
console.log('Applied Planner FM — Estate Sessions to ' + pages.length + ' existing routes, including the 404 fallback.');
