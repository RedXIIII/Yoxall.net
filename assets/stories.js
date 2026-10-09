(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('[data-story-card]')];
  if (cards.length) {
    let theme = 'all';
    const search = $('story-search'), status = $('story-filter-status');
    document.querySelector('[data-story-controls]').hidden = false;
    function filterStories() {
      const query = search.value.trim().toLowerCase(); let count = 0;
      cards.forEach(card => { const show = (theme === 'all' || card.dataset.storyTheme === theme) && (!query || card.dataset.storySearch.includes(query)); card.hidden = !show; if (show) count++; });
      status.textContent = count + ' of ' + cards.length + ' stories'; $('story-empty').hidden = count > 0;
    }
    search.addEventListener('input', filterStories);
    document.querySelectorAll('[data-story-filter]').forEach(button => button.addEventListener('click', () => { theme = button.dataset.storyFilter; document.querySelectorAll('[data-story-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); filterStories(); }));
    const assessments = $('story-assessments');
    assessments.addEventListener('click', () => { const open = assessments.getAttribute('aria-pressed') !== 'true'; document.querySelectorAll('.story-card-assessment').forEach(details => { details.open = open; }); assessments.setAttribute('aria-pressed', String(open)); assessments.textContent = open ? 'Hide assessments ↗' : 'Show assessments ↗'; });
    filterStories();
  }
  const evidence = $('evidence');
  if (!evidence) return;
  function revealForHash(hash, focus) {
    let id; try { id = decodeURIComponent((hash || '').replace(/^#/, '')); } catch { return; }
    const target = $(id); if (!target) return;
    if (target === evidence || evidence.contains(target)) {
      evidence.open = true;
      // Use the next task so native fragment navigation can finish first.
      if (focus) setTimeout(() => {
        if (evidence.open) evidence.querySelector('h2').focus({ preventScroll: true });
      }, 0);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => revealForHash(link.hash, link.hash === '#evidence')));
  window.addEventListener('hashchange', () => revealForHash(location.hash, location.hash === '#evidence'));
  revealForHash(location.hash, false);
  const chapterLinks = [...document.querySelectorAll('.story-chapter-nav a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (!entry.isIntersecting) return; chapterLinks.forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); }); }, { rootMargin: '-12% 0px -65% 0px' });
    chapterLinks.forEach(link => { const section = document.querySelector(link.hash); if (section) observer.observe(section); });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  const bar = document.querySelector('.story-progress span'); let frame = 0;
  function progress() { frame = 0; const maximum = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (maximum > 0 ? Math.min(1, Math.max(0, scrollY / maximum)) : 0) + ')'; }
  function queueProgress() { if (!frame) frame = requestAnimationFrame(progress); }
  if (bar) { window.addEventListener('scroll', queueProgress, { passive: true }); window.addEventListener('resize', queueProgress); evidence.addEventListener('toggle', queueProgress); progress(); window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true }); }
})();
