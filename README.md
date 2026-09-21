# sebastianmankowski.com

A one-page personal site. Plain HTML and CSS, no build step, no analytics, no JavaScript
libraries. Everything that gets served lives at the repo root.

```
index.html     the page
contact.html   the contact form
style.css      all styles, light and dark
views.js       the linear/visual view toggle on the home page
theme.js       the theme icon in the top nav (cycles light, dark, system)
img/           the Scarpa drawing behind the landing boxes, and the Pax Pamir photograph
favicon.svg    SM monogram
_headers       security headers for Cloudflare Pages
_redirects     301 from www to the apex domain
```

Built with Claude Code.

## The two views

The home page renders two ways at the same URL. A link in the top-right nav switches
between them. The link names the view it takes you to, not the one you are in.

**Linear view** is the plain stack: masthead, then Now, Elsewhere and BattleForce, each as
tall as its own content with `3.2rem` between them. It is what the HTML renders on its own,
so it is also what you get with JavaScript off. The three used to share one height set by
the tallest of them, which left dead space under Now and BattleForce; only the visual view
needs a shared height, and it sets that on `#main` rather than on the sections.

**Visual view** is the default. Three square boxes sit below the masthead, each with a
large lowercase label and its own slice of a single Scarpa photograph
running across all three. Picking one collapses all three into narrow vertical tabs and
opens that section's text between them: the tabs up to and including the selected one stay
on the left, the rest move to the right. Click the open tab again, or press Escape, to go
back to the three boxes. Arrow keys move between the tabs.

Each box carries two labels, one horizontal and one vertical. Only one is visible in each
state and neither has any timing of its own; the morph below cross-fades them. The vertical
one is `aria-hidden`.

`views.js` adds the class `visual` to `<body>` and sets `data-open` to the section name;
everything else is CSS. The choice is stored in `localStorage` under `sm-view`.

### The morph

Landing to tabs, tab to tab, and back again are one
[view transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API),
not a set of CSS transitions on flex properties. `views.js` wraps the state change:

```js
if (document.startViewTransition && !reduced.matches) {
  document.startViewTransition(render);
} else {
  render();
}
```

`style.css` gives each box a `view-transition-name` (`box-now`, `box-elsewhere`,
`box-battleforce`), plus `pane` and `footer`. The browser snapshots each named element
before and after the layout change, then runs its bounding box from the old rectangle to
the new one and cross-fades the two snapshots over the top. That is what sends the four
corners of a box straight to their new position, grows the text pane alongside them,
dissolves the horizontal label into the vertical one *during* the move, and sends the
footer travelling as the page gets taller. `--dur` on `:root` sets the length for all of
it; it is declared there rather than on `body.visual` because the view transition
pseudo-elements hang off `<html>` and inherit from it.

Two details in that CSS are load-bearing:

- `::view-transition-old(*)` and `::view-transition-new(*)` are pinned to
  `object-fit: none` and clipped by `overflow: hidden` on the image pair. The default
  stretches each snapshot to the size of the animating group, which drags the Scarpa
  drawing and the labels out of shape as a 17rem square becomes a 3.5rem tab. The pane and
  the footer hold theirs at `object-position: left top`, so their words are uncovered from
  the left rather than creeping in from both edges.
- `::view-transition-old(root)` and `::view-transition-new(root)` have their animation
  turned off. Everything that moves is named, so the page-wide pair has nothing to say;
  left to itself it cross-fades the masthead and nav against themselves.

Anything before Chrome 111, Safari 18 or Firefox 144 has no same-document view
transitions and gets an instant state change instead. So does anyone who asks for reduced
motion: `views.js` checks `prefers-reduced-motion` before starting a transition, and there
is no second animation path to keep in step.

The reduced-motion block in `style.css` is flat on purpose (`*, *::before, *::after`). It
used to list the animated selectors one at a time, which lost to the more specific
`body.visual[data-open]` rules: the geometry stopped moving while the labels kept fading,
so a reader on reduced motion saw the boxes snap and then the label arrive after them.

### Linking to a view

| URL | Result |
| --- | --- |
| `/` | whatever was last chosen, visual view by default |
| `/?view=linear` or `/#linear` | linear view |
| `/?view=visual` or `/#visual` | visual view, landing state |
| `/?view=visual&open=now` | visual view with Now open |
| `/?view=visual&open=elsewhere` | visual view with Elsewhere open |
| `/?view=visual&open=battleforce` | visual view with BattleForce open |

The views were first called fun and simple. Those names are still accepted wherever a view
name is read, so `?view=fun`, `#simple` and older stored values keep working.

A `?view=` or `#` in the URL wins over the stored choice for that visit but does not
overwrite it. Only using the nav link changes what is stored.

## The theme control

One icon in the top-right nav that cycles light (sun), dark (moon), system (monitor). The choice sets `data-theme` on
`<html>` (`light`, `dark`, or no attribute at all for System) and is stored in
`localStorage` under `sm-theme`. A three-line inline script in the `<head>` of both pages
applies it before the first paint, so switching to Dark and reloading never flashes the
light background.

Dark tokens are declared twice in `style.css`: once under
`@media (prefers-color-scheme: dark)` scoped to `:root:not([data-theme="light"])`, and once
under `:root[data-theme="dark"]`. Keep the two blocks in step when changing a colour.

The control is hidden in the markup and unhidden by `theme.js`, so with JavaScript off the
page simply follows the system setting.

## The scrollbar gutter

