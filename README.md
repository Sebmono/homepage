# sebastianmankowski.com

A one-page personal site. Plain HTML and CSS, no build step, no analytics, no JavaScript
libraries. Everything that gets served lives at the repo root.

```
index.html     the page
contact.html   the contact form
style.css      all styles, light and dark
views.js       the simple/fun view toggle on the home page
img/           Scarpa photographs used behind the fun view boxes
favicon.svg    SM monogram
_headers       security headers for Cloudflare Pages
_redirects     301 from www to the apex domain
```

Built with Claude Code.

## The two views

The home page renders two ways at the same URL. A link in the top-right nav switches
between them.

**Simple view** is the plain stack: masthead, then Now, Elsewhere and BattleForce at equal
heights. It is what the HTML renders on its own, so it is also what you get with
JavaScript off.

**Fun view** is the default. Three square boxes sit below the masthead, each with a Scarpa
photograph behind its label. Picking one collapses all three into narrow vertical tabs and
opens that section's text between them: the tabs up to and including the selected one stay
on the left, the rest move to the right. Click the open tab again, or press Escape, to go
back to the three boxes. Arrow keys move between the tabs.

`views.js` adds the class `fun` to `<body>` and sets `data-open` to the section name;
everything else is CSS. The choice is stored in `localStorage` under `sm-view`.

### Linking to a view

| URL | Result |
| --- | --- |
| `/` | whatever was last chosen, fun view by default |
| `/?view=simple` or `/#simple` | simple view |
| `/?view=fun` or `/#fun` | fun view, landing state |
| `/?view=fun&open=now` | fun view with Now open |
| `/?view=fun&open=elsewhere` | fun view with Elsewhere open |
| `/?view=fun&open=battleforce` | fun view with BattleForce open |

A `?view=` or `#` in the URL wins over the stored choice for that visit but does not
overwrite it. Only using the nav link changes what is stored.

### Swapping the images

The three photographs are `img/scarpa-1.jpg` (now), `img/scarpa-2.jpg` (elsewhere) and
`img/scarpa-3.jpg` (battleforce), wired up at the bottom of the fun view block in
`style.css`:

```css
#box-now::after         { background-image: url("img/scarpa-1.jpg"); }
#box-elsewhere::after   { background-image: url("img/scarpa-2.jpg"); }
#box-battleforce::after { background-image: url("img/scarpa-3.jpg"); }
```

To change one, drop a replacement in at the same filename. Keep them around 1400px wide
and under 250KB; `sips -s format jpeg -s formatOptions 60 -Z 1400 in.jpg --out out.jpg`
does both. They are cropped with `object-fit`-style `background-size: cover`, desaturated
and held at 18% opacity (22% in dark mode) by the `.box::after` rule, so anything with a
legible large-scale structure works. Update the credits below and the comment at the top
of `index.html` when you swap one.

## Image credits

All three are Creative Commons Attribution, from Wikimedia Commons.

| File | Work | Author | License |
| --- | --- | --- | --- |
| `img/scarpa-1.jpg` | [Carlo Scarpa, architect: the Cangrande space, Castelvecchio Museum, Verona 1956-1973](https://commons.wikimedia.org/wiki/File:Carlo_scarpa,_architect-_the_cangrande_space,_castelvecchio_museum,_verona_1956-1973_(31252404523).jpg) | seier+seier | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| `img/scarpa-2.jpg` | [Palazzo Querini Stampalia, piano terra e giardino di Carlo Scarpa](https://commons.wikimedia.org/wiki/File:Palazzo_querini_stampalia,_piano_terra_e_giardino_di_carlo_scarpa_09.jpg) | Sailko | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| `img/scarpa-3.jpg` | [Olivetti Exhibition centre by Carlo Scarpa, St Mark's Square, Venice, Italy](https://commons.wikimedia.org/wiki/File:Olivetti_Exhibition_centre_by_Carlo_Scarpa,_St_Mark%27s_Square,_Venice,_Italy.jpg) | fusion-of-horizons | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |

Each has been resized to 1400px wide and recompressed. The same credits are repeated in an
HTML comment at the top of `index.html` so they travel with the page.

## Placeholders to fill before going live

Two literal strings in `index.html` must be replaced. The site will render fine without
doing so, but both forms will fail on submit.

### `BUTTONDOWN_USERNAME`

Appears twice in the BattleForce section (the form `action` and the `onsubmit` popup URL).

1. Create a free account at https://buttondown.com.
2. Your username is the last path segment of your public newsletter URL,
   `https://buttondown.com/<username>`. It is also shown under Settings, Basics.
3. Replace both occurrences of `BUTTONDOWN_USERNAME` with it.

### `WEB3FORMS_ACCESS_KEY`

Appears once, in the hidden `access_key` input of the contact form.

1. Go to https://web3forms.com, enter the destination email address, and submit.
2. Web3Forms emails an access key (a UUID). Confirm the address from that email.
3. Replace `WEB3FORMS_ACCESS_KEY` with the key.

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
