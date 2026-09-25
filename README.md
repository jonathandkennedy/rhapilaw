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

Every page exists twice: English at `/<path>/`, Spanish at `/es/<path>/`. Pre-rendered, no runtime language swapping. Each carries a self-canonical plus `hreflang` en / es / x-default, and the sitemap repeats the triplet. 78 indexable pages.

**Set A — control** (`/compton/` … `/los-angeles/`, 15 pages × 2 languages). Empathy-led H1, single offer, one screen to the form. Hours: Mon–Fri 8am–5pm.

**Set B — test** (`/attorneys/compton/` … `/attorneys/los-angeles/`, 15 × 2). Same cities, client-specified heading structure, in this fixed order:

| Level | Heading |
|---|---|
| H1 | {City} car accident attorneys |
| H2 | Types of cases our {City} car accident attorneys represent |
| H3 ×5 | Red light · Drunk drivers · Rear-end · Ride share · Chain reaction |
| H2 | Car accident attorneys in {City}, CA open 24 hours |
| H2 | Why turn to a car accident attorney in {City} after a crash |
| H3 ×5 | No fees unless we win · Over $500 million won · We fight to get you paid while you recover · Award winning … {City} and all of Los Angeles County · Free car accident consultations |
| H2 | Schedule a free consultation with our {City} car accident attorneys |

`qa.js` asserts that exact sequence on all 30 set-B pages and fails the build on any drift. Client reviews sit below the last specified H2 so the outline is uninterrupted. Set B carries two lead forms (hero and bottom) and its own thank-you page at `/attorneys/thank-you/` so the hours copy never contradicts itself.

**Sitelink / campaign pages** (× 2 languages), built for Google Ads sitelink extensions:

`/no-fee-unless-we-win/` · `/reviews/` · `/settlements/` · `/24-7-case-review/` · `/maximize-your-compensation/` · `/our-team/`

**Other:** `/` hub (three sections: set A, set B, sitelinks), `/privacy/`, `/terms/`, `/thank-you/` and `/attorneys/thank-you/` (both `noindex`).

## Claims on the pages

Confirmed by the firm and now stated site-wide:

| Claim | Where | Source of truth |
|---|---|---|
| 24/7 intake, English and Spanish | Header, hours, footer, set B H2, `/24-7-case-review/`, JSON-LD `openingHoursSpecification` | `site.json → open24` |
| "Over $500 million won" | Set B H3, `/settlements/` | `site.json → totalRecovered` |
| Award winning | Set B H3 | Super Lawyers Rising Stars 2022–2026, CAALA |
| Licensed since 1975 | Throughout | Original brief |
| 5.0 from 144 Google reviews | Throughout | The firm's Google Business Profile |

Both sets now state the same hours, so nothing on the site contradicts itself. Setting `open24` to `false` reverts the copy and the structured data together; `qa.js` fails the build if any page states Mon–Fri hours while the flag is on.

Note: the firm described the practice as "over 30 years." The pages say **licensed since 1975** and "five decades," which came from the original brief and is the stronger, still-accurate claim. If 1975 is wrong, it is in `strings/*.json` and the legal pages.

## Asset caching

`/assets/` carries a seven-day cache header, so `styles.css` and `lander.js` are **content-hashed at build time** (`styles.9a696a27.css`) and every HTML reference is rewritten to match. Without this a CSS change is invisible to returning visitors for a week — which is exactly what happened once. `qa.js` fails the build if any page links an unhashed stylesheet or script.

## Photos

Real firm photography only — no stock. `src/assets/img/team/` holds five 480px square WebP headshots (80 KB for all five), all lazy-loaded below the fold so the text hero stays the largest contentful paint.

| Where | What |
|---|---|
| `/our-team/` | All five headshots, one per person, with role and bio |
| City + set-B "who handles your case" | Kyle, Robert, and an Abby + Ismael pair |
| Set-B award-winning claim | Overlapping row of all five faces |
| Sitelink mid-article CTA | Three faces beside the call button (not on `/our-team/`) |

**Roster confirmed** against the firm's own staff page:

| File | Person | Role |
|---|---|---|
| `robert-hindin.webp` | Robert Hindin | Founder, licensed in California since 1975 |
| `kyle-hindin.webp` | Kyle Hindin | Attorney |
| `abigail-noriega.webp` | Abigail Noriega | Senior Case Manager (clients call her Abby) |
| `ismael-noriega.webp` | Ismael Noriega | Hispanic Community Specialist |
| `felix-trauernicht.webp` | Felix Trauernicht | Loss Management Specialist |
| `jesimiel-trauernicht.webp` | Jesimiel Trauernicht | Records and Invoicing Specialist |

Jesimiel's headshot was cropped from a screenshot and is 302px rather than 480px — swap in the original when it is to hand. Corbin appears in one client review but is not on the current staff page, so his name survives only inside that verbatim quote. `qa.js` asserts all six names and files and fails if Corbin is listed as staff.

## Built for phone calls

Calls are the primary conversion on every one of the 78 pages; the form is the fallback for people who won't call.

- **Header:** the phone number is a red button labelled "Call 24/7", on every page. The form link is demoted to a text link beside it.
- **Hero:** a large call button with the number spelled out, above the fold at every breakpoint, with "leave your number and we call you" as the secondary path.
- **Form card:** the call button sits *above* the fields, with an "or leave your number" divider under it.
- **Call bands:** full-width red bands with a single call button, twice inside every city and set-B page.
- **Mobile sticky bar:** call takes two thirds of the width, the form one third.
- **Sitelink pages:** trust chips and a call button above the fold, the form directly beneath the hero rather than below the article, an intent-matched mid-article CTA, and cross-links to the other five pages.

`qa.js` enforces this: every page needs the header call button, at least four `tel:` links, and a call link appearing before the first form in DOM order. City and set-B pages need at least two call bands.

## Tracking the A/B split

Every set-B page carries `data-variant="b"` on `<html>`, a hidden `variant` field on both forms, and `variant` on every `dataLayer` / GA4 event. In GA4, compare by that parameter or by page path (`/attorneys/` = B).

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
