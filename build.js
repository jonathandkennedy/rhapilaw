#!/usr/bin/env node
/* Builds dist/ from src/. Zero dependencies.
 *   node build.js            -> dist/
 *   node build.js --out=path -> custom output dir
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const argOut = (process.argv.find(a => a.startsWith("--out=")) || "").slice(6);
const OUT = path.resolve(ROOT, argOut || "dist");

const site = JSON.parse(fs.readFileSync(path.join(SRC, "site.json"), "utf8"));
const cities = JSON.parse(fs.readFileSync(path.join(SRC, "cities.json"), "utf8"));
const STR = {
  en: JSON.parse(fs.readFileSync(path.join(SRC, "strings/en.json"), "utf8")),
  es: JSON.parse(fs.readFileSync(path.join(SRC, "strings/es.json"), "utf8")),
};
const KW = JSON.parse(fs.readFileSync(path.join(SRC, "keywords.json"), "utf8"));
delete KW._note;
const template = fs.readFileSync(path.join(SRC, "template.html"), "utf8");
const tyTemplate = fs.readFileSync(path.join(SRC, "thankyou.html"), "utf8");
const YEAR = String(new Date().getFullYear());
const prefix = (site.pathPrefix || "").replace(/\/$/, "");

function sub(str, city) {
  return str
    .replace(/\{City\}/g, city.name)
    .replace(/\{serve\}/g, city["serve_" + this.lang] || "")
    .replace(/\{local\}/g, city["local_" + this.lang] || "")
    .replace(/\{year\}/g, YEAR);
}

/** Strings for one language with the city substituted in. Drops nested objects (wave2). */
function stringsFor(lang, city) {
  const out = {};
  const s = STR[lang];
  const ctx = { lang };
  for (const k of Object.keys(s)) {
    if (typeof s[k] !== "string") continue;
    out[k] = sub.call(ctx, s[k], city);
  }
  return out;
}

