/* The Signal Room: public Nostr notes, no account or private server required.
   Protocol: https://github.com/nostr-protocol/nips/blob/master/01.md */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.RecordBoard = api; if (root.document) api.init(root); }
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const TAG = 'the-record-yoxall-net-v1';
  const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.net'];
  const TOPICS = { general: 'Open signal', documented: 'Documented world', ancient: 'Deep past', current: 'Current questions', england: 'England', sources: 'Sources & corrections' };
  const HEX = /^[0-9a-f]{64}$/;
  const MAX_POSTS = 200;
  const storageKeys = { key: 'record-board-key-v1', draft: 'record-board-draft-v1', cache: 'record-board-cache-v1', muted: 'record-board-muted-v1', sent: 'record-board-sent-v1' };
  const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const fingerprint = key => key.slice(0, 12) + '…' + key.slice(-4);
  function validContent(value, catalogue) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.v !== 1) return null;
    if (typeof value.name !== 'string' || value.name.length < 1 || value.name.length > 32 || value.name !== value.name.trim() || /[\r\n\t]/.test(value.name) || controls.test(value.name)) return null;
    if (typeof value.body !== 'string' || !value.body.trim() || value.body.length > 1200 || controls.test(value.body)) return null;
    if (typeof value.topic !== 'string' || !own(TOPICS, value.topic)) return null;
    if (typeof value.file !== 'string' || (value.file !== '' && !catalogue.has(value.file))) return null;
    if (typeof value.reply !== 'string' || (value.reply !== '' && !HEX.test(value.reply))) return null;
    return { v: 1, name: value.name, body: value.body, topic: value.topic, file: value.file, reply: value.reply };
  }
  function parseEvent(input, tools, catalogue, now = Math.floor(Date.now() / 1000)) {
    try {
      if (!input || typeof input !== 'object' || input.kind !== 1 || !HEX.test(input.id || '') || !HEX.test(input.pubkey || '') || !/^[0-9a-f]{128}$/.test(input.sig || '')) return null;
      if (!Number.isSafeInteger(input.created_at) || input.created_at < 1577836800 || input.created_at > now + 300) return null;
      if (typeof input.content !== 'string' || input.content.length > 7000 || !Array.isArray(input.tags) || input.tags.length > 12) return null;
      if (!input.tags.every(tag => Array.isArray(tag) && tag.length > 0 && tag.length <= 5 && tag.every(part => typeof part === 'string' && part.length <= 150))) return null;
      if (!input.tags.some(tag => tag[0] === 't' && tag[1] === TAG)) return null;
      const content = validContent(JSON.parse(input.content), catalogue);
      if (!content) return null;
      // Copy only signed wire fields. Never trust a cached verification marker.
      const event = { id: input.id, pubkey: input.pubkey, created_at: input.created_at, kind: 1, tags: input.tags.map(tag => tag.slice()), content: input.content, sig: input.sig };
      if (!tools.verifyEvent(event)) return null;
      return { event, ...content };
    } catch { return null; }
  }
  function createClient(options) {
    const { tools, catalogue, onEvent = () => {}, onState = () => {} } = options;
    const WebSocketClass = options.WebSocket || WebSocket;
    const now = options.now || (() => Date.now());
    const timer = options.setTimeout || setTimeout;
    const untimer = options.clearTimeout || clearTimeout;
    const connectTimeout = options.connectTimeout || 9000;
    const ackTimeout = options.ackTimeout || 14000;
    const subscription = 'record-' + now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    const pending = new Map();
    const sockets = new Map();
    let stopped = false;
    function state() {
      const entries = [...sockets.values()];
      const value = { open: entries.filter(item => item.phase === 'open').length, connecting: entries.filter(item => item.phase === 'connecting').length, complete: entries.filter(item => item.complete).length, total: RELAYS.length };
      onState(value); return value;
    }
    function finish(id, success, relay) {
      const job = pending.get(id);
      if (!job) return;
      if (success) {
        pending.delete(id); untimer(job.timeout);
        job.resolve({ accepted: true, relay });
      } else {
        job.remaining.delete(relay);
        if (!job.remaining.size) { pending.delete(id); untimer(job.timeout); job.reject(Error('No relay accepted the signal. Your draft is still here.')); }
      }
    }
    function failure(url, item) {
      if (sockets.get(url) !== item || item.phase === 'failed') return;
      item.phase = 'failed'; untimer(item.timeout);
      for (const id of pending.keys()) finish(id, false, url);
      state();
    }
    function connect(url) {
      let socket;
      try { socket = new WebSocketClass(url); } catch { sockets.set(url, { phase: 'failed' }); state(); return; }
      const item = { socket, phase: 'connecting', complete: false, received: 0, window: now() };
      sockets.set(url, item);
      item.timeout = timer(() => { failure(url, item); try { socket.close(); } catch {} }, connectTimeout);
      socket.addEventListener('open', () => {
        if (stopped || sockets.get(url) !== item || item.phase === 'failed') { socket.close(); return; }
        item.phase = 'open'; untimer(item.timeout);
        try {
          socket.send(JSON.stringify(['REQ', subscription, { kinds: [1], '#t': [TAG], limit: MAX_POSTS }]));
          for (const [id, job] of pending) if (job.remaining.has(url)) socket.send(JSON.stringify(['EVENT', job.event]));
        } catch { failure(url, item); }
        state();
      });
      socket.addEventListener('message', message => {
        if (stopped || sockets.get(url) !== item || item.phase !== 'open' || typeof message.data !== 'string' || message.data.length > 16000) return;
        if (now() - item.window > 20000) { item.window = now(); item.received = 0; }
        if (++item.received > 300) return;
        let packet; try { packet = JSON.parse(message.data); } catch { return; }
        if (!Array.isArray(packet) || packet.length > 4) return;
        if (packet[0] === 'EVENT' && packet.length === 3 && packet[1] === subscription) {
          const post = parseEvent(packet[2], tools, catalogue, Math.floor(now() / 1000));
          if (post) onEvent(post);
        } else if (packet[0] === 'OK' && packet.length === 4 && typeof packet[2] === 'boolean' && typeof packet[3] === 'string' && pending.has(packet[1])) {
          finish(packet[1], packet[2], url);
        } else if (packet[0] === 'EOSE' && packet[1] === subscription) { item.complete = true; state(); }
        else if (packet[0] === 'CLOSED' && packet[1] === subscription) { item.complete = true; state(); }
      });
      socket.addEventListener('error', () => failure(url, item));
      socket.addEventListener('close', () => failure(url, item));
    }
    RELAYS.forEach(connect);
    return {
      state,
      refresh() {
        if (stopped || pending.size) return;
        for (const url of RELAYS) {
          const item = sockets.get(url);
          if (item?.phase === 'open') {
            item.complete = false;
            try { item.socket.send(JSON.stringify(['REQ', subscription, { kinds: [1], '#t': [TAG], limit: MAX_POSTS }])); } catch { failure(url, item); }
          } else { if (item?.socket) try { item.socket.close(); } catch {} connect(url); }
        }
        state();
      },
      publish(event) {
        const post = parseEvent(event, tools, catalogue, Math.floor(now() / 1000));
        if (!post || stopped || pending.size) return Promise.reject(Error('The signal could not be prepared. Your draft is still here.'));
        const remaining = new Set([...sockets].filter(([, item]) => item.phase !== 'failed').map(([url]) => url));
        if (!remaining.size) return Promise.reject(Error('The relays are offline. Reconnect and try again; your draft is still here.'));
        return new Promise((resolve, reject) => {
          const job = { event: post.event, remaining, resolve, reject };
          job.timeout = timer(() => { pending.delete(event.id); reject(Error('No relay confirmed the signal in time. Your draft is still here.')); }, ackTimeout);
          pending.set(event.id, job);
          for (const [url, item] of sockets) if (item.phase === 'open') {
            try { item.socket.send(JSON.stringify(['EVENT', post.event])); } catch { finish(event.id, false, url); }
          }
        });
      },
      close() {
        stopped = true;
        for (const [id, job] of pending) { untimer(job.timeout); job.reject(Error('Connection closed. Your draft is still here.')); pending.delete(id); }
        for (const item of sockets.values()) { untimer(item.timeout); if (item.socket) try { item.socket.close(); } catch {} }
      }
    };
  }
  function renderMessage(post, options) {
    const { document: doc, catalogue, posts, visibleIds, reply, mute, ownKey } = options;
    const make = (tag, className, text) => { const node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
    const item = make('article', 'signal-post'); item.id = 'signal-' + post.event.id;
    const heading = make('div', 'signal-post-heading');
    const author = make('div', 'signal-author');
    author.append(make('strong', '', post.name), make('span', 'signal-fingerprint', fingerprint(post.event.pubkey) + (post.event.pubkey === ownKey ? ' / this browser' : ' / unverified name')));
    const time = make('time', 'signal-time', new Date(post.event.created_at * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }));
    time.dateTime = new Date(post.event.created_at * 1000).toISOString(); heading.append(author, time); item.append(heading);
    item.append(make('span', 'signal-topic', TOPICS[post.topic]));
    if (post.reply) {
      const parent = posts.get(post.reply);
      const context = make('p', 'signal-reply-context', parent ? 'In reply to ' + parent.name + ' / ' + fingerprint(parent.event.pubkey) : 'Reply to an earlier signal outside this loaded window.');
      if (parent && visibleIds?.has(parent.event.id)) { const link = make('a', '', 'See signal ↗'); link.href = '#signal-' + parent.event.id; context.append(link); }
      item.append(context);
    }
    item.append(make('p', 'signal-message', post.body));
    if (post.file && catalogue.has(post.file)) {
      const record = catalogue.get(post.file); const link = make('a', 'signal-file-link', 'Linked file / ' + record.title + ' ↗');
      link.href = '/files/' + encodeURIComponent(record.id) + '.html'; item.append(link);
    }
    const actions = make('div', 'signal-post-actions');
    const respond = make('button', 'text-link', 'Reply ↗'); respond.type = 'button'; respond.dataset.signalAction = post.event.id + '-reply'; respond.addEventListener('click', () => reply(post));
    const quiet = make('button', 'signal-mute', 'Mute author'); quiet.type = 'button'; quiet.dataset.signalAction = post.event.id + '-mute'; quiet.setAttribute('aria-label', 'Mute ' + post.name + ' in this browser'); quiet.addEventListener('click', () => mute(post));
    actions.append(respond, quiet); item.append(actions); return item;
  }
  function init(win) {
    const doc = win.document; const $ = id => doc.getElementById(id);
    const form = $('board-form'); if (!form) return;
    const tools = win.NostrTools;
    const status = $('board-status'), connection = $('board-connection'), send = $('board-submit');
    if (!tools || !win.WebSocket) { status.textContent = 'The Signal Room could not load in this browser. The archive remains available.'; send.disabled = true; return; }
    const allRecords = win.RECORDS || [...(win.MODERN_RECORDS || []), ...(win.ANCIENT_RECORDS || []), ...(win.CURRENT_RECORDS || [])];
    const catalogue = new Map(allRecords.filter(record => typeof record.id === 'string' && /^[a-z0-9-]+$/.test(record.id) && typeof record.title === 'string').map(record => [record.id, record]));
    const store = { get(key) { try { return win.localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { win.localStorage.setItem(key, value); return true; } catch { return false; } } };
    const posts = new Map(); let muted = new Set(), replyId = '', busy = false, ownKey = '', renderTimer = null, lastSent = Number(store.get(storageKeys.sent)) || 0;
    if (lastSent > Date.now()) lastSent = 0;
    try { const raw = store.get(storageKeys.muted); if (raw && raw.length < 4000) muted = new Set(JSON.parse(raw).filter(key => typeof key === 'string' && HEX.test(key)).slice(0, 50)); } catch {}
    const name = $('board-name'), body = $('board-body'), topic = $('board-topic'), file = $('board-file'), consent = $('board-privacy');
    for (const record of catalogue.values()) { const option = doc.createElement('option'); option.value = record.id; option.textContent = record.title; file.append(option); }
    try {
      const raw = store.get(storageKeys.draft);
      if (raw && raw.length < 8000) { const draft = JSON.parse(raw); if (typeof draft.name === 'string') name.value = draft.name.slice(0, 32); if (typeof draft.body === 'string') body.value = draft.body.slice(0, 1200); if (own(TOPICS, draft.topic)) topic.value = draft.topic; if (catalogue.has(draft.file)) file.value = draft.file; if (HEX.test(draft.reply || '')) replyId = draft.reply; }
    } catch {}
    const linked = new URL(win.location.href).searchParams.get('related'); if (catalogue.has(linked)) file.value = linked;
    function draft() { return { v: 1, name: name.value.trim(), body: body.value, topic: topic.value, file: file.value, reply: replyId }; }
    function saveDraft() { store.set(storageKeys.draft, JSON.stringify(draft())); $('board-counter').textContent = body.value.length + ' / 1200'; }
    function updateReply() {
      const parent = posts.get(replyId); $('board-reply').hidden = !replyId;
      $('board-reply-label').textContent = parent ? 'Replying to ' + parent.name + ' / ' + fingerprint(parent.event.pubkey) : 'Replying to an earlier signal.';
    }
    function updateCooldown() {
      const seconds = Math.max(0, Math.ceil((lastSent + 60000 - Date.now()) / 1000));
      send.disabled = busy || seconds > 0;
      send.textContent = busy ? 'Sending signal…' : seconds > 0 ? 'Next signal in ' + seconds + 's' : 'Send signal ↗';
    }
    function render() {
      const activeAction = doc.activeElement?.dataset?.signalAction;
      const selected = $('board-filter').value;
      const visible = [...posts.values()].filter(post => !muted.has(post.event.pubkey) && (selected === 'all' || post.topic === selected)).sort((a, b) => b.event.created_at - a.event.created_at || a.event.id.localeCompare(b.event.id));
      const displayed = visible.slice(0, 100), visibleIds = new Set(displayed.map(post => post.event.id));
      const list = $('board-feed');
      list.replaceChildren(...displayed.map(post => renderMessage(post, { document: doc, catalogue, posts, visibleIds, ownKey,
        reply(post) { replyId = post.event.id; topic.value = post.topic; file.value = post.file; updateReply(); saveDraft(); body.focus(); status.textContent = 'Reply selected. Write your signal below.'; },
        mute(post) { if (muted.size >= 50 && !muted.has(post.event.pubkey)) { status.textContent = 'The browser mute list is full. Clear it to add another author.'; return; } muted.add(post.event.pubkey); store.set(storageKeys.muted, JSON.stringify([...muted])); render(); status.textContent = 'Author muted in this browser. Public messages remain on the relays.'; }
      })));
      if (activeAction) for (const button of list.querySelectorAll('button')) if (button.dataset.signalAction === activeAction) button.focus({ preventScroll: true });
      $('board-empty').hidden = visible.length > 0;
      $('board-count').textContent = visible.length + ' matching signal' + (visible.length === 1 ? '' : 's') + (visible.length > 100 ? ' / showing latest 100' : '');
      $('board-mutes').hidden = muted.size === 0; $('board-muted-count').textContent = muted.size + ' muted author' + (muted.size === 1 ? '' : 's');
      updateReply();
    }
    function remember(post) {
      if (!post || posts.has(post.event.id)) return;
      posts.set(post.event.id, post);
      const ordered = [...posts.values()].sort((a, b) => b.event.created_at - a.event.created_at || a.event.id.localeCompare(b.event.id));
      ordered.slice(MAX_POSTS).forEach(item => posts.delete(item.event.id));
      // Relay history arrives in bursts. Batch DOM updates and disk writes.
      if (renderTimer === null) renderTimer = win.setTimeout(() => { renderTimer = null; persistPosts(); render(); }, 80);
    }
    function persistPosts() { store.set(storageKeys.cache, JSON.stringify([...posts.values()].sort((a, b) => b.event.created_at - a.event.created_at || a.event.id.localeCompare(b.event.id)).slice(0, MAX_POSTS).map(item => item.event))); }
    try { const raw = store.get(storageKeys.cache); if (raw && raw.length < 1600000) { const cached = JSON.parse(raw); if (Array.isArray(cached)) cached.slice(0, MAX_POSTS).forEach(event => { const post = parseEvent(event, tools, catalogue); if (post) posts.set(event.id, post); }); } } catch {}
    let secret = null;
    function identity() {
      if (secret) return secret;
      const existing = store.get(storageKeys.key);
      try { if (HEX.test(existing || '')) { const bytes = Uint8Array.from(existing.match(/../g), hex => parseInt(hex, 16)); tools.getPublicKey(bytes); secret = bytes; } } catch {}
      let persisted = Boolean(secret);
      if (!secret) { secret = tools.generateSecretKey(); persisted = store.set(storageKeys.key, Array.from(secret, byte => byte.toString(16).padStart(2, '0')).join('')); }
      ownKey = tools.getPublicKey(secret); $('board-identity').textContent = 'Browser signature / ' + fingerprint(ownKey) + (persisted ? ' · saved here' : ' · this session only');
      return secret;
    }
    if (HEX.test(store.get(storageKeys.key) || '')) { try { identity(); } catch {} }
    render(); saveDraft(); updateCooldown();
    const client = createClient({ tools, catalogue, WebSocket: win.WebSocket, onEvent: remember, onState(value) {
      connection.textContent = value.open ? value.open + ' / ' + value.total + ' relays connected' + (value.complete ? ' · record received' : ' · listening') : value.connecting ? 'Connecting to the public relays…' : 'Relays offline / showing any signals cached here';
      if (!value.open && value.complete === 0) $('board-empty').textContent = posts.size ? 'No signals match this topic or browser mute list.' : 'Listening for the first signals. The archive note above is the starting point.';
    } });
    form.addEventListener('input', saveDraft);
    $('board-filter').addEventListener('change', () => { render(); $('board-status').textContent = 'Topic filter updated.'; });
    $('board-cancel-reply').addEventListener('click', () => { replyId = ''; updateReply(); saveDraft(); body.focus(); });
    $('board-clear-mutes').addEventListener('click', () => { muted.clear(); store.set(storageKeys.muted, '[]'); render(); status.textContent = 'All authors are visible again in this browser.'; });
    $('board-refresh').addEventListener('click', () => { client.refresh(); status.textContent = 'Checking the relays for the latest signals.'; });
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (busy) return;
      if (Date.now() - lastSent < 60000) { status.textContent = 'Please wait one minute between signals.'; return; }
      if (!consent.checked) { status.textContent = 'Read the public-message note and tick the checkbox before sending.'; consent.focus(); return; }
      const content = validContent(draft(), catalogue);
      if (!content) { status.textContent = 'Use a name of 1–32 characters and a message of 1–1200 characters. Check the topic and file.'; return; }
      saveDraft(); busy = true; updateCooldown(); status.textContent = 'Waiting for a public relay to accept your signal…';
      try {
        const tags = [['t', TAG]]; if (content.reply) tags.push(['e', content.reply, '', 'reply']);
        const signed = tools.finalizeEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags, content: JSON.stringify(content) }, identity());
        await client.publish(signed);
        lastSent = Date.now(); store.set(storageKeys.sent, String(lastSent));
        remember(parseEvent(signed, tools, catalogue));
        if (JSON.stringify(draft()) === JSON.stringify(content)) { body.value = ''; replyId = ''; updateReply(); saveDraft(); }
        status.textContent = 'Signal sent. At least one public relay accepted it. Names remain unverified.';
      } catch (error) { status.textContent = error.message || 'The signal could not be sent. Your draft is still here.'; }
      finally { busy = false; updateCooldown(); }
    });
    const cooldown = win.setInterval(updateCooldown, 1000);
    win.addEventListener('storage', event => { if (event.key === storageKeys.sent) { lastSent = Math.min(Number(event.newValue) || 0, Date.now()); updateCooldown(); } });
    win.addEventListener('pagehide', () => { client.close(); win.clearInterval(cooldown); if (renderTimer !== null) win.clearTimeout(renderTimer); persistPosts(); }, { once: true });
    win.addEventListener('pageshow', event => { if (event.persisted) win.location.reload(); });
  }
  return { TAG, RELAYS, TOPICS, parseEvent, validContent, createClient, renderMessage, init };
});
