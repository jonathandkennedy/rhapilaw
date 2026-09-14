#!/usr/bin/env node
/* Builds dist/ from src/. Zero dependencies.
 * Every page is rendered twice: English at /<path>/ and Spanish at /es/<path>/.
 * No runtime language swapping; hreflang en / es / x-default on every page.
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
const T = {
  lander: fs.readFileSync(path.join(SRC, "template.html"), "utf8"),
  thanks: fs.readFileSync(path.join(SRC, "thankyou.html"), "utf8"),
  hub: fs.readFileSync(path.join(SRC, "hub.html"), "utf8"),
  legal: fs.readFileSync(path.join(SRC, "legal.html"), "utf8"),
};
const YEAR = String(new Date().getFullYear());
const prefix = (site.pathPrefix || "").replace(/\/$/, "");
const LANGS = ["en", "es"];

// ---------- helpers ----------
function esc(v) { return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function jsonForScript(o) { return JSON.stringify(o).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--"); }
function absUrl(p) { return site.baseUrl.replace(/\/$/, "") + prefix + p; }
function langPath(lang, p) { return (lang === "es" ? "/es" : "") + p; }
function cityPath(city) { return `/${city.slug}/`; }

function stringsFor(lang, city) {
  const out = {}, s = STR[lang];
  for (const k of Object.keys(s)) {
    if (typeof s[k] !== "string") continue;
    out[k] = s[k].replace(/\{City\}/g, city.name).replace(/\{serve\}/g, city["serve_" + lang] || "").replace(/\{local\}/g, city["local_" + lang] || "").replace(/\{year\}/g, YEAR);
  }
  return out;
}

function render(tpl, ctx) {
  const html = tpl.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (m, key) => {
    let v = ctx;
    for (const p of key.split(".")) v = v == null ? undefined : v[p];
    if (v === undefined) throw new Error("Unresolved template token: " + key);
    return v;
  });
  // No runtime i18n: strip the swap hooks so the output is plain HTML.
  return html.replace(/ data-i18n(?:-attr)?="[^"]*"/g, "").replace(/ data-hide-empty/g, "");
}

function write(p, html) {
  const dir = path.join(OUT, p.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function tags() {
  let head = "", body = "";
  const ids = [site.ga4Id, site.googleAdsId].filter(Boolean);
  if (ids.length) {
    head += `<script async src="https://www.googletagmanager.com/gtag/js?id=${ids[0]}"></script>`;
    head += `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${ids.map(i => `gtag('config','${i}');`).join("")}</script>`;
  }
  if (site.gtmId) {
    head += `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${site.gtmId}');</script>`;
    body += `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${site.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
  }
  return { head, body };
}

/** hreflang triplet + canonical for a logical page path p (e.g. "/compton/"). x-default follows the city's default language. */
function alternates(p, xDefaultLang) {
  const en = absUrl(langPath("en", p)), es = absUrl(langPath("es", p));
  const xd = xDefaultLang === "es" ? es : en;
  return { en, es, xd, links: `<link rel="alternate" hreflang="en" href="${en}">\n<link rel="alternate" hreflang="es" href="${es}">\n<link rel="alternate" hreflang="x-default" href="${xd}">` };
}

