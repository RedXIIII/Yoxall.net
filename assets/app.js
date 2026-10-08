(() => {
  'use strict';
  const modern = window.MODERN_RECORDS || [];
  const ancient = window.ANCIENT_RECORDS || [];
  const records = [...modern, ...ancient];
  const byId = new Map(records.map(record => [record.id, record]));
  const $ = id => document.getElementById(id);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = storage.get('record-motion') == null ? !media.matches : storage.get('record-motion') === 'on';
  let filter = 'all';
  let query = '';
  let activeScene = 0;
  let storiesPaused = false;
  let heroVisible = true;
  let currentFile = null;
  const dossier = $('dossier-dialog');
  const info = $('info-dialog');
  const sourceAnchor = source => {
    const link = make('a', 'source-link', source.label);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append(make('span', '', '↗'));
    return link;
  };
  function matches(record) {
    return [record.title, record.hook, record.category, record.summary, record.status].join(' ').toLowerCase().includes(query);
  }
  function createRow(record, index) {
    const button = make('button', 'file-row');
    button.type = 'button';
    button.dataset.open = record.id;
    button.setAttribute('aria-label', `Open ${record.title} — ${record.status}`);
    button.append(make('span', 'file-number', String(index + 1).padStart(3, '0')));
    const name = make('span', 'file-name');
    name.append(make('span', 'file-title', record.title), make('span', 'file-hook', record.hook));
    button.append(name, make('span', 'file-year', record.year), make('span', 'file-status', record.status), make('span', 'row-arrow', '↗'));
    button.addEventListener('click', () => openFile(record.id));
    return button;
  }
  function renderIndex() {
    const modernResults = modern.filter(record => (filter === 'all' || record.category === filter) && matches(record));
    const ancientResults = ancient.filter(matches);
    $('modern-index').replaceChildren(...modernResults.map(record => createRow(record, modern.indexOf(record))));
    $('ancient-index').replaceChildren(...ancientResults.map(record => createRow(record, modern.length + ancient.indexOf(record))));
    if (!modernResults.length) $('modern-index').append(make('p', 'empty-state', 'No documented files match. Try another subject or choose All files.'));
    if (!ancientResults.length) $('ancient-index').append(make('p', 'empty-state', 'No ancient files match this search.'));
    $('search-status').textContent = `${modernResults.length} of ${modern.length} documented files${query ? ` · ${ancientResults.length} ancient files also match below` : ''}`;
    $('ancient-search-status').textContent = query ? `${ancientResults.length} of ${ancient.length} ancient files match “${$('archive-search').value}”` : '';
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderIndex();
  }));
  $('archive-search').addEventListener('input', event => { query = event.target.value.trim().toLowerCase(); renderIndex(); });
  $('random-file').addEventListener('click', () => {
    const choices = records.filter(record => record.id !== currentFile);
    if (choices.length) openFile(choices[Math.floor(Math.random() * choices.length)].id);
  });
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openFile(button.dataset.open)));

  function openFile(id, updateAddress = true) {
    const record = byId.get(id);
    if (!record) return;
    currentFile = id;
    const content = make('div', 'dossier-inner');
    const meta = make('div', 'dossier-meta');
    meta.append(make('span', '', record.category), make('span', '', record.year), make('span', '', record.status));
    content.append(meta);
    const title = make('h2', 'dossier-title', record.title);
    title.id = 'dossier-title';
    content.append(title, make('p', 'dossier-hook', record.hook), make('p', 'dossier-summary', record.summary));
    if (record.image) {
      const figure = make('figure', 'dossier-image');
      const img = make('img');
      img.src = record.image;
      img.alt = record.imageAlt || `Original source image for ${record.title}`;
      figure.append(img, make('figcaption', '', record.imageCredit || 'Original 1977 US Senate hearing cover. US government record. Cropped and toned in the opening display.'));
      content.append(figure);
    }
    content.append(make('h3', '', 'What the record establishes'));
    const facts = make('ul', 'dossier-facts');
    record.facts.forEach(fact => facts.append(make('li', '', fact)));
    content.append(facts);
    const limit = make('div', 'evidence-limit');
    limit.append(make('h3', '', 'Where the evidence stops'), make('p', '', record.limits));
    content.append(limit, make('h3', '', 'Read the source material'));
    const sources = make('div', 'source-links');
    record.sources.forEach(source => sources.append(sourceAnchor(source)));
    content.append(sources);
    const actions = make('div', 'dossier-actions');
    const copy = make('button', 'text-link', 'Copy file link ↗');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      const url = new URL(location.href); url.searchParams.set('file', id);
      try { await navigator.clipboard.writeText(url.href); copy.textContent = 'Link copied ✓'; }
      catch { copy.textContent = 'File link is in your address bar'; }
    });
    actions.append(copy);
    const related = make('button', 'related-file', 'Continue into another file');
    related.type = 'button';
    const group = ancient.includes(record) ? ancient : modern;
    const next = group[(group.indexOf(record) + 1) % group.length];
    related.append(make('span', '', `${next.title} ↗`));
    related.addEventListener('click', () => openFile(next.id));
    content.append(actions, related);
    $('dossier-label').textContent = `THE RECORD / FILE ${String(records.indexOf(record) + 1).padStart(3, '0')}`;
    $('dossier-content').replaceChildren(content);
    if (info.open) info.close();
    if (!dossier.open) dossier.showModal();
    dossier.scrollTop = 0;
    document.body.classList.add('dialog-open');
    if (updateAddress) {
      const url = new URL(location.href); url.searchParams.set('file', id);
      history.replaceState(null, '', url);
    }
  }
  function cleanAddress() {
    const url = new URL(location.href);
    if (url.searchParams.has('file')) { url.searchParams.delete('file'); history.replaceState(null, '', url); }
  }
  [dossier, info].forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      if (!dossier.open && !info.open) document.body.classList.remove('dialog-open');
      if (dialog === dossier) cleanAddress();
    });
  });
  function openInfo(kind) {
    const content = make('div', 'info-content');
    const heading = make('h2', '', kind === 'method' ? 'Follow the record.' : 'The source trail.');
    heading.id = 'info-title'; content.append(heading);
    if (kind === 'method') {
      content.append(make('p', '', 'Each case distinguishes an extraordinary headline from the narrower evidence that supports it. Start with the findings, read the limits, and open the original source.'));
      const definitions = [
        ['Documented programme', 'Records or official investigations establish that a programme existed. Its existence does not prove that every claimed technique worked.'],
        ['Unexecuted proposal', 'An authentic plan is evidence of what was proposed. It is not evidence that the proposed events happened.'],
        ['Court finding / regulatory settlement', 'A court finding and a settlement are different kinds of records. Each file describes which occurred.'],
        ['Archaeological find', 'Objects or sites establish a discovery. They may leave questions of interpretation, function or chronology.'],
        ['Contested study / literary account', 'A reported experiment or ancient narrative may deserve attention without settling a broader claim.']
      ];
      definitions.forEach(([label, text]) => { content.append(make('h3', '', label), make('p', '', text)); });
      content.append(make('p', '', 'The most useful questions are specific: which object, which measurement, which document, and how securely can it be dated? Follow those details and the investigation becomes more interesting.'));
    } else {
      content.append(make('p', '', 'Every case file links to its supporting papers, museum records, original documents or official findings. This is an independent archive with no affiliation to the institutions cited.'));
      content.append(make('h3', '', 'Image credits'));
      const list = make('ul');
      const credits = [
        ['Giza pyramids: Ricardo Liberato, retouched by Ikiwaner. CC BY-SA 2.0. Cropped and colour-treated for display.', 'https://commons.wikimedia.org/wiki/File:All_Gizah_Pyramids.jpg', 'https://creativecommons.org/licenses/by-sa/2.0/'],
        ['Diorite jar: The Metropolitan Museum of Art, accession 2021.41.59. Public Domain / CC0. Cropped for display.', 'https://www.metmuseum.org/art/collection/search/329827', 'https://www.metmuseum.org/hubs/open-access'],
        ['Antikythera mechanism: Peulle (Petter Ulleland). CC BY-SA 4.0. Cropped for display where applicable.', 'https://commons.wikimedia.org/wiki/File:Antikythera_Mechanism_(NAMA)_2017.jpg', 'https://creativecommons.org/licenses/by-sa/4.0/'],
        ['MKULTRA hearing cover: US Senate / Government Printing Office, 3 August 1977. Public-domain government scan, resized and toned for display.', 'https://commons.wikimedia.org/wiki/File:ProjectMKULTRA_Senate_Report.pdf', null],
        ['Northwoods memorandum: Joint Chiefs of Staff, 13 March 1962. Government record held by the National Security Archive, resized and toned for display.', 'https://nsarchive.gwu.edu/sites/default/files/2022-10/Joint-Chiefs-pretexts-to-invade-Cuba-March-1962_0.pdf', null],
        ['Telephone-records report cover: Privacy and Civil Liberties Oversight Board, 23 January 2014. Government record, resized and toned for display.', 'https://documents.pclob.gov/prod/Documents/OversightReport/ec542143-1079-424a-84b3-acc354698560/215-Report_on_the_Telephone_Records_Program.pdf', null]
      ];
      credits.forEach(([text, url, license]) => {
        const li = make('li', '', `${text} `);
        const source = make('a', '', 'Source'); source.href = url; source.target = '_blank'; source.rel = 'noopener noreferrer'; li.append(source);
        if (license) { li.append(document.createTextNode(' · ')); const link = make('a', '', 'Licence / terms'); link.href = license; link.target = '_blank'; link.rel = 'noopener noreferrer'; li.append(link); }
        list.append(li);
      });
      content.append(list, make('h3', '', 'Explore the primary sources'));
      const sourceList = make('div', 'source-links');
      records.forEach(record => sourceList.append(sourceAnchor({label: `${record.title} — ${record.sources[0].label}`, url: record.sources[0].url})));
      content.append(sourceList);
    }
    $('info-content').replaceChildren(content);
    if (dossier.open) dossier.close();
    if (!info.open) info.showModal();
    info.scrollTop = 0;
    document.body.classList.add('dialog-open');
  }
  $('method-open').addEventListener('click', () => openInfo('method'));
  $('credits-open').addEventListener('click', () => openInfo('credits'));

  const scenes = [
    {id:'mkultra', title:'They drugged people who never agreed to an experiment.', description:'Project MKULTRA. The CIA’s covert experiments on human behaviour.', image:'assets/mkultra-hearing.jpg', alt:'Cover of the 1977 US Senate hearing on Project MKULTRA'},
    {id:'northwoods', title:'The attack that would justify a war was in the proposal.', description:'Operation Northwoods. An authentic plan, never carried out.', image:'assets/northwoods-memo.jpg', alt:'First page of the original 1962 Northwoods memorandum'},
    {id:'nsa', title:'Who you called. When. How long. Collected at scale.', description:'The NSA’s bulk telephone-records programme. Metadata, not conversations.', image:'assets/nsa-report.jpg', alt:'Cover of the official 2014 report on the NSA telephone-records programme'}
  ];
  function showScene(index) {
    activeScene = index;
    const scene = scenes[index], record = byId.get(scene.id);
    $('scene-number').textContent = String(index + 1).padStart(2, '0');
    $('scene-year').textContent = record?.year || '';
    $('scene-status').textContent = (record?.status || 'Documented record').toUpperCase();
    $('scene-title').textContent = scene.title;
    $('scene-description').textContent = scene.description;
    const img = $('evidence-visual').querySelector('img'); img.src = scene.image; img.alt = scene.alt;
    document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.scene) === index)));
  }
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => { showScene(Number(button.dataset.scene)); storiesPaused = true; updateStoryPause(); }));
  $('scene-open').addEventListener('click', () => openFile(scenes[activeScene].id));
  function updateStoryPause() { $('scene-pause').setAttribute('aria-pressed', String(storiesPaused)); $('scene-pause').textContent = storiesPaused ? 'Play stories' : 'Pause stories'; }
  $('scene-pause').addEventListener('click', () => { storiesPaused = !storiesPaused; updateStoryPause(); });
  setInterval(() => { if (motion && !storiesPaused && heroVisible && !document.hidden && !dossier.open && !info.open) showScene((activeScene + 1) % scenes.length); }, 9000);

  const canvas = $('matrix-rain'), ctx = canvas.getContext('2d');
  const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ0123456789';
  let streams = [], width = 0, height = 0, raf = 0, lastFrame = 0;
  function setupRain() {
    const box = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 1.8);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    streams = Array.from({length:Math.ceil(width / (width < 620 ? 25 : 22))}, (_, index) => ({
      x:index * (width < 620 ? 25 : 22), y:Math.random() * (height + 450) - 250, speed:62 + Math.random() * 69,
      length:18 + Math.floor(Math.random() * 23), brightness:.5 + Math.random() * .5,
      characters:Array.from({length:38}, () => glyphs[Math.floor(Math.random() * glyphs.length)])
    }));
    drawRain(0);
  }
  function drawRain(delta) {
    if (!ctx) return;
    ctx.clearRect(0,0,width,height);
    ctx.font = '13px "IBM Plex Mono", monospace';
    streams.forEach(stream => {
      stream.y += stream.speed * delta;
      if (stream.y - stream.length * 18 > height) stream.y = -Math.random() * 400;
      for (let i = 0; i < stream.length; i++) {
        const y = stream.y - i * 18;
        if (y < -18 || y > height + 18) continue;
        const alpha = Math.pow(1 - i / stream.length, 1.7) * stream.brightness;
        ctx.fillStyle = i === 0 ? `rgba(207,255,220,${alpha})` : `rgba(92,235,129,${alpha * .88})`;
        if (delta && Math.random() < .004) stream.characters[i] = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillText(stream.characters[i], stream.x, y);
      }
    });
  }
  function frame(time) {
    raf = 0;
    if (!motion || !heroVisible || document.hidden) return;
    if (!lastFrame || time - lastFrame >= 45) {
      drawRain(lastFrame ? Math.min((time - lastFrame) / 1000, .1) : 0); lastFrame = time;
    }
    raf = requestAnimationFrame(frame);
  }
  function startRain() { if (!raf && motion && heroVisible && !document.hidden) { lastFrame = 0; raf = requestAnimationFrame(frame); } }
  function stopRain() { cancelAnimationFrame(raf); raf = 0; lastFrame = 0; }
  function updateMotion() {
    document.documentElement.classList.toggle('motion-paused', !motion);
    $('motion-toggle').setAttribute('aria-pressed', String(motion));
    $('motion-toggle').setAttribute('aria-label', motion ? 'Pause animated effects' : 'Enable animated effects');
    $('motion-toggle').querySelector('span').textContent = motion ? 'on' : 'off';
    $('scene-pause').disabled = !motion;
    if (motion) updateStoryPause(); else $('scene-pause').textContent = 'Stories paused';
    if (motion) startRain(); else stopRain();
  }
  $('motion-toggle').addEventListener('click', () => { motion = !motion; storage.set('record-motion', motion ? 'on' : 'off'); updateMotion(); });
  media.addEventListener('change', event => { if (storage.get('record-motion') == null) { motion = !event.matches; updateMotion(); } });
  new ResizeObserver(setupRain).observe(canvas);
  new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; if (heroVisible) startRain(); else stopRain(); }, {threshold:0}).observe(document.querySelector('.hero'));

  let audioContext = null, soundEnabled = false;
  async function toggleSound() {
    try {
      if (!audioContext) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Web Audio unavailable');
        audioContext = new Audio();
        const gain = audioContext.createGain(); gain.gain.value = .025; gain.connect(audioContext.destination);
        [55, 82.41, 110.1].forEach(frequency => { const oscillator = audioContext.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start(); });
      }
      soundEnabled = !soundEnabled;
      if (soundEnabled) await audioContext.resume(); else await audioContext.suspend();
      $('sound-toggle').setAttribute('aria-pressed', String(soundEnabled));
      $('sound-toggle').setAttribute('aria-label', soundEnabled ? 'Mute ambient sound' : 'Enable ambient sound');
      $('sound-toggle').querySelector('span').textContent = soundEnabled ? 'on' : 'off';
    } catch { $('sound-toggle').querySelector('span').textContent = 'unavailable'; soundEnabled = false; }
  }
  $('sound-toggle').addEventListener('click', toggleSound);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopRain(); if (audioContext) audioContext.suspend(); }
    else { startRain(); if (audioContext && soundEnabled) audioContext.resume(); }
  });
  renderIndex(); showScene(0); setupRain(); updateMotion();
  const initialFile = new URL(location.href).searchParams.get('file');
  if (initialFile && byId.has(initialFile)) openFile(initialFile, false);
})();
