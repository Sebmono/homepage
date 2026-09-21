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

  Every change to either one runs as a single View Transitions API morph; see the
  transitions section below and "The morph" in README.md.

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
    Every geometry change goes through the View Transitions API. The browser
    snapshots each element that style.css gives a view-transition-name to, lets
    the layout change happen, then runs each snapshot's bounding box from the
    old rectangle to the new one and cross-fades the old and new content over
    the top. A box turning into a tab, the pane growing between them and the
    label swapping direction are all the same single morph, and none of it is
    choreographed here.

    Without the API the state change simply applies. There is no second
    animation path. The OS reduced-motion preference is deliberately ignored:
    the owner wants the morph to run for everyone.
  */
  function morph(change) {
    if (document.startViewTransition && !body.classList.contains('no-anim')) {
      // A hidden tab aborts the transition; the state change still applies,
      // so the rejection is noise.
      var t = document.startViewTransition(change);
      var quiet = function () {};
      t.ready.catch(quiet);
      t.finished.catch(quiet);
    } else {
      change();
    }
  }

  function setOpen(next) {
    if (next === open) { return; }
    morph(function () {
      open = next;
      render();
    });
  }

  function setView(next) {
    var to = named(next) || 'visual';
    if (to === view) { return; }
    morph(function () {
      view = to;
      if (view === 'linear') { open = null; }
      remember(view);
      render();
    });
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
