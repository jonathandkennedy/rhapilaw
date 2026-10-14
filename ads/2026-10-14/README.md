# Google Ads changes, 14 Oct 2026

Built from "Quality Score Fix Plan" (13 Oct). The plan's changes are all in the Google Ads account. These files make them ready to import with **Google Ads Editor → Account → Import → From file** (or *Make multiple changes → paste*). Review the preview before posting. Every headline is ≤ 30 characters, every description ≤ 90 and every path ≤ 15; the script that generated them checked this.

## 1. Spanish branded campaign (plan §3.1): do now

`Branded - Search - Spanish - California`, all three RSAs:

| Field | Set to |
|---|---|
| Final URL | `https://results.rhapilaw.com/es/los-angeles/` |
| Path 1 / Path 2 | `abogados` / `los-angeles` (replaces `{location(city):los_angeles}`) |

The current `…/los-angeles/?lang=es` URL already redirects (308) to the Spanish page, so searchers weren't actually seeing English. But Google scores the landing page through a redirect and it splits history, so use the clean `/es/` URL.

## 2. Remove `?lang=es` and the old Spanish ad groups (plan §3.3)

- Delete **Ad group 1** and **Abogado Accidente de Auto** (the old ones, paused) in the Spanish campaign. Their keepers ("abogados de accidentes de carro", "abogado de accidente de carro") are already in `keywords.csv` under *Abogado Accidente de Auto | Los Ángeles (Core)*.
- **Search | Non-Branded | Spanish | Compton** (paused): delete it. The new Spanish campaign's Compton group replaces it. If you keep it, change `/compton/?lang=es` to `https://results.rhapilaw.com/es/compton/`.

## 3. New RSAs with the keyword pinned (plan §3.4): `rsas.csv`

Six RSAs, for the three long city names in each language:

- **English** (Huntington Park, Baldwin Park, Pico Rivera): position 1 is pinned to `Car Accident Lawyer` / `Car Accident Lawyers`, and position 2 to `{City}, CA`.
- **Spanish** (same three cities): position 1 is pinned to `Abogado de Accidentes` / `Abogados de Accidentes`, and position 2 to `{City}, CA`.
- **Paths:** `car-accident/{city}` and `accidentes/{city}`.
- **Final URLs:** unchanged, the existing `/attorneys/{city}/` and `/es/attorneys/{city}/` pages.

Once the new ads are approved, pause the old "Crash Lawyers" / "Accident Attorneys" RSAs in those six groups.

## 4. Attorney Names ad group (plan §3.2)

1. In **Search | Branded | English**, create the ad group **Attorney Names**: copy the existing group's bid settings first, because Editor won't invent them.
2. Import its RSA from `rsas.csv`:
   - position 1 is pinned to `{KeyWord:Robert Hindin}`, so a search for Kyle shows "Kyle Hindin";
   - final URL `/our-team/`.
3. Import its keywords from `keywords.csv`: [kyle hindin], [robert hindin], [hindin law], plus three phrase variants.
4. Remove [kyle hindin], [robert hindin] and [hindin law] from the existing branded group, so the two groups don't compete. Keep [robert hindin & associates] there.

The `/our-team/` page title now starts with "Kyle Hindin & Robert Hindin" (Spanish: "Kyle Hindin y Robert Hindin"), so the landing page matches the search.

## 5. Keyword trim, 5–8 per ad group (plan §3.5): `keywords.csv`

`keywords.csv` has 218 keywords across 31 ad groups. Each group gets 5–8, exact and phrase match only, built on the plan's stems:
- English: `car accident lawyer {city}`, `car accident attorney {city}`, `accident lawyer {city}`.
- Spanish: `abogado de accidentes {city}`, `abogado accidente de auto {city}`, `abogados {city}`.

1. Import the file. Anything already in the account just stays.
2. In each of the 30 MVA ad groups, **pause every keyword that isn't in the file**. Don't delete them, so you can bring back any that later show real volume.
3. Leave negatives alone.

## 6. Optional: set A vs set B test (plan §3.6)

In LA Core, Van Nuys, Compton, Inglewood and Huntington Park:
1. Duplicate the RSA.
2. Change the copy's final URL to set A: `/los-angeles/`, `/van-nuys/`, `/compton/`, `/inglewood/` or `/huntington-park/`, and the `/es/…` equivalents in the Spanish groups.
3. Set ad rotation to **Do not optimize**.

Set A now carries the keyword H1 (`{City} Car Accident Lawyer`) and the local-proof section, so it won't lose on Quality Score before the conversion test is decided.

## 7. Don't touch

The 29 new ad groups' final URLs. Re-check the Quality Score columns on **Oct 27**. Look again only at keywords with more than 100 impressions that still rate "Below average" on landing page.
