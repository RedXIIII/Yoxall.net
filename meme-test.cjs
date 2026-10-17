const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const code = fs.readFileSync(__dirname + '/assets/meme-dancer.js', 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function node() {
  return {hidden: true, attrs: {}, dataset: {}, events: {},
    addEventListener(event, fn) {(this.events[event] ||= []).push(fn);},
    emit(event) {for (const fn of this.events[event] || []) fn();},
    getAttribute(key) {return this.attrs[key] || null;},
    setAttribute(key, value) {this.attrs[key] = value;}, focus() {this.focused = true;}};
}
function fixture({reduced = false, visualsOff = false, mode = 'allowed', catMode = 'allowed', random = [0]} = {}) {
  const names = ['release-audio','dancer-video','cat-video','meme-dancer','dancer-panel','dancer-hide','dancer-show','visual-toggle','meme-label'];
  const n = Object.fromEntries(names.map(id => [id, node()])), a = n['release-audio'];
  Object.assign(a, {paused: true, ended: false, error: null, playbackRate: 1});
  a.play = a.pause = () => {throw Error('Meme altered music playback');};
  function video(id, src, playMode) {
    const v = n[id];
    Object.assign(v, {paused: true, calls: 0, pauses: 0, currentTime: 0, pending: [], mode: playMode}); v.dataset.src = src;
    v.pause = function() {this.pauses++; this.paused = true;};
    v.play = function() {
      this.calls++;
      if (this.mode === 'blocked') return Promise.reject(Error('blocked'));
      if (this.mode === 'deferred') return new Promise((resolve, reject) => this.pending.push({resolve, reject}));
      this.paused = false; return Promise.resolve();
    };
    v.finish = function() {this.paused = true; this.emit('ended');};
    return v;
  }
  const g = video('dancer-video', '/assets/planner-fm-dancer.mp4', mode);
  const c = video('cat-video', '/assets/planner-fm-vibe-cat.mp4', catMode);
  const doc = node(); doc.hidden = false; doc.getElementById = id => n[id];
  let off = visualsOff; doc.body = {classList: {contains: () => off}};
  const media = node(); media.matches = reduced;
  const math = Object.create(Math); let roll = 0;
  math.random = () => random[Math.min(roll++, random.length - 1)];
  const box = {document: doc, matchMedia: () => media, Promise, Math: math}; if (!reduced) box.PlannerFMVisuals = {};
  vm.runInNewContext(code, box);
  return {n, a, g, c, doc, media,
    off(value) {off = value; n['visual-toggle'].emit('click');},
    async start() {a.paused = false; a.emit('playing'); await tick();}};
}
function active(f, id) {
  const current = id === 'girl' ? f.g : f.c, other = id === 'girl' ? f.c : f.g;
  assert.equal(f.n['meme-dancer'].dataset.meme, id);
  assert.equal(f.n['meme-dancer'].hidden, false); assert.equal(f.n['dancer-panel'].hidden, false);
  assert.equal(current.hidden, false); assert.equal(other.hidden, true);
  assert.equal(current.paused, false); assert.equal(other.paused, true);
  assert.equal(current.muted, true); assert.equal(current.volume, 0); assert.equal(current.loop, false); assert.equal(current.playsInline, true);
  assert.equal(current.playbackRate, id === 'girl' ? 140 / 155 : 140 / 123);
  assert.equal(f.a.paused, false); assert.equal(f.a.playbackRate, 1);
}
(async () => {
  // First turn is exactly one girl loop. Later turns include both random bounds.
  const f = fixture({random: [0, .999999, .999999, 0]});
  assert.equal(f.g.calls, 0); assert.equal(f.c.calls, 0);
  assert.equal(f.g.getAttribute('src'), null); assert.equal(f.c.getAttribute('src'), null);
  assert.equal(f.n['meme-dancer'].hidden, true);
  assert.equal(f.g.defaultPlaybackRate, 140 / 155); assert.equal(f.c.defaultPlaybackRate, 140 / 123);
  await f.start(); active(f, 'girl'); assert.equal(f.c.getAttribute('src'), null);
  f.g.finish(); await tick(); active(f, 'cat'); // Minimum cat turn: one loop.
  assert.equal(f.n['meme-label'].textContent, 'CAT ON CALL');
  f.g.emit('ended'); active(f, 'cat'); // A late event from the inactive clip is ignored.
  f.c.finish(); await tick(); active(f, 'girl');
  f.g.finish(); await tick(); active(f, 'girl');
  f.g.finish(); await tick(); active(f, 'girl');
  f.g.finish(); await tick(); active(f, 'cat'); // Maximum girl turn: three loops.
  f.c.finish(); await tick(); active(f, 'cat');
  f.c.finish(); await tick(); active(f, 'girl'); // Maximum cat turn: two loops.
  f.g.finish(); await tick(); active(f, 'cat'); // Minimum later girl turn: one loop.

  // Dismissal and transport changes preserve the active turn and never control music.
  const life = fixture(); await life.start(); life.g.finish(); await tick(); active(life, 'cat');
  life.c.currentTime = 12;
  life.n['dancer-hide'].emit('click'); assert.equal(life.c.paused, true); assert.equal(life.g.paused, true);
  assert.equal(life.n['dancer-panel'].hidden, true); assert.equal(life.n['dancer-show'].hidden, false); assert.equal(life.a.paused, false);
  life.a.emit('playing'); assert.equal(life.n['dancer-panel'].hidden, true);
  life.n['dancer-show'].emit('click'); await tick(); active(life, 'cat'); assert.equal(life.c.currentTime, 12);
  life.a.emit('waiting'); assert.equal(life.c.paused, true); assert.equal(life.n['meme-dancer'].hidden, true);
  life.c.playbackRate = 1; life.a.emit('playing'); await tick(); active(life, 'cat');
  life.off(true); assert.equal(life.c.paused, true); assert.equal(life.n['meme-dancer'].hidden, true);
  life.off(false); await tick(); active(life, 'cat');
  life.doc.hidden = true; life.doc.emit('visibilitychange'); assert.equal(life.c.paused, true);
  life.doc.hidden = false; life.doc.emit('visibilitychange'); await tick(); active(life, 'cat');
  life.a.paused = true; life.a.emit('emptied'); assert.equal(life.c.paused, true);
  life.a.paused = false; life.a.emit('playing'); await tick(); active(life, 'cat'); assert.equal(life.c.currentTime, 12);
  life.a.paused = true; life.a.emit('pause'); assert.equal(life.c.paused, true); assert.equal(life.n['meme-dancer'].hidden, true);
  const low = fixture({reduced: true}); await low.start(); assert.equal(low.g.calls, 0); assert.equal(low.c.calls, 0);

  // A blocked or failed meme must not interrupt the music or the other video.
  const blocked = fixture({catMode: 'blocked'}); await blocked.start(); blocked.g.finish(); await tick();
  assert.equal(blocked.n['dancer-show'].hidden, false); assert.equal(blocked.n['dancer-panel'].hidden, true); assert.equal(blocked.a.paused, false);
  blocked.c.mode = 'allowed'; blocked.n['dancer-show'].emit('click'); await tick(); active(blocked, 'cat');
  const broken = fixture(); await broken.start(); broken.g.emit('error'); await tick(); active(broken, 'cat');
  broken.c.finish(); await tick(); active(broken, 'cat');
  broken.c.emit('error'); assert.equal(broken.n['meme-dancer'].hidden, true); assert.equal(broken.a.paused, false);

  // Late play promises cannot leave the inactive clip running or resurrect a hidden panel.
  const race = fixture({mode: 'deferred'}); await race.start(); race.g.finish(); await tick(); active(race, 'cat');
  race.g.paused = false; race.g.pending[0].resolve(); await tick(); active(race, 'cat');
  const hidden = fixture({mode: 'deferred'}); await hidden.start(); hidden.a.paused = true; hidden.a.emit('pause');
  hidden.g.pending[0].reject(Error('interrupted')); await tick(); assert.equal(hidden.n['meme-dancer'].hidden, true); assert.equal(hidden.g.paused, true);
  vm.runInNewContext(code, {document: {getElementById: () => null}});
  console.log('PASS: first girl loop; random 1–3 girl / 1–2 cat turns; only the active silent clip loads/plays; fixed video rates leave music unchanged; hide/show, pause, buffering, hidden tabs, reduced motion and track changes preserve turns; failures and stale promises are isolated.');
})().catch(error => {console.error(error); process.exitCode = 1;});
