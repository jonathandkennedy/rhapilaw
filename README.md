# Robert Hindin & Associates — city landers

Car-accident landing pages for 14 LA County cities, English and Spanish, one template, zero dependencies.
Same system as the Goldberg hub. Not their copy, not their leaks.

## Locked in

| | |
|---|---|
| Phone, everywhere | **(310) 564-7911** — the CallRail swap target. The office line (310) 473-0337 does not appear on these pages. |
| Office | 11400 W Olympic Blvd, Suite 200, Los Angeles, CA 90064 — the only office, no fake suites |
| Hours | Mon–Fri 8am–5pm. Nothing says 24/7. |
| Proof | 5.0 on 130+ Google reviews, Super Lawyers Rising Stars 2022–2026, CAALA, plaintiff-only since 1975 |
| Result | Only the released one: $85,000 offer → $375,000 |
| Form | Name + mobile. "Free case review. We call you." One screen. |
| Reviews | Julio Barberena, Rob Cruize, Chelsea Israelsky, verbatim in English on both languages |
| Spanish | usted only, English city names, Ismael line above the fold, FAQ 5 (papeles / emergencia / idioma) always visible |

## Pages

Every page exists twice: English at `/<path>/`, Spanish at `/es/<path>/`. Same template, pre-rendered, no runtime language swapping. Each carries a self-canonical plus `hreflang` en / es / x-default, and the sitemap repeats the triplet.

| English | Spanish | What |
|---|---|---|
| `/` | `/es/` | Hub: every city with EN and ES links |
| `/compton/` … `/pico-rivera/` | `/es/compton/` … `/es/pico-rivera/` | 14 city landers |
| `/los-angeles/` | `/es/los-angeles/` | Catch-all lander |
| `/privacy/` | `/es/privacy/` | Privacy Policy (CCPA, TCPA/SMS, GA4, Formspree, retention) |
| `/terms/` | `/es/terms/` | Terms of Use (attorney advertising, no attorney-client relationship, results disclaimer) |
| `/thank-you/` | `/es/thank-you/` | Post-submit, `noindex` |

**x-default** points at the English page except for Huntington Park and Lynwood, where it points at `/es/…` (the plan's Spanish-first cities). Spanish ads land on the `/es/` URL directly: `/es/huntington-park/`, `/es/compton/?kw=rear-end`, and so on.

**Old query URLs still work.** `/compton/?lang=es` is a 308 to `/es/compton/` (Vercel redirect in `vercel.json`, with an inline JS fallback for other hosts). The `kw` parameter survives the redirect.

**Footer on every page:** office, hours, SMS opt-out line, Privacy, Terms, hub, the same page in the other language, firm website, Google reviews, and cross-links to all 15 city landers in the page's language.

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
  template.html      the lander
  thankyou.html      the thank-you page
  hub.html           the hub
  legal.html         wrapper for privacy / terms
  legal/             privacy.{en,es}.html, terms.{en,es}.html
  assets/            styles.css, lander.js, logo-white.svg, favicon.svg, img/
build.js             renders dist/, sitemap.xml, robots.txt, pages.json
qa.js                the checklist, automated
```

`{City}` in any string becomes the city name at build time. `{serve}` and `{local}` pull the city module lines. Roads stay numbers. City names stay English.

## How language works

Path decides language. `build.js` renders every template once per language; the header toggle and footer link are plain links to the other path. `lander.js` only handles the form, the thank-you questions, the keyword swap, and tracking. The Ismael line and Julio caption exist only on Spanish pages.

## Form

`site.json → formEndpoint` is set to the firm's Formspree form (`https://formspree.io/f/xqpkgbyg`). The form POSTs JSON:

```json
{ "name", "phone" (10 digits), "phone_display", "lang", "city", "city_slug",
  "practice": "car", "page", "source" (UTM/gclid/referrer JSON), "kw", "submitted_at", "tcpa",
  "_subject": "New lead: Compton (ES, rear-end) — <name>" }
```

then redirects to `/thank-you/?lang=<lang>`. When empty (staging) it redirects without posting. On a failed POST it shows the phone number instead of eating the lead. Honeypot field `website`. `dataLayer` events: `lead_submit`, `lead_error`, `phone_click`, `lang_toggle`, each carrying `lang`, `city`, `kw`.

## Thank-you page

After the lead posts, the page stores name/phone/city in `sessionStorage` and redirects to `/thank-you/?lang=<lang>`. There the person can answer four optional questions (when the crash was, seen a doctor, insurer contact, what happened). Those post to the same Formspree form as a second submission with subject "Lead details: <city> — <name> <phone>", so intake can match them to the lead. The page also offers a vCard (`assets/rha.vcf`), the three next steps, the firm bio and result, a "Find out more about us" button to `site.json → corporateUrl` (opens in a new tab with UTM tags), and the reviews. `googleReviewsUrl` is the firm's Google Business Profile share link, shown as a "Read our Google reviews" button (no UTM appended, to keep the Google redirect intact).

## Deploy (Vercel)

`vercel.json` sets the output directory to `dist`, trailing slashes on (matches the canonicals), and cache headers for `/assets/`. Build command is `npm run build`. Node is pinned to 22.x.

## Analytics

Configured in `src/site.json` and loaded on every page (landers, hub, thank-you):

- `ga4Ids` = `G-K9CNL0LV5B`, `G-BBKS7FGRKP`: the Google tag (gtag.js) loads once and is configured for both GA4 properties, so each receives pageviews and the events below. Remove one from the list if only one property should get lander data.
- `gtmId` = `GTM-N7PDDTKX`: the Tag Manager container loads alongside it for tags added later (Google Ads, call tracking). **Do not add a GA4 configuration tag for G-K9CNL0LV5B inside the container**, or pageviews double-count. Page events are on the `dataLayer` as Custom Event triggers.
- `googleAdsId` (`AW-…`): optional, added to the same gtag config when set.

Events fired by the pages, each with `lang`, `city`, `kw`: `lead_submit` (the conversion), `lead_details`, `lead_error`, `phone_click`, `lang_toggle`, `vcard`, `corporate_click`, `reviews_click`. In GA4 → Admin → Events, mark `lead_submit` and `phone_click` as key events.

## Call tracking (CallRail)

Every page shows one number, (310) 564-7911, in text and in every `tel:` link, so CallRail dynamic number insertion has a single swap target. The CallRail swap script (`site.json → callrailSwapUrl`, company 929322410) loads at the end of `<body>` on every page. In CallRail the website-visitor pool's swap target must be 310-564-7911.

## Click-fraud protection (ClickCease)

`site.json → clickceaseScriptUrl` and `clickceaseNoscriptUrl` render the ClickCease tag and its noscript iframe at the end of `<body>` on every page. The script keeps the `ct_clicktrue` class ClickCease looks for. Blank either value to remove it.

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
- form not posting `lang: "es"` on ES pages; thank-you redirect not on the `/es/` path
- any page missing its self-canonical or the hreflang en/es/x-default triplet; any internal link carrying `?lang=`
- footer missing Privacy, Terms, or a cross-link to any city
- phone missing from TCPA, hero, form, footer, final CTA, thank-you
- FAQ 5 inside an accordion; Ismael line missing on ES or present on EN
- reviews not attributed to the real names
- footer advertising paragraph without "Publicidad de abogados" and Robert Hindin as responsible attorney
- x-default not pointing at `/es/` for Huntington Park and Lynwood
