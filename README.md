# Robert Hindin & Associates — city landers

Car-accident landing pages for 14 LA County cities, English and Spanish, one template, zero dependencies.
Same system as the Goldberg hub. Not their copy, not their leaks.

## Locked in

| | |
|---|---|
| Phone, everywhere | **(310) 564-7911** — the CallRail swap target. The office line (310) 473-0337 does not appear on these pages. |
| Office | 11400 W Olympic Blvd, Suite 200, Los Angeles, CA 90064 — the only office, no fake suites |
| Hours | Open 24/7, English and Spanish intake (confirmed by the firm; `site.json → open24`). |
| Proof | 5.0 on {reviewCount} Google reviews (`site.json → reviewCount`, currently 144), Super Lawyers Rising Stars 2022–2026, CAALA, plaintiff-only since 1975 |
| Result | Only the released one: $85,000 offer → $375,000 |
| Form | Name + mobile. "Free case review. We call you." One screen. |
| Reviews | Julio Barberena, Rob Cruize, Chelsea Israelsky, verbatim in English on both languages |
| Spanish | usted only, English city names, Ismael line above the fold, FAQ 5 (papeles / emergencia / idioma) always visible |

## Pages

Every page exists twice: English at `/<path>/`, Spanish at `/es/<path>/`. Pre-rendered, no runtime language swapping. Each carries a self-canonical plus `hreflang` en / es / x-default, and the sitemap repeats the triplet. 78 indexable pages.

**Set A — control** (`/compton/` … `/los-angeles/`, 15 pages × 2 languages). The H1 is the keyword (`Compton Car Accident Lawyer` / `Abogado de Accidentes de Auto en Compton`); the empathy line ("The insurance company already has a lawyer for your Compton crash…") sits directly under it as `p.lead-h2`, styled at the old H1 size so the page looks the same. Single offer, one screen to the form.

**Set B — test** (`/attorneys/compton/` … `/attorneys/los-angeles/`, 15 × 2). Same cities, client-specified heading structure, in this fixed order:

| Level | Heading |
|---|---|
| H1 | {City} Car Accident Lawyers & Attorneys (ES: Abogado de Accidentes de Auto en {City}) |
| H2 | Car accidents in {City}: where they happen and what to do first (local proof) |
| H2 | Ask us about our rental car |
| H2 | Types of cases our {City} car accident attorneys represent |
| H3 ×7 | Red light · Drunk drivers (now also hit and run) · Rear-end · Ride share · Chain reaction · Truck and commercial vehicle · Motorcycle, pedestrian and bicycle |
| H2 | Car accident attorneys in {City}, CA open 24 hours |
| H2 | Why turn to a car accident attorney in {City} after a crash |
| H3 ×5 | No fees unless we win · Over $500 million won · We fight to get you paid while you recover · Award winning … {City} and all of Los Angeles County · Free car accident consultations |
| H2 | Schedule a free consultation with our {City} car accident attorneys |

`qa.js` asserts that exact sequence on all 30 set-B pages and fails the build on any drift. Client reviews sit below the last specified H2 so the outline is uninterrupted. Set B carries two lead forms (hero and bottom) and its own thank-you page at `/attorneys/thank-you/` so the hours copy never contradicts itself.

**Sitelink / campaign pages** (× 2 languages), built for Google Ads sitelink extensions:

`/no-fee-unless-we-win/` · `/reviews/` · `/settlements/` · `/24-7-case-review/` · `/maximize-your-compensation/` · `/our-team/`

**Other:** `/` hub (three sections: set A, set B, sitelinks), `/privacy/`, `/terms/`, `/thank-you/` and `/attorneys/thank-you/` (both `noindex`).

## Per-city overrides (set B)

