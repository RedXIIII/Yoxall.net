'use strict';

// Temporary takeover. The complete site is preserved at the backup branch below.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = __dirname;
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="theme-color" content="#fff4ce">
  <title>Darren is a Bellend</title>
  <link rel="canonical" href="https://yoxall.net/">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M15 77Q29 63 29 42a21 21 0 0142 0q0 21 14 35z' fill='%23f6bd38' stroke='%231a1720' stroke-width='6'/%3E%3Ccircle cx='50' cy='84' r='8' fill='%231a1720'/%3E%3Ccircle cx='41' cy='43' r='4'/%3E%3Ccircle cx='59' cy='43' r='4'/%3E%3C/svg%3E">
  <style>
    *{box-sizing:border-box}
    html{background:#fff4ce;color:#1b1820}
    body{margin:0;min-height:100svh;display:grid;place-items:center;overflow-x:hidden;background:radial-gradient(#6b513a18 .8px,transparent .8px);background-size:8px 8px}
    body::before,body::after{content:"";position:fixed;left:0;right:0;height:12px;background:repeating-linear-gradient(135deg,#1b1820 0 14px,#fff4ce 14px 28px);z-index:2}
    body::before{top:0}body::after{bottom:0}
    main{width:min(1240px,100%);display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:12px;padding:64px 54px}
    h1{position:relative;margin:0;z-index:1;font-family:Impact,"Arial Black",sans-serif;font-size:clamp(90px,11.8vw,168px);font-weight:900;line-height:.89;letter-spacing:-.045em;text-align:center;transform:rotate(-3deg)}
    h1>span{display:block}
    .name{position:relative;width:fit-content;margin:auto;letter-spacing:.04em;font-kerning:none}
    .name::after{content:"";display:block;position:absolute;left:3%;right:-1%;bottom:-10px;height:8px;background:#e94b4b;border-radius:70% 20% 70% 30%;transform:rotate(-2deg);z-index:-1}
    .join{font-family:Georgia,serif;font-style:italic;font-size:.34em;line-height:1.4;letter-spacing:-.04em;margin:22px 0 8px}
    .punchline{color:#ed4b49;font-size:.94em;letter-spacing:.005em;-webkit-text-stroke:2px #1b1820;text-shadow:5px 6px 0 #1b1820;paint-order:stroke fill}
    .art{position:relative;min-width:0;transform:rotate(5deg);animation:wobble 4.5s ease-in-out infinite;transform-origin:50% 75%}
    svg{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(12px 15px 0 #1b182018)}
    .music-controls{position:fixed;right:max(20px,env(safe-area-inset-right));bottom:max(25px,env(safe-area-inset-bottom));z-index:3;display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;gap:12px;max-width:calc(100% - 40px)}
    .music-controls [hidden]{display:none!important}
    .music-controls audio{display:block;width:min(300px,75vw);height:44px}
    .music-controls button{font:700 14px/1.2 Arial,sans-serif;color:#1b1820;background:#fff4ce;border:3px solid #1b1820;border-radius:50px;padding:12px 19px;box-shadow:3px 3px 0 #ed4b49;cursor:pointer;min-height:44px}
    .music-controls button:hover{background:#ffe4a2}
    .music-controls button:focus-visible,.music-controls a:focus-visible{outline:3px solid #ed4b49;outline-offset:5px}
    .music-controls a{font:700 12px/1.4 Arial,sans-serif;color:#1b1820;background:#fff4ce;padding:8px 10px;text-underline-offset:3px}
    .audio-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
    @keyframes wobble{0%,75%,100%{transform:rotate(5deg)}82%{transform:rotate(0deg)}89%{transform:rotate(9deg)}95%{transform:rotate(3deg)}}
    @media(min-width:1500px){main{gap:55px}}
    @media(max-width:720px){main{grid-template-columns:1fr;gap:20px;padding:48px 24px 96px;max-width:470px}h1{font-size:clamp(70px,19vw,98px)}.join{margin:16px 0 6px}.name::after{height:6px;bottom:-8px}.punchline{-webkit-text-stroke:1.5px #1b1820;text-shadow:3px 4px 0 #1b1820}.art{width:76%;max-width:320px;margin:0 auto}.name{white-space:nowrap}}
    @media(prefers-reduced-motion:reduce){.art{animation:none}}
  </style>
</head>
<body>
  <main>
    <h1 aria-label="Darren is a Bellend"><span class="name">Darren</span> <span class="join">is a</span> <span class="punchline">Bellend</span></h1>
    <div class="art" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 500">
        <defs>
          <linearGradient id="rim" x1="0" x2="1"><stop stop-color="#b77818"/><stop offset=".35" stop-color="#ffe8a2"/><stop offset=".65" stop-color="#efb846"/><stop offset="1" stop-color="#a96e18"/></linearGradient>
          <radialGradient id="brass" cx=".32" cy=".25" r=".78"><stop stop-color="#fff2bc"/><stop offset=".38" stop-color="#ffda70"/><stop offset=".76" stop-color="#e9ad32"/><stop offset="1" stop-color="#b67c20"/></radialGradient>
        </defs>
        <g fill="none" stroke="#1b1820" stroke-width="6" stroke-linecap="round">
          <path d="M62 184q-28 29-22 65m44-54q-18 19-15 43M413 179q28 28 23 65m-45-53q18 19 15 43M73 370l-23 14m355-15 25 17"/>
        </g>
        <path d="m72 54 7 20 22 2-17 14 5 22-19-12-18 12 5-22-17-14 23-2z" fill="#ed4b49" stroke="#1b1820" stroke-width="4"/>
        <path d="m414 420 5 15 17 1-13 11 4 17-14-9-14 9 4-17-13-11 17-1z" fill="#77bfa0" stroke="#1b1820" stroke-width="4"/>
        <g transform="rotate(-10 240 250)" stroke="#1b1820" stroke-linejoin="round">
          <ellipse cx="240" cy="82" rx="25" ry="30" fill="none" stroke-width="12"/>
          <ellipse cx="240" cy="82" rx="25" ry="30" fill="none" stroke="#eab744" stroke-width="5"/>
          <path d="M219 104h42l8 20h-58z" fill="url(#rim)" stroke-width="6"/>
          <path d="M240 365v52" fill="none" stroke-width="13"/>
          <circle cx="240" cy="418" r="26" fill="url(#brass)" stroke-width="7"/>
          <path d="M93 360q53-48 53-128c0-68 38-115 94-115s94 47 94 115q0 80 53 128z" fill="url(#brass)" stroke-width="7"/>
          <path d="M168 210q9-57 54-69" fill="none" stroke="#fff7d1" stroke-width="13" stroke-linecap="round"/>
          <path d="M307 279q7 42 31 64" fill="none" stroke="#af751c" stroke-width="10" stroke-linecap="round" opacity=".5"/>
          <ellipse cx="194" cy="224" rx="30" ry="39" fill="#fffdf4" stroke-width="5"/>
          <ellipse cx="281" cy="215" rx="35" ry="44" fill="#fffdf4" stroke-width="5"/>
          <ellipse cx="203" cy="232" rx="12" ry="18" fill="#1b1820" stroke="none"/>
          <ellipse cx="273" cy="224" rx="13" ry="20" fill="#1b1820" stroke="none"/>
          <circle cx="207" cy="225" r="5" fill="white" stroke="none"/><circle cx="277" cy="216" r="5" fill="white" stroke="none"/>
          <path d="M187 280q53 66 105-7-53 18-105 7z" fill="#1b1820" stroke-width="5"/>
          <path d="M224 306q16-17 35-9-16 16-35 9" fill="#f5828a" stroke="none"/>
          <path d="m176 173 29-7m62-11 32 11" fill="none" stroke-width="7" stroke-linecap="round"/>
          <ellipse cx="167" cy="270" rx="15" ry="8" fill="#ec8062" stroke="none" opacity=".65"/><ellipse cx="310" cy="260" rx="15" ry="8" fill="#ec8062" stroke="none" opacity=".65"/>
          <rect x="87" y="349" width="306" height="35" rx="17" fill="url(#rim)" stroke-width="7"/>
          <path d="M108 359h260" fill="none" stroke="#fff3be" stroke-width="5" stroke-linecap="round"/>
        </g>
      </svg>
    </div>
  </main>
  <div class="music-controls" aria-label="Background music controls">
    <audio id="joke-song" src="/assets/darren-darren.mp3" loop preload="auto" controls aria-label="Background music">
      <a href="/assets/darren-darren.mp3">Play the song</a>
    </audio>
    <button id="music-toggle" type="button" aria-pressed="false" aria-controls="joke-song" hidden>Play song ♪</button>
    <a id="music-fallback" href="/assets/darren-darren.mp3" target="_blank" rel="noopener" hidden>Open audio ↗</a>
    <span id="music-status" class="audio-status" role="status" aria-live="polite"></span>
  </div>
  <script src="/assets/joke-audio.js" defer></script>
</body>
</html>
`;

const pages = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(file => file.endsWith('.html'));
if (!pages.includes('index.html') || !pages.includes('404.html')) throw Error('Expected homepage and fallback are missing');
for (const file of pages) fs.writeFileSync(path.join(root, file), page);
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://yoxall.net/</loc></url></urlset>\n');
console.log('Applied the same temporary joke page to ' + pages.length + ' existing routes, including the 404 fallback.');
