(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const $all = selector => [...document.querySelectorAll(selector)];
  const animations = new Set();
  const pending = new Set();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-seen');
      pending.delete(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' }) : null;

  function watch(element, className, delay = 0) {
    element.classList.add(className);
    if (delay) element.style.setProperty('--enter-delay', `${delay}ms`);
    if (!observer || reduced.matches) element.classList.add('motion-seen');
    else { pending.add(element); observer.observe(element); }
  }

  // Keep the text nodes in reading order, including the original line breaks.
  $all('.section-heading h2, .contact h2, .hero h1').forEach(heading => {
    [...heading.childNodes].forEach((node, index) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const line = document.createElement('span');
        line.className = 'motion-line';
        line.textContent = node.textContent;
        line.style.setProperty('--line-delay', `${index * 70}ms`);
        node.replaceWith(line);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
        node.classList.add('motion-line');
        node.style.setProperty('--line-delay', `${index * 70}ms`);
      }
    });
    watch(heading, 'motion-heading');
  });

  const statement = document.querySelector('.hero-statement');
  const spokenStatement = document.createElement('span');
  spokenStatement.className = 'sr-only';
  spokenStatement.textContent = statement.textContent;
  const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  let character = 0;
  textNodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    [...node.textContent].forEach(text => {
      const span = document.createElement('span');
      span.className = 'type-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = text;
      span.style.setProperty('--char-delay', `${140 + character++ * 29}ms`);
      fragment.append(span);
    });
    node.replaceWith(fragment);
  });
  statement.prepend(spokenStatement);
  watch(statement, 'motion-typing');

  // Rolling digits reserve their final width and expose only the actual value to AT.
  $all('.hero-proof strong, .academic-stats strong, .metric-row strong:not(.metric-word), .capability-evidence strong').forEach(strong => {
    const node = [...strong.childNodes].find(child => child.nodeType === Node.TEXT_NODE && /\d/.test(child.textContent));
    if (!node) return;
    const match = node.textContent.match(/^(\s*)([\d.,]+)(.*)$/);
    if (!match) return;
    const fragment = document.createDocumentFragment();
    const accessible = document.createElement('span');
    accessible.className = 'sr-only';
    accessible.textContent = match[2];
    const number = document.createElement('span');
    number.className = 'rolling-number';
    number.setAttribute('aria-hidden', 'true');
    [...match[2]].forEach((digit, index) => {
      if (!/\d/.test(digit)) { number.append(digit); return; }
      const cell = document.createElement('span');
      cell.className = 'rolling-digit';
      const track = document.createElement('span');
      track.className = 'rolling-track';
      track.style.setProperty('--digit-delay', `${index * 65}ms`);
      [(Number(digit) + 8) % 10, (Number(digit) + 9) % 10, digit].forEach(value => {
        const row = document.createElement('span');
        row.textContent = value;
        track.append(row);
      });
      cell.append(track);
      number.append(cell);
    });
    fragment.append(match[1], accessible, number, match[3]);
    node.replaceWith(fragment);
    watch(strong, 'motion-counter');
  });

  $all('.hero-copy>.eyebrow, .hero-school, .hero-actions, .portrait, .section-heading>.eyebrow, .wide-heading>p, .school-heading, .academic-stats, .courses, .project, .experience, .campus-item, .contact-info, .skill-line').forEach(element => watch(element, 'motion-enter'));
  ['.honor-shortcuts', '.honors ul'].forEach(selector => {
    $all(selector).forEach(group => [...group.children].forEach((child, index) => watch(child, 'motion-enter', index * 65)));
  });
  $all('.section').forEach(section => watch(section, 'motion-divider'));
  if (!reduced.matches) root.classList.add('motion-ready');

  function animate(element, keyframes, options) {
    if (reduced.matches || !element.animate) return null;
    const animation = element.animate(keyframes, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation;
  }

  // One underline glides between tabs instead of disappearing and reappearing.
  const tabBar = document.querySelector('.capability-tabs');
  const tabInk = document.createElement('span');
  tabInk.className = 'tab-ink';
  tabInk.setAttribute('aria-hidden', 'true');
  tabBar.append(tabInk);
  tabBar.classList.add('tabs-motion');
  const nav = document.querySelector('.nav');
  const navInk = document.createElement('span');
  navInk.className = 'nav-ink';
  navInk.setAttribute('aria-hidden', 'true');
  nav.append(navInk);
  nav.classList.add('nav-motion');
  function positionInk(ink, target) {
    ink.style.opacity = target ? '1' : '0';
    if (!target) return;
    ink.style.width = `${target.offsetWidth}px`;
    ink.style.transform = `translateX(${target.offsetLeft}px)`;
  }
  const updateTabInk = () => positionInk(tabInk, tabBar.querySelector('[aria-selected="true"]'));
  const updateNavInk = () => positionInk(navInk, nav.querySelector('[aria-current]'));
  new MutationObserver(updateNavInk).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  nav.addEventListener('pointerover', event => {
    const link = event.target.closest('a');
    if (link && finePointer.matches) positionInk(navInk, link);
  });
  nav.addEventListener('pointerleave', updateNavInk);
  nav.addEventListener('focusin', event => { if (event.target.matches('a')) positionInk(navInk, event.target); });
  nav.addEventListener('focusout', updateNavInk);
  if ('ResizeObserver' in window) new ResizeObserver(() => { updateTabInk(); updateNavInk(); }).observe(document.querySelector('.site-header'));
  addEventListener('resize', updateTabInk, { passive: true });
  updateTabInk(); updateNavInk();

  document.addEventListener('portfolio:tab', event => {
    updateTabInk();
    const panel = document.getElementById(event.detail.getAttribute('aria-controls'));
    panel.classList.remove('motion-panel');
    if (reduced.matches) return;
    panel.querySelectorAll('.capability-intro, .capability-evidence a').forEach((child, index) => child.style.setProperty('--panel-delay', `${index * 65}ms`));
    requestAnimationFrame(() => { if (!panel.hidden) panel.classList.add('motion-panel'); });
  });
  document.addEventListener('portfolio:filter', () => {
    let index = 0;
    $all('.archive-item').forEach(item => {
      item.classList.remove('motion-filter-item');
      if (item.hidden || reduced.matches) return;
      item.style.setProperty('--filter-delay', `${index++ * 35}ms`);
      requestAnimationFrame(() => { if (!item.hidden) item.classList.add('motion-filter-item'); });
    });
  });

  // Native details remain semantic and keyboard-operable, including rapid reversals.
  const detailStates = new Map();
  $all('details').forEach(details => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.details-body');
    if (!summary || !body) return;
    details.classList.add('motion-details');
    const state = { animation: null, open: details.open };
    detailStates.set(details, state);
    const finish = () => {
      details.open = state.open;
      details.style.height = '';
      state.animation = null;
    };
    summary.addEventListener('click', event => {
      if (reduced.matches || !details.animate || event.target.closest('a')) return;
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      state.open = state.animation ? !state.open : !details.open;
      if (state.animation) { state.animation.onfinish = null; state.animation.cancel(); }
      const styles = getComputedStyle(details);
      const closed = summary.offsetHeight + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom) + parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
      details.open = true;
      details.style.height = '';
      const end = state.open ? details.getBoundingClientRect().height : closed;
      details.style.height = `${start}px`;
      state.animation = animate(details, [{ height: `${start}px` }, { height: `${end}px` }], { duration: Math.min(500, 230 + Math.abs(end - start) * .22), easing: 'cubic-bezier(.22,1,.36,1)' });
      if (state.animation) state.animation.onfinish = finish;
      else finish();
      if (state.open) animate(body, [{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 330, easing: 'ease-out' });
    });
  });

  // Restrained pointer response is scoped to the project data, not the portrait.
  const pointerTargets = [];
  $all('.project-evidence, .hero-actions .button, .contact-nav').forEach(element => {
    const surface = element.matches('.project-evidence');
    element.classList.add(surface ? 'motion-surface' : 'motion-magnet');
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0;
      element.classList.remove('is-pointed');
      ['--tilt-x', '--tilt-y', '--magnet-x', '--magnet-y'].forEach(key => element.style.removeProperty(key));
    };
    pointerTargets.push(reset);
    element.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        if (surface) {
          element.classList.add('is-pointed');
          element.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
          element.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
          element.style.setProperty('--light-x', `${x * 100}%`);
          element.style.setProperty('--light-y', `${y * 100}%`);
        } else {
          element.style.setProperty('--magnet-x', `${(x - 0.5) * 8}px`);
          element.style.setProperty('--magnet-y', `${(y - 0.5) * 8}px`);
        }
      });
    }, { passive: true });
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
  });

  function settleMotion() {
    root.classList.remove('motion-ready');
    pending.forEach(element => element.classList.add('motion-seen'));
    pending.clear(); observer?.disconnect();
    detailStates.forEach((state, details) => {
      if (!state.animation) return;
      state.animation.onfinish = null;
      state.animation.cancel(); state.animation = null;
      details.open = state.open; details.style.height = '';
    });
    animations.forEach(animation => animation.cancel());
    pointerTargets.forEach(reset => reset());
  }
  reduced.addEventListener('change', () => { if (reduced.matches) settleMotion(); });
  finePointer.addEventListener('change', () => pointerTargets.forEach(reset => reset()));
})();
