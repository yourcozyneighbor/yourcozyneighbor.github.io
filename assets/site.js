// Open every link that leaves this site in a new tab.
document.querySelectorAll('a[href^="http"]').forEach(function (a) {
  if (a.host !== location.host) {
    a.target = '_blank';
    var rel = (a.rel || '').split(' ').filter(Boolean);
    if (rel.indexOf('noopener') < 0) rel.push('noopener');
    a.rel = rel.join(' ');
  }
});
