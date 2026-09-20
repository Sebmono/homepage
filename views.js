/*
  Two views of the same page.

  Simple view  the plain stack of sections. This is what the markup renders on its own,
               so the page still works with JavaScript off.
  Fun view     added by putting the class "fun" on <body>. Three big boxes; picking one
               collapses all three into vertical tabs and opens that section between them.

  State lives in two attributes on <body>:
    class="fun"        which view we are in
    data-open="now"    which section is open (absent = the landing state)

  Choice order: ?view= / #hash in the URL, then localStorage, then fun view by default.
  Deep links: ?view=fun&open=elsewhere, ?view=simple, #simple, #fun.
*/
(function () {
  'use strict';

  var KEYS = ['now', 'elsewhere', 'battleforce'];
  var STORE = 'sm-view';

  var body = document.body;
  var pane = document.getElementById('pane');
  var toggle = document.getElementById('view-toggle');
  var boxes = KEYS.map(function (k) { return document.getElementById('box-' + k); });
  var sections = KEYS.map(function (k) { return document.getElementById('sec-' + k); });

  if (!pane || !toggle || boxes.indexOf(null) > -1) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- persistence ------------------------------------------------- */

  function remember(view) {
    try { localStorage.setItem(STORE, view); } catch (e) { /* private mode, ignore */ }
  }

  function remembered() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }

  /* ---- render ------------------------------------------------------ */

  var view = 'fun';
  var open = null;

  function render() {
    var fun = view === 'fun';

    body.classList.toggle('fun', fun);
    if (fun && open) { body.setAttribute('data-open', open); }
    else { body.removeAttribute('data-open'); }

    boxes.forEach(function (box, i) {
      box.hidden = !fun;
      var on = fun && open === KEYS[i];
      box.setAttribute('aria-expanded', on ? 'true' : 'false');
      box.classList.toggle('is-open', on);
    });

    // Simple view shows every section. Fun view shows the open one, or none.
    sections.forEach(function (section, i) {
      section.hidden = fun && open !== KEYS[i];
    });

    toggle.hidden = false;
    toggle.textContent = fun ? 'Simple view' : 'Fun view';
    toggle.href = fun ? '?view=simple' : '?view=fun';

    try {
      var url = new URL(window.location.href);
      url.hash = '';
      url.searchParams.set('view', view);
      if (fun && open) { url.searchParams.set('open', open); }
      else { url.searchParams.delete('open'); }
      history.replaceState(null, '', url.pathname + url.search);
    } catch (e) { /* no history API, ignore */ }
  }

  /* ---- transitions -------------------------------------------------- */

  /*
    Landing <-> open animates on its own: the text pane grows from zero width, so the
    boxes never have to jump past it. Switching straight from one open section to
    another does move boxes across the pane, so that one case gets a FLIP: measure,
    apply the new state, then slide each element back from where it was.
  */
  function setOpen(next) {
    var flip = open && next && open !== next && !reduced.matches;
    var movers = flip ? boxes.concat([pane]) : [];
    var before = movers.map(function (el) { return el.getBoundingClientRect().left; });

    open = next;
    render();

    movers.forEach(function (el, i) {
      var dx = before[i] - el.getBoundingClientRect().left;
      if (!dx) return;
      el.style.transition = 'none';
      el.style.transform = 'translateX(' + dx + 'px)';
      void el.offsetWidth;            // flush, so the next line animates
      el.style.transition = '';
      el.style.transform = '';
    });
  }

  function setView(next) {
    view = next === 'simple' ? 'simple' : 'fun';
    if (view === 'simple') { open = null; }
    remember(view);
    render();
  }

  /* ---- events ------------------------------------------------------- */

  boxes.forEach(function (box, i) {
    box.addEventListener('click', function () {
      setOpen(open === KEYS[i] ? null : KEYS[i]);
    });

    box.addEventListener('keydown', function (event) {
      var step = 0;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { step = 1; }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { step = -1; }
      else { return; }

      event.preventDefault();
      var target = (i + step + KEYS.length) % KEYS.length;
      boxes[target].focus();
      // Once a section is open, arrowing moves the opening with the focus.
      if (open) { setOpen(KEYS[target]); }
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && open) { setOpen(null); }
  });

  toggle.addEventListener('click', function (event) {
    event.preventDefault();
    setView(view === 'fun' ? 'simple' : 'fun');
  });

  /* ---- start -------------------------------------------------------- */

  var params = new URLSearchParams(window.location.search);
  var hash = window.location.hash.replace('#', '');
  var asked = params.get('view') || (hash === 'simple' || hash === 'fun' ? hash : null);

  view = asked || remembered() || 'fun';
  if (view !== 'simple') { view = 'fun'; }

  var wanted = params.get('open');
  if (view === 'fun' && KEYS.indexOf(wanted) > -1) { open = wanted; }

  // Only animate once the first paint has settled.
  body.classList.add('no-anim');
  render();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { body.classList.remove('no-anim'); });
  });
})();