function esc(v) { return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function jsonForScript(o) { return JSON.stringify(o).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--"); }

function render(tpl, ctx) {
  return tpl.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (m, key) => {
    const parts = key.split(".");
    let v = ctx;
    for (const p of parts) { v = v == null ? undefined : v[p]; }
    if (v === undefined) throw new Error("Unresolved template token: " + key);
    return v;
  });
}

function cityPath(city) { return city.slug ? `/${city.slug}/` : "/"; }
function absUrl(p) { return site.baseUrl.replace(/\/$/, "") + prefix + p; }

function gtm() {
  if (!site.gtmId) return { head: "", body: "" };
  const id = site.gtmId;
  return {
    head: `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`,
    body: `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
  };
}

function jsonld(city, s) {
  const o = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": absUrl(cityPath(city)) + "#firm",
    name: site.firm,
    url: absUrl(cityPath(city)),
    telephone: site.phoneTel,
    priceRange: "Free consultation. No fee unless we recover.",
    image: absUrl("/assets/logo-white.png"),
    address: { "@type": "PostalAddress", streetAddress: site.office.street, addressLocality: site.office.city, addressRegion: site.office.state, postalCode: site.office.zip, addressCountry: "US" },
    areaServed: [{ "@type": "City", name: city.name }, { "@type": "AdministrativeArea", name: "Los Angeles County" }],
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" }],
    founder: { "@type": "Person", name: "Robert Hindin" },
    employee: [{ "@type": "Person", name: "Kyle Hindin", jobTitle: "Attorney" }],
    aggregateRating: { "@type": "AggregateRating", ratingValue: site.rating, reviewCount: site.reviewCount, bestRating: "5" },
    knowsLanguage: ["en", "es"],
    slogan: s.eyebrow,
  };
  return jsonForScript(o);
}

function buildCity(city) {
  const lang = city.defaultLang || "en";
  const s = stringsFor(lang, city);
  const i18n = { en: stringsFor("en", city), es: stringsFor("es", city) };
  const p = cityPath(city);
  const url = absUrl(p);
  const g = gtm();
  const other = lang === "es" ? "en" : "es";
  const page = {
    name: city.name,
    slugOrDefault: city.slug || "los-angeles",
    defaultLang: lang,
    canonical: url,
    urlEn: lang === "en" ? url : url + "?lang=en",
    urlEs: lang === "es" ? url : url + "?lang=es",
    toggleHref: other === lang ? p : (other === "en" && lang !== "en" ? prefix + p + "?lang=en" : prefix + p + "?lang=es"),
    toggleLang: other,
    robots: site.index ? "index, follow" : "noindex, nofollow",
    jsonld: jsonld(city, s),
    i18nJson: jsonForScript(i18n),
    kwJson: jsonForScript(KW),
    formAction: site.formEndpoint || (prefix + site.thankYouPath),
    thankYouUrl: prefix + site.thankYouPath,
    ismaelHidden: s.ismael ? "" : "hidden",
    capHidden: s.rev_1_cap ? "" : "hidden",
    gtmHead: g.head,
    gtmBody: g.body,
  };
  // toggleHref: link to same page in the other language
  page.toggleHref = prefix + p + (other === lang ? "" : `?lang=${other}`);
  const ctx = Object.assign({}, s, { page, site });
  // Escape attribute-bound strings that the template drops into attributes.
  ctx.meta_desc = esc(s.meta_desc);
  ctx.meta_title = esc(s.meta_title);
  ctx.hero_img_alt = esc(s.hero_img_alt);
  ctx.form_name_ph = esc(s.form_name_ph);
  ctx.form_phone_ph = esc(s.form_phone_ph);
  ctx.lang_toggle_aria = esc(s.lang_toggle_aria);
  const html = render(template, ctx);
  const dir = path.join(OUT, city.slug || "");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  return { path: p, url, lang, city: city.name };
}

function buildThankYou() {
  const la = cities.find(c => c.isDefault) || cities[cities.length - 1];
  const s = stringsFor("en", la);
  const i18n = { en: stringsFor("en", la), es: stringsFor("es", la) };
  const g = gtm();
  const utm = "utm_source=lander&utm_medium=thankyou&utm_campaign=city-landers";
  const link = u => u ? u + (u.includes("?") ? "&" : "?") + utm : "";
  const page = {
    i18nJson: jsonForScript(i18n),
    kwJson: jsonForScript(KW),
    toggleHref: prefix + site.thankYouPath + "?lang=es",
    formAction: site.formEndpoint || (prefix + site.thankYouPath),
    corporateHref: link(site.corporateUrl),
    reviewsHref: site.googleReviewsUrl || "",
    reviewsHidden: site.googleReviewsUrl ? "" : "hidden",
    gtmHead: g.head, gtmBody: g.body,
  };
  const ctx = Object.assign({}, s, { page, site });
  ctx.hero_img_alt = esc(s.hero_img_alt); ctx.ty_q4_ph = esc(s.ty_q4_ph);
  const html = render(tyTemplate, ctx);
  const dir = path.join(OUT, site.thankYouPath.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, ent.name), b = path.join(to, ent.name);
    if (ent.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const built = cities.map(buildCity);
  buildThankYou();
  copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));
  fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\n${site.index ? "Allow" : "Disallow"}: /\nDisallow: ${prefix}${site.thankYouPath}\nSitemap: ${absUrl("/sitemap.xml")}\n`);
  const sm = built.map(b => `  <url><loc>${b.url}</loc><xhtml:link rel="alternate" hreflang="en" href="${b.lang === "en" ? b.url : b.url + "?lang=en"}"/><xhtml:link rel="alternate" hreflang="es" href="${b.lang === "es" ? b.url : b.url + "?lang=es"}"/></url>`).join("\n");
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sm}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, "pages.json"), JSON.stringify(built, null, 2));
  for (const b of built) console.log(`${b.lang.toUpperCase()}  ${b.path.padEnd(18)} ${b.city}`);
  console.log(`\nBuilt ${built.length} city pages + thank-you -> ${path.relative(ROOT, OUT) || "."}/`);
}
main();
