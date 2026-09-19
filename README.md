# sebastianmankowski.com

A one-page personal site. Plain HTML and CSS, no build step, no analytics, no JavaScript
libraries. Everything that gets served lives at the repo root.

```
index.html     the page
style.css      all styles, light and dark
favicon.svg    SM monogram
_headers       security headers for Cloudflare Pages
_redirects     301 from www to the apex domain
```

Built with Claude Code.

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
