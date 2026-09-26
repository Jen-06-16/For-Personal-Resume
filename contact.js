/* Load the local 3D dependency only near the contact section. */
(() => {
  const section = document.getElementById('contact');
  if (!section) return;
  const load = source => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    load('vendor/three-0.184.0.js')
      .then(() => load('contact-balls.js?v=88964328'))
      .catch(() => { document.getElementById('contact-balls').hidden = true; });
  }, {rootMargin: '300px'});
  observer.observe(section);
})();
