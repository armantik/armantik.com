/* armantik.com theme switch.
   Loaded in <head> on every page (and in every Lab guide) so the saved theme applies before the page paints.
   Dark is the default. Any button with  data-theme-toggle  switches between light and dark,
   and the choice is remembered in this browser. Change DEFAULT to 'light' or 'system' if you ever want another default. */
(function () {
  var KEY = 'aa-theme', DEFAULT = 'dark', root = document.documentElement;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) { if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme'); }
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var MOON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function label() {
    var dark = current() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.innerHTML = (dark ? SUN : MOON) + '<span>' + (dark ? 'Light' : 'Dark') + '</span>';
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  apply(saved() || DEFAULT);
  document.addEventListener('DOMContentLoaded', function () {
    label();
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-theme-toggle]');
      if (!b) return;
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (err) {}
      label();
      /* canvases in some Lab guides redraw on resize, so they pick up the new colors */
      try { window.dispatchEvent(new Event('resize')); } catch (err) {}
    });
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', label);
    }
  });
})();
