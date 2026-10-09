(() => {
  'use strict';
  const cases=window.UAP_CASES||[];
  const byId=new Map(cases.map(item=>[item.id,item]));
  const selected=document.getElementById('uap-selected');
  const cards=[...document.querySelectorAll('[data-uap-card]')];
  let current=cases.find(item=>item.id==='uap-flir')?.id||cases[0]?.id;
  let filter='all';
  function select(id,{focus=false,updateUrl=true}={}) {
    const item=byId.get(id),template=document.querySelector(`template[data-uap-panel="${id}"]`);
    if(!item||!template||!selected)return;
    selected.querySelector('video')?.pause();
    selected.replaceChildren(template.content.cloneNode(true));
    current=id;
    document.querySelectorAll('[data-uap-select]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.uapSelect===id)));
    window.UAP_GLOBE?.focus(id);
    if(updateUrl){const address=new URL(location.href);address.searchParams.set('case',id);history.replaceState(null,'',address.pathname+address.search+address.hash);}
    if(focus){const title=selected.querySelector('h2');title.setAttribute('tabindex','-1');title.focus({preventScroll:false});}
  }
  function applyFilter() {
    const query=(document.getElementById('uap-search')?.value||'').trim().toLowerCase();
    const visible=[];
    cards.forEach(card=>{const item=byId.get(card.dataset.uapCard);const text=[item.title,item.hook,item.summary,item.region,item.status,...item.sources.map(s=>s.label)].join(' ').toLowerCase();
      const show=(!query||text.includes(query))&&(filter==='all'||filter===item.statusKey||(filter==='britain'&&item.regionGroup==='britain')||(filter==='video'&&item.videoUrl));
      card.hidden=!show;if(show)visible.push(item.id);
    });
    window.UAP_GLOBE?.setVisible(visible);
    document.getElementById('uap-filter-status').textContent=`${visible.length} of ${cases.length} observations`;
    document.getElementById('uap-empty').hidden=visible.length>0;
    if(visible.length&&!visible.includes(current))select(visible[0],{updateUrl:false});
  }
  if(selected){
    document.addEventListener('uap-select',event=>{if(byId.has(event.detail?.id))select(event.detail.id);});
    document.getElementById('uap-search').addEventListener('input',applyFilter);
    document.querySelectorAll('[data-uap-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.uapFilter;document.querySelectorAll('[data-uap-filter]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));applyFilter();}));
    const requested=new URL(location.href).searchParams.get('case');
    select(byId.has(requested)?requested:current,{updateUrl:false});
    applyFilter();
  }
  document.addEventListener('click',async event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.uapSelect){select(target.dataset.uapSelect,{focus:true});return;}
    if(target.dataset.uapShare){try{await navigator.clipboard.writeText(`${location.origin}/ufo.html?case=${encodeURIComponent(target.dataset.uapShare)}`);target.textContent='Observation link copied ✓';}catch{target.textContent='Copy the address from your browser';}return;}
    if(!target.dataset.uapVideo)return;
    const container=target.closest('figure').querySelector('[data-uap-player]');
    const status=container.closest('figure').querySelector('[data-media-status]');
    let media;
    if(target.dataset.videoType==='iframe'||target.dataset.videoType==='youtube'){
      media=document.createElement('iframe');media.src=target.dataset.uapVideo;media.title=`Official footage: ${target.dataset.videoTitle}`;media.allow='fullscreen; picture-in-picture';media.setAttribute('allowfullscreen','');media.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
      media.addEventListener('load',()=>{status.textContent='Official embedded player connected. Use its controls to begin.';});
    }else{
      media=document.createElement('video');media.controls=true;media.playsInline=true;media.preload='metadata';media.setAttribute('aria-label',`Official footage: ${target.dataset.videoTitle}`);media.src=target.dataset.uapVideo;
      media.addEventListener('error',()=>{status.textContent='The original host did not load this clip. Use the official player & record link below.';});
      media.addEventListener('loadedmetadata',()=>{status.textContent='Official footage loaded. Use the player controls to begin.';});
    }
    container.querySelector('video')?.pause();container.replaceChildren(media);status.textContent='Connecting to the original media host…';
  });
  window.addEventListener('popstate',()=>{const id=new URL(location.href).searchParams.get('case');if(byId.has(id))select(id,{updateUrl:false});});
})();
