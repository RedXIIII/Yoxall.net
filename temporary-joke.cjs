'use strict';

// Temporary single release. The original site remains on the pre-joke backup branch.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = __dirname;
const lyrics = [
  {name:'Intro',note:'Spoken, low voice, bass rumbling',lines:['Oi.','Yeah.','Darren.','You know what time it is.','Listen.']},
  {name:'Drop',note:'Heavy distorted square-wave bass',lines:[]},
  {name:'Verse 1',note:'Fast aggressive grime flow',lines:["Darren’s a geezer, Darren’s a lad,","Top-tier mate, best one we’ve had.","Heart of gold but he’s still a prick,","Proper good bloke but a massive dick.",'','Oi! Bellend! That’s my guy!','Big man’s flexin’, don’t ask why.','Knobhead, tosser, absolute tit,','Still roll with Darren, that’s legit.']},
  {name:'Hook',note:'Deep bass, aggressive shouted delivery',lines:['DARREN’S A BELLEND! (OI!)','PROPER FUCKING BELLEND! (WHAT!)','WANKER! TOSSER! (YEAH!)','BUT HE’S STILL MY BREDDER! (OI!)']},
  {name:'Verse 2',note:'Double-time grime flow',lines:['Big up Daz, yeah, big up the man,','Certified bellend, number one fan.','Top lad, top geezer, solid all day,','Still gonna call him a knob anyway.','','No bad blood, nah, nothing but love,','But the man’s still a weapon, bruv.','Raise that glass, put your hands in the air,','DARREN’S A BELLEND, AND WE DON’T CARE!']},
  {name:'Final hook',note:'Bass drops harder',lines:['DARREN’S A BELLEND! (OI!)','PROPER FUCKING BELLEND! (WHAT!)','TOP LAD! BIG KNOB! (YEAH!)','DARREN, YOU ABSOLUTE SOD!']},
  {name:'Outro',note:'Beat cuts, spoken',lines:['Safe, Daz.','You fucking bellend.']}
];
const escape = value => String(value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
const lyricMarkup = lyrics.map(section => `<section class="lyric-block${section.name.toLowerCase().includes('hook') ? ' lyric-hook' : ''}"><h3>${escape(section.name)}</h3><p class="lyric-note">${escape(section.note)}</p>${section.lines.length ? `<p class="lyric-lines">${section.lines.map(escape).join('<br>')}</p>` : ''}</section>`).join('');
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="theme-color" content="#0b0d10">
  <meta name="description" content="Darren is a Bellend! — Proper Grime Banter. A deeply unserious single.">
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="Darren is a Bellend! — Proper Grime Banter">
  <meta property="og:description" content="The diss nobody asked for. Drop the track.">
  <meta property="og:url" content="https://yoxall.net/">
  <meta property="og:image" content="https://yoxall.net/assets/darren-bellend-cover-v2.jpg">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="1280">
  <meta name="twitter:card" content="summary_large_image">
  <title>Darren is a Bellend! — Proper Grime Banter</title>
  <link rel="canonical" href="https://yoxall.net/">
  <link rel="icon" href="/assets/single-icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/single.css?v=cover2">
  <script src="/assets/single-player.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to the single</a>
  <div class="ambient" aria-hidden="true"></div>
  <div class="page-shell">
    <header class="masthead">
      <a class="label-brand" href="/" aria-label="Banter Records home"><span class="label-mark" aria-hidden="true">◉</span>BANTER<span>RECORDS</span></a>
      <span class="masthead-note">UNSIGNED. UNHINGED.</span>
      <span class="edition">BNT–001 <span class="edition-dot" aria-hidden="true"></span> THE UNOFFICIAL SINGLE</span>
    </header>
    <main id="main" class="release">
      <section class="visual-column" aria-label="Single artwork">
        <div class="record-display">
          <div class="vinyl" aria-hidden="true"><div class="vinyl-label"><span>BANTER RECORDS</span><strong>SIDE A</strong><i></i><span>33⅓ / ABSOLUTE NONSENSE</span></div></div>
          <figure class="sleeve"><img src="/assets/darren-bellend-cover-v2.jpg" width="1280" height="1280" alt="Darren is a Bellend! by Proper Grime Banter: a grime crew and speakers on a rainy estate at night." fetchpriority="high"><figcaption class="advisory"><span>ADVISORY</span><strong>EXCESSIVE<br>DARREN</strong></figcaption></figure>
        </div>
        <div class="sleeve-caption"><span>01 / THE SINGLE</span><span>0% SUBTLETY. 100% BANTER.</span></div>
        <p class="sleeve-note">PRESS PLAY. <span>MAKE IT THE GROUP CHAT’S PROBLEM.</span></p>
      </section>
      <section class="release-copy" aria-labelledby="release-title">
        <div class="release-kicker"><span class="release-type">GRIME / BANTER</span><span>THE DISS NOBODY ASKED FOR</span></div>
        <h1 id="release-title"><span>Darren</span><small>is a</small><strong>Bellend!</strong></h1>
        <div class="artist-row"><span class="artist-icon" aria-hidden="true">↳</span><p>PROPER GRIME BANTER<span>A deeply unserious release.</span></p></div>
        <section class="player" aria-label="Play the single">
          <div class="player-topline"><span id="player-state">READY TO CAUSE A SCENE</span><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
          <audio id="joke-song" src="/assets/darren-bellend-single.mp3" loop preload="metadata" controls aria-label="Darren is a Bellend! by Proper Grime Banter"><a href="/assets/darren-bellend-single.mp3">Play the single</a></audio>
          <div id="custom-player" hidden>
            <button id="music-toggle" class="drop-button" type="button" aria-pressed="false" aria-controls="joke-song" aria-label="Play Darren is a Bellend!">
              <span class="play-disc" aria-hidden="true"><svg class="play-icon" viewBox="0 0 24 24"><path d="m8 4 13 8-13 8z"/></svg><svg class="pause-icon" viewBox="0 0 24 24"><path d="M6 4h5v16H6zm8 0h5v16h-5z"/></svg></span>
              <span class="drop-copy"><strong id="play-label">DROP THE TRACK</strong><span id="play-hint">Darren’s villain origin story starts here.</span></span><span class="drop-arrow" aria-hidden="true">↗</span>
            </button>
            <div class="seek-row"><span id="music-current">0:00</span><label class="seek-label"><span class="sr-only">Seek through the single</span><input id="music-seek" type="range" min="0" max="1000" step="1" value="0" aria-valuetext="0:00 of 2:10" disabled></label><span id="music-duration">2:10</span></div>
            <div class="transport"><button id="music-restart" type="button" aria-label="Restart the single">↶ <span>RUN IT BACK</span></button><button id="music-loop" type="button" aria-pressed="true">↻ <span>LOOP ON</span></button><button id="music-mute" type="button" aria-pressed="false">◖ <span>SOUND ON</span></button></div>
          </div>
          <a id="music-fallback" class="fallback-link" href="/assets/darren-bellend-single.mp3" target="_blank" rel="noopener" hidden>Open the track directly ↗</a>
          <p id="music-status" class="sr-only" role="status" aria-live="polite"></p>
        </section>
        <div class="release-actions"><button id="share-single" type="button" hidden>SEND TO THE GROUP CHAT <span aria-hidden="true">↗</span></button><a href="/assets/darren-bellend-single.mp3" download="Darren is a Bellend!.mp3">KEEP THE EVIDENCE ↓</a></div>
        <label id="share-fallback" class="share-fallback" hidden>Copy this link<input id="share-url" type="text" value="https://yoxall.net/" readonly></label>
        <div class="liner-note"><span>LINER NOTES / 001</span><p>No bad blood. Nothing but love.<br>Absolutely no filter.</p></div>
        <details class="lyrics" id="lyrics"><summary><span>KNOW THE BARS</span><span aria-hidden="true">+</span></summary><div class="lyrics-content"><p class="lyrics-intro">The full lyric sheet. Strong language. Strong friendship.</p>${lyricMarkup}</div></details>
      </section>
    </main>
    <footer class="release-footer"><span>ONE TRACK. ONE VERY SPECIFIC TARGET.</span><span>BEST SERVED LOUD. <b>ALL BANTER.</b></span><span class="catalogue">BNT–001 / SIDE A</span></footer>
  </div>
</body>
</html>
`;

const pages = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(file => file.endsWith('.html'));
if (!pages.includes('index.html') || !pages.includes('404.html')) throw Error('Expected homepage and fallback are missing');
for (const file of pages) fs.writeFileSync(path.join(root, file), page);
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://yoxall.net/</loc></url></urlset>\n');
console.log('Applied the single release page to ' + pages.length + ' existing routes, including the 404 fallback.');