`src/strings/b.overrides.json` changes individual set-B pages without touching the other cities: title, meta description, H1, hero tagline, hero subhead, extra hero bullets, extra H2 sections (placed after the local-proof section and before the attorney's specified headings, whose order QA still enforces) and extra `areaServed` entries. Since the Quality Score pass, titles, H1s and meta descriptions come from `b.<lang>.json` for every city; the only title override left is Huntington Park, which drops "Free 24/7 Case Review" for length.

| Page | From | What changed |
|---|---|---|
| `/attorneys/los-angeles/` | Ads keyword review, 30 Sep; QS spec, 12 Oct | Auto accident / car wreck section; Beverly Hills, Woodland Hills, Long Beach section and schema; car-crash tagline; EN and ES hero subheads naming truck, motorcycle, pedestrian, Uber/Lyft and hit and run (camión, moto, Uber, choque y fuga, "abogado de accidente de carro", "Los Ángeles") |
| `/attorneys/van-nuys/` | Ads keyword review, 30 Sep | "Near you" section; hero bullets matching the ad (next-day doctor, rental car); Van Nuys case copy. The old "What to know" section became the local-proof section, plus the courthouse and neighborhoods bullets |
| `/attorneys/huntington-park/` | QS spec, 12 Oct | Shorter title |

**Firm to confirm on `/attorneys/van-nuys/`** before scaling spend:
- The firm meets clients at home, in the hospital, or by video.
- Next-day doctor appointments and the rental-car offer, as worded (both mirror the live ad).
- Local facts, checked against official sites on 30 Sep 2026: LAPD Valley Traffic Division at 7870 Nollan Place, Panorama City; LAPD reports via LexisNexis BuyCrash or by mail, which LAPD says can take two months or more; Van Nuys Courthouse West at 14400 Erwin Street Mall handling general civil. The CHP office is deliberately not named.
- The Van Nuys ad still says "130+ Google Reviews"; the profile shows 144.

## Claims on the pages

Confirmed by the firm and now stated site-wide:

| Claim | Where | Source of truth |
|---|---|---|
| 24/7 intake, English and Spanish | Header, hours, footer, set B H2, `/24-7-case-review/`, JSON-LD `openingHoursSpecification` | `site.json → open24` |
| "Over $500 million won" / "Más de $500 millones" | Set B H3 and hero, meta descriptions, `/settlements/` | `site.json → totalRecovered` (one value per language, so Spanish never says "million") |
| Award winning | Set B H3 | Super Lawyers Rising Stars 2022–2026, CAALA |
| Licensed since 1975 | Throughout | Original brief |
| 5.0 from 144 Google reviews | Throughout, plus a "Read all 144 reviews on Google" link beside the 5.0 chip in every form | `site.json → reviewCount`. Strings use `{reviewCount}`; `qa.js` fails if a literal count creeps back in. Bump it monthly |

Both sets now state the same hours, so nothing on the site contradicts itself. Setting `open24` to `false` reverts the copy and the structured data together; `qa.js` fails the build if any page states Mon–Fri hours while the flag is on.

Note: the firm described the practice as "over 30 years." The pages say **licensed since 1975** and "five decades," which came from the original brief and is the stronger, still-accurate claim. If 1975 is wrong, it is in `strings/*.json` and the legal pages.

## Quality Score pass (12 Oct 2026)

Done from "Landing page changes required for Quality Score ≥ 6". `qa.js` checks each item on every affected page.

| Spec | What changed |
|---|---|
| §1.3 | `lead_submit` now fires on the thank-you URL with `language`, `city`, `keyword`. Hidden `gclid` field on every lead form |
| §1.4 | Clarity capped at 20% of sessions; privacy policy (EN/ES) updated to say so |
| §2.1 | Set B: H1 `{City} Car Accident Lawyers & Attorneys`, title `{City} Car Accident Lawyer \| Free 24/7 Case Review \| Robert Hindin & Associates`, keyword-first meta description with no phone number. Spanish: `Abogado de Accidentes de Auto en {City}` in H1 and title |
| §2.2 | Set A: keyword H1, emotional line kept at the same size as `p.lead-h2` |
| §2.3 | Every sitelink page's first paragraph says "car accident lawyer(s)" / "abogado(s) de accidentes de auto" |
| §3 | Local-proof section on all 60 city pages (both sets, both languages); six `local__proof` lines rewritten with a specific local fact |
| §4 | "$500 millones" in Spanish; truck and motorcycle/pedestrian/bicycle cards; hit and run / choque y fuga; reviews link beside the 5.0 chip; review count in one place; set-B footer links stay in set B; `data-keyword` |
| §5 | CSS inlined, hero `srcset`, small logo, Formspree preconnect, sticky bar safe-area padding and hide-on-typing |
| §6 | "What to say when you call" box; Ismael's face on the Spanish hero; urgent call line on the thank-you page |
| §7 | Keyword matrix checked automatically: title, H1 and first 150 words of every set-B page |

**Lighthouse, mobile, simulated throttling** (local build; the sandbox blocks third-party hosts, so the Google tag, Clarity and CallRail did not load in either run. Expect real-world TBT to be higher):

| Page | Perf | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| `/attorneys/compton/` before | 92 | 1.4 s | 2.7 s | 230 ms | 0 |
| `/attorneys/compton/` after (3 runs) | 99–100 | 1.1–1.2 s | 1.7–1.8 s | 0–80 ms | 0 |
| `/es/attorneys/compton/` before | 97 | 1.1 s | 2.4 s | 90 ms | 0 |
| `/es/attorneys/compton/` after (3 runs) | 99–100 | 1.2–1.4 s | 1.7 s | 0 ms | 0 |

Re-run on the live URLs with PageSpeed Insights after deploy; the target is LCP ≤ 2.0 s, INP ≤ 200 ms, CLS ≤ 0.05 on a mid-tier Android.

**Deliberately not done**

- *"Average call-back: under 5 minutes"* (§6.2). Only if intake can prove it; the pages make no time promise.
- *Thank-you "we're already dialing you"* (§6.6). Intake answers 24/7 (and the thank-you page says call-backs come day or night), but an instant call-back is a separate promise. The line says "If it's urgent, call us now at (310) 564-7911 — you don't have to wait for us to call."
- *Scroll-50% phone slide-in* (§6.5). The mobile sticky call bar is already on screen at all times, and a second overlay would sit on top of it and the form. Revisit if the sticky bar's click share drops.
- *Review dates* (§4.4). `reviews.json` accepts `"date": "2026-08"` per review and renders "August 2026" beside the badge, but no dates are filled in: they need to come from the Google profile, not guesses.
- *GTM changes* (§1.4, §5.5). GTM is not on these pages; there is one async Google tag.

**Account-side (no page change)**

- §1.1 call conversions. (310) 564-7911 is the CallRail swap number, so use **option B**: in CallRail turn on the Google Ads integration with qualified call ≥ 60 s, import it as a Primary "Phone call lead" (value 250), and leave Google's own website-call swap **off** (two swappers on one number break both). Use a Google Ads DNI pool of at least four numbers. Option A in the spec assumes GTM on the landers, which was removed on 29 Sep.
- §1.2 `phone_click` stays Secondary.
- §1.3 "Form Capture" is a duplicate of `lead_submit`; leave it Secondary or remove it.

**Firm to confirm**

- The report-request wording on each city page (station, records unit, CHP 190 form). CHP area offices are not named because which office covers Pomona and Palmdale freeways could not be confirmed.
- The six rewritten `local__proof` lines and the two new set-B case cards.

## Asset caching and speed

`styles.css` (about 26 KB, 6 KB gzipped) is **inlined into every page** at build time, so the first paint no longer waits on a stylesheet request. `lander.js` is still a file and is **content-hashed** (`lander.9b35f98d.js`) because `/assets/` carries a seven-day cache header. `qa.js` fails the build if a page links a stylesheet or an unhashed script.

The hero photo ships at 480, 640 and 1080 px with `srcset`/`sizes` (it displays at 220–330 px, so phones get the 480), the header logo is a 210/420 px PNG pair instead of the 1101 px original, and every page preconnects to googletagmanager.com, cdn.calltrk.com and formspree.io. Fonts are system fonts, so there is nothing to self-host.

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
- **What to say when you call:** a three-bullet box under the hero call button (when and where, where it hurts, whether you've talked to an insurer), to take the anxiety out of dialing.
- **Spanish hero:** Ismael's headshot sits in the "Hablamos español las 24 horas" callout beside the call button.
- **Mobile sticky bar:** call takes two thirds of the width, the form one third. It clears the iPhone home indicator and hides while a form field has focus, so it never covers the submit button.
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
  localproof.json    per-city local proof EN+ES: crash hotspots, who takes the report, nearest ERs, why it matters
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
  "practice": "car", "page", "source" (UTM/gclid/referrer JSON), "kw", "keyword", "gclid", "submitted_at", "tcpa",
  "_subject": "New lead: Compton (ES, rear-end) — <name>" }
```

then redirects to the thank-you page in the same language. When empty (staging) it redirects without posting. On a failed POST it shows the phone number instead of eating the lead. Honeypot field `website`.

- `gclid` is a hidden field filled from the URL's `gclid`, else the `_gcl_aw` cookie the Google tag sets on ad clicks, else whatever an earlier page in the same tab saw. It arrives in the Formspree notification so intake can match a signed case to the click.
- `keyword` is the raw `?kw=` / `utm_term` value, cleaned and cut to 80 characters, for reporting only. `kw` remains the allowlisted token.

## Thank-you page

After the lead posts, the page stores name/phone/city in `sessionStorage` and redirects to `/thank-you/?lang=<lang>`. There the person can answer four optional questions (when the crash was, seen a doctor, insurer contact, what happened). Those post to the same Formspree form as a second submission with subject "Lead details: <city> — <name> <phone>", so intake can match them to the lead. The page also offers a vCard (`assets/rha.vcf`), the three next steps, the firm bio and result, a "Find out more about us" button to `site.json → corporateUrl` (opens in a new tab with UTM tags), and the reviews. `googleReviewsUrl` is the firm's Google Business Profile share link, shown as a "Read our Google reviews" button (no UTM appended, to keep the Google redirect intact).

## Deploy (Vercel)

`vercel.json` sets the output directory to `dist`, trailing slashes on (matches the canonicals), and cache headers for `/assets/`. Build command is `npm run build`. Node is pinned to 22.x.

## Analytics

One Google tag, loaded once, configured once:

| ID | What it is |
|---|---|
| `GT-WVG5SWDZ` | The Google tag installed on every page (`site.json → googleTagId`) |
| `G-BBKS7FGRKP` | GA4 property — a destination of that tag |
| `AW-18388471482` | Google Ads — a destination of that tag |
| `GT-WRHLFHMJ` | Serves the identical bundle; not loaded separately, which would double-fire |

Only the Google tag id is configured. Configuring its destinations as well would send each `page_view` twice.

**Never on these pages** (`site.json → blockedTagIds`, enforced by `qa.js`): `G-K9CNL0LV5B`, `GT-T5N4JM8K` and container `GTM-N7PDDTKX`. They belong to the main site. The container was removed on 29 Sep 2026: on the landers it only sent traffic to `G-K9CNL0LV5B` and loaded a second copy of ClickCease.

**ClickCease was removed** on 29 Sep 2026 at the firm's request. `qa.js` fails if it returns.

Page events, each with `lang`, `language`, `city`, `kw`, `keyword`, `variant`: `lead_submit`, `lead_details`, `lead_error`, `phone_click`, `lang_toggle`, `vcard`, `corporate_click`, `reviews_click`. They go to both destinations; Google Ads ignores any not set up as a conversion.

**`lead_submit` fires on the thank-you page**, once per lead: the form page leaves a marker in `sessionStorage` and `/thank-you/` (or `/attorneys/thank-you/`, `/es/…`) reports it and clears it, so the redirect can't swallow the event and a reload can't count it twice. If the browser blocks session storage, it fires on the form page instead. Keep `lead_submit` as the GA4 key event imported into "Submit lead form (Google Analytics event form)" (Primary). `phone_click` is diagnostics only: it is **Secondary** in Google Ads since 12 Oct and must not be promoted again.

**Privacy.** Google Ads remarketing can count as "sharing" under California law, and the privacy policy now says so. A visitor whose browser sends Global Privacy Control gets ad personalization switched off automatically. Whether the firm also needs a "Do Not Sell or Share" footer link depends on whether it meets the CCPA thresholds, which is a question for its counsel.

### Scripts on every page

| Script | Loads | Why |
|---|---|---|
| Google tag `GT-WVG5SWDZ` | head, async | GA4 and Google Ads |
| Microsoft Clarity `yql9v07dy8` | head, async, **20% of sessions** | Session recordings and heatmaps. Sampled per tab session (`site.json → claritySampleRate`), so a sampled visitor is recorded on every page and the rest load nothing. Every form carries `data-clarity-mask="True"`, so names, phone numbers and the "what happened" box are never recorded |
| CallRail swap | end of body, async | Swaps the tracking number |

`preconnect` is set for googletagmanager.com, cdn.calltrk.com and formspree.io. None of the scripts blocks HTML parsing.

## Call tracking (CallRail)

Every page shows one number, (310) 564-7911, in text and in every `tel:` link, so CallRail dynamic number insertion has a single swap target. The CallRail swap script (`site.json → callrailSwapUrl`, company 929322410) loads at the end of `<body>` on every page. In CallRail the website-visitor pool's swap target must be 310-564-7911.

## Keyword match (`?kw=`)

Page-side dynamic keyword insertion, allowlisted. `?kw=rear-end` (or `utm_term` when it exactly matches a token) swaps only the first sentence of the hero subhead, in whichever language is showing. Tokens live in `src/keywords.json`:

`rear-end`, `uber`, `lyft`, `hit-and-run`, `drunk-driver`, `truck`, `motorcycle`, `pedestrian`, `bicycle`, `freeway`, `intersection`, `passenger`, `whiplash`

Anything not on the list is ignored and the default copy shows. Raw search terms never appear in the page copy (they are kept only as `data-keyword` and the `keyword` field, for reporting). The token is sent with the lead as `kw` and on every `dataLayer` event. Ad ops: put `kw=<token>` in the ad group's final URL suffix.

## Assets

- `src/assets/logo-white.png` — the firm's white logo (1101×180, transparent), used in structured data. The header uses `logo-white-210.png` / `logo-white-420.png` (1x / 2x).
- `src/assets/img/hindin-team.webp` — Robert and Kyle Hindin, cutout on transparent, in the hero, with 480 and 640 px variants for `srcset`.
- `src/assets/img/team/ismael-noriega-96.webp` — Ismael's headshot for the Spanish hero callout.

## Wave 2

Dedicated truck and motorcycle landers (Spanish copy in `src/strings/es.json → wave2`) are not rendered. Ship them only after the car pages convert. Set B already carries a truck card and a motorcycle / pedestrian / bicycle card so those searchers land on a page that mentions their crash.

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