`html` carries `scrollbar-gutter: stable`. Opening a section or switching views changes the
page height, so without it the vertical scrollbar appears and disappears and the centred
column jumps sideways by half the scrollbar width on every state change. Reserving the
gutter whether or not the page scrolls holds the column still.
[CSS Overflow 3](https://drafts.csswg.org/css-overflow-3/#scrollbar-gutter-property);
Chrome 94, Firefox 97, Safari 17.4. It does nothing on a platform with overlay scrollbars,
which take no layout space and cause no shift in the first place.

## The nav frame

The top nav is not on the 38rem text measure. It is the width of `--row-w`, the same wide
frame the visual view's box row uses, so its right edge lines up with the right edge of the
boxes in both views and on `contact.html`. Below about 40rem both collapse to the 16px
gutter.

## Swapping the images

`img/scarpa-wide.jpg` is one photograph cut across the three landing boxes. Each box paints
the whole image at the row width and shifts it left by its own index (`--i` on the box),
so the gaps read as cuts through one picture:

```css
body.visual .box::after {
  background-image: url("img/scarpa-wide.jpg");
  background-size: var(--row-w) auto;
  background-position: calc(-1 * var(--i) * (var(--box-w) + var(--box-gap))) center;
}
```

A replacement wants to be about 3:1, around 1600px wide, under 300KB, and to have legible
large-scale horizontal structure, since it is held at 17% opacity (23% in dark mode) and
desaturated by the `.box::after` rule. Stacked bars on mobile cannot read as one picture,
so there each bar takes a third of the image across instead.

`img/pax-pamir.jpg` sits under the links in the Elsewhere section, which is the tallest of
the three. If you swap it for something a different shape, check the visual view:
`--open-h` in `body.visual` is the fixed height the tabs and the text pane share, and it is
sized to that section. The linear view no longer cares, since each section is as tall as
its own content.

Update the credits below and the comment at the top of `index.html` when you swap either.

## Image credits

| File | Work | Author | License |
| --- | --- | --- | --- |
| `img/scarpa-wide.jpg` | [Altivole - Tomba Brion - 2024-09-28 20-27-56 009](https://commons.wikimedia.org/wiki/File:Altivole_-_Tomba_Brion_-_2024-09-28_20-27-56_009.jpg), via Wikimedia Commons | Viaggiamocela | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `img/pax-pamir.jpg` | Pax Pamir, second edition, mid-game | the site owner | own photograph |

The Scarpa photograph has been cropped to 3:1, desaturated and recompressed; the Pax Pamir
photograph cropped to 2.6:1, desaturated and recompressed. The same credits are repeated in
an HTML comment at the top of `index.html` so they travel with the page.

## Placeholders to fill before going live

Two literal strings in `index.html` must be replaced. The site will render fine without
doing so, but both forms will fail on submit.

### `battleforce_game (set)`

Appears twice in the BattleForce section (the form `action` and the `onsubmit` popup URL).

1. Create a free account at https://buttondown.com.
2. Your username is the last path segment of your public newsletter URL,
   `https://buttondown.com/<username>`. It is also shown under Settings, Basics.
3. Replace both occurrences of `battleforce_game (set)` with it.

### `the Web3Forms key (set)`

Appears once, in the hidden `access_key` input of the contact form.

1. Go to https://web3forms.com, enter the destination email address, and submit.
2. Web3Forms emails an access key (a UUID). Confirm the address from that email.
3. Replace `the Web3Forms key (set)` with the key.

The access key is a public, write-only submission token; it is safe in client-side HTML.
The destination address is held by Web3Forms and never appears in this repo. Keep it that
way: do not put an email address in the HTML.

The contact form posts via `fetch` and shows an inline "Thanks" state without leaving the
page. The honeypot `botcheck` checkbox is hidden and must stay empty; Web3Forms drops any
submission that fills it.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git. Authorize and
   pick this repository.
3. Build settings:
   - Framework preset: **None**
   - Build command: **leave empty**
   - Build output directory: **`/`**
   - Root directory: **`/`**
4. Save and Deploy. The site lands on `<project>.pages.dev`.
5. Custom domains, Set up a custom domain. Add both `sebastianmankowski.com` and
   `www.sebastianmankowski.com`.

`_headers` and `_redirects` are read automatically by Pages on each deploy. The
`_redirects` file sends `www` to the apex with a 301; if you would rather have the apex
redirect to `www`, reverse the two rules and adjust the custom domains accordingly.

## DNS at Porkbun

The domain is registered at Porkbun. Two options.

### Option A, move nameservers to Cloudflare (simpler, recommended)

1. In Cloudflare, Add a site, `sebastianmankowski.com`, Free plan. Cloudflare scans
   existing records and gives you two nameservers, e.g. `xxx.ns.cloudflare.com`.
2. In Porkbun, open the domain, Authoritative Nameservers, Edit, and replace Porkbun's
   nameservers with Cloudflare's two.
3. Back in Cloudflare Pages, add the custom domains. Cloudflare creates the apex and `www`
   records itself (a proxied CNAME flattened at the apex). Nothing else to do.
4. Propagation is usually under an hour, allow up to 24.

### Option B, keep Porkbun DNS

In Porkbun, Domain Management, DNS Records:

| Type | Host | Answer |
| --- | --- | --- |
| `ALIAS` (Porkbun's ANAME) | leave blank, the apex | `<project>.pages.dev` |
| `CNAME` | `www` | `<project>.pages.dev` |

Porkbun supports `ALIAS` at the apex, which is what makes this work; a plain `CNAME` is not
legal there. Delete any pre-existing `A` or `ALIAS` record on the apex first, including
Porkbun's default parking record.

Either way, Cloudflare issues the TLS certificate automatically once the records resolve.

## Local preview

```sh
python3 -m http.server 8123
```

Then open http://localhost:8123. Opening `index.html` as a `file://` URL mostly works, but
the fonts and the contact-form `fetch` behave differently, so use the server.
