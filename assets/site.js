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
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  box.addEventListener('focusin', stop);
  box.addEventListener('focusout', start);
  show(0); start();
});
