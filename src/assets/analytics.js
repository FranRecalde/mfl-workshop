/* MFL Workshop analytics: a cookie banner, then PostHog only for visitors who accept.
   The build fills in the key, host and cookie domain from src/config.json.
   The tools load this same file from the main site:
     <script src="https://themflworkshop.co.uk/assets/analytics.js" data-mask="all" defer></script>
   data-mask="all" hides every bit of page text in session recordings (for pages where teachers paste their own words).
   Mark any other element with data-private to hide its text in recordings.
   Track a click by giving the element data-track="event_name"; other data-* values on it go along as properties. */
(function () {
  var KEY = "__POSTHOG_KEY__", HOST = "__POSTHOG_HOST__", DOMAIN = "__COOKIE_DOMAIN__", PRIVACY = "__PRIVACY_URL__";
  var NAME = "mfl_consent", me = document.currentScript, queue = [];

  window.mflTrack = function (event, props) { queue.push([event, props || {}]); };
  if (!KEY) return;

  function getConsent() { var m = document.cookie.match(/(?:^|; )mfl_consent=(yes|no)/); return m ? m[1] : ""; }
  function setConsent(v) {
    var onDomain = DOMAIN && (location.hostname === DOMAIN || location.hostname.slice(-DOMAIN.length - 1) === "." + DOMAIN);
    document.cookie = NAME + "=" + v + "; path=/; max-age=31536000; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "") + (onDomain ? "; domain=." + DOMAIN : "");
  }

  var loaded = false;
  function start() {
    if (loaded) { window.posthog.opt_in_capturing(); return; }
    loaded = true;
    /* PostHog's loader stub: queues calls until the library arrives. */
    !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, o = "init capture register unregister identify reset opt_in_capturing opt_out_capturing has_opted_out_capturing get_distinct_id startSessionRecording stopSessionRecording".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);
    var maskAll = me && me.getAttribute("data-mask") === "all";
    window.posthog.init(KEY, {
      api_host: HOST,
      person_profiles: "identified_only",
      cross_subdomain_cookie: true,
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: { maskAllInputs: true, maskTextSelector: maskAll ? "*" : "[data-private], [data-private] *" }
    });
    window.mflTrack = function (event, props) { window.posthog.capture(event, props || {}); };
    queue.forEach(function (q) { window.mflTrack(q[0], q[1]); });
    queue = [];
  }
  /* On "No thanks", remove anything PostHog stored from an earlier "Accept". */
  function clearStored() {
    document.cookie.split("; ").forEach(function (c) {
      var n = c.split("=")[0];
      if (!/^(__)?ph_/.test(n)) return;
      document.cookie = n + "=; path=/; max-age=0";
      if (DOMAIN) document.cookie = n + "=; path=/; max-age=0; domain=." + DOMAIN;
    });
    try { Object.keys(localStorage).forEach(function (k) { if (/^(__)?ph_/.test(k)) localStorage.removeItem(k); }); } catch (e) {}
  }
  function stop() { if (loaded) window.posthog.opt_out_capturing(); window.mflTrack = function () {}; queue = []; clearStored(); }

  /* Clicks on anything with data-track="event_name". */
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-track]");
    if (!el) return;
    var props = {};
    for (var k in el.dataset) if (k !== "track") props[k] = el.dataset[k];
    window.mflTrack(el.dataset.track, props);
  }, true);

  /* The banner. Colours fall back to plain ones on pages without the site's stylesheet. */
  var bar;
  function banner() {
    if (bar) { bar.hidden = false; return; }
    var css = document.createElement("style");
    css.textContent = ".mfl-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;padding:16px 18px;display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;justify-content:space-between;background:var(--bg-surface,#fff);color:var(--text-primary,#16231f);border:1px solid var(--border-strong,#123029);border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.18);font:400 15px/1.45 var(--f-body,system-ui,sans-serif)}" +
      ".mfl-consent[hidden]{display:none}.mfl-consent p{margin:0;flex:1 1 260px}.mfl-consent a{color:var(--text-link,#0D6B58)}" +
      ".mfl-consent div{display:flex;gap:8px}.mfl-consent button{min-height:44px;padding:0 18px;border-radius:999px;font:600 15px/1 var(--f-body,system-ui,sans-serif);cursor:pointer;border:1px solid var(--border-strong,#123029);background:transparent;color:inherit}" +
      ".mfl-consent button.yes{background:var(--action-primary,#0D6B58);border-color:var(--action-primary,#0D6B58);color:var(--text-on-action,#fff)}" +
      "@media (prefers-color-scheme:dark){.mfl-consent{background:var(--bg-surface,#14211c);color:var(--text-primary,#e7efea);border-color:var(--border-strong,#e7efea)}}";
    document.head.appendChild(css);
    bar = document.createElement("div");
    bar.className = "mfl-consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Cookie choice");
    bar.innerHTML = '<p>Can we use cookies to see how teachers use the site and tools? It helps us decide what to build next. <a href="' + PRIVACY + '">How we use them</a></p><div><button type="button" class="no">No thanks</button><button type="button" class="yes">Accept</button></div>';
    bar.querySelector(".yes").onclick = function () { setConsent("yes"); bar.hidden = true; start(); };
    bar.querySelector(".no").onclick = function () { setConsent("no"); bar.hidden = true; stop(); };
    document.body.appendChild(bar);
  }

  /* Any link or button with data-cookie-settings reopens the banner. */
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-cookie-settings]");
    if (!el) return;
    e.preventDefault();
    banner();
  });

  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }
  var c = getConsent();
  if (c === "yes") start();
  else if (c === "no") clearStored();
  else ready(banner);
})();
