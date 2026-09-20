/*
  Two views of the same page.

  Linear view  the plain stack of sections. This is what the markup renders on its own,
               so the page still works with JavaScript off.
  Visual view  added by putting the class "visual" on <body>. Three big boxes; picking
               one collapses all three into vertical tabs and opens that section between
               them.

  State lives in two attributes on <body>:
    class="visual"     which view we are in
    data-open="now"    which section is open (absent = the landing state)

  Choice order: ?view= / #hash in the URL, then localStorage, then visual by default.
  Deep links: ?view=visual&open=elsewhere, ?view=linear, #linear, #visual. The older
  names fun and simple are still accepted everywhere a view name is read.
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

  /* ---- names -------------------------------------------------------- */

  // "fun" and "simple" were the first names for these views; old links and old
  // stored values still resolve.
  function named(value) {
    if (value === 'linear' || value === 'simple') { return 'linear'; }
    if (value === 'visual' || value === 'fun') { return 'visual'; }
    return null;
  }

  /* ---- persistence ------------------------------------------------- */

  function remember(v) {
    try { localStorage.setItem(STORE, v); } catch (e) { /* private mode, ignore */ }
  }

  function remembered() {
    try { return named(localStorage.getItem(STORE)); } catch (e) { return null; }
  }

  /* ---- render ------------------------------------------------------ */

  var view = 'visual';
  var open = null;

  function render() {
    var visual = view === 'visual';

    body.classList.toggle('visual', visual);
    if (visual && open) { body.setAttribute('data-open', open); }
    else { body.removeAttribute('data-open'); }

    boxes.forEach(function (box, i) {
      box.hidden = !visual;
      var on = visual && open === KEYS[i];
      box.setAttribute('aria-expanded', on ? 'true' : 'false');
      box.classList.toggle('is-open', on);
    });

    // Linear view shows every section. Visual view shows the open one, or none.
    sections.forEach(function (section, i) {
      section.hidden = visual && open !== KEYS[i];
    });

    // The link names the view it takes you to, not the one you are in.
    toggle.hidden = false;
    toggle.textContent = visual ? 'Linear' : 'Visual';
    toggle.href = visual ? '?view=linear' : '?view=visual';

    try {
      var url = new URL(window.location.href);
      url.hash = '';
      url.searchParams.set('view', view);
      if (visual && open) { url.searchParams.set('open', open); }
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
    view = named(next) || 'visual';
    if (view === 'linear') { open = null; }
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
    setView(view === 'visual' ? 'linear' : 'visual');
  });

  /* ---- start -------------------------------------------------------- */

  var params = new URLSearchParams(window.location.search);
  var asked = named(params.get('view')) || named(window.location.hash.replace('#', ''));

  view = asked || remembered() || 'visual';

  var wanted = params.get('open');
  if (view === 'visual' && KEYS.indexOf(wanted) > -1) { open = wanted; }

  // Only animate once the first paint has settled.
  body.classList.add('no-anim');
  render();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { body.classList.remove('no-anim'); });
  });
})();
