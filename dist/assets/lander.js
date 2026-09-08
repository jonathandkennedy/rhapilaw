/* RH&A lander runtime: i18n toggle (EN/ES), lead form, click tracking. No dependencies. */
(function () {
  "use strict";
  var I18N = window.__RHA_I18N || {};
  var root = document.documentElement;
  var DEFAULT = root.getAttribute("data-default-lang") || "en";
  var KW = window.__RHA_KW || {};
  // Allowlisted keyword token: ?kw=rear-end (or utm_term when it exactly matches a token). Anything else is ignored.
  var KW_TOKEN = "";
  try {
    var qs = new URLSearchParams(location.search);
    var raw = (qs.get("kw") || qs.get("utm_term") || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
    if (Object.prototype.hasOwnProperty.call(KW, raw)) KW_TOKEN = raw;
  } catch (e) {}

  function track(ev, data) {
    try {
      window.dataLayer = window.dataLayer || [];
      var o = { event: ev, lang: root.getAttribute("data-lang"), city: root.getAttribute("data-city") || "", kw: KW_TOKEN };
      if (data) for (var k in data) o[k] = data[k];
      window.dataLayer.push(o);
    } catch (e) {}
  }

  function withLang(pathname, lang) {
    var u = new URL(pathname, location.href);
    if (lang === DEFAULT) u.searchParams.delete("lang"); else u.searchParams.set("lang", lang);
    return u.pathname + u.search + u.hash;
  }

  function setLang(lang, opts) {
    opts = opts || {};
    var s = I18N[lang];
    if (!s) { lang = DEFAULT; s = I18N[lang] || {}; }
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i], key = el.getAttribute("data-i18n"), v = s[key];
      if (v == null) continue;
      if (el.tagName === "TITLE") el.textContent = v.replace(/<[^>]+>/g, ""); else el.innerHTML = v;
      if (el.hasAttribute("data-hide-empty")) el.hidden = !v;
    }
    var attrs = document.querySelectorAll("[data-i18n-attr]");
    for (var j = 0; j < attrs.length; j++) {
      var a = attrs[j], pairs = a.getAttribute("data-i18n-attr").split(";");
      for (var p = 0; p < pairs.length; p++) {
        var kv = pairs[p].split(":"); if (kv.length < 2) continue;
        var val = s[kv[1].trim()]; if (val != null) a.setAttribute(kv[0].trim(), val.replace(/<[^>]+>/g, ""));
      }
    }
    if (KW_TOKEN && KW[KW_TOKEN] && KW[KW_TOKEN][lang]) {
      var kwEls = document.querySelectorAll('[data-i18n="hero_kw"]');
      for (var q = 0; q < kwEls.length; q++) kwEls[q].textContent = KW[KW_TOKEN][lang];
      root.setAttribute("data-kw", KW_TOKEN);
    }
    root.setAttribute("lang", lang);
    root.setAttribute("data-lang", lang);
    var langInputs = document.querySelectorAll('input[name="lang"]');
    for (var n = 0; n < langInputs.length; n++) langInputs[n].value = lang;
    var other = lang === "es" ? "en" : "es";
    var toggles = document.querySelectorAll("[data-lang-toggle]");
    for (var t = 0; t < toggles.length; t++) {
      toggles[t].setAttribute("href", withLang(location.pathname, other));
      toggles[t].setAttribute("hreflang", other);
      toggles[t].setAttribute("lang", other);
    }
    var backs = document.querySelectorAll("[data-back]");
    for (var b = 0; b < backs.length; b++) backs[b].setAttribute("href", withLang(backs[b].getAttribute("href") || "/", lang));
    if (!opts.silent) {
      try { history.replaceState(null, "", withLang(location.pathname, lang) + location.hash); } catch (e) {}
    }
    root.classList.remove("lang-pending");
  }

  // Initial language: ?lang= wins, then the page's default. Head script already set data-lang before first paint.
  setLang(root.getAttribute("data-lang") || DEFAULT, { silent: true });

  document.addEventListener("click", function (e) {
    var tg = e.target.closest && e.target.closest("[data-lang-toggle]");
    if (tg) {
      e.preventDefault();
      var next = root.getAttribute("data-lang") === "es" ? "en" : "es";
      setLang(next);
      track("lang_toggle", { to: next });
      return;
    }
    var tel = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (tel) track("phone_click", { href: tel.getAttribute("href") });
  });

  // Lead form
  var form = document.querySelector("form.lead-form");
  if (!form) return;
  var errEl = form.querySelector(".form-err");
  var nameIn = form.querySelector('input[name="name"]');
  var phoneIn = form.querySelector('input[name="phone"]');
  var btn = form.querySelector('button[type="submit"]');
  var srcIn = form.querySelector('input[name="source"]');
  var kwIn = form.querySelector('input[name="kw"]');
  if (kwIn) kwIn.value = KW_TOKEN;

  try {
    var q = new URLSearchParams(location.search), src = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "wbraid", "gbraid", "fbclid"].forEach(function (k) { if (q.get(k)) src[k] = q.get(k); });
    if (document.referrer) src.ref = document.referrer;
    if (srcIn) srcIn.value = JSON.stringify(src);
  } catch (e) {}

  function strings() { return I18N[root.getAttribute("data-lang")] || I18N[DEFAULT] || {}; }
  function showErr(msg, field) {
    if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
    if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
  }
  function clearErr() {
    if (errEl) { errEl.hidden = true; errEl.textContent = ""; }
    if (nameIn) nameIn.removeAttribute("aria-invalid");
    if (phoneIn) phoneIn.removeAttribute("aria-invalid");
  }

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
    var s = strings();
    var hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) { return; } // bot
    var name = (nameIn.value || "").trim();
    var digits = (phoneIn.value || "").replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
    if (name.length < 2) return showErr(s.form_err_name || "Enter your name.", nameIn);
    if (digits.length !== 10) return showErr(s.form_err_phone || "Enter a 10-digit mobile number.", phoneIn);

    var lang = root.getAttribute("data-lang");
    var payload = {
      name: name,
      phone: digits,
      phone_display: phoneIn.value,
      lang: lang,
      city: form.querySelector('input[name="city"]').value,
      city_slug: form.querySelector('input[name="city_slug"]').value,
      practice: form.querySelector('input[name="practice"]').value,
      page: location.href,
      source: srcIn ? srcIn.value : "",
      kw: KW_TOKEN,
      submitted_at: new Date().toISOString(),
      tcpa: s.form_tcpa ? s.form_tcpa.replace(/<[^>]+>/g, "") : "",
      _subject: "New lead: " + form.querySelector('input[name="city"]').value + " (" + lang.toUpperCase() + (KW_TOKEN ? ", " + KW_TOKEN : "") + ") — " + name
    };
    var endpoint = form.getAttribute("data-endpoint") || "";
    var thanks = withLang(form.getAttribute("data-thankyou") || "/thank-you/", lang);
    var label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = s.form_sending || "Sending…";

    function done() { track("lead_submit", { practice: payload.practice }); location.href = thanks; }
    function fail() { btn.disabled = false; btn.innerHTML = label; showErr(s.form_err_send || "That didn't go through. Call (310) 473-0337."); track("lead_error"); }

    if (!endpoint) { done(); return; }
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctl && setTimeout(function () { ctl.abort(); }, 12000);
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { if (timer) clearTimeout(timer); r.ok ? done() : fail(); }).catch(function () { if (timer) clearTimeout(timer); fail(); });
  });
})();
