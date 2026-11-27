/* Your Cozy Neighbor Shop: Google Analytics 4 + click tracking.
   Set GA_ID to the property's Measurement ID (G-XXXXXXXXXX). Empty = tracking off. */
(function () {
  var GA_ID = '';
  if (!GA_ID) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());

  var slug = location.pathname.split('/').filter(Boolean)[0] || 'home';
  gtag('config', GA_ID, { shop: slug });

  function clean(t) { return (t || '').replace(/\s+/g, ' ').trim().slice(0, 100); }

  // Every Amazon button or link: which shop, which product, where on the page.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.href;
    var isAmazon = /(^|\.)amazon\.|link\.amazon|amzn\.to/.test(a.hostname);
    if (isAmazon) {
      var card = a.closest('article.product, .pick, .card, .prime-box, .sticky');
      var title = card && card.querySelector('h3, h4, strong');
      var placement = !card ? 'inline' : card.matches('.prime-box') ? 'prime' : card.matches('.sticky') ? 'sticky_bar' : card.matches('article.product') ? 'product' : 'other';
      gtag('event', 'amazon_click', {
        shop: slug,
        product: clean(title ? title.textContent : a.textContent),
        product_id: card && card.id ? card.id : '',
        placement: placement,
        link_text: clean(a.textContent),
        link_url: href,
        transport_type: 'beacon'
      });
    } else if (a.hostname && a.hostname !== location.hostname) {
      gtag('event', 'outbound_click', { shop: slug, link_url: href, link_text: clean(a.textContent), transport_type: 'beacon' });
    }
  }, true);

  // Site search: what people look for.
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches && f.matches('form.site-search')) {
      var q = f.querySelector('input[type="search"]');
      if (q && q.value.trim()) gtag('event', 'search', { search_term: clean(q.value), shop: slug });
    }
  }, true);
  document.addEventListener('click', function (e) {
    var r = e.target.closest && e.target.closest('.search-results a');
    if (r) {
      var q = document.querySelector('form.site-search input[type="search"]');
      gtag('event', 'search_result_click', { search_term: clean(q && q.value), result: clean(r.textContent), shop: slug });
    }
  }, true);
})();
