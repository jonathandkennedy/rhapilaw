#!/usr/bin/env node
/* Spanish QA checklist (§7.15) run against dist/. Exit 1 on any failure.
 * Also checks the English side for the locked-in facts (phone, office, hours, no 24/7).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const DIST = path.resolve(__dirname, process.argv[2] || "dist");
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, "src/cities.json"), "utf8"));
const ES = JSON.parse(fs.readFileSync(path.join(__dirname, "src/strings/es.json"), "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(__dirname, "src/strings/en.json"), "utf8"));
const KW = JSON.parse(fs.readFileSync(path.join(__dirname, "src/keywords.json"), "utf8"));
const PHONE = "(310) 473-0337";
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log("  FAIL  " + msg); } }
function strip(html) { return html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " "); }
function flat(o) { return Object.keys(o).filter(k => typeof o[k] === "string").map(k => [k, o[k]]); }

// ---- String-level checks on the Spanish master (independent of city) ----
console.log("Spanish strings");
{
  // No tú anywhere. Words that only exist in tú-register: tú, ti, contigo, tuyo/a, and unaccented "tu/tus" as possessives.
  const TU = /\b(tú|ti|contigo|tuyo|tuya|tuyos|tuyas|tu|tus|te)\b/i;
  for (const [k, v] of flat(ES)) {
    const txt = v.replace(/<[^>]+>/g, " ");
    ok(!TU.test(txt), `es.${k} uses tú-register: "${(txt.match(TU) || [])[0]}"`);
  }
  // Translator-speak / Spain-isms / bill-sounding phrases from the Don't column
  const BAD = [/\bevaluaci[oó]n\b/i, /\bbufete\b/i, /sin cargos hasta ganar/i, /Comptonía/i, /Parque Huntington/i, /24\s*\/\s*7/, /las 24 horas/i];
  for (const [k, v] of flat(ES)) for (const re of BAD) ok(!re.test(v), `es.${k} matches banned phrase ${re}`);
  // "Compañía de seguros" at most once across the page copy
  const cds = flat(ES).map(([, v]) => v).join(" ").match(/compañía de seguros/gi) || [];
  ok(cds.length <= 1, `"compañía de seguros" appears ${cds.length}× (limit 1)`);
  // Goldberg Spanish H1 must not ship
  ok(!/Lesionado en un accidente de auto en/i.test(ES.hero_h1), "hero_h1 is the Goldberg H1");
  // City at the end of the H1's first clause
  ok(/en \{City\}\./.test(ES.hero_h1), "hero_h1 does not end its first line with 'en {City}.'");
  // Phone present in the places that must carry it
  for (const k of ["form_tcpa", "hero_call", "form_orcall", "footer_office", "final_p", "ty_body"]) ok(ES[k].includes(PHONE), `es.${k} missing ${PHONE}`);
  ok(/Robert Hindin/.test(ES.footer_ad) && /Publicidad de abogados/.test(ES.footer_ad), "footer_ad: responsible attorney / advertising line");
  ok(/Ismael/.test(ES.ismael) && /Ismael/.test(ES.faq_5_a), "Ismael missing from ismael line / FAQ 5");
  ok(/papeles/.test(ES.faq_5_q) && /emergencia/.test(ES.faq_5_q) && /ingl[eé]s/.test(ES.faq_5_q), "FAQ 5 must cover papeles / emergencia / idioma");
  ok(/8am–5pm/.test(ES.hours) && /8am–5pm/.test(ES.footer_hours), "hours not Mon–Fri 8–5");
  ok(!/24\/7/.test(JSON.stringify(EN)), "EN copy ships 24/7");
  ok(ES.res_offer === "$85,000" && ES.res_result === "$375,000", "results must be the one released case");
  ok(EN.res_offer === "$85,000" && EN.res_result === "$375,000", "results must be the one released case (EN)");
}

{
  const ek = Object.keys(EN).filter(k => typeof EN[k] === "string"), sk = Object.keys(ES).filter(k => typeof ES[k] === "string");
  ok(ek.every(k => k in ES) && sk.every(k => k in EN), "EN/ES key parity: " + ek.filter(k => !(k in ES)).concat(sk.filter(k => !(k in EN))).join(","));
}
console.log("Keyword allowlist");
for (const k of Object.keys(KW)) {
  if (k === "_note") continue;
  ok(/^[a-z0-9-]+$/.test(k), `keywords.${k}: token must be lowercase a-z0-9-`);
  ok(typeof KW[k].en === "string" && typeof KW[k].es === "string", `keywords.${k}: needs en + es`);
  ok(!/\b(tú|ti|contigo|tuyo|tuya|tu|tus|te)\b/i.test(KW[k].es || ""), `keywords.${k}: tú-register in ES`);
  ok(/\.$/.test(KW[k].en) && /\.$/.test(KW[k].es), `keywords.${k}: sentence must end with a period (it precedes the subhead)`);
}

// ---- Per-city checks on built HTML ----
console.log("Built pages");
const spanishDefault = cities.filter(c => c.defaultLang === "es").map(c => c.name);
ok(spanishDefault.includes("Huntington Park") && spanishDefault.includes("Lynwood") && spanishDefault.length === 2, "Only Huntington Park and Lynwood default to ES: " + spanishDefault.join(", "));

for (const c of cities) {
  const file = path.join(DIST, c.slug || "", "index.html");
  const html = fs.readFileSync(file, "utf8");
  const text = strip(html);
  const label = (c.slug || "/") + " (" + c.name + ")";
  const m = html.match(/window\.__RHA_I18N=(\{[\s\S]*?\});(?:window\.__RHA_KW=|<\/script>)/);
  ok(m, `${label}: i18n JSON missing`);
  const i18n = m ? JSON.parse(m[1].replace(/<\\\//g, "</")) : { en: {}, es: {} };
  const es = i18n.es, en = i18n.en;

  ok(html.includes(`data-default-lang="${c.defaultLang}"`), `${label}: default lang attr`);
  ok(html.includes(`<html lang="${c.defaultLang}"`), `${label}: html lang`);
  ok(html.includes(`<input type="hidden" name="lang" value="${c.defaultLang}">`), `${label}: form lang hidden input`);
  ok((text.match(/\(310\) 473-0337/g) || []).length >= 5, `${label}: phone appears fewer than 5 times`);
  ok(!/\b512\b/.test(text), `${label}: a 512 number leaked in`);
  ok(text.includes("11400 W Olympic Blvd, Suite 200"), `${label}: office address missing`);
  ok(!/\{City\}|\{serve\}|\{local\}|\{year\}|\{\{/.test(html), `${label}: unsubstituted token`);
  ok(!/24\/7/.test(text), `${label}: 24/7 on page`);
  ok(!/Google Guaranteed/i.test(text), `${label}: fake Google Guaranteed badge`);

  // ES side (available on every page through the toggle)
  if (c.name !== "Los Angeles") {
    ok(es.hero_h1.includes(`en ${c.name}.`), `${label}: ES H1 city splice — got "${es.hero_h1}"`);
    ok(new RegExp(`\\b${c.name}\\b`).test(es.local_serve), `${label}: ES serve line lacks English city name`);
  }
  ok(!/\b(tú|contigo)\b/i.test(JSON.stringify(es)), `${label}: tú in ES bundle`);
  ok(es.ismael.includes("Ismael"), `${label}: ES Ismael line missing`);
  ok(en.ismael === "", `${label}: Ismael line should be ES-only`);
  ok(es.faq_5_q.includes("papeles"), `${label}: ES FAQ 5 missing`);
  ok(html.includes('id="faq-5"') && !/<details/.test(html), `${label}: FAQ must not be an accordion`);
  for (const n of ["Julio Barberena", "Rob Cruize", "Chelsea Israelsky"]) ok(text.includes(n), `${label}: review attribution ${n} missing`);
  ok(es.footer_ad.includes("Robert Hindin"), `${label}: ES footer responsible attorney`);
  ok(es.footer_office.includes(PHONE), `${label}: ES office line phone`);

  // Default-ES pages must be pre-rendered in Spanish (no English flash)
  if (c.defaultLang === "es") {
    ok(html.includes(es.hero_h1), `${label}: ES-default page not pre-rendered in Spanish`);
    ok(html.includes(es.faq_5_a), `${label}: FAQ 5 answer not in ES HTML`);
    ok(!html.replace(/<script[\s\S]*?<\/script>/g, "").includes(en.hero_h1), `${label}: English H1 present on ES-default page`);
    ok(/<p class="ismael" data-i18n="ismael" data-hide-empty >/.test(html), `${label}: Ismael line hidden on ES-default page`);
  } else {
    ok(html.includes(en.hero_h1), `${label}: EN-default page not pre-rendered in English`);
  }
  ok(html.includes('data-lang-toggle'), `${label}: language toggle missing`);
  ok(html.includes('window.__RHA_KW=') && html.includes('<input type="hidden" name="kw" value="">'), `${label}: keyword swap not wired`);
  ok(html.includes('data-i18n="hero_kw"') && es.hero_kw === "Usted está lastimado." && en.hero_kw === "You're hurt.", `${label}: hero_kw default sentence`);
}

// Thank-you
{
  const html = fs.readFileSync(path.join(DIST, "thank-you/index.html"), "utf8");
  const m = html.match(/window\.__RHA_I18N=(\{[\s\S]*?\});(?:window\.__RHA_KW=|<\/script>)/);
  const i18n = m ? JSON.parse(m[1].replace(/<\\\//g, "</")) : { es: {} };
  ok(i18n.es.ty_h1 === ES.ty_h1, "thank-you: ES h1 bundled for ?lang=es");
  ok(html.includes('data-default-lang="en"') && /new URLSearchParams\(location\.search\)\.get\("lang"\)/.test(html), "thank-you: respects ?lang=");
  ok(/class="qual-form"/.test(html) && html.includes('name="story"'), "thank-you: qualifying form present");
  ok(/href="https:\/\/www\.rhapilaw\.com\?utm_source=lander[^"]*" target="_blank" rel="noopener"/.test(html), "thank-you: corporate link with UTM, new tab");
  ok(html.includes('href="/assets/rha.vcf"') && fs.existsSync(path.join(DIST, "assets/rha.vcf")), "thank-you: vCard");
  ok(i18n.es.ty_q_h2 && !/\b(tú|contigo)\b/i.test(JSON.stringify(i18n.es)), "thank-you: ES strings usted-only");
  ok(!/24\/7/.test(strip(html)), "thank-you: 24/7");
}

console.log(`\n${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
