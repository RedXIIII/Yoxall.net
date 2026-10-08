'use strict';
// Offline tests only. Every WebSocket is a mock; no public test note is sent.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const board = require('./assets/board.js');
const context = vm.createContext({ crypto: webcrypto, Uint8Array, Object, Array, TextEncoder, TextDecoder, setTimeout, clearTimeout, URL, console });
vm.runInContext(fs.readFileSync(path.join(__dirname, 'assets/vendor/nostr-tools-2.25.2.js'), 'utf8'), context);
const tools = context.NostrTools;
assert.equal(typeof tools.finalizeEvent, 'function');
const catalogue = new Map([['mkultra', { id: 'mkultra', title: 'MKULTRA' }]]);
const now = Date.now();
const secret = tools.generateSecretKey();
const content = { v: 1, name: 'A reader', body: 'What does the primary source establish?', topic: 'documented', file: 'mkultra', reply: '' };
function signed(overrides = {}, fields = {}) { return tools.finalizeEvent({ kind: 1, created_at: Math.floor(now / 1000), tags: [['t', board.TAG]], content: JSON.stringify({ ...content, ...overrides }), ...fields }, secret); }
const valid = signed();
assert.ok(board.parseEvent(valid, tools, catalogue));
assert.equal(board.parseEvent({ ...valid, content: valid.content.replace('primary', 'invented') }, tools, catalogue), null, 'tampered signed content is rejected');
assert.equal(board.parseEvent({ ...valid, sig: '0'.repeat(128) }, tools, catalogue), null, 'forged signature is rejected');
assert.equal(board.parseEvent({ ...valid, id: '1'.repeat(64) }, tools, catalogue), null, 'wrong event hash is rejected');
for (const edit of [{ body: 'x'.repeat(1201) }, { name: 'n'.repeat(33) }, { topic: '__proto__' }, { file: '../../private' }, { file: 'javascript:alert(1)' }, { reply: '<svg>' }, { name: 'Name\nSpoof' }, { body: '\u202eSpoof' }]) assert.equal(board.parseEvent(signed(edit), tools, catalogue), null, JSON.stringify(edit).slice(0, 50));
assert.equal(board.parseEvent(signed({}, { kind: 2 }), tools, catalogue), null);
assert.equal(board.parseEvent(signed({}, { tags: [['t', 'another-room']] }), tools, catalogue), null);
assert.equal(board.parseEvent(signed({}, { created_at: Math.floor(now / 1000) + 301 }), tools, catalogue, Math.floor(now / 1000)), null);

