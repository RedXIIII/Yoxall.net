'use strict';
/* Original stories use the same static page shell as the archive. */
const fs = require('node:fs');
const path = require('node:path');

module.exports = function buildStories({ write, page, e, sourceLink }) {
  const stories = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/story-records.json'), 'utf8'));
  const safeId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!Array.isArray(stories) || !stories.length) throw Error('story-records.json must contain story records');
  const used = new Set();
  for (const story of stories) {
    if (!safeId.test(story.id || '') || used.has(story.id)) throw Error('Unsafe or duplicate story id: ' + story.id);
    used.add(story.id);
    for (const field of ['title', 'hook', 'theme', 'region', 'period']) if (typeof story[field] !== 'string' || !story[field].trim()) throw Error(story.id + ': missing ' + field);
    if (!Array.isArray(story.opening) || !story.opening.length || !Array.isArray(story.chapters) || !story.chapters.length || !Array.isArray(story.sources) || !story.sources.length) throw Error(story.id + ': opening, chapters and original sources are required');
    const sourceIds = new Set();
    for (const source of story.sources) {
      if (!safeId.test(source.id || '') || sourceIds.has(source.id)) throw Error(story.id + ': invalid source id');
      sourceIds.add(source.id);
      if (typeof source.label !== 'string' || !source.label.trim() || !/^https:\/\//.test(source.url || '')) throw Error(story.id + ': each source needs a label and HTTPS URL');
    }
    const evidence = story.evidence;
    if (!evidence || !['documented', 'explained', 'open', 'mixed'].includes(evidence.verdictKey) || !Array.isArray(evidence.claims) || !evidence.claims.length) throw Error(story.id + ': a supported evidence assessment is required');
    for (const claim of evidence.claims) {
      if (!['supported', 'unsupported', 'open', 'mixed'].includes(claim.status) || typeof claim.claim !== 'string' || typeof claim.finding !== 'string' || !Array.isArray(claim.sourceIds) || !claim.sourceIds.length) throw Error(story.id + ': each claim needs a finding, status and sources');
      if (claim.sourceIds.some(id => !sourceIds.has(id))) throw Error(story.id + ': claim references an unknown source');
    }
    for (const chapter of story.chapters) {
      if (typeof chapter.title !== 'string' || !Array.isArray(chapter.paragraphs) || !chapter.paragraphs.length) throw Error(story.id + ': invalid story chapter');
      if ((chapter.sourceIds || []).some(id => !sourceIds.has(id))) throw Error(story.id + ': chapter references an unknown source');
    }
    for (const url of story.relatedUrls || []) if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//') || url.includes('\\')) throw Error(story.id + ': related links must stay inside The Record');
  }
  const storyUrl = story => '/stories/' + story.id + '.html';
  const paragraphs = values => (Array.isArray(values) ? values : [values]).filter(value => typeof value === 'string' && value.trim()).map(value => `<p>${e(value)}</p>`).join('');
  const readingTime = story => {
    const parts = [...story.opening, ...story.chapters.flatMap(chapter => chapter.paragraphs), story.evidence.summary, ...story.evidence.claims.flatMap(claim => [claim.claim, claim.finding])];
    return Math.max(3, Math.ceil(parts.join(' ').split(/\s+/).length / 210));
  };
  const assessmentNames = { documented: 'Documented', explained: 'Explained', open: 'Open question', mixed: 'Mixed evidence' };
  const claimNames = { supported: 'Supported by the record', unsupported: 'Not established', open: 'Still open', mixed: 'Partly supported' };
  function references(story, ids, label = 'Sources') {
    if (!ids?.length) return '';
    return `<div class="story-references"><span>${e(label)}</span>${ids.map(id => { const source = story.sources.find(item => item.id === id), number = String(story.sources.indexOf(source) + 1).padStart(2, '0'); return `<a href="#source-${e(id)}">${number} / ${e(source.label)} <span aria-hidden="true">↗</span></a>`; }).join('')}</div>`;
  }
  function illustration() {
    return `<svg class="story-vessel-illustration" viewBox="0 0 560 410" role="img" aria-labelledby="vessel-illustration-title"><title id="vessel-illustration-title">Original illustration of a narrow-necked stone vessel; not a measured reconstruction</title><g fill="none" stroke="#a1ffba"><ellipse cx="280" cy="205" rx="180" ry="168" opacity=".1" stroke-dasharray="2 10"/><path d="M280 37V367M82 205H478" opacity=".16" stroke-dasharray="4 7"/><path d="M242 94Q238 86 249 80H311Q322 86 318 94L309 134Q310 159 333 177Q365 206 366 247Q368 290 340 313Q316 334 280 334Q244 334 220 313Q192 290 194 247Q195 206 227 177Q250 159 251 134Z" fill="#163423" fill-opacity=".4" stroke-width="1.7"/><path d="M252 94H308M259 95L264 146Q260 177 239 194Q214 218 214 249Q214 278 234 295Q252 311 280 311Q308 311 326 295Q346 278 346 249Q346 218 321 194Q300 177 296 146L301 95" opacity=".45" stroke-width="1.1" stroke-dasharray="4 5"/><path d="M197 249H363M280 105V310" opacity=".2" stroke-dasharray="3 6"/><path d="M318 87H426M366 247H446M194 247H106M248 334H152" opacity=".65"/><circle cx="318" cy="87" r="3" fill="#a1ffba"/><circle cx="366" cy="247" r="3" fill="#a1ffba"/><circle cx="194" cy="247" r="3" fill="#a1ffba"/></g><g fill="#8eae98" font-family="IBM Plex Mono,monospace" font-size="8" letter-spacing="1"><text x="348" y="73">A NARROW OPENING</text><text x="390" y="237">HARD STONE</text><text x="91" y="274">A QUESTION OF TOOLS</text><text x="37" y="382">ILLUSTRATION / NOT A MEASURED MODEL</text><text x="450" y="382">OBJECT FILE</text></g></svg>`;
  }
  function image(story, feature = false) {
    const picture = story.image || story.optionalimage;
    if (!picture?.src) return feature ? illustration() : '';
    let src = picture.src;
    if (!/^https:\/\//.test(src) && !src.startsWith('/')) src = '/' + src;
    if ((!src.startsWith('/assets/') && !/^https:\/\//.test(src)) || src.startsWith('//')) throw Error(story.id + ': unsafe story image');
    return `<figure class="${feature ? 'story-feature-image' : 'story-image'}"><img src="${e(src)}" alt="${e(picture.alt || story.title)}" loading="lazy">
      <figcaption>${e(picture.credit || 'Original source and image provenance are listed below.')}</figcaption>
      </figure>`;
  }
  const feature = stories.find(story => story.id === 'hard-stone-vessels') || stories.find(story => /vessel|vase/i.test(story.title)) || stories[0];
  const themes = [...new Set(stories.map(story => story.theme))];
  const indexBody = `<main id="main" class="stories-index">
      <section class="section-shell story-index-hero">
      <div class="section-label"><span>THE RECORD / INTERESTING STORIES</span><span>FOLLOW THE STRANGE DETAIL</span>
      </div>
      <div class="collection-heading">
      <div>
      <h1>Interesting<br><em>stories.</em>
      </h1>
      <div class="story-index-count"><strong>${stories.length}</strong><span>ORIGINAL STORIES<br>WITH A RECORD BEHIND THEM</span>
      </div>
      </div>
      <div>
      <p>A curious object. A secret programme. A story that refuses to sit neatly inside the explanation. Start with the question, follow the trail, then open the evidence.</p>
      <p class="story-index-premise">Every story keeps its sources close. Read the narrative, or go straight to the assessment.</p><a class="text-link" href="#story-index">Choose a story <span aria-hidden="true">↓</span></a>
      </div>
      </div>
      </section>
      <section class="section-shell story-feature-section" aria-labelledby="story-feature-title">
      <article class="story-feature">
      <div class="story-feature-visual">${image(feature, true)}</div>
      <div class="story-feature-copy"><span class="file-kicker">THE FIRST THREAD / ${e(feature.theme)}</span>
      <h2 id="story-feature-title">${e(feature.title)}</h2>
      <p>${e(feature.hook)}</p>
      <div class="story-meta"><span>${e(feature.period)}</span><span>${readingTime(feature)} MIN READ</span>
      </div><a class="primary-link" href="${storyUrl(feature)}">Read the story <span aria-hidden="true">↗</span></a>
      </div>
      </article>
      </section>
      <section class="section-shell story-index-section" id="story-index" aria-labelledby="story-index-title">
      <div class="section-label"><span>THE STORY SHELF</span><span>OPEN ANY THREAD</span>
      </div>
      <h2 id="story-index-title">Something<br><em>worth following.</em>
      </h2>
      <div class="story-index-tools" data-story-controls hidden><label class="search-box"><span class="sr-only">Search the stories</span><span aria-hidden="true">⌕</span><input id="story-search" type="search" placeholder="Search a story, place or question…" autocomplete="off"></label><button class="text-link" id="story-assessments" type="button" aria-pressed="false">Show assessments ↗</button>
      <div class="filter-group" role="group" aria-label="Filter stories by theme"><button type="button" data-story-filter="all" aria-pressed="true">All stories</button>${themes.map(theme => `<button type="button" data-story-filter="${e(theme)}" aria-pressed="false">${e(theme)}</button>`).join('')}</div>
      </div>
      <p id="story-filter-status" class="search-status" role="status" aria-live="polite">${stories.length} stories</p>
      <div class="story-card-grid">${stories.map((story, index) => `<article class="story-card" data-story-card="${e(story.id)}" data-story-theme="${e(story.theme)}" data-story-search="${e([story.title, story.hook, story.theme, story.region, story.period, ...story.opening].join(' ').toLowerCase())}">
      <div class="story-card-top"><span>${String(index + 1).padStart(2, '0')} / ${e(story.theme)}</span><span>${readingTime(story)} MIN</span>
      </div>
      <h3><a href="${storyUrl(story)}">${e(story.title)}</a>
      </h3>
      <p>${e(story.hook)}</p>
      <div class="story-card-meta"><span>${e(story.region)}</span><span>${e(story.period)}</span>
      </div><a class="text-link" href="${storyUrl(story)}">Follow the story <span aria-hidden="true">↗</span></a>
      <details class="story-card-assessment">
      <summary>The assessment <span aria-hidden="true">+</span>
      </summary>
      <div><span class="story-verdict story-verdict-${e(story.evidence.verdictKey)}">${e(story.evidence.verdictLabel || assessmentNames[story.evidence.verdictKey])}</span>
      <p>${e(story.evidence.headline)}</p><a href="${storyUrl(story)}#evidence">Open the evidence ↗</a>
      </div>
      </details>
      </article>`).join('')}</div>
      <p class="empty-state" id="story-empty" hidden>No stories match. Try a broader question or another theme.</p>
      <noscript>
      <p class="story-no-script">Every story is listed here. Its assessment is available from the native “The assessment” disclosure; the full narrative and sources work without JavaScript.</p>
      </noscript>
      </section>
      <section class="section-shell story-inspiration"><span class="file-kicker">FURTHER WATCHING</span>
      <p>For more curiosity: <a href="https://thewhyfiles.com/" target="_blank" rel="noopener noreferrer">The Why Files ↗</a> and <a href="https://unchartedx.com/site/" target="_blank" rel="noopener noreferrer">UnchartedX ↗</a>.</p><span>Original writing. Independent research.</span>
      </section>
      </main>`;
  const assets = '<link rel="stylesheet" href="/assets/stories.css"><script src="/assets/stories.js" defer></script>';
  write('stories.html', page('Interesting stories', 'Original stories of strange objects, concealed programmes and the evidence behind them. Read the narrative, then follow the sources.', indexBody, { active: 'stories', canonical: '/stories.html' }).replace('</head>', assets + '</head>'));
  for (let index = 0; index < stories.length; index++) {
    const story = stories[index], evidence = story.evidence;
    const related = (story.relatedUrls || []).map(url => { const slug = url.split('/').pop().split(/[?#]/)[0].replace(/\.html$/, '').replace(/-/g, ' '); return `<a href="${e(url)}"><span>RELATED RECORD</span><strong>${e(slug.charAt(0).toUpperCase() + slug.slice(1))}</strong><b aria-hidden="true">↗</b></a>`; }).join('');
    const next = stories[(index + 1) % stories.length];
    const body = `<main id="main" class="story-page">
      <div class="story-progress" aria-hidden="true"><span></span>
      </div>
      <section class="section-shell story-heading">
      <div class="breadcrumb"><a href="/stories.html">Interesting stories</a><span>/</span><span>${e(story.theme)}</span>
      </div>
      <div class="story-overline"><span>${e(story.region)}</span><span>${e(story.period)}</span><span>${readingTime(story)} MIN READ</span>
      </div>
      <h1>${e(story.title)}</h1>
      <p class="story-deck">${e(story.hook)}</p>
      <div class="story-heading-actions"><a class="primary-link" href="#opening">Read the story <span aria-hidden="true">↓</span></a><a class="text-link story-evidence-shortcut" href="#evidence">Skip to the evidence <span aria-hidden="true">↗</span></a><a class="story-source-shortcut" href="#sources">Open the sources ↗</a>
      </div>
      </section>
      <div class="section-shell story-layout">
      <aside class="story-chapter-nav" aria-label="Story chapters"><span>FOLLOW THE THREAD</span>
      <nav><a href="#opening">The opening</a>${story.chapters.map((chapter, number) => `<a href="#chapter-${number + 1}"><span>${String(number + 1).padStart(2, '0')}</span>${e(chapter.title)}</a>`).join('')}<a class="story-nav-evidence" href="#evidence">The evidence ↗</a><a href="#sources">Original sources</a>
      </nav><a class="story-back" href="/stories.html">Return to the story shelf ↗</a>
      </aside>
      <article class="story-article">
      <section class="story-opening" id="opening" aria-label="The opening">${paragraphs(story.opening)}</section>${image(story)}${story.chapters.map((chapter, number) => `<section class="story-chapter" id="chapter-${number + 1}"><span class="file-kicker">${String(number + 1).padStart(2, '0')} / FOLLOWING THE STORY</span>
      <h2>${e(chapter.title)}</h2>${paragraphs(chapter.paragraphs)}${references(story, chapter.sourceIds, 'Chapter sources')}</section>`).join('')}<div class="story-turn"><span>THE STORY HAS A RECORD BEHIND IT.</span>
      <p>Now follow the evidence.</p>
      </div>
      <details class="story-evidence" id="evidence">
      <summary><span class="story-evidence-summary"><span class="file-kicker">THE EVIDENCE / SOURCE BY SOURCE</span><strong>Open the evidence.</strong><span>The claims, what the record supports, and what remains open.</span></span><span class="story-evidence-symbol" aria-hidden="true">+</span>
      </summary>
      <div class="story-evidence-content"><span class="story-verdict story-verdict-${e(evidence.verdictKey)}">${e(evidence.verdictLabel || assessmentNames[evidence.verdictKey])}</span>${story.reviewed ? `<p class="file-kicker">SOURCE REVIEW / ${e(new Date(story.reviewed + 'T12:00:00Z').toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}))}</p>` : ''}
      <h2 id="evidence-title" tabindex="-1">${e(evidence.headline)}</h2>${paragraphs(evidence.summary)}<div class="story-claims">${evidence.claims.map((claim, number) => `<article class="story-claim" id="claim-${number + 1}">
      <div><span class="story-claim-number">${String(number + 1).padStart(2, '0')}</span><span class="story-claim-status story-claim-status-${e(claim.status)}">${e(claimNames[claim.status])}</span>
      </div>
      <h3>${e(claim.claim)}</h3>
      <p>${e(claim.finding)}</p>${references(story, claim.sourceIds, 'The record')}</article>`).join('')}</div>${evidence.remaining?.length ? `<section class="story-remaining"><span class="file-kicker">WHAT REMAINS OPEN</span>
      <h3>The next question.</h3>${paragraphs(evidence.remaining)}</section>` : ''}${evidence.nextTest ? `<section class="story-next-test"><span class="file-kicker">A USEFUL NEXT TEST</span>${paragraphs(evidence.nextTest)}</section>` : ''}</div>
      </details>
      <section class="story-sources" id="sources">
      <div class="section-label"><span>THE ORIGINAL SOURCES</span><span>THE TRAIL REMAINS OPEN</span>
      </div>
      <h2>Read the record<br><em>for yourself.</em>
      </h2>
      <p class="story-source-intro">These are the documents, objects and studies behind this story. Their findings and limits belong to the named source.</p>
      <ol>${story.sources.map((source, number) => `<li id="source-${e(source.id)}"><span class="story-source-number">${String(number + 1).padStart(2, '0')}</span>
      <div>${sourceLink(source)}${source.note ? `<p>${e(source.note)}</p>` : ''}</div>
      </li>`).join('')}</ol>
      </section>${related ? `<section class="story-related"><span class="file-kicker">CONTINUE INTO THE ARCHIVE</span>
      <div>${related}</div>
      </section>` : ''}<div class="story-final-actions"><button class="text-link" type="button" data-copy-link>Copy story link ↗</button><a class="text-link" href="/board.html#board-compose">Discuss in the Signal Room ↗</a>
      </div>
      </article>
      </div>
      <section class="section-shell story-next"><span class="file-kicker">ANOTHER THREAD</span><a href="${storyUrl(next)}"><strong>${e(next.title)}</strong><span aria-hidden="true">↗</span></a><a class="story-next-index" href="/stories.html">Explore all ${stories.length} stories ↗</a>
      </section>
      </main>`;
    write(storyUrl(story).slice(1), page(story.title, story.hook, body, { active: 'stories', canonical: storyUrl(story), file: true }).replace('</head>', assets + '</head>'));
  }
  return ['/stories.html', ...stories.map(storyUrl)];
};
