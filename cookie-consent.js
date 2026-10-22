(function () {
  var POLICY_VERSION = "2026-10-22";
  var STORAGE_KEY = "gcv-cookie-consent";
  var GTM_ID = "GTM-W5DK2XVM";
  var gtmLoaded = false;
  var saved = read();

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function valid(record) {
    if (!record || record.version !== POLICY_VERSION || !record.timestamp || !record.choices) return false;
    var then = new Date(record.timestamp);
    if (isNaN(then.getTime())) return false;
    var expires = new Date(then.getTime());
    expires.setMonth(expires.getMonth() + 12);
    return Date.now() < expires.getTime();
  }

  function loadGTM() {
    if (gtmLoaded) return;
    gtmLoaded = true;
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", GTM_ID);
  }

  function signal(choices) {
    var analytics = !!choices.analytics;
    var advertising = !!choices.advertising;
    window.gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: advertising ? "granted" : "denied",
      ad_user_data: advertising ? "granted" : "denied",
      ad_personalization: advertising ? "granted" : "denied"
    });
    window.dataLayer.push({
      event: "cookie_consent_update",
      analytics: analytics,
      advertising: advertising,
      necessary: true
    });
    if (analytics || advertising) loadGTM();
  }

  function commit(choices) {
    var record = {
      version: POLICY_VERSION,
      timestamp: new Date().toISOString(),
      choices: {
        necessary: true,
        analytics: !!choices.analytics,
        advertising: !!choices.advertising
      }
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {}
    signal(record.choices);
    saved = record;
    return record;
  }

  if (valid(saved)) signal(saved.choices);

  function boot() {
    var banner = document.createElement("div");
    banner.id = "cookie-banner";
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "cookie-title");
    banner.setAttribute("aria-describedby", "cookie-text");
    banner.tabIndex = -1;
    banner.hidden = true;
    banner.innerHTML =
      '<h2 id="cookie-title" class="cookie-sr">Cookies</h2>' +
      '<p id="cookie-text">Cookies de estatística e anúncios. <a href="privacy-policy.html">Privacidade</a>.</p>' +
      '<div class="cookie-actions">' +
        '<button type="button" class="cookie-choice" id="cookie-accept">Aceitar</button>' +
        '<button type="button" class="cookie-choice" id="cookie-reject">Recusar</button>' +
        '<button type="button" class="cookie-ghost" id="cookie-custom" aria-expanded="false" aria-controls="cookie-categories">Personalizar</button>' +
      "</div>" +
      '<div id="cookie-categories" class="cookie-categories" hidden>' +
        '<fieldset>' +
          '<legend class="cookie-sr">Categorias</legend>' +
          '<label class="cookie-row"><input type="checkbox" checked disabled aria-disabled="true"><span>Necessários</span></label>' +
          '<label class="cookie-row"><input type="checkbox" id="cookie-analytics"><span>Analíticos</span></label>' +
          '<label class="cookie-row"><input type="checkbox" id="cookie-ads"><span>Publicidade</span></label>' +
        "</fieldset>" +
        '<button type="button" class="cookie-choice" id="cookie-save">Salvar</button>' +
      "</div>";
    document.body.appendChild(banner);

    var categories = document.getElementById("cookie-categories");
    var customBtn = document.getElementById("cookie-custom");
    var analyticsInput = document.getElementById("cookie-analytics");
    var adsInput = document.getElementById("cookie-ads");

    function fill() {
      var choices = saved && saved.choices ? saved.choices : { analytics: false, advertising: false };
      analyticsInput.checked = !!choices.analytics;
      adsInput.checked = !!choices.advertising;
    }

    function show(customize) {
      fill();
      categories.hidden = !customize;
      customBtn.setAttribute("aria-expanded", customize ? "true" : "false");
      banner.hidden = false;
      if (customize) analyticsInput.focus();
      else banner.focus();
    }

    function hide() {
      banner.hidden = true;
      customBtn.setAttribute("aria-expanded", "false");
    }

    document.getElementById("cookie-accept").addEventListener("click", function () {
      commit({ analytics: true, advertising: true });
      hide();
    });
    document.getElementById("cookie-reject").addEventListener("click", function () {
      commit({ analytics: false, advertising: false });
      hide();
    });
    document.getElementById("cookie-save").addEventListener("click", function () {
      commit({ analytics: analyticsInput.checked, advertising: adsInput.checked });
      hide();
    });
    customBtn.addEventListener("click", function () {
      var open = categories.hidden;
      if (open) fill();
      categories.hidden = !open;
      customBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) analyticsInput.focus();
    });

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("#gerenciar-cookies, [data-gerenciar-cookies]");
      if (!trigger) return;
      e.preventDefault();
      show(true);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || banner.hidden || !valid(saved)) return;
      hide();
    });

    if (!valid(saved)) show(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
