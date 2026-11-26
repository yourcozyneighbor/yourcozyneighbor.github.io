// Open every link that leaves this site in a new tab.
document.querySelectorAll('a[href^="http"]').forEach(function (a) {
  if (a.host !== location.host) {
    a.target = '_blank';
    var rel = (a.rel || '').split(' ').filter(Boolean);
    if (rel.indexOf('noopener') < 0) rel.push('noopener');
    a.rel = rel.join(' ');
  }
});

// Homepage Quick Shop slider: rotates every 4.5s, pauses on hover/focus, dots to jump.
document.querySelectorAll('.slider').forEach(function (box) {
  var slides = [].slice.call(box.querySelectorAll('.slide'));
  var dots = [].slice.call(box.querySelectorAll('.dot'));
  var credit = box.parentElement.querySelector('.slider-credit a');
  if (slides.length < 2) return;
  var i = 0, timer = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === i;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      s.tabIndex = on ? 0 : -1;
    });
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    if (credit) {
      credit.textContent = slides[i].dataset.creditName;
      credit.href = 'https://unsplash.com/@' + slides[i].dataset.creditUser + '?utm_source=your_cozy_neighbor&utm_medium=referral';
    }
  }
  function start() { if (!reduce) { stop(); timer = setInterval(function () { show(i + 1); }, 4500); } }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); start(); }); });
  // Manual scrolling: arrows, swipe/drag, trackpad side-scroll, keyboard.
  var prev = box.querySelector('.slide-nav.prev'), next = box.querySelector('.slide-nav.next');
  if (prev) prev.addEventListener('click', function () { show(i - 1); start(); });
  if (next) next.addEventListener('click', function () { show(i + 1); start(); });
  var x0 = null, y0 = 0, moved = false;
  box.addEventListener('pointerdown', function (e) { if (e.target.closest('.slide-nav,.dot')) return; x0 = e.clientX; y0 = e.clientY; moved = false; });
  box.addEventListener('pointermove', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 10) moved = true; });
  box.addEventListener('pointerup', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { show(dx < 0 ? i + 1 : i - 1); start(); }
  });
  box.addEventListener('dragstart', function (e) { e.preventDefault(); });
  box.addEventListener('pointercancel', function () { x0 = null; });
  // Stop the slide's link from opening after a swipe.
  box.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  var wheelLock = false;
  box.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) < 25 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (wheelLock) return; wheelLock = true; setTimeout(function () { wheelLock = false; }, 600);
    show(e.deltaX > 0 ? i + 1 : i - 1); start();
  }, { passive: false });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { show(i + 1); start(); slides[i].focus(); }
    if (e.key === 'ArrowLeft') { show(i - 1); start(); slides[i].focus(); }
  });
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  box.addEventListener('focusin', stop);
  box.addEventListener('focusout', start);
  show(0); start();
});