/** Shared footer: contact, legal links, language alternate, city cross-links. */
function footer(lang, s, p) {
  const other = lang === "es" ? "en" : "es";
  const cityLinks = cities.map(c => `<a href="${prefix}${langPath(lang, cityPath(c))}">${esc(c.name)}</a>`).join(" · ");
  const ext = u => u ? u + (u.includes("?") ? "&" : "?") + "utm_source=lander&utm_medium=footer" : "";
  return `<footer class="ftr">
  <div class="wrap">
    <div class="ftr__grid">
      <div>
        <p class="ftr__firm">Robert Hindin &amp; Associates</p>
        <p>${s.footer_office}</p>
        <p>${s.footer_hours}</p>
        <p class="ftr__sms">${s.footer_sms}</p>
      </div>
      <div>
        <p class="ftr__h">${s.footer_legal_h}</p>
        <ul class="ftr__links">
          <li><a href="${prefix}${langPath(lang, "/privacy/")}">${s.footer_privacy}</a></li>
          <li><a href="${prefix}${langPath(lang, "/terms/")}">${s.footer_terms}</a></li>
          <li><a href="${prefix}${langPath(lang, "/")}">${s.footer_hub}</a></li>
          <li><a href="${prefix}${langPath(other, p)}" hreflang="${other}" lang="${other}">${s.footer_alt_lang}</a></li>
          ${site.corporateUrl ? `<li><a href="${ext(site.corporateUrl)}" target="_blank" rel="noopener" data-track="corporate_click">${s.footer_site}</a></li>` : ""}
          ${site.googleReviewsUrl ? `<li><a href="${site.googleReviewsUrl}" target="_blank" rel="noopener" data-track="reviews_click">${s.footer_reviews}</a></li>` : ""}
        </ul>
      </div>
    </div>
    <p class="ftr__cities"><strong>${s.footer_cities_h}:</strong> ${cityLinks}</p>
    <p>${s.footer_sol}</p>
    <p class="ftr__ad">${s.footer_ad}</p>
    <p class="ftr__copy">${s.footer_copy}</p>
  </div>
</footer>`;
}

function baseCtx(lang, city, p, xDefaultLang) {
  const s = stringsFor(lang, city);
  const alt = alternates(p, xDefaultLang);
  const g = tags();
  const other = lang === "es" ? "en" : "es";
  const page = {
    lang, other,
    path: prefix + langPath(lang, p),
    canonical: lang === "es" ? alt.es : alt.en,
    hreflang: alt.links,
    toggleHref: prefix + langPath(other, p),
    toggleLang: other,
    robots: site.index ? "index, follow" : "noindex, nofollow",
    footer: footer(lang, s, p),
    strJson: jsonForScript(s),
    kwJson: jsonForScript(Object.fromEntries(Object.entries(KW).map(([k, v]) => [k, v[lang]]))),
    thankYouUrl: prefix + langPath(lang, site.thankYouPath),
    formAction: site.formEndpoint || (prefix + langPath(lang, site.thankYouPath)),
    hubHref: prefix + langPath(lang, "/"),
    privacyHref: prefix + langPath(lang, "/privacy/"),
    termsHref: prefix + langPath(lang, "/terms/"),
    gtmHead: g.head, gtmBody: g.body,
  };
  const ctx = Object.assign({}, s, { page, site });
  for (const k of ["meta_desc", "meta_title", "hero_img_alt", "form_name_ph", "form_phone_ph", "lang_toggle_aria", "ty_q4_ph", "hub_desc"]) if (s[k] != null) ctx[k] = esc(s[k]);
  return { s, page, ctx };
}

function jsonld(city, s, page) {
  return jsonForScript({
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": page.canonical + "#firm",
    name: site.firm,
    url: page.canonical,
    inLanguage: page.lang,
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
  });
}

// ---------- pages ----------
const built = []; // { path, url, lang, kind, alt: {en, es} }

function buildCity(city, lang) {
  const p = cityPath(city);
  const { s, page, ctx } = baseCtx(lang, city, p, city.defaultLang);
  page.name = city.name;
  page.slug = city.slug;
  page.jsonld = jsonld(city, s, page);
  page.ismaelHidden = s.ismael ? "" : "hidden";
  page.capHidden = s.rev_1_cap ? "" : "hidden";
  write(langPath(lang, p), render(T.lander, ctx));
  built.push({ path: page.path, url: page.canonical, lang, kind: "city", city: city.name, alt: alternates(p, city.defaultLang) });
}

