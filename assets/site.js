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

/* Quick Shops pagination: N cards per page with numbered pages */
document.querySelectorAll('.cards[data-per-page]').forEach(function (grid) {
  var per = parseInt(grid.getAttribute('data-per-page'), 10) || 4;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var pages = Math.ceil(cards.length / per);
  if (pages < 2) return;
  var nav = document.createElement('nav');
  nav.className = 'pager';
  nav.setAttribute('aria-label', 'Quick Shops pages');
  grid.parentNode.insertBefore(nav, grid.nextSibling);
  var cur = 0;
  function btn(label, aria, cls) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    if (aria) b.setAttribute('aria-label', aria);
    if (cls) b.className = cls;
    return b;
  }
  function go(p, scroll) {
    cur = Math.max(0, Math.min(pages - 1, p));
    cards.forEach(function (c, i) { c.hidden = Math.floor(i / per) !== cur; });
    nav.innerHTML = '';
    var prev = btn('‹ Previous', 'Previous page', 'pg-step');
    prev.disabled = cur === 0;
    prev.addEventListener('click', function () { go(cur - 1, true); });
    nav.appendChild(prev);
    for (var i = 0; i < pages; i++) {
      (function (i) {
        var b = btn(String(i + 1), 'Page ' + (i + 1));
        if (i === cur) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', function () { if (i !== cur) go(i, true); });
        nav.appendChild(b);
      })(i);
    }
    var next = btn('Next ›', 'Next page', 'pg-step');
    next.disabled = cur === pages - 1;
    next.addEventListener('click', function () { go(cur + 1, true); });
    nav.appendChild(next);
    if (scroll) {
      var h = document.getElementById('quick-shops') || grid;
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  go(0, false);
});

/* Site search: live results for every Quick Shop and pick (index in /assets/search-index.js). */
(function () {
  var data = window.YCN_SEARCH || [];
  document.querySelectorAll('form.site-search').forEach(function (form) {
    var input = form.querySelector('input[type="search"]');
    var list = form.querySelector('.search-results');
    var active = -1, shown = [];
    function norm(s) { return s.toLowerCase().replace(/[^a-z0-9$\- ]+/g, ' ').trim(); }
    function stem(w) { return w.length > 3 ? w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '') : w; }
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function search(q) {
      var words = norm(q).split(/\s+/).filter(Boolean).map(stem);
      if (!words.length) return [];
      var out = [];
      data.forEach(function (it) {
        var score = 0, name = it.n.toLowerCase();
        for (var j = 0; j < words.length; j++) {
          if (it.k.indexOf(words[j]) < 0) return;
          score += name.indexOf(words[j]) >= 0 ? 3 : 1;
        }
        if (it.t === 's') score += 1;
        out.push({ it: it, score: score });
      });
      out.sort(function (a, b) { return b.score - a.score; });
      return out.slice(0, 8).map(function (o) { return o.it; });
    }
    function render() {
      var q = input.value.trim();
      shown = search(q); active = -1;
      if (!q) { list.hidden = true; list.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); return; }
      if (!shown.length) {
        list.innerHTML = '<li class="sr-empty">No picks match "' + esc(q) + '". Try "mugs", "candles" or "storage".</li>';
      } else {
        list.innerHTML = shown.map(function (it, k) {
          var thumb = it.i ? '<img src="' + it.i + '" alt="" width="44" height="44" loading="lazy">' : '<span class="sr-dot" aria-hidden="true"></span>';
          var meta = it.t === 's' ? 'Quick Shop · ' + esc(it.s) : 'In ' + esc(it.s);
          return '<li role="option" id="' + form.id + '-o' + k + '"><a href="' + it.u + '">' + thumb +
            '<span><b>' + esc(it.n) + '</b><small>' + meta + '</small></span></a></li>';
        }).join('');
      }
      list.hidden = false; input.setAttribute('aria-expanded', 'true');
    }
    function move(d) {
      var opts = list.querySelectorAll('li[role="option"]');
      if (!opts.length) return;
      active = (active + d + opts.length) % opts.length;
      opts.forEach(function (o, k) { o.classList.toggle('is-active', k === active); });
      input.setAttribute('aria-activedescendant', opts[active].id);
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', function () { if (input.value.trim()) render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Escape') { list.hidden = true; input.blur(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pick = shown[active >= 0 ? active : 0];
      if (pick) location.href = pick.u; else render();
    });
    document.addEventListener('click', function (e) { if (!form.contains(e.target)) list.hidden = true; });
    var q0 = new URLSearchParams(location.search).get('q');
    if (q0) { input.value = q0; render(); }
  });
})();
