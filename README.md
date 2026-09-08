# Robert Hindin & Associates — city landers

Car-accident landing pages for 14 LA County cities, English and Spanish, one template, zero dependencies.
Same system as the Goldberg hub. Not their copy, not their leaks.

## Locked in

| | |
|---|---|
| Phone, everywhere | **(310) 473-0337** |
| Office | 11400 W Olympic Blvd, Suite 200, Los Angeles, CA 90064 — the only office, no fake suites |
| Hours | Mon–Fri 8am–5pm. Nothing says 24/7. |
| Proof | 5.0 on 130+ Google reviews, Super Lawyers Rising Stars 2022–2026, CAALA, plaintiff-only since 1975 |
| Result | Only the released one: $85,000 offer → $375,000 |
| Form | Name + mobile. "Free case review. We call you." One screen. |
| Reviews | Julio Barberena, Rob Cruize, Chelsea Israelsky, verbatim in English on both languages |
| Spanish | usted only, English city names, Ismael line above the fold, FAQ 5 (papeles / emergencia / idioma) always visible |

## Pages

| URL | City | Default language |
|---|---|---|
| `/compton/` | Compton | EN |
| `/huntington-park/` | Huntington Park | **ES** |
| `/van-nuys/` | Van Nuys | EN |
| `/pomona/` | Pomona | EN |
| `/palmdale/` | Palmdale | EN |
| `/hawthorne/` | Hawthorne | EN |
| `/downey/` | Downey | EN |
| `/inglewood/` | Inglewood | EN |
| `/paramount/` | Paramount | EN |
| `/baldwin-park/` | Baldwin Park | EN |
| `/bellflower/` | Bellflower | EN |
| `/lynwood/` | Lynwood | **ES** |
| `/norwalk/` | Norwalk | EN |
| `/pico-rivera/` | Pico Rivera | EN |
| `/` | Los Angeles (default) | EN |
| `/thank-you/` | post-submit, `noindex`: confirmation, optional qualifying questions, what happens next, who we are, links to the corporate site, reviews | EN, honours `?lang=es` |

Every page carries both languages. `?lang=es` forces Spanish, `?lang=en` forces English, the header toggle flips without reload and rewrites the URL.

**Spanish ad traffic** for Huntington Park, Lynwood, Compton, Pico Rivera, Baldwin Park, Paramount, Bellflower, Downey, Norwalk and Pomona must land on `?lang=es` (the `spanishAds` flag in `src/cities.json` marks them). Huntington Park and Lynwood are Spanish even without it and are pre-rendered in Spanish, so they never flash English.

## Build

```
node build.js        # -> dist/
node qa.js           # §7.15 Spanish QA + locked-fact checks, exits 1 on failure
npm run serve        # build + http://localhost:8080
```

`dist/` is committed so it can be deployed as-is from any static host (Netlify, Cloudflare Pages, S3, GitHub Pages). Rebuild after any change under `src/`.

## Layout

```
src/
  site.json          phone, office, base URL, form endpoint, GTM id, index flag
  keywords.json      ?kw= allowlist, EN+ES
  cities.json        14 cities + LA default: slug, default language, serve/local lines EN+ES
  strings/en.json    English copy (§6)
  strings/es.json    Spanish master copy (§7). Not a translation. Same keys 1:1.
  template.html      the lander. Every text node has data-i18n="<key>".
  thankyou.html      the thank-you page
  assets/            styles.css, lander.js, logo-white.svg, favicon.svg, img/
build.js             renders dist/, sitemap.xml, robots.txt, pages.json
qa.js                the checklist, automated
```

`{City}` in any string becomes the city name at build time. `{serve}` and `{local}` pull the city module lines. Roads stay numbers. City names stay English.

## How the language swap works

