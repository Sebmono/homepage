/*
  Light / Dark / System.

  The choice lives in localStorage under "sm-theme" and is applied as
  data-theme="light" or data-theme="dark" on <html>. System means no attribute
  at all, so the stylesheet's prefers-color-scheme rules take over.

  The attribute is set by a tiny inline script in <head> before first paint;
  this file only wires up the control, which stays hidden without JavaScript.
*/
(function () {
  'use strict';

  var STORE = 'sm-theme';
  var group = document.getElementById('themes');
  if (!group) return;

  var buttons = group.querySelectorAll('[data-theme-set]');

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

    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-theme-set') === choice;
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (event) {
      apply(event.currentTarget.getAttribute('data-theme-set'));
    });
  }

  apply(stored() || 'system');
  group.hidden = false;
})();
