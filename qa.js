#!/usr/bin/env node
/* QA for dist/: Spanish checklist (§7.15), locked facts, hreflang/canonical integrity, footer, legal pages. Exit 1 on failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const DIST = path.resolve(__dirname, process.argv[2] || "dist");
const site = JSON.parse(fs.readFileSync(path.join(__dirname, "src/site.json"), "utf8"));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, "src/cities.json"), "utf8"));
const ES = JSON.parse(fs.readFileSync(path.join(__dirname, "src/strings/es.json"), "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(__dirname, "src/strings/en.json"), "utf8"));
const KW = JSON.parse(fs.readFileSync(path.join(__dirname, "src/keywords.json"), "utf8"));
const SITELINKS = JSON.parse(fs.readFileSync(path.join(__dirname, "src/sitelinks.json"), "utf8"));
const BEN = JSON.parse(fs.readFileSync(path.join(__dirname, "src/strings/b.en.json"), "utf8"));
const BES = JSON.parse(fs.readFileSync(path.join(__dirname, "src/strings/b.es.json"), "utf8"));
function headings(html) {
  return [...html.matchAll(/<(h[123])[^>]*>([\s\S]*?)<\/\1>/g)].map(m => m[1] + " " + m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
}
const PHONE = "(310) 564-7911";
const BASE = site.baseUrl.replace(/\/$/, "");
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log("  FAIL  " + msg); } }
function strip(html) { return html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " "); }
function flat(o) { return Object.keys(o).filter(k => typeof o[k] === "string").map(k => [k, o[k]]); }
function read(p) { return fs.readFileSync(path.join(DIST, p.replace(/^\//, ""), "index.html"), "utf8"); }
const TU = /\b(tú|ti|contigo|tuyo|tuya|tuyos|tuyas|tu|tus|te)\b/i;

console.log("Spanish strings");
{
  for (const [k, v] of flat(ES)) ok(!TU.test(v.replace(/<[^>]+>/g, " ")), `es.${k} uses tú-register: "${(v.match(TU) || [])[0]}"`);
  // 24/7 phrasing was banned while the office was Mon–Fri; the firm has since confirmed round-the-clock intake.
  const BAD = [/\bevaluaci[oó]n\b/i, /\bbufete\b/i, /sin cargos hasta ganar/i, /Comptonía/i, /Parque Huntington/i];
  for (const [k, v] of flat(ES)) for (const re of BAD) ok(!re.test(v), `es.${k} matches banned phrase ${re}`);
  ok((flat(ES).map(([, v]) => v).join(" ").match(/compañía de seguros/gi) || []).length <= 1, `"compañía de seguros" over limit`);
  ok(!/Lesionado en un accidente de auto en/i.test(ES.hero_h1), "hero_h1 is the Goldberg H1");
  ok(/en \{City\}\./.test(ES.hero_h1), "hero_h1 must end its first line with 'en {City}.'");
  for (const k of ["form_tcpa", "hero_call", "form_orcall", "footer_office", "final_p", "ty_body"]) ok(ES[k].includes(PHONE), `es.${k} missing phone`);
  ok(/Robert Hindin/.test(ES.footer_ad) && /Publicidad de abogados/.test(ES.footer_ad), "footer_ad: responsible attorney");
  ok(/Ismael/.test(ES.ismael) && /Ismael/.test(ES.faq_5_a), "Ismael missing");
  ok(/papeles/.test(ES.faq_5_q) && /emergencia/.test(ES.faq_5_q) && /ingl[eé]s/.test(ES.faq_5_q), "FAQ 5 coverage");
  for (const [L, S] of [["en", EN], ["es", ES]])
    for (const k of ["call_sub", "form_note", "hours", "footer_hours", "ty_hours"])
      ok(!/8am–5pm|Monday–Friday|lunes a viernes|Mon–Fri|Lun–Vie/i.test(S[k]), `${L}.${k} still states Mon–Fri hours while open24 is on`);
  ok(site.open24 === true, "site.open24 must be set while the copy claims 24/7 intake");
  ok(ES.res_offer === "$85,000" && ES.res_result === "$375,000" && EN.res_offer === "$85,000" && EN.res_result === "$375,000", "results must be the one released case");
  const ek = Object.keys(EN).filter(k => typeof EN[k] === "string"), sk = Object.keys(ES).filter(k => typeof ES[k] === "string");
  ok(ek.every(k => k in ES) && sk.every(k => k in EN), "EN/ES key parity: " + ek.filter(k => !(k in ES)).concat(sk.filter(k => !(k in EN))).join(","));
  for (const f of ["privacy.es.html", "terms.es.html"]) {
    const txt = fs.readFileSync(path.join(__dirname, "src/legal", f), "utf8").replace(/<[^>]+>/g, " ");
    ok(!TU.test(txt), `legal/${f} uses tú-register: "${(txt.match(TU) || [])[0]}"`);
  }
  for (const e of SITELINKS) {
    const txt = fs.readFileSync(path.join(__dirname, "src/sitelinks", `${e.slug}.es.html`), "utf8").replace(/<[^>]+>/g, " ");
    ok(!TU.test(txt), `sitelinks/${e.slug}.es.html uses tú-register: "${(txt.match(TU) || [])[0]}"`);
  }
  for (const [k, v] of Object.entries(BES)) {
    if (k[0] === "_" || typeof v !== "string") continue;
    ok(!TU.test(v.replace(/<[^>]+>/g, " ")), `b.es.${k} uses tú-register`);
  }
  for (const [S, B, L] of [[EN, BEN, "en"], [ES, BES, "es"]]) {
    const first = S.hero_kw.replace(/[.!?]$/, "").toLowerCase();
    ok(!B.b_hero_sub.toLowerCase().startsWith(first), `b.${L}.b_hero_sub repeats the hero_kw sentence that precedes it`);
    ok(!S.hero_sub.toLowerCase().startsWith(first), `${L}.hero_sub repeats the hero_kw sentence that precedes it`);
  }
  const bek = Object.keys(BEN).filter(k => k[0] !== "_"), bsk = Object.keys(BES).filter(k => k[0] !== "_");
  ok(bek.every(k => k in BES) && bsk.every(k => k in BEN), "variant B EN/ES key parity");
}

console.log("Keyword allowlist");
for (const k of Object.keys(KW)) {
  if (k === "_note") continue;
  ok(/^[a-z0-9-]+$/.test(k), `keywords.${k}: token charset`);
  ok(typeof KW[k].en === "string" && typeof KW[k].es === "string", `keywords.${k}: needs en + es`);
  ok(!TU.test(KW[k].es || ""), `keywords.${k}: tú-register`);
  ok(/\.$/.test(KW[k].en) && /\.$/.test(KW[k].es), `keywords.${k}: must end with a period`);
}

console.log("Built pages");
const spanishDefault = cities.filter(c => c.defaultLang === "es").map(c => c.name);
ok(spanishDefault.length === 2 && spanishDefault.includes("Huntington Park") && spanishDefault.includes("Lynwood"), "Spanish-default cities: " + spanishDefault.join(", "));

/** Checks shared by every page: canonical self, hreflang triplet, footer, no ?lang in internal links, phone, no 24/7. */
function common(label, html, lang, logical, xDefaultLang, indexable, allow24) {
  const text = strip(html);
  const en = `${BASE}${logical}`, es = `${BASE}/es${logical}`, self = lang === "es" ? es : en, xd = xDefaultLang === "es" ? es : en;
  ok(html.includes(`<html lang="${lang}"`), `${label}: html lang`);
  ok(html.includes(`<link rel="canonical" href="${self}">`), `${label}: canonical must be self (${self})`);
  ok(html.includes(`<link rel="alternate" hreflang="en" href="${en}">`), `${label}: hreflang en`);
  ok(html.includes(`<link rel="alternate" hreflang="es" href="${es}">`), `${label}: hreflang es`);
  ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${xd}">`), `${label}: hreflang x-default -> ${xd}`);
  ok(!/href="[^"]*[?&]lang=/.test(html), `${label}: internal link still uses ?lang=`);
  ok(html.includes(indexable ? 'content="index, follow"' : 'content="noindex, nofollow"'), `${label}: robots`);
  ok(html.includes(`href="${lang === "es" ? "/es" : ""}/privacy/"`) && html.includes(`href="${lang === "es" ? "/es" : ""}/terms/"`), `${label}: footer privacy/terms links`);
  for (const c of cities) ok(html.includes(`href="${lang === "es" ? "/es" : ""}/${c.slug}/"`), `${label}: footer cross-link to ${c.name}`);
  ok(html.includes(`href="${lang === "es" ? "" : "/es"}${logical}"`), `${label}: footer/header link to other language`);
  ok(text.includes("11400 W Olympic Blvd, Suite 200"), `${label}: office address`);
  ok((text.match(/\(310\) 564-7911/g) || []).length >= 3, `${label}: phone`);
  ok(!/\b512\b/.test(text) && !/473-0337/.test(text), `${label}: wrong number (512 or office line) on page`);
  ok(!/8am.?5pm|Monday.?Friday|lunes a viernes/i.test(text), `${label}: states Mon–Fri hours while the site claims 24/7`);
  ok(/00:00/.test(html) ? true : !/"opens":"08:00"/.test(html), `${label}: structured data still says 08:00–17:00`);
  ok(!/\{City\}|\{serve\}|\{local\}|\{year\}|\{\{/.test(html), `${label}: unsubstituted token`);
  ok(!/data-i18n/.test(html), `${label}: runtime i18n hooks leaked into output`);
  ok(html.includes("gtag('config','G-K9CNL0LV5B')") && html.includes("gtag('config','G-BBKS7FGRKP')") && html.includes("GTM-N7PDDTKX"), `${label}: analytics tags`);
  ok(html.includes('src="//cdn.calltrk.com/companies/929322410/22fcab48a6ebb6eff8c0/12/swap.js"'), `${label}: CallRail swap script`);
  ok(html.includes('class="ct_clicktrue"') && html.includes("ob.belvionetta.com/i/") && html.includes("ob.belvionetta.com/ns/"), `${label}: ClickCease script + noscript`);
  if (lang === "es") ok(!TU.test(text.replace(/Kyle, Abby, and Ismael[\s\S]*?recover\./g, "")), `${label}: tú-register on ES page`);
}

for (const c of cities) for (const lang of ["en", "es"]) {
  const logical = `/${c.slug}/`;
  const label = (lang === "es" ? "/es" : "") + logical;
  const html = read((lang === "es" ? "/es" : "") + logical);
  const text = strip(html);
  common(label, html, lang, logical, c.defaultLang, true, false);
  ok(html.includes(`<input type="hidden" name="lang" value="${lang}">`), `${label}: form lang`);
  ok(html.includes(`data-thankyou="${lang === "es" ? "/es" : ""}/thank-you/"`), `${label}: thank-you redirect in page language`);
  ok(!/Google Guaranteed/i.test(text), `${label}: fake badge`);
  ok(!/130\+/.test(text), `${label}: stale 130+ review count`);
  ok(html.includes('id="faq-5"') && !/<details/.test(html), `${label}: FAQ not an accordion`);
  for (const n of ["Julio Barberena", "Rob Cruize", "Chelsea Israelsky"]) ok(text.includes(n), `${label}: review ${n}`);
  ok(html.includes('window.__RHA_KW=') && html.includes('<input type="hidden" name="kw" value="">') && html.includes('class="kw"'), `${label}: keyword swap wired`);
  ok((html.match(/class="callband/g) || []).length >= 2, `${label}: needs at least two mid-page call bands`);
  ok(html.includes('class="hero__cta"'), `${label}: hero call CTA`);
  ok(html.includes('"@type":"LegalService"') && html.includes(`"inLanguage":"${lang}"`), `${label}: JSON-LD`);
  if (lang === "es") {
    if (!c.isDefault) ok(text.includes(`para su choque en ${c.name}.`), `${label}: ES H1 city splice`);
    ok(/<p class="ismael" >/.test(html) || /<p class="ismael">/.test(html), `${label}: Ismael line must be visible on ES`);
    ok(text.includes("No tengo papeles"), `${label}: FAQ 5`);
    ok(text.includes("Reseñas reales de Google"), `${label}: ES review frame`);
    ok(text.includes("Publicidad de abogados") && text.includes("Abogado responsable: Robert Hindin"), `${label}: ES footer advertising`);
  } else {
    ok(/<p class="ismael" hidden>/.test(html), `${label}: Ismael line hidden on EN`);
    ok(text.includes(`for your ${c.name} crash.`), `${label}: EN H1`);
  }
}

console.log("Variant B (test set)");
for (const c of cities) for (const lang of ["en", "es"]) {
  const logical = `/attorneys/${c.slug}/`;
  const label = (lang === "es" ? "/es" : "") + logical;
  const html = read((lang === "es" ? "/es" : "") + logical);
  const B = lang === "es" ? BES : BEN;
  common(label, html, lang, logical, c.defaultLang, true, true);
  const sub = v => v.replace(/\{City\}/g, c.name).replace(/\{totalRecovered\}/g, site.totalRecovered).replace(/&amp;/g, "&");
  const want = [
    "h1 " + sub(B.b_h1),
    "h2 " + sub(B.b_h2_cases),
    "h3 " + sub(B.b_case_1_t), "h3 " + sub(B.b_case_2_t), "h3 " + sub(B.b_case_3_t), "h3 " + sub(B.b_case_4_t), "h3 " + sub(B.b_case_5_t),
    "h2 " + sub(B.b_h2_24h),
    "h2 " + sub(B.b_h2_why),
    "h3 " + sub(B.b_why_1_t), "h3 " + sub(B.b_why_2_t), "h3 " + sub(B.b_why_3_t), "h3 " + sub(B.b_why_4_t), "h3 " + sub(B.b_why_5_t),
    "h2 " + sub(B.b_h2_schedule),
  ];
  const got = headings(html);
  for (let i = 0; i < want.length; i++) ok(got[i] === want[i], `${label}: heading ${i + 1} must be "${want[i]}" — got "${got[i]}"`);
  ok((html.match(/class="lead-form"/g) || []).length === 2, `${label}: two lead forms (hero + schedule)`);
  ok((html.match(/id="lead"/g) || []).length === 1 && html.includes('id="lead-bottom"'), `${label}: unique form ids`);
  ok((html.match(/<h1/g) || []).length === 1, `${label}: exactly one H1`);
  ok(html.includes(`data-thankyou="${lang === "es" ? "/es" : ""}/attorneys/thank-you/"`), `${label}: variant B thank-you`);
  ok(html.includes('<input type="hidden" name="variant" value="b">'), `${label}: variant flag on the lead`);
  ok(html.includes('data-variant="b"'), `${label}: variant attribute for analytics`);
  ok(html.includes(site.totalRecovered), `${label}: recovered total`);
  ok((html.match(/class="callband/g) || []).length >= 2, `${label}: needs at least two mid-page call bands`);
  ok(html.includes('class="hero__cta"'), `${label}: hero call CTA`);
  ok(!/\bTravis\b|\bAustin\b|\bTexas\b|, TX\b/.test(strip(html)), `${label}: Texas copy leaked in`);
}

console.log("Sitelink pages");
for (const e of SITELINKS) for (const lang of ["en", "es"]) {
  const logical = `/${e.slug}/`;
  const label = (lang === "es" ? "/es" : "") + logical;
  const html = read((lang === "es" ? "/es" : "") + logical);
  common(label, html, lang, logical, "en", true, true);
  ok(html.includes(`<h1>${e[lang].h1.replace(/&/g, "&amp;")}</h1>`) || html.includes(`<h1>${e[lang].h1}</h1>`), `${label}: H1`);
  ok((html.match(/<h1/g) || []).length === 1, `${label}: exactly one H1`);
  ok(/class="lead-form"/.test(html), `${label}: lead form`);
  ok(html.includes('class="sl__trust"') && html.includes('class="sl__midcta"') && html.includes('class="sl__related"'), `${label}: trust row, mid CTA and related links`);
  ok(html.indexOf('class="sl__side"') < html.indexOf('class="sl__body"'), `${label}: form must precede the article in DOM order (mobile)`);
  ok(html.includes('class="callband'), `${label}: closing call band`);
  ok(strip(html).length > 2500, `${label}: body too thin`);
  ok(!/\{totalRecovered\}/.test(html), `${label}: unsubstituted token`);
}
for (const kind of ["settlements", "reviews"]) {
  for (const lang of ["en", "es"]) {
    const html = read((lang === "es" ? "/es" : "") + `/${kind}/`);
    ok(/result|guarantee|garantizan/i.test(strip(html)), `${kind} ${lang}: prior-results disclaimer`);
  }
}
const REVIEWERS = ["Hans Helmudt", "Karina Sodre", "Julio Barberena", "Geovanny Moreno", "Matt Benson", "Kathleen Francis", "Rob Cruize", "Chelsea Israelsky", "Matt Fenster"];
for (const lang of ["en", "es"]) {
  const html = read((lang === "es" ? "/es" : "") + "/reviews/");
  for (const n of REVIEWERS) ok(strip(html).includes(n), `reviews ${lang}: real reviewer ${n}`);
  ok(strip(html).includes("144"), `reviews ${lang}: review count`);
  ok(!/130\+/.test(strip(html)), `reviews ${lang}: stale 130+ count`);
}

for (const lang of ["en", "es"]) {
  const pre = lang === "es" ? "/es" : "";
  const hub = read(pre + "/");
  common(pre + "/", hub, lang, "/", "en", true, true);
  ok(/class="city-grid"/.test(hub) && !/<form/.test(hub), "hub: grid, no form");
  ok(hub.includes('id="cities"') && hub.includes('id="attorneys"') && hub.includes('id="pages"'), `${pre}/ hub: three sections`);
  for (const c of cities) ok(hub.includes(`href="/attorneys/${c.slug}/"`) && hub.includes(`href="/es/attorneys/${c.slug}/"`), `${pre}/ hub: variant B links to ${c.name}`);
  for (const e of SITELINKS) ok(hub.includes(`href="/${e.slug}/"`) && hub.includes(`href="/es/${e.slug}/"`), `${pre}/ hub: sitelink ${e.slug}`);
  for (const c of cities) ok(hub.includes(`href="/${c.slug}/"`) && hub.includes(`href="/es/${c.slug}/"`), `${pre}/ hub: EN+ES links to ${c.name}`);
  const ty = read(pre + "/thank-you/");
  common(pre + "/thank-you/", ty, lang, "/thank-you/", "en", false, false);
  ok(/class="qual-form"/.test(ty) && ty.includes(`<input type="hidden" name="lang" value="${lang}">`), `${pre}/thank-you/: qualifying form`);
  ok(/href="https:\/\/www\.rhapilaw\.com\?utm_source=lander[^"]*" target="_blank" rel="noopener"/.test(ty), `${pre}/thank-you/: corporate link`);
  ok(ty.includes('href="/assets/rha.vcf"') && fs.existsSync(path.join(DIST, "assets/rha.vcf")), `${pre}/thank-you/: vCard`);
  for (const kind of ["privacy", "terms"]) {
    const html = read(`${pre}/${kind}/`), text = strip(html);
    common(`${pre}/${kind}/`, html, lang, `/${kind}/`, "en", true, true);
    ok(text.length > 4000, `${pre}/${kind}/: body too short (${text.length})`);
    ok(/STOP/.test(text) && /Formspree/.test(text) && /G-K9CNL0LV5B/.test(text.replace(/\s/g, "")) || kind === "terms", `${pre}/${kind}/: privacy specifics`);
    ok(/Robert Hindin/.test(text) && text.includes("11400 W Olympic Blvd"), `${pre}/${kind}/: responsible attorney + address`);
    if (kind === "terms") ok(html.includes(`href="${pre}/privacy/"`), `${pre}/terms/: links privacy`);
  }
}

{
  const sm = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const locs = (sm.match(/<loc>[^<]+<\/loc>/g) || []).length;
  const expect = (cities.length * 2 + SITELINKS.length + 3) * 2;
  ok(locs === expect, `sitemap: expected ${expect} urls, got ${locs}`);
  ok(!/thank-you/.test(sm), "sitemap: thank-you must not be listed");
  ok((sm.match(/hreflang="x-default"/g) || []).length === locs, "sitemap: x-default on every url");
  ok(!/\?lang=/.test(sm), "sitemap: no query variants");
  const v = JSON.parse(fs.readFileSync(path.join(__dirname, "vercel.json"), "utf8"));
  ok(Array.isArray(v.redirects) && v.redirects.length === 2, "vercel.json: ?lang redirects");
}

console.log(`\n${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