function buildThankYou(lang) {
  const la = cities.find(c => c.isDefault) || cities[cities.length - 1];
  const p = site.thankYouPath;
  const { page, ctx } = baseCtx(lang, la, p, "en");
  const link = u => u ? u + (u.includes("?") ? "&" : "?") + "utm_source=lander&utm_medium=thankyou&utm_campaign=city-landers" : "";
  page.corporateHref = link(site.corporateUrl);
  page.reviewsHref = site.googleReviewsUrl || "";
  page.reviewsHidden = site.googleReviewsUrl ? "" : "hidden";
  write(langPath(lang, p), render(T.thanks, ctx));
}

function buildHub(lang) {
  const la = cities.find(c => c.isDefault) || cities[cities.length - 1];
  const { s, page, ctx } = baseCtx(lang, la, "/", "en");
  page.cityCards = cities.map(c => {
    const en = `<a href="${prefix}${langPath("en", cityPath(c))}" hreflang="en" lang="en">${esc(s.hub_en)}</a>`;
    const es = `<a href="${prefix}${langPath("es", cityPath(c))}" hreflang="es" lang="es">${esc(s.hub_es)}</a>`;
    const first = c.defaultLang === "es" ? es + es.slice(0, 0) + en : en + es;
    return `      <li class="city-card${c.isDefault ? " city-card--default" : ""}${c.defaultLang === "es" ? " city-card--es" : ""}">
        <h3><a href="${prefix}${langPath(lang, cityPath(c))}">${c.isDefault ? esc(s.hub_default) : esc(c.name)}</a></h3>
        <p>${esc(c["serve_" + lang])}</p>
        <div class="city-card__links">${c.defaultLang === "es" ? es + en : en + es}</div>
      </li>`;
  }).join("\n");
  write(langPath(lang, "/"), render(T.hub, ctx));
  built.push({ path: page.path, url: page.canonical, lang, kind: "hub", alt: alternates("/", "en") });
}

function buildLegal(kind, lang) {
  const la = cities.find(c => c.isDefault) || cities[cities.length - 1];
  const p = `/${kind}/`;
  const { s, page, ctx } = baseCtx(lang, la, p, "en");
  page.title = s[`${kind}_title`];
  page.h1 = s[`${kind}_h1`];
  page.body = fs.readFileSync(path.join(SRC, "legal", `${kind}.${lang}.html`), "utf8").replace(/\{\{privacyHref\}\}/g, page.privacyHref);
  write(langPath(lang, p), render(T.legal, ctx));
  built.push({ path: page.path, url: page.canonical, lang, kind, alt: alternates(p, "en") });
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
  for (const lang of LANGS) {
    buildHub(lang);
    for (const c of cities) buildCity(c, lang);
    buildThankYou(lang);
    buildLegal("privacy", lang);
    buildLegal("terms", lang);
  }
  copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));
  fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\n${site.index ? "Allow" : "Disallow"}: /\nDisallow: ${prefix}${site.thankYouPath}\nDisallow: ${prefix}/es${site.thankYouPath}\nSitemap: ${absUrl("/sitemap.xml")}\n`);
  const sm = built.map(b => `  <url>\n    <loc>${b.url}</loc>\n    <xhtml:link rel="alternate" hreflang="en" href="${b.alt.en}"/>\n    <xhtml:link rel="alternate" hreflang="es" href="${b.alt.es}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${b.alt.xd}"/>\n  </url>`).join("\n");
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sm}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, "pages.json"), JSON.stringify(built.map(b => ({ path: b.path, url: b.url, lang: b.lang, kind: b.kind, city: b.city })), null, 2));
  for (const b of built) console.log(`${b.lang.toUpperCase()}  ${b.path.padEnd(22)} ${b.city || b.kind}`);
  console.log(`\nBuilt ${built.length} indexable pages + 2 thank-you -> ${path.relative(ROOT, OUT) || "."}/`);
}
main();
