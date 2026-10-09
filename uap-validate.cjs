'use strict';
/* Run after node build.cjs. Validate the curated UFO catalogue against the
   public, generated output. Offline: this does not fetch or play any media. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const failures = [];
let checks = 0;
function check(condition, message) { checks++; if (!condition) failures.push(message); }
function read(relative) { try { return fs.readFileSync(path.join(root, relative), 'utf8'); } catch { failures.push('Missing public file: ' + relative); return ''; } }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
function decode(value) { return String(value).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
function plain(html) { return decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function normalize(value) { return String(value).replace(/\s+/g, ' ').trim(); }
function attributes(tag) { const values = {}; for (const match of tag.matchAll(/([\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) values[match[1].toLowerCase()] = decode(match[3]); return values; }
function meta(html, key) { const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0])).find(item => item.name === key || item.property === key); return tag?.content; }
function links(html) { return [...html.matchAll(/<(?:a|link)\b[^>]*>/gi)].map(match => attributes(match[0]).href).filter(Boolean); }
function isHttps(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port; } catch { return false; } }
function mediaHost(value) { try { const url = new URL(value); return isHttps(value) && (url.hostname === 'd34w7g4gy10iej.cloudfront.net' || url.hostname === 'www.dvidshub.net' || url.hostname === 'dvidshub.net'); } catch { return false; } }
function checkLocalLinks(relative, html) {
  for (const match of html.matchAll(/<(?:a|link|script|img)\b[^>]*>/gi)) {
    const attrs = attributes(match[0]); const value = attrs.href || attrs.src; if (!value) continue;
    let url; try { url = new URL(value, 'https://yoxall.net/' + relative); } catch { check(false, relative + ': invalid link ' + value); continue; }
    if (url.protocol !== 'https:') { check(false, relative + ': unsupported link protocol ' + value); continue; }
    if (url.hostname !== 'yoxall.net') continue;
    const local = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
    const absolute = path.resolve(root, local);
    check(absolute.startsWith(path.resolve(root) + path.sep), relative + ': link escapes the public root: ' + value);
    check(fs.existsSync(absolute), relative + ': missing link/resource ' + value);
    if (url.hash && fs.existsSync(absolute) && local.endsWith('.html')) {
      const fragment = decodeURIComponent(url.hash.slice(1)), target = fs.readFileSync(absolute, 'utf8');
      const ids = [...target.matchAll(/\bid\s*=\s*(["'])(.*?)\1/g)].map(item => decode(item[2]));
      check(ids.includes(fragment), relative + ': missing fragment ' + value);
    }
    if (url.pathname === '/ufo.html' && url.searchParams.has('case')) check(ids.has(url.searchParams.get('case')), relative + ': unknown observation query ' + value);
  }
}
const catalogueFile = path.join(root, 'assets/uap-records.json');
if (!fs.existsSync(catalogueFile)) { console.error('UFO validation is waiting for assets/uap-records.json. Merge the catalogue and run node build.cjs first.'); process.exit(1); }
let records;
try { records = JSON.parse(fs.readFileSync(catalogueFile, 'utf8')); } catch (error) { console.error('Invalid UFO catalogue JSON: ' + error.message); process.exit(1); }
if (!Array.isArray(records)) { console.error('UFO catalogue must be an array.'); process.exit(1); }
check(records.length === 11, 'Expected the reviewed 11 observation records; got ' + records.length);
const ids = new Set(), statuses = new Set(['open', 'resolved', 'contested']);
let videoCount = 0, pinned = 0, unpinned = 0;
for (const record of records) {
  const label = record?.id || '(missing id)';
  check(record && typeof record === 'object' && !Array.isArray(record), label + ': invalid record object');
  if (!record || typeof record !== 'object') continue;
  check(typeof record.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id), label + ': unsafe observation id');
  check(!ids.has(record.id), label + ': duplicate observation id'); ids.add(record.id);
  for (const field of ['title', 'date', 'dateLabel', 'region', 'locationPrecision', 'hook', 'summary', 'status', 'limits']) check(text(record[field]), label + ': missing ' + field);
  check(statuses.has(record.statusKey), label + ': unsupported evidence status');
  const pairNull = record.lat === null && record.lon === null;
  const pairNumber = typeof record.lat === 'number' && typeof record.lon === 'number' && Number.isFinite(record.lat) && Number.isFinite(record.lon);
  check(pairNull || pairNumber, label + ': latitude/longitude must be both finite numbers or both null');
  if (pairNumber) {
    pinned++;
    check(Math.abs(record.lat) <= 90 && Math.abs(record.lon) <= 180, label + ': coordinates outside globe bounds');
    check(/approximate|regional/i.test(record.locationPrecision || ''), label + ': approximate map location is not disclosed');
  } else if (pairNull) {
    unpinned++;
    check(/no map pin|undisclosed|not specif|does not specif/i.test(record.locationPrecision || ''), label + ': missing explanation for an unpinned case');
  }
  check(Array.isArray(record.facts) && record.facts.length > 0 && record.facts.every(text), label + ': missing/invalid established facts');
  check(Array.isArray(record.sources) && record.sources.length > 0, label + ': missing source record');
  const sourceUrls = new Set();
  for (const source of record.sources || []) {
    check(source && text(source.label) && isHttps(source.url), label + ': invalid source label or HTTPS URL');
    check(!sourceUrls.has(source?.url), label + ': duplicate source URL'); sourceUrls.add(source?.url);
  }
  if (record.narrative !== undefined) check(Array.isArray(record.narrative) && record.narrative.every(text), label + ': invalid narrative paragraphs');
  for (const field of ['imageUrl', 'videoPage', 'fallbackEmbedUrl']) if (record[field]) check(isHttps(record[field]), label + ': invalid HTTPS ' + field);
  if (record.videoUrl) {
    videoCount++;
    check(mediaHost(record.videoUrl), label + ': video must use the reviewed DVIDS/CloudFront host');
    check(['mp4', 'iframe'].includes(record.videoType), label + ': unsupported official media format');
    check(text(record.videoLabel), label + ': official media provenance label missing');
    const page = record.videoPage || record.sources?.[0]?.url;
    check(mediaHost(page) && /\/video\/(?:embed\/)?\d+/.test(new URL(page).pathname), label + ': missing usable official video-player record link');
    if (record.videoType === 'mp4') check(/\.mp4$/i.test(new URL(record.videoUrl).pathname), label + ': mp4 URL lacks an mp4 path');
  }
}
check(videoCount === 8, 'Expected 8 official videos; got ' + videoCount);
check(pinned === 9 && unpinned === 2, 'Expected 9 approximate pins and 2 unpinned cases; got ' + pinned + '/' + unpinned);
const room = read('ufo.html');
const publicData = read('assets/uap-data.js');
try {
  const sandbox = { window: {} }; vm.runInNewContext(publicData, sandbox, { timeout: 1000 });
  check(JSON.stringify(sandbox.window.UAP_CASES) === JSON.stringify(records), 'Public uap-data.js is stale or differs from the reviewed catalogue');
} catch (error) { check(false, 'Cannot read the generated public catalogue: ' + error.message); }
const cardIds = [...room.matchAll(/<article\b[^>]*\bdata-uap-card="([^"]+)"/g)].map(match => decode(match[1]));
const panelIds = [...room.matchAll(/<template\b[^>]*\bdata-uap-panel="([^"]+)"/g)].map(match => decode(match[1]));
check(cardIds.length === 11 && new Set(cardIds).size === 11 && cardIds.every(id => ids.has(id)), 'Observation-room accessible cards do not match the 11 reviewed cases');
check(panelIds.length === 11 && new Set(panelIds).size === 11 && panelIds.every(id => ids.has(id)), 'Observation-room selectable panels do not match the 11 reviewed cases');
for (const asset of ['/assets/uap-data.js', '/assets/uap-globe.js', '/assets/uap-page.js']) check(room.includes(asset), 'Observation room lacks required asset ' + asset);
check(room.indexOf('/assets/uap-data.js') < room.indexOf('/assets/uap-globe.js') && room.indexOf('/assets/uap-globe.js') < room.indexOf('/assets/uap-page.js'), 'Public data, globe and panel scripts load in the wrong order');
check(room.includes('id="uap-globe-canvas"') && room.includes('id="uap-case-index"'), 'Globe or accessible observation index missing');
checkLocalLinks('ufo.html', room);
const htmlFiles = [['ufo.html', room]];
for (const record of records) {
  if (typeof record.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) continue;
  const file = 'ufo/' + record.id + '.html', html = read(file), content = plain(html);
  htmlFiles.push([file, html]);
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  check(h1 && plain(h1[1]) === normalize(record.title), file + ': title does not match its source record');
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).find(item => item.rel === 'canonical');
  check(canonical?.href === 'https://yoxall.net/' + file, file + ': canonical URL incorrect');
  check(meta(html, 'description') === record.hook && meta(html, 'og:description') === record.hook, file + ': description metadata differs from the source hook');
  check(meta(html, 'og:title') === record.title + ' — The Record', file + ': social title differs from the source record');
  for (const field of ['summary', 'limits', 'locationPrecision', 'status']) check(content.includes(normalize(record[field])), file + ': public ' + field + ' missing or changed');
  for (const fact of record.facts || []) check(content.includes(normalize(fact)), file + ': established fact missing from public text');
  for (const paragraph of record.narrative || []) check(content.includes(normalize(paragraph)), file + ': narrative paragraph missing from public text');
  const hrefs = links(html);
  for (const source of record.sources || []) {
    check(hrefs.includes(source.url), file + ': original source URL missing: ' + source.url);
    check(content.includes(normalize(source.label)), file + ': original source label missing');
  }
  check(hrefs.includes('/ufo.html?case=' + record.id + '#uap-selected'), file + ': deep link back to this observation is missing');
  if (record.videoUrl) {
    const buttons = [...html.matchAll(/<button\b[^>]*>/gi)].map(match => attributes(match[0]));
    check(buttons.some(button => button['data-uap-video'] === record.videoUrl), file + ': source video URL missing or changed in the load button');
    check(hrefs.includes(record.videoPage || record.sources[0].url), file + ': official fallback-player link missing');
    check(content.includes(normalize(record.videoLabel)), file + ': official media caption missing');
    check(room.includes(record.videoUrl.replace(/&/g, '&amp;')), 'Observation-room panel lacks source media for ' + record.id);
  } else check(content.includes('No verified original video is embedded.'), file + ': archival case falsely promises a verified video');
  checkLocalLinks(file, html);
}
for (const [file, html] of htmlFiles) check(!/<(?:video|iframe)\b[^>]*(?:\bsrc\s*=|\bautoplay\b)/i.test(html), file + ': official media loads automatically before the visitor requests it');
const tremonton = records.find(record => /tremonton/i.test(record.id + ' ' + record.title));
check(Boolean(tremonton), 'The reviewed Tremonton archive case is missing');
if (tremonton) {
  const recordText = [tremonton.summary, tremonton.limits, tremonton.mediaNote].filter(Boolean).join(' ');
  check(/55\s*seconds/i.test(recordText) && /unrelated.*sewing|sewing[- ]equipment/i.test(recordText), 'Tremonton record lacks the approximately 55-second switch to unrelated sewing footage warning');
  for (const [file, html] of htmlFiles.filter(([file]) => file === 'ufo.html' || file === 'ufo/' + tremonton.id + '.html')) {
    const content = plain(html); check(/55\s*seconds/i.test(content) && /sewing/i.test(content), file + ': Tremonton footage warning is not preserved in the public output');
  }
}
const world = read('assets/uap-world.json');
try { const geometry = JSON.parse(world); check(geometry.license === 'Public domain' && Array.isArray(geometry.rings) && geometry.rings.length > 0, 'Local globe coastline data or public-domain provenance is missing'); } catch { check(false, 'Local globe coastline JSON is invalid'); }
if (failures.length) {
  console.error('FAIL: ' + failures.length + ' UFO validation issue(s) across ' + checks + ' checks.');
  failures.forEach(message => console.error(' - ' + message)); process.exitCode = 1;
} else console.log('PASS: ' + checks + ' UFO catalogue/public-output checks; 11 records, 8 official videos, 9 approximate pins, 2 unpinned, intact facts/sources/metadata/deep links, opt-in media and Tremonton warning. Offline validation; media availability is checked separately.');
