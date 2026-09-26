(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const links = [...document.querySelectorAll('.nav a')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  const progress = document.querySelector('.reading-progress');
  let scheduled = false;
  function updateNavigation() {
    const threshold = document.querySelector('.site-header').getBoundingClientRect().height + 70;
    let active = null;
    for (const section of sections) if (section.getBoundingClientRect().top <= threshold) active = section.id;
    if (document.querySelector('#contact').getBoundingClientRect().top <= threshold) active = null;
    links.forEach(link => {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, scrollY / distance) : 0})`;
    scheduled = false;
  }
  addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  addEventListener('resize', updateNavigation);
  updateNavigation();

  const tabs = [...document.querySelectorAll('.capability-tabs [role="tab"]')];
  function selectTab(selected, focus = false) {
    tabs.forEach(tab => {
      const isSelected = tab === selected;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !isSelected;
    });
    if (focus) selected.focus();
    document.dispatchEvent(new CustomEvent('portfolio:tab', { detail: selected }));
    updateNavigation();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });

  const filters = [...document.querySelectorAll('.archive-filters button')];
  const records = [...document.querySelectorAll('.archive-item')];
  const count = document.querySelector('#archive-count');
  function filterRecords(value) {
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === value)));
    records.forEach(item => {
      item.hidden = !(value === 'all' || (value === 'competition' ? item.dataset.competition === 'true' : item.dataset.category === value));
    });
    const total = records.filter(item => !item.hidden).length;
    count.textContent = `${total} 项${value === 'competition' ? '竞赛' : '经历'}`;
    document.querySelector('#archive-context').hidden = value !== 'competition';
    document.dispatchEvent(new CustomEvent('portfolio:filter'));
    updateNavigation();
  }
  filters.forEach(button => button.addEventListener('click', () => filterRecords(button.dataset.filter)));

  // Evidence links reveal their destination even when a filter hid it.
  function revealTarget(id, animate = true) {
    const target = document.getElementById(id);
    if (!target) return null;
    const record = target.closest('.archive-item');
    if (record?.hidden) filterRecords('all');
    const detail = target.matches('details') ? target : target.querySelector('details');
    if (detail) detail.open = true;
    if (animate && !reducedMotion.matches) {
      target.classList.remove('arrival');
      requestAnimationFrame(() => target.classList.add('arrival'));
    }
    return target;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    if (id === 'home') {
      event.preventDefault();
      history.pushState(null, '', '#home');
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      return;
    }
    if (link.dataset.selectFilter) filterRecords(link.dataset.selectFilter);
    if (/^(project-|exploration-|internship-|honor-)/.test(id)) {
      event.preventDefault();
      revealTarget(id);
      history.pushState(null, '', link.hash);
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      const focusTarget = target.querySelector('summary') || target;
      if (!focusTarget.hasAttribute('tabindex') && !focusTarget.matches('summary')) focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
  });
  function restoreHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id === 'home') { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    if (/^(project-|exploration-|internship-|honor-)/.test(id)) {
      const target = revealTarget(id, false);
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
  }
  addEventListener('hashchange', restoreHash);
  restoreHash();

})();
