/*
  Theme: one button cycling light > dark > system.

  The choice lives in localStorage under "sm-theme" and is applied as
  data-theme="light" or data-theme="dark" on <html>. System means no attribute
  at all, so the stylesheet's prefers-color-scheme rules take over.

  The attribute is set by a tiny inline script in <head> before first paint;
  this file only wires up the control, which stays hidden without JavaScript.
*/
(function () {
  'use strict';

  var STORE = 'sm-theme';
  var ORDER = ['light', 'dark', 'system'];
  var button = document.getElementById('theme');
  if (!button) return;

  function stored() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }

  function apply(choice) {
    if (choice === 'light' || choice === 'dark') {
      document.documentElement.setAttribute('data-theme', choice);
    } else {
      choice = 'system';
      document.documentElement.removeAttribute('data-theme');
    }

    try {
      if (choice === 'system') { localStorage.removeItem(STORE); }
      else { localStorage.setItem(STORE, choice); }
    } catch (e) { /* private mode, ignore */ }

    button.setAttribute('data-theme-state', choice);
    button.setAttribute('aria-label', 'Color theme: ' + choice + '. Click to change.');
    button.setAttribute('title', 'Theme: ' + choice);
  }

  button.addEventListener('click', function () {
    var current = button.getAttribute('data-theme-state');
    var next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    apply(next);
  });

  apply(stored() || 'system');
  button.hidden = false;
})();
