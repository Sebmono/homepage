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

  Opening, closing and moving between sections run as a View Transitions API
  morph of the three box outlines and nothing else; switching views is a plain
  two-step fade. See the transitions section below and "The morph" in README.md.

  Choice order: ?view= / #hash in the URL, then localStorage, then visual by default.
  Deep links: ?view=visual&open=elsewhere, ?view=linear, #linear, #visual. The older
  names fun and simple are still accepted everywhere a view name is read.
*/
(function () {
  'use strict';

  var KEYS = ['now', 'elsewhere', 'battleforce'];
  var STORE = 'sm-view';

  var body = document.body;
  var main = document.getElementById('main');
  var pane = document.getElementById('pane');
  var toggle = document.getElementById('view-toggle');
  var boxes = KEYS.map(function (k) { return document.getElementById('box-' + k); });
  var sections = KEYS.map(function (k) { return document.getElementById('sec-' + k); });

  if (!main || !pane || !toggle || boxes.indexOf(null) > -1) return;


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
    The View Transitions API has one job here: run the three box outlines from
    their old rectangles to their new ones. Nothing else is named, no snapshot
    is ever shown, and every fade -- the two labels, the photograph behind the
    boxes, the open section -- is an ordinary CSS transition or animation on a
    live element, declared in style.css. The engines disagree about snapshots
    and agree about live CSS, so the timing lives where they agree. See "The
    morph" in README.md.

    Without the API the state change simply applies and the CSS fades still
    run. There is no second animation path, and the OS reduced-motion
    preference is deliberately ignored: the owner wants this for everyone.
  */
  function duration() {
    var ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur'));
    return ms > 0 ? ms : 450;
  }

  function morph(change, kind) {
    if (!document.startViewTransition || body.classList.contains('no-anim')) {
      change();
      return;
    }
    // open | close | tab: the stylesheet times the photo fade off this.
    document.documentElement.setAttribute('data-vt', kind || 'tab');

    // While the morph runs the boxes drop their own border and the
    // ::view-transition-group pseudo draws it instead: on the group it is a
    // real rectangle that changes shape, not a picture of a border.
    body.classList.add('morphing');

    var t = document.startViewTransition(change);

    // Hand the border back one frame before the pseudo tree is torn down, with
    // the fade suppressed, so nothing blinks at the seam. The clock starts
    // here rather than on t.ready: ready resolves a frame later in Chromium,
    // rejects outright when a transition is skipped, and is not worth relying
    // on across engines for something this small.
    var timer = setTimeout(settle, Math.max(0, duration() - 16));

    t.finished.catch(function () {}).then(function () {
      clearTimeout(timer);
      settle();
    });

    function settle() {
      if (!body.classList.contains('morphing')) { return; }
      boxes.forEach(function (b) { b.style.transition = 'none'; });
      body.classList.remove('morphing');
      document.documentElement.removeAttribute('data-vt');
      // Tear the pseudo tree down in the same frame the boxes take their
      // border back. Two borders drawn a sub-pixel apart for even one frame
      // read as a jitter; skipping the last few milliseconds does not.
      if (t.skipTransition) { t.skipTransition(); }
      void body.offsetWidth;
      requestAnimationFrame(function () {
        boxes.forEach(function (b) { b.style.transition = ''; });
      });
    }
  }

  /*
    Linear <-> visual is not a morph. The two layouts share no geometry worth
    carrying across, so this does not touch the API: fade #main and the footer
    out, apply the change while they are invisible, fade them back. Content
    never moves while it can be seen.
  */
  var OUT = 160;
  var swapping = false;

  function swap(change) {
    if (swapping) { return; }

    if (body.classList.contains('no-anim')) {
      change();
      return;
    }

    swapping = true;
    body.classList.add('swapping');

    var done = false;

    function half(event) {
      // transitionend bubbles; only #main's own opacity ends the first half.
      if (event && event.target !== main) { return; }
      if (done) { return; }
      done = true;
      main.removeEventListener('transitionend', half);
      change();
      // One frame at the new layout before the fade back, so the browser has
      // something to fade from.
      requestAnimationFrame(function () {
        body.classList.remove('swapping');
        swapping = false;
      });
    }

    main.addEventListener('transitionend', half);
    setTimeout(half, OUT + 40);          // transitionend never fires if the tab is hidden
  }

  function setOpen(next) {
    if (next === open || swapping) { return; }
    var kind = !open ? 'open' : (!next ? 'close' : 'tab');
    morph(function () {
      open = next;
      render();
    }, kind);
  }

  function setView(next) {
    var to = named(next) || 'visual';
    if (to === view) { return; }
    swap(function () {
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
