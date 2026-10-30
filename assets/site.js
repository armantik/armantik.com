/* armantik.com site script: builds the lists from content.js, handles hidden sections and copy buttons.
   You should not need to edit this file to add content. Edit content.js instead. */
(function () {
  var SITE = window.SITE || { show: {}, links: {}, groups: [], lab: [], writing: [], talks: [] };
  var root = document.body.getAttribute('data-root') || '';
  var preview = false;
  try { preview = new URLSearchParams(location.search).has('preview'); } catch (e) {}

  var GROUPS = (SITE.groups && SITE.groups.length) ? SITE.groups : [
    { id: 'system-design', title: 'System design', summary: '' },
    { id: 'algorithms', title: 'Algorithms', summary: '' },
    { id: 'java', title: 'Java', summary: '' }
  ];
  var GROUP_TITLE = {};
  GROUPS.forEach(function (g) { GROUP_TITLE[g.id] = g.title; });
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isExternal(href) { return /^https?:\/\//.test(href || ''); }
  function url(href) { return isExternal(href) ? href : root + href; }
  function target(href) { return isExternal(href) ? ' target="_blank" rel="noopener"' : ''; }
  function visible(item) { return !item.hidden || preview; }
  function hiddenTag(item) { return item.hidden ? '<span class="tag flag">hidden</span>' : ''; }
  function fmtDate(d) {
    if (!d) return '';
    var p = String(d).split('-');
    if (p.length === 1) return p[0];
    var m = MONTHS[parseInt(p[1], 10) - 1] || '';
    return p.length === 3 ? parseInt(p[2], 10) + ' ' + m + ' ' + p[0] : m + ' ' + p[0];
  }
  function byDateDesc(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); }

  /* ---- section switches: <section data-show="writing"> and nav links with data-show ---- */
  document.querySelectorAll('[data-show]').forEach(function (el) {
    var key = el.getAttribute('data-show');
    var on = SITE.show && SITE.show[key];
    if (!on && !preview) { el.hidden = true; }
    else if (!on && preview) { var b = el.querySelector('.sec-label'); if (b) b.insertAdjacentHTML('beforeend', ' <span class="tag flag">hidden</span>'); }
  });

  /* ---- the opposite: <p data-show-off="writing"> only appears while that switch is off ---- */
  document.querySelectorAll('[data-show-off]').forEach(function (el) {
    var on = SITE.show && SITE.show[el.getAttribute('data-show-off')];
    if (on || preview) el.hidden = true;
  });

  /* ---- links: <a data-link="github"> hides itself when the value is empty ---- */
  document.querySelectorAll('[data-link]').forEach(function (el) {
    var v = SITE.links && SITE.links[el.getAttribute('data-link')];
    if (!v) { el.hidden = true; return; }
    if (el.tagName === 'A') el.href = v;
  });

  /* ---- lab tiles ---- */
  function problemLinks(item) {
    if (!item.problems || !item.problems.length) return '';
    return '<span class="probs">' + item.problems.map(function (p) {
      return '<a href="' + esc(p.href) + '" target="_blank" rel="noopener">' + esc(p.site) + (p.label ? ' ' + esc(p.label) : '') + ' ↗</a>';
    }).join('') + '</span>';
  }
  function tile(item) {
    var tags = (item.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
    var inner = '<a class="tile' + (item.hidden ? ' is-hidden-item' : '') + '" href="' + esc(url(item.href)) + '"' + target(item.href) + '>' +
      '<span class="tile-group">' + esc(GROUP_TITLE[item.group] || item.group) + '</span>' +
      '<span class="tile-title">' + esc(item.title) + '</span>' +
      '<span class="tile-sum">' + esc(item.summary) + '</span>' +
      '<span class="tags">' + tags + hiddenTag(item) + '</span></a>';
    var probs = problemLinks(item);
    return probs ? '<div class="tile-wrap">' + inner + probs + '</div>' : inner;
  }
  function itemsIn(groupId) {
    return (SITE.lab || []).filter(function (i) { return i.group === groupId && visible(i); });
  }
  document.querySelectorAll('[data-lab]').forEach(function (el) {
    var mode = el.getAttribute('data-lab');
    if (mode === 'categories') {
      /* home page: one card per category */
      el.innerHTML = GROUPS.map(function (g) {
        var list = itemsIn(g.id);
        if (!list.length) return '';
        var shown = list.slice(0, 5).map(function (i) { return '<li>' + esc(i.title) + '</li>'; }).join('');
        var more = list.length > 5 ? '<li>and ' + (list.length - 5) + ' more</li>' : '';
        return '<a class="cat-card" href="' + esc(root + 'lab/index.html#' + g.id) + '">' +
          '<span class="cat-count">' + list.length + (list.length === 1 ? ' guide' : ' guides') + '</span>' +
          '<span class="cat-title">' + esc(g.title) + '</span>' +
          '<span class="cat-sum">' + esc(g.summary) + '</span>' +
          '<ul class="cat-list">' + shown + more + '</ul>' +
          '<span class="cat-more">Open ' + esc(/^(Java|Go|AI)\b/.test(g.title) ? g.title : g.title.toLowerCase()) + ' →</span></a>';
      }).join('');
    } else {
      /* lab page: every guide, grouped */
      el.innerHTML = GROUPS.map(function (g) {
        var list = itemsIn(g.id);
        if (!list.length) return '';
        return '<section class="sec" id="' + esc(g.id) + '"><p class="sec-label">/lab/' + esc(g.id) + '</p><div class="sec-body">' +
          '<h2>' + esc(g.title) + '</h2>' + (g.summary ? '<p class="intro">' + esc(g.summary) + '</p>' : '') +
          '<div class="tiles">' + list.map(tile).join('') + '</div></div></section>';
      }).join('');
      if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    }
  });
  document.querySelectorAll('[data-lab-count]').forEach(function (el) {
    el.textContent = (SITE.lab || []).filter(function (i) { return !i.hidden; }).length;
  });

  /* ---- writing and talks rows ---- */
  /* writing rows show no date (the date in content.js only decides the order) */
  function writingRow(item) {
    var src = item.source || '';
    return '<li class="row nodate' + (item.hidden ? ' is-hidden-item' : '') + '">' +
      '<span class="what"><span class="title"><a href="' + esc(url(item.href)) + '"' + target(item.href) + '>' + esc(item.title) + '</a></span>' +
      (item.summary ? '<span class="note">' + esc(item.summary) + '</span>' : '') +
      '<span class="src"><a href="' + esc(url(item.href)) + '"' + target(item.href) + '>' + (src ? 'Read on ' + esc(src) : 'Read') +
      (isExternal(item.href) ? ' ↗' : ' →') + '</a> ' + hiddenTag(item) + '</span></span></li>';
  }
  /* talks keep their date */
  function talkRow(item) {
    return '<li class="row' + (item.hidden ? ' is-hidden-item' : '') + '">' +
      '<span class="when">' + esc(fmtDate(item.date)) + '</span>' +
      '<span class="what"><span class="title"><a href="' + esc(url(item.href)) + '"' + target(item.href) + '>' + esc(item.title) + '</a></span>' +
      (item.summary ? '<span class="note">' + esc(item.summary) + '</span>' : '') +
      '<span class="src">' + esc(item.event || '') + ' ' + hiddenTag(item) + '</span></span></li>';
  }
  function fillRows(attr, list, rowFn) {
    document.querySelectorAll('[' + attr + ']').forEach(function (el) {
      var limit = parseInt(el.getAttribute(attr), 10) || 0;
      var items = (list || []).filter(visible).sort(byDateDesc);
      if (limit) items = items.slice(0, limit);
      el.innerHTML = items.length ? items.map(rowFn).join('') :
        '<li class="row nodate"><span class="what"><span class="note">Nothing here yet.</span></span></li>';
    });
  }
  fillRows('data-writing', SITE.writing, writingRow);
  fillRows('data-talks', SITE.talks, talkRow);

  /* ---- services: <div data-services> gets one card per entry in SITE.services ---- */
  document.querySelectorAll('[data-services]').forEach(function (el) {
    el.innerHTML = (SITE.services || []).filter(visible).map(function (s) {
      return '<article class="svc' + (s.hidden ? ' is-hidden-item' : '') + '"><h3>' + esc(s.title) + hiddenTag(s) + '</h3>' +
        '<p>' + esc(s.summary) + '</p>' +
        (s.points && s.points.length ? '<ul>' + s.points.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        '</article>';
    }).join('');
  });

  /* ---- contact: <ul data-service-topics> lists the service titles ---- */
  document.querySelectorAll('[data-service-topics]').forEach(function (el) {
    el.innerHTML = (SITE.services || []).filter(function (x) { return !x.hidden; }).map(function (x) {
      return '<li><a href="#services">' + esc(x.title) + '</a></li>';
    }).join('');
  });

  /* ---- contact details are never in the page as text ----
     The email (links.emailBytes in content.js) and the phone number (on the card page) are stored as
     scrambled bytes: reversed, then XOR'ed with KEY. Pages only put them together after a person
     interacts, so bots that read the source, or run the page without touching it, find nothing.
     window.AA.unscramble(bytes) decodes; window.AA.email() returns the address once revealed. */
  var KEY = [133, 28, 142, 76, 200];
  function unscramble(bytes) {
    return (bytes || []).slice().reverse().map(function (c, i) { return String.fromCharCode(c ^ KEY[i % KEY.length]); }).join('');
  }
  var EMAIL_BYTES = (SITE.links && SITE.links.emailBytes) || [];
  var EMAIL = '';
  function email() { if (!EMAIL && EMAIL_BYTES.length) EMAIL = unscramble(EMAIL_BYTES); return EMAIL; }
  window.AA = { unscramble: unscramble, email: email };

  /* <span data-email>Show email</span> becomes name[at]domain after the first interaction (or a tap on it).
     <a data-email-link> becomes a mail link when tapped. <button data-copy-email> copies the address. */
  var emailShown = false;
  var WAKE = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel', 'mousemove', 'focusin'];
  function showEmail() {
    if (emailShown) return;
    emailShown = true;
    WAKE.forEach(function (e) { window.removeEventListener(e, showEmail, true); });
    var addr = email();
    document.querySelectorAll('[data-email]').forEach(function (el) {
      var span = document.createElement('span');
      span.className = 'email';
      span.textContent = addr.replace('@', '[at]');
      el.replaceWith(span);
    });
    document.querySelectorAll('[data-copy-email]').forEach(function (btn) { btn.setAttribute('data-copy', addr); });
  }
  if (EMAIL_BYTES.length) {
    WAKE.forEach(function (e) { window.addEventListener(e, showEmail, { capture: true, passive: true }); });
    document.querySelectorAll('[data-email]').forEach(function (el) { el.addEventListener('click', showEmail); });
  } else {
    document.querySelectorAll('[data-email], [data-copy-email]').forEach(function (el) { el.hidden = true; });
  }
  document.querySelectorAll('[data-email-link]').forEach(function (el) {
    if (!EMAIL_BYTES.length) { el.hidden = true; return; }
    el.addEventListener('click', function () { el.href = 'mailto:' + email(); });
  });
  document.querySelectorAll('[data-copy-email]').forEach(function (btn) {
    btn.addEventListener('click', showEmail, true);
    btn.setAttribute('data-copy', '');
  });

  /* ---- copy buttons: <button data-copy="text"> ---- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { var old = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = old; }, 1600); };
      var fallback = function () {
        var sel = document.querySelector(btn.getAttribute('data-copy-select') || '.email');
        if (!sel) return;
        var r = document.createRange(); r.selectNodeContents(sel);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = 'Press Ctrl+C';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });

  /* ---- footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