1. Build renders each page in its default language, so the HTML is already right with JS off.
2. An inline script in `<head>` reads `?lang=` before first paint and sets `<html lang data-lang>`. If the request differs from the page's default, `body` is hidden until the swap runs, so there's no flash of the wrong language.
3. `lander.js` holds both string sets (`window.__RHA_I18N`) and walks `[data-i18n]` / `[data-i18n-attr]`. It also sets the hidden `lang` form field, the toggle's href, and the thank-you redirect.
4. The Ismael line and Julio caption are empty in English and hidden with `data-hide-empty`.

## Form

`site.json → formEndpoint` is set to the firm's Formspree form (`https://formspree.io/f/xqpkgbyg`). The form POSTs JSON:

```json
{ "name", "phone" (10 digits), "phone_display", "lang", "city", "city_slug",
  "practice": "car", "page", "source" (UTM/gclid/referrer JSON), "kw", "submitted_at", "tcpa",
  "_subject": "New lead: Compton (ES, rear-end) — <name>" }
```

then redirects to `/thank-you/?lang=<lang>`. When empty (staging) it redirects without posting. On a failed POST it shows the phone number instead of eating the lead. Honeypot field `website`. `dataLayer` events: `lead_submit`, `lead_error`, `phone_click`, `lang_toggle`, each carrying `lang`, `city`, `kw`.

## Thank-you page

After the lead posts, the page stores name/phone/city in `sessionStorage` and redirects to `/thank-you/?lang=<lang>`. There the person can answer four optional questions (when the crash was, seen a doctor, insurer contact, what happened). Those post to the same Formspree form as a second submission with subject "Lead details: <city> — <name> <phone>", so intake can match them to the lead. The page also offers a vCard (`assets/rha.vcf`), the three next steps, the firm bio and result, a "Find out more about us" button to `site.json → corporateUrl` (opens in a new tab with UTM tags), and the reviews. Set `googleReviewsUrl` to show a "Read our Google reviews" button; it stays hidden while empty.

## Deploy (Vercel)

`vercel.json` sets the output directory to `dist`, trailing slashes on (matches the canonicals), and cache headers for `/assets/`. Build command is `npm run build`. Node is pinned to 22.x.

## Keyword match (`?kw=`)

Page-side dynamic keyword insertion, allowlisted. `?kw=rear-end` (or `utm_term` when it exactly matches a token) swaps only the first sentence of the hero subhead, in whichever language is showing. Tokens live in `src/keywords.json`:

`rear-end`, `uber`, `lyft`, `hit-and-run`, `drunk-driver`, `truck`, `motorcycle`, `pedestrian`, `bicycle`, `freeway`, `intersection`, `passenger`, `whiplash`

Anything not on the list is ignored and the default copy shows. Raw search terms never reach the page. The token is sent with the lead as `kw` and on every `dataLayer` event. Ad ops: put `kw=<token>` in the ad group's final URL suffix.

## Assets

- `src/assets/logo-white.png` — the firm's white logo (1101×180, transparent). Sits on the navy header bar.
- `src/assets/img/hindin-team.webp` — Robert and Kyle Hindin, cutout on transparent, in the hero.

## Wave 2

Truck and motorcycle copy (Spanish) lives in `src/strings/es.json → wave2` and is not rendered. Ships only after the car pages convert.

## Spanish QA checklist (§7.15)

Run `node qa.js`. It fails the build on any of:

- tú-register anywhere in the Spanish strings
- "evaluación", "bufete", "sin cargos hasta ganar", 24/7, translated city names, the Goldberg H1
- city not at the end of the H1's first line, or a splice mid-word
- form not posting `lang: "es"` on ES pages; thank-you not respecting `?lang=es`
- phone missing from TCPA, hero, form, footer, final CTA, thank-you
- FAQ 5 inside an accordion; Ismael line missing on ES or present on EN
- reviews not attributed to the real names
- footer advertising paragraph without "Publicidad de abogados" and Robert Hindin as responsible attorney
- Huntington Park / Lynwood not pre-rendered in Spanish
