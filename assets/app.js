(() => {
  'use strict';
  const records=window.RECORDS||[];
  const $=id=>document.getElementById(id);
  const fileUrl=id=>`/files/${encodeURIComponent(id)}.html`;
  const storage={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
  const saved=()=>{try{const ids=JSON.parse(storage.get('record-saved')||'[]');return Array.isArray(ids)?ids.filter(id=>typeof id==='string'):[]}catch{return []}};
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let motion=storage.get('record-motion')==null?!media.matches:storage.get('record-motion')==='on';
  const oldId=new URL(location.href).searchParams.get('file');
  if(oldId&&records.some(r=>r.id===oldId)&&['/','/index.html'].includes(location.pathname)){location.replace(fileUrl(oldId));return;}
  document.querySelectorAll('[data-open]').forEach(node=>node.addEventListener('click',()=>location.assign(fileUrl(node.dataset.open))));
  $('method-open')?.addEventListener('click',()=>location.assign('/reading-room.html#standards'));
  $('credits-open')?.addEventListener('click',()=>location.assign('/reading-room.html#credits'));
  $('random-file')?.addEventListener('click',()=>location.assign(fileUrl(records[Math.floor(Math.random()*records.length)].id)));
  document.querySelectorAll('[data-save-file]').forEach(button=>{
    const id=button.dataset.saveFile;
    function update(){const on=saved().includes(id);button.setAttribute('aria-pressed',String(on));button.textContent=on?'Saved ✓':'Save file +';}
    button.addEventListener('click',()=>{const ids=saved();storage.set('record-saved',JSON.stringify(ids.includes(id)?ids.filter(item=>item!==id):[...ids,id]));update();});update();
  });
  document.querySelectorAll('[data-copy-link]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);button.textContent='Link copied ✓'}catch{button.textContent='Use the address bar to copy';}}));
  document.querySelectorAll('[data-collection]').forEach(section=>{
    const input=section.querySelector('[data-search-input]');const rows=[...section.querySelectorAll('.file-row')];let category='all';const savedFilter=document.querySelector('[data-saved-filter]');
    function render(){const query=(input?.value||'').trim().toLowerCase();const region=section.querySelector('[data-region-filter]')?.value||'all';const onlySaved=savedFilter?.getAttribute('aria-pressed')==='true';const ids=saved();let count=0;
      rows.forEach(row=>{const show=(!query||row.dataset.search.includes(query))&&(category==='all'||row.dataset.category===category)&&(region==='all'||row.dataset.region.includes(region))&&(!onlySaved||ids.includes(row.dataset.id));row.hidden=!show;if(show)count++;});
      section.querySelector('[data-search-status]').textContent=`${count} of ${rows.length} files${onlySaved?' · saved in this browser':''}`;section.querySelector('[data-empty]').hidden=count>0;
    }
    input?.addEventListener('input',render);section.querySelector('[data-region-filter]')?.addEventListener('change',render);
    section.querySelectorAll('[data-category-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.categoryFilter;section.querySelectorAll('[data-category-filter]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));render();}));
    savedFilter?.addEventListener('click',()=>{savedFilter.setAttribute('aria-pressed',String(savedFilter.getAttribute('aria-pressed')!=='true'));savedFilter.textContent=savedFilter.getAttribute('aria-pressed')==='true'?'Show all files ↗':'Show saved files ↗';render();});render();
  });
  const directory=document.querySelector('[data-source-directory]');
  if(directory){const input=directory.querySelector('[data-source-search]');const entries=[...directory.querySelectorAll('.source-entry')];input.addEventListener('input',()=>{const query=input.value.trim().toLowerCase();let count=0;entries.forEach(entry=>{entry.hidden=!entry.dataset.sourceText.includes(query);if(!entry.hidden)count++;});directory.querySelector('[data-directory-status]').textContent=`${count} source groups match`;});}
  function row(record){const link=document.createElement('a');link.className='file-row';link.href=fileUrl(record.id);const span=(cls,text)=>{const n=document.createElement('span');n.className=cls;n.textContent=text;return n};const name=span('file-name','');name.append(span('file-title',record.title),span('file-hook',record.hook));link.append(span('file-number',String(records.indexOf(record)+1).padStart(3,'0')),name,span('file-year',record.year),span('file-status',record.status),span('row-arrow','↗'));return link;}
  if($('modern-index')){
    let filter='all';
    function renderHome(){const query=$('archive-search').value.trim().toLowerCase();const matches=r=>[r.title,r.hook,r.category,r.summary,r.region,...r.facts].join(' ').toLowerCase().includes(query);const modern=records.filter(r=>r.collection==='modern'&&(filter==='all'||r.category===filter)&&matches(r));const ancient=records.filter(r=>r.collection==='ancient'&&matches(r));const current=records.filter(r=>r.collection==='current'&&matches(r));
      $('modern-index').replaceChildren(...modern.slice(0,query?100:8).map(row));$('ancient-index').replaceChildren(...ancient.slice(0,query?100:6).map(row));if($('current-preview'))$('current-preview').replaceChildren(...current.slice(0,query?100:4).map(row));
      $('search-status').textContent=query?`${modern.length} documented · ${ancient.length} ancient · ${current.length} current matches`:`A selection from ${records.filter(r=>r.collection==='modern').length} documented files`;$('ancient-search-status').textContent=query?`${ancient.length} ancient files match`:'The first six files. Continue into the full collection.';
      if(!modern.length){const p=document.createElement('p');p.className='empty-state';p.textContent='No documented files match. Ancient and current matches appear below.';$('modern-index').append(p);}
    }
    $('archive-search').addEventListener('input',renderHome);document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));renderHome();}));renderHome();
  }
  const scenes=[
    {id:'mkultra',title:'They drugged people who never agreed to an experiment.',description:'Project MKULTRA. The CIA’s covert experiments on human behaviour.',image:'/assets/mkultra-hearing.jpg',alt:'Cover of the 1977 US Senate hearing on Project MKULTRA'},
    {id:'northwoods',title:'The attack that would justify a war was in the proposal.',description:'Operation Northwoods. An authentic plan, never carried out.',image:'/assets/northwoods-memo.jpg',alt:'First page of the original 1962 Northwoods memorandum'},
    {id:'nsa',title:'Who you called. When. How long. Collected at scale.',description:'The NSA’s bulk telephone-records programme. Metadata, not conversations.',image:'/assets/nsa-report.jpg',alt:'Cover of the official 2014 telephone-records report'}
  ];
  let activeScene=0,storiesPaused=false,heroVisible=true;const scenePause=$('scene-pause');
  function showScene(index){activeScene=index;const scene=scenes[index],record=records.find(r=>r.id===scene.id);$('scene-number').textContent=String(index+1).padStart(2,'0');$('scene-year').textContent=record.year;$('scene-status').textContent=record.status.toUpperCase();$('scene-title').textContent=scene.title;$('scene-description').textContent=scene.description;const img=$('evidence-visual').querySelector('img');img.src=scene.image;img.alt=scene.alt;document.querySelectorAll('[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.scene)===index)));}
  function updateStories(){if(!scenePause)return;scenePause.disabled=!motion;scenePause.setAttribute('aria-pressed',String(storiesPaused));scenePause.textContent=!motion?'Stories paused':storiesPaused?'Play stories':'Pause stories';}
  if(scenePause){document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{showScene(Number(button.dataset.scene));storiesPaused=true;updateStories();}));$('scene-open').addEventListener('click',()=>location.assign(fileUrl(scenes[activeScene].id)));scenePause.addEventListener('click',()=>{storiesPaused=!storiesPaused;updateStories();});setInterval(()=>{if(motion&&!storiesPaused&&heroVisible&&!document.hidden)showScene((activeScene+1)%scenes.length);},9000);}
  const canvas=$('matrix-rain');const ctx=canvas?.getContext('2d');const glyphs='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ0123456789';let streams=[],width=0,height=0,raf=0,lastFrame=0;
  function drawRain(delta){if(!ctx)return;ctx.clearRect(0,0,width,height);ctx.font='13px "IBM Plex Mono",monospace';streams.forEach(s=>{s.y+=s.speed*delta;if(s.y-s.length*18>height)s.y=-Math.random()*400;for(let i=0;i<s.length;i++){const y=s.y-i*18;if(y< -18||y>height+18)continue;const alpha=Math.pow(1-i/s.length,1.7)*s.brightness;ctx.fillStyle=i===0?`rgba(207,255,220,${alpha})`:`rgba(92,235,129,${alpha*.88})`;if(delta&&Math.random()<.004)s.characters[i]=glyphs[Math.floor(Math.random()*glyphs.length)];ctx.fillText(s.characters[i],s.x,y);}});}
  function setupRain(){const box=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.8);width=box.width;height=box.height;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);const gap=width<620?25:22;streams=Array.from({length:Math.ceil(width/gap)},(_,i)=>({x:i*gap,y:Math.random()*(height+450)-250,speed:62+Math.random()*69,length:18+Math.floor(Math.random()*23),brightness:.5+Math.random()*.5,characters:Array.from({length:42},()=>glyphs[Math.floor(Math.random()*glyphs.length)])}));drawRain(0);}
  function frame(time){raf=0;if(!motion||!heroVisible||document.hidden)return;if(!lastFrame||time-lastFrame>=45){drawRain(lastFrame?Math.min((time-lastFrame)/1000,.1):0);lastFrame=time;}raf=requestAnimationFrame(frame);}
  function startRain(){if(ctx&&!raf&&motion&&heroVisible&&!document.hidden){lastFrame=0;raf=requestAnimationFrame(frame);}}function stopRain(){cancelAnimationFrame(raf);raf=0;lastFrame=0;}
  function updateMotion(){document.documentElement.classList.toggle('motion-paused',!motion);const button=$('motion-toggle');if(button){button.setAttribute('aria-pressed',String(motion));button.setAttribute('aria-label',motion?'Pause animated effects':'Enable animated effects');button.querySelector('span').textContent=motion?'on':'off';}updateStories();if(motion)startRain();else stopRain();}
  $('motion-toggle')?.addEventListener('click',()=>{motion=!motion;storage.set('record-motion',motion?'on':'off');updateMotion();});media.addEventListener('change',event=>{if(storage.get('record-motion')==null){motion=!event.matches;updateMotion();}});
  if(ctx){new ResizeObserver(setupRain).observe(canvas);new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)startRain();else stopRain();},{threshold:0}).observe(document.querySelector('.hero'));}
  let audioContext=null,soundEnabled=false;
  $('sound-toggle')?.addEventListener('click',async()=>{try{if(!audioContext){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Unavailable');audioContext=new Audio();const gain=audioContext.createGain();gain.gain.value=.025;gain.connect(audioContext.destination);[55,82.41,110.1].forEach(f=>{const oscillator=audioContext.createOscillator();oscillator.type='sine';oscillator.frequency.value=f;oscillator.connect(gain);oscillator.start();});}soundEnabled=!soundEnabled;if(soundEnabled)await audioContext.resume();else await audioContext.suspend();const button=$('sound-toggle');button.setAttribute('aria-pressed',String(soundEnabled));button.setAttribute('aria-label',soundEnabled?'Mute ambient sound':'Enable ambient sound');button.querySelector('span').textContent=soundEnabled?'on':'off';}catch{$('sound-toggle').querySelector('span').textContent='unavailable';$('sound-toggle').disabled=true;}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRain();audioContext?.suspend();}else{startRain();if(soundEnabled)audioContext?.resume();}});
  const caseLinks=[...document.querySelectorAll('.case-nav nav a')];
  if(caseLinks.length){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)caseLinks.forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}),{rootMargin:'-10% 0px -60% 0px'});caseLinks.forEach(link=>{const section=document.querySelector(link.hash);if(section)observer.observe(section);});}
  updateMotion();
})();