class Element {
  constructor(tag, doc) { this.tagName = tag.toUpperCase(); this.doc = doc; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; this.textContent = ''; this.value = ''; this.hidden = false; this.checked = false; this.disabled = false; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  querySelectorAll(tag) { const found = []; const walk = node => { for (const child of node.children) { if (child.tagName.toLowerCase() === tag) found.push(child); walk(child); } }; walk(this); return found; }
  focus() { this.doc.activeElement = this; }
  async emit(name, event = {}) { for (const listener of this.listeners[name] || []) await listener(event); }
}
class Document {
  constructor() { this.elements = new Map(); this.activeElement = null; }
  createElement(tag) { return new Element(tag, this); }
  getElementById(id) { if (!this.elements.has(id)) this.elements.set(id, new Element(id === 'board-form' ? 'form' : 'div', this)); return this.elements.get(id); }
}
const doc = new Document();
const markup = '<img src=x onerror=alert(1)>\n<script>steal()</script> https://evil.invalid';
const hostile = board.parseEvent(signed({ name: '<script>name</script>', body: markup }), tools, catalogue);
assert.ok(hostile, 'plain text markup is permitted as content');
const rendered = board.renderMessage(hostile, { document: doc, catalogue, posts: new Map(), reply() {}, mute() {} });
assert.equal(rendered.querySelectorAll('img').length, 0);
assert.equal(rendered.querySelectorAll('script').length, 0);
assert.ok(rendered.querySelectorAll('p').some(node => node.textContent === markup), 'malicious content remains exact text, never HTML');
assert.deepEqual(rendered.querySelectorAll('a').map(link => link.href), ['/files/mkultra.html'], 'only a known archive file receives a link');

class MockSocket {
  static sockets = [];
  constructor(url) { this.url = url; this.listeners = {}; this.sent = []; this.closed = false; MockSocket.sockets.push(this); }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  emit(name, event = {}) { for (const listener of this.listeners[name] || []) listener(event); }
  open() { this.emit('open'); }
  message(packet) { this.emit('message', { data: JSON.stringify(packet) }); }
  send(raw) { assert.equal(this.closed, false); this.sent.push(JSON.parse(raw)); }
  close() { this.closed = true; this.emit('close'); }
}
function harness() {
  MockSocket.sockets = []; let sequence = 0; const timers = new Map(); const received = [];
  const client = board.createClient({ tools, catalogue, WebSocket: MockSocket, now: () => now, setTimeout(callback) { const id = ++sequence; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); }, onEvent(post) { received.push(post); } });
  const sockets = MockSocket.sockets.slice(); sockets.forEach(socket => socket.open());
  return { client, sockets, received, timers };
}
async function transportTests() {
  let h = harness(); const subscription = h.sockets[0].sent[0][1];
  assert.deepEqual(h.sockets[0].sent[0][2], { kinds: [1], '#t': [board.TAG], limit: 200 });
  h.sockets[0].message(['EVENT', 'wrong-subscription', valid]);
  h.sockets[0].message(['EVENT', subscription, { ...valid, sig: '0'.repeat(128) }]);
  h.sockets[0].emit('message', { data: '['.repeat(16001) });
  h.sockets[0].emit('message', { data: 'not json' });
  assert.equal(h.received.length, 0);
  h.sockets[0].message(['EVENT', subscription, valid]); assert.equal(h.received.length, 1);
  const accepted = h.client.publish(valid);
  h.sockets[0].message(['OK', 'f'.repeat(64), true, '']);
  h.sockets[0].message(['OK', valid.id, 'true', '']);
  assert.equal(h.timers.size, 1, 'unrelated and malformed acknowledgements leave the publication pending');
  h.sockets[1].message(['OK', valid.id, true, '']);
  assert.deepEqual(await accepted, { accepted: true, relay: board.RELAYS[1] });
  assert.equal(h.timers.size, 0); h.client.close();
  h = harness(); const rejected = h.client.publish(valid); const failed = assert.rejects(rejected, /No relay accepted/);
  h.sockets.forEach(socket => socket.message(['OK', valid.id, false, 'blocked: mocked refusal'])); await failed; h.client.close();
  h = harness(); const timeout = h.client.publish(valid); const expired = assert.rejects(timeout, /confirmed.*draft/);
  for (const callback of h.timers.values()) callback(); await expired; h.client.close();
  h = harness(); const dropped = h.client.publish(valid); const disconnect = assert.rejects(dropped, /No relay accepted/);
  h.sockets.forEach(socket => socket.close()); await disconnect; h.client.close();
  assert.equal(MockSocket.sockets.every(socket => socket.url.startsWith('wss://')), true);
}
function uiHarness(seed = new Map()) {
  MockSocket.sockets = [];
  const document = new Document(), storage = new Map(seed), listeners = {};
  const win = { document, NostrTools: tools, RECORDS: [...catalogue.values()], WebSocket: MockSocket, location: { href: 'https://yoxall.net/board.html', reload() {} }, localStorage: { getItem(key) { return storage.get(key) ?? null; }, setItem(key, value) { storage.set(key, value); } }, setTimeout, clearTimeout, setInterval() { return 1; }, clearInterval() {}, addEventListener(name, listener) { (listeners[name] ||= []).push(listener); } };
  const $ = id => document.getElementById(id);
  $('board-name').value = 'Offline test reader'; $('board-topic').value = 'general'; $('board-file').value = ''; $('board-filter').value = 'all';
  board.init(win); const sockets = MockSocket.sockets.slice(); sockets.forEach(socket => socket.open());
  const close = () => { for (const listener of listeners.pagehide || []) listener(); };
  return { win, $, storage, sockets, close };
}
async function uiTests() {
  let h = uiHarness(); h.$('board-body').value = 'Do not send this test to a public relay.';
  const consentMissing = h.$('board-form').emit('submit', { preventDefault() {} }); await consentMissing;
  assert.equal(h.sockets.every(socket => socket.sent.every(packet => packet[0] !== 'EVENT')), true, 'unchecked disclosure prevents publication');
  h.$('board-privacy').checked = true;
  const send = h.$('board-form').emit('submit', { preventDefault() {} });
  const published = h.sockets[0].sent.find(packet => packet[0] === 'EVENT')[1];
  assert.equal(h.$('board-body').value, 'Do not send this test to a public relay.', 'draft stays until acknowledgement');
  h.sockets[2].message(['OK', published.id, true, '']); await send;
  assert.match(h.$('board-status').textContent, /^Signal sent/);
  assert.equal(h.$('board-body').value, ''); assert.equal(h.$('board-submit').disabled, true, '60-second local cooldown after successful acknowledgement');
  assert.ok([...h.storage.keys()].some(key => key.endsWith('key-v1')), 'signing identity is persisted locally');
  const eventsBefore = h.sockets[0].sent.length;
  h.$('board-body').value = 'A rapid follow-up'; await h.$('board-form').emit('submit', { preventDefault() {} });
  assert.equal(h.sockets[0].sent.length, eventsBefore, 'cooldown prevents second publication'); h.close();
  h = uiHarness(); h.$('board-body').value = 'Keep this draft after every relay refuses.'; h.$('board-privacy').checked = true;
  const refusal = h.$('board-form').emit('submit', { preventDefault() {} });
  const refused = h.sockets[0].sent.find(packet => packet[0] === 'EVENT')[1];
  h.sockets.forEach(socket => socket.message(['OK', refused.id, false, 'error: offline test'])); await refusal;
  assert.equal(h.$('board-body').value, 'Keep this draft after every relay refuses.');
  assert.match(h.$('board-status').textContent, /No relay accepted.*draft/);
  assert.equal(h.$('board-submit').disabled, false); assert.equal(h.storage.has('record-board-sent-v1'), false); h.close();
  h = uiHarness(new Map([['record-board-cache-v1', JSON.stringify([{ ...valid, content: 'forged cache' }, valid])]]));
  assert.equal(h.$('board-feed').children.length, 1, 'cached messages are reverified and forged cache entries discarded');
  const cachedPost = h.$('board-feed').children[0];
  await cachedPost.querySelectorAll('button')[0].emit('click');
  assert.equal(h.$('board-reply').hidden, false); assert.equal(h.$('board-file').value, 'mkultra'); assert.equal(h.$('board-body').doc.activeElement, h.$('board-body'));
  await h.$('board-cancel-reply').emit('click'); assert.equal(h.$('board-reply').hidden, true);
  h.$('board-filter').value = 'ancient'; await h.$('board-filter').emit('change'); assert.equal(h.$('board-feed').children.length, 0, 'topic filters exclude other topics');
  h.$('board-filter').value = 'all'; await h.$('board-filter').emit('change');
  await h.$('board-feed').children[0].querySelectorAll('button')[1].emit('click');
  assert.equal(h.$('board-feed').children.length, 0); assert.deepEqual(JSON.parse(h.storage.get('record-board-muted-v1')), [valid.pubkey], 'author mutes persist only in local storage');
  await h.$('board-clear-mutes').emit('click'); assert.equal(h.$('board-feed').children.length, 1);
  h.close();
}
(async () => { await transportTests(); await uiTests(); console.log('PASS: real signatures, bounded hostile inputs, text-only rendering, scoped subscriptions, relay success/refusal/timeout/disconnect, consent, draft preservation, cooldown, verified cache, replies, filters and browser mutes. All WebSockets were mocked.'); })().catch(error => { console.error(error); process.exitCode = 1; });
