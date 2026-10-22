(function () {
  var depths = [25, 50, 75, 90];
  var seenDepth = {};
  var seenSection = {};

  function push(event, params) {
    var payload = { event: event };
    var key;
    if (params) {
      for (key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null && params[key] !== "") {
          payload[key] = params[key];
        }
      }
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  function eventId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function textOf(el) {
    return (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function sectionId(el) {
    var node = el.closest("[id]");
    return node ? node.id : "";
  }

  function onClick(e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (!href || href === "#" || href.indexOf("javascript:") === 0) return;

    var info = {
      link_url: a.href,
      link_text: textOf(a),
      section_id: sectionId(a)
    };

    if (/wa\.me|api\.whatsapp\.com/i.test(href)) {
      var quote = /cota/i.test(href) || /cota/i.test(info.link_text);
      push(quote ? "generate_lead" : "contact", {
        event_id: eventId(),
        method: "whatsapp",
        link_url: info.link_url,
        link_text: info.link_text,
        section_id: info.section_id
      });
      return;
    }

    if (/^mailto:/i.test(href)) {
      push("contact", { event_id: eventId(), method: "email", link_url: info.link_url, link_text: info.link_text, section_id: info.section_id });
      return;
    }

    if (/^tel:/i.test(href)) {
      push("contact", { event_id: eventId(), method: "phone", link_url: info.link_url, link_text: info.link_text, section_id: info.section_id });
      return;
    }

    var hash = href.indexOf("#");
    if (href.charAt(0) === "#" || (hash > 0 && /index\.html#/.test(href))) {
      push("select_content", { content_type: "menu", item_id: href.slice(hash + 1), link_text: info.link_text });
      return;
    }

    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) {
      push("click", { link_url: info.link_url, link_domain: url.hostname, link_text: info.link_text, outbound: true, section_id: info.section_id });
    }
  }

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var pct = Math.round((window.scrollY / max) * 100);
    var i, mark;
    for (i = 0; i < depths.length; i++) {
      mark = depths[i];
      if (pct >= mark && !seenDepth[mark]) {
        seenDepth[mark] = true;
        push("scroll", { percent_scrolled: mark });
      }
    }
  }

  function watchSections() {
    if (!("IntersectionObserver" in window)) return;
    var nodes = document.querySelectorAll("section[id], #inicio");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (!entry.isIntersecting || !id || seenSection[id]) return;
        seenSection[id] = true;
        push("view_section", { section_id: id });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (node) { if (node.id) io.observe(node); });
  }

  function boot() {
    push("page_view", {
      page_title: document.title,
      page_location: location.href,
      page_path: location.pathname,
      page_referrer: document.referrer,
      language: document.documentElement.lang || "pt-BR"
    });
    document.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    watchSections();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
