/* RH&A lander runtime: lead form, thank-you follow-up, keyword swap, click tracking. No dependencies.
 * Language is decided by the URL path (/ = English, /es/ = Spanish). Nothing is swapped at runtime. */
(function () {
  "use strict";
  var S = window.__RHA_S || {};      // strings for this page's language
  var KW = window.__RHA_KW || {};    // allowlisted keyword token -> first sentence of the subhead, this language
  var root = document.documentElement;
  var LANG = root.getAttribute("lang") || "en";
  var CITY = root.getAttribute("data-city") || "";

  var KW_TOKEN = "";
  try {
    var qs = new URLSearchParams(location.search);
    var raw = (qs.get("kw") || qs.get("utm_term") || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
    if (Object.prototype.hasOwnProperty.call(KW, raw)) KW_TOKEN = raw;
  } catch (e) {}
  if (KW_TOKEN) {
    var kwEls = document.querySelectorAll(".kw");
    for (var q = 0; q < kwEls.length; q++) kwEls[q].textContent = KW[KW_TOKEN];
    root.setAttribute("data-kw", KW_TOKEN);
  }

  function track(ev, data) {
    try {
      window.dataLayer = window.dataLayer || [];
      var o = { event: ev, lang: LANG, city: CITY, kw: KW_TOKEN, variant: root.getAttribute("data-variant") || "a" };
      if (data) for (var k in data) o[k] = data[k];
      if (typeof window.gtag === "function") { var params = {}; for (var pk in o) if (pk !== "event") params[pk] = o[pk]; window.gtag("event", ev, params); }
      window.dataLayer.push(o);
    } catch (e) {}
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-track]");
    if (a) { track(a.getAttribute("data-track"), { href: a.getAttribute("href") }); return; }
    var tel = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (tel) track("phone_click", { href: tel.getAttribute("href") });
  });

  // Thank-you page: optional qualifying questions, matched to the lead by phone.
  var qual = document.querySelector("form.qual-form");
  if (qual) {
    var lead = {};
    try { lead = JSON.parse(sessionStorage.getItem("rha_lead") || "{}") || {}; } catch (e) {}
    ["name", "phone", "city", "kw"].forEach(function (k) { var i = qual.querySelector('input[name="' + k + '"]'); if (i && lead[k]) i.value = lead[k]; });
    var qErr = qual.querySelector(".form-err"), qBtn = qual.querySelector('button[type="submit"]');
    qual.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(qual), data = {};
      fd.forEach(function (v, k) { data[k] = v; });
      if (!(data.when || data.doctor || data.insurer || (data.story && data.story.trim()))) return;
      data.lang = LANG; data.page = location.href; data.submitted_at = new Date().toISOString();
      data._subject = "Lead details: " + (data.city || "?") + " — " + (data.name || "?") + " " + (data.phone || "");
      var endpoint = qual.getAttribute("data-endpoint") || "";
      function ok() { qual.hidden = true; var d = document.querySelector(".qual__done"); if (d) d.hidden = false; track("lead_details", { when: data.when, doctor: data.doctor, insurer: data.insurer }); }
      function bad() { qBtn.disabled = false; if (qErr) { qErr.textContent = S.ty_q_err || "That didn't go through."; qErr.hidden = false; } }
      qBtn.disabled = true;
      if (!endpoint) { ok(); return; }
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { r.ok ? ok() : bad(); }).catch(bad);
    });
  }

  // Lead forms. Variant B carries two on one page (hero + bottom), so bind every one.
  var forms = document.querySelectorAll("form.lead-form");
  for (var fi = 0; fi < forms.length; fi++) bindLeadForm(forms[fi]);

  function bindLeadForm(form) {
  var errEl = form.querySelector(".form-err");
  var nameIn = form.querySelector('input[name="name"]');
  var phoneIn = form.querySelector('input[name="phone"]');
  var btn = form.querySelector('button[type="submit"]');
  var srcIn = form.querySelector('input[name="source"]');
  var kwIn = form.querySelector('input[name="kw"]');
  if (kwIn) kwIn.value = KW_TOKEN;

  try {
    var src = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "wbraid", "gbraid", "fbclid"].forEach(function (k) { if (qs.get(k)) src[k] = qs.get(k); });
    if (document.referrer) src.ref = document.referrer;
    if (srcIn) srcIn.value = JSON.stringify(src);
  } catch (e) {}

  function showErr(msg, field) { if (errEl) { errEl.textContent = msg; errEl.hidden = false; } if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); } }
  function clearErr() { if (errEl) { errEl.hidden = true; errEl.textContent = ""; } if (nameIn) nameIn.removeAttribute("aria-invalid"); if (phoneIn) phoneIn.removeAttribute("aria-invalid"); }

  phoneIn && phoneIn.addEventListener("input", function () {
    var d = phoneIn.value.replace(/\D/g, "").slice(0, 11);
    if (d.length === 11 && d[0] === "1") d = d.slice(1);
    var out = d;
    if (d.length > 6) out = "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    else if (d.length > 3) out = "(" + d.slice(0, 3) + ") " + d.slice(3);
    else if (d.length > 0) out = "(" + d;
    phoneIn.value = out;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErr();
    var hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) return; // bot
    var name = (nameIn.value || "").trim();
    var digits = (phoneIn.value || "").replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
    if (name.length < 2) return showErr(S.form_err_name || "Enter your name.", nameIn);
    if (digits.length !== 10) return showErr(S.form_err_phone || "Enter a 10-digit mobile number.", phoneIn);

    var payload = {
      name: name, phone: digits, phone_display: phoneIn.value, lang: LANG,
      city: form.querySelector('input[name="city"]').value,
      city_slug: form.querySelector('input[name="city_slug"]').value,
      practice: form.querySelector('input[name="practice"]').value,
      page: location.href, source: srcIn ? srcIn.value : "", kw: KW_TOKEN,
      variant: (form.querySelector('input[name="variant"]') || {}).value || "a",
      submitted_at: new Date().toISOString(),
      tcpa: S.form_tcpa ? S.form_tcpa.replace(/<[^>]+>/g, "") : "",
      _subject: "New lead: " + form.querySelector('input[name="city"]').value + " (" + LANG.toUpperCase() + (KW_TOKEN ? ", " + KW_TOKEN : "") + ") — " + name
    };
    var endpoint = form.getAttribute("data-endpoint") || "";
    var thanks = form.getAttribute("data-thankyou") || "/thank-you/";
    var label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = S.form_sending || "Sending…";

    function done() {
      try { sessionStorage.setItem("rha_lead", JSON.stringify({ name: name, phone: digits, city: payload.city, city_slug: payload.city_slug, lang: LANG, kw: KW_TOKEN })); } catch (e) {}
      track("lead_submit", { practice: payload.practice });
      location.href = thanks;
    }
    function fail() { btn.disabled = false; btn.innerHTML = label; showErr(S.form_err_send || "That didn't go through. Call (310) 564-7911."); track("lead_error"); }

    if (!endpoint) { done(); return; }
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctl && setTimeout(function () { ctl.abort(); }, 12000);
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (timer) clearTimeout(timer); r.ok ? done() : fail(); }).catch(function () { if (timer) clearTimeout(timer); fail(); });
  });
  }
})();
