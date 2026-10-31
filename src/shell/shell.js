/* Life Planner shell
   One shared engine for every planner download. It mounts the planner "packs" (the
   original Girly Pop, Arcade and Studio apps, each in its own shadow DOM so their
   styles and ids never clash), routes the tabs, applies themes and runs the
   Customize panel. Everything stays in this browser: no accounts, no network. */
(function () {
  "use strict";
  var B = window.LP_BUILD;
  var P = B.planner, KEY = P.key, SKEY = KEY + ":settings";
  var PACKS = B.packs, THEMES = B.themes, ORDER = B.packOrder;
  var AREAS = [
    ["plan", "Plan & goals"], ["work", "Work & study"], ["health", "Health & fitness"],
    ["people", "People"], ["home", "Home & hobbies"], ["creative", "Creative"]
  ];
  var packFns = {}, ctxs = {}, settings = null, current = null, primary = null;

  /* ---------- storage ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function readJSON(k) { var s = lsGet(k); if (!s) return null; try { return JSON.parse(s); } catch (e) { return null; } }
  function packKey(id) { return id === P.primary ? KEY : KEY + ":pack:" + id; }
  function saveSettings() {
    try { localStorage.setItem(SKEY, JSON.stringify(settings)); }
    catch (e) { if (window.LPBackup) LPBackup.saveFailed(e); }
  }
  function loadSettings() {
    var s = readJSON(SKEY);
    settings = s && typeof s === "object" && !Array.isArray(s) ? s : {};
    if (!THEMES[settings.theme]) settings.theme = P.theme;
    if (!settings.tabs || typeof settings.tabs !== "object" || Array.isArray(settings.tabs)) settings.tabs = {};
    // Studio used to hide tabs from "Make it yours": carry those choices over once.
    if (!settings.migrated && P.primary === "studio") {
      var st = readJSON(KEY), hid = st && st.custom && st.custom.tabs;
      if (hid && typeof hid === "object") Object.keys(hid).forEach(function (v) {
        if (hid[v] && hid[v].hide === true && libById["studio:" + v] && settings.tabs["studio:" + v] === undefined) settings.tabs["studio:" + v] = false;
      });
    }
    settings.migrated = 1;
  }

  /* ---------- the tab library: every tab from every pack ---------- */
  var LIB = [], libById = {}, libByRoute = {};
  ORDER.forEach(function (pid) {
    var m = PACKS[pid].meta;
    m.views.forEach(function (v) {
      var e = { id: pid + ":" + v.id, pack: pid, view: v.id, label: v.label, desc: v.desc, area: v.area, group: v.group,
        route: pid === P.primary ? v.id : m.short + "-" + v.id };
      LIB.push(e); libById[e.id] = e; libByRoute[e.route] = e;
    });
  });
  function isOn(e) { var v = settings.tabs[e.id]; return v === undefined ? e.pack === P.primary : v === true; }
  function enabled() { return LIB.filter(isOn); }
  function packActive(pid) { return LIB.some(function (e) { return e.pack === pid && isOn(e); }); }
  function navLabel(e, list) {
    var custom = e.pack === P.primary && ctxs[e.pack] && ctxs[e.pack].labelOf ? ctxs[e.pack].labelOf(e.view) : null;
    var label = custom || e.label;
    var clash = (list || enabled()).some(function (o) { return o !== e && o.label.toLowerCase() === e.label.toLowerCase(); });
    return clash && e.pack !== P.primary ? label + " · " + PACKS[e.pack].meta.name : label;
  }

  /* ---------- assets ---------- */
  function withAssets(s) { return s.replace(/asset:([a-z0-9\/-]+)/g, function (m, n) { return B.assets[n] || m; }); }

  /* ---------- packs: each runs in its own shadow root with small shims ---------- */
  function makeCtx(pid, host) {
    var root = host.attachShadow({ mode: "open" });
    var ctx = { id: pid, host: host, root: root, primary: pid === P.primary, hashListeners: [], mounted: false };
    var meta = PACKS[pid].meta;
    host.className = "lp-pack"; host.dataset.pack = pid;
    root.innerHTML = "<style>" + withAssets(B.css[pid]) + "</style><style>" + withAssets(B.themed[pid]) + "</style>" +
      (ctx.primary ? "<style>" + document.getElementById("lpb-style").textContent + "</style>" : "") +
      '<div class="lp-root">' + withAssets(PACKS[pid].html) + "</div>";
    var doc = {
      getElementById: function (id) { return root.getElementById(id); },
      querySelector: function (s) { return root.querySelector(s); },
      querySelectorAll: function (s) { return root.querySelectorAll(s); },
      createElement: function (t, o) { return document.createElement(t, o); },
      createElementNS: function (n, t) { return document.createElementNS(n, t); },
      createTextNode: function (t) { return document.createTextNode(t); },
      createDocumentFragment: function () { return document.createDocumentFragment(); },
      addEventListener: function (t, f, o) { root.addEventListener(t, f, o); },
      removeEventListener: function (t, f, o) { root.removeEventListener(t, f, o); },
      get activeElement() { return root.activeElement || document.activeElement; },
      documentElement: host,
      get body() { return document.body; },
      get head() { return document.head; },
      get title() { return document.title; },
      set title(v) { if (ctx.primary && settings.theme === pid) document.title = v; },
      get hidden() { return document.hidden; },
      get visibilityState() { return document.visibilityState; },
      get readyState() { return document.readyState; },
      get fonts() { return document.fonts; }
    };
    var loc = {
      get hash() { return ctx.localHash(); },
      set hash(v) { go(toRoute(pid, String(v).replace(/^#/, ""))); },
      get href() { return location.href; },
      get pathname() { return location.pathname; },
      get search() { return location.search; },
      reload: function () { location.reload(); },
      assign: function (u) { location.assign(u); }
    };
    var ls = {
      getItem: function (k) { return localStorage.getItem(mapKey(k)); },
      setItem: function (k, v) { return localStorage.setItem(mapKey(k), v); },
      removeItem: function (k) { return localStorage.removeItem(mapKey(k)); },
      key: function (i) { return localStorage.key(i); },
      get length() { return localStorage.length; },
      clear: function () {}
    };
    var legacy = "life-planner-" + pid + "-v1";
    function mapKey(k) { k = String(k); return k.indexOf(legacy) === 0 ? packKey(pid) + k.slice(legacy.length) : k; }
    var backup = {
      setSource: function (fn) { ctx.source = fn; },
      setSamples: function (fn) { if (window.LPBackup) window.LPBackup.setSamples(fn, pid); },
      saveFailed: function (e) { if (window.LPBackup) window.LPBackup.saveFailed(e); },
      restoreSamples: function () { if (window.LPBackup) window.LPBackup.restoreSamples(); },
      exportBackup: function () { return window.LPBackup ? window.LPBackup.exportBackup() : Promise.resolve(false); },
      importFile: function () { if (window.LPBackup) window.LPBackup.importFile(); }
    };
    var win = new Proxy(window, {
      get: function (t, k) {
        if (k === "document") return doc;
        if (k === "location") return loc;
        if (k === "localStorage") return ls;
        if (k === "LPBackup") return backup;
        if (k === "addEventListener") return function (type, f, o) { if (type === "hashchange") ctx.hashListeners.push(f); else window.addEventListener(type, f, o); };
        if (k === "removeEventListener") return function (type, f, o) { window.removeEventListener(type, f, o); };
        var v = t[k];
        return typeof v === "function" && !/^[A-Z]/.test(String(k)) ? v.bind(t) : v;
      },
      set: function (t, k, v) { t[k] = v; return true; }
    });
    ctx.localHash = function () {
      var e = libByRoute[current];
      return e && e.pack === pid ? "#" + e.view : "#lp-elsewhere";
    };
    // in-page links: route through the shell instead of the real address bar
    root.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.target) return;
      var h = a.getAttribute("href").slice(1); if (!h) return;
      e.preventDefault();
      if (a.hasAttribute("data-lp-route")) go(h);
      else if (meta.views.some(function (v) { return v.id === h || h === "journal"; })) go(toRoute(pid, h));
      else { var t = root.getElementById(h); if (t) t.scrollIntoView({ behavior: "smooth" }); }
    });
    ctx.run = function () {
      if (!packFns[pid]) return;
      try { packFns[pid].call(win, doc, win, loc, ls, backup); }
      catch (err) { console.error("Life Planner: the " + meta.name + " part didn't start", err); }
      ctx.mounted = true;
    };
    ctxs[pid] = ctx;
    return ctx;
  }
  function toRoute(pid, view) {
    if (view === "journal") view = "wellbeing";
    var e = libById[pid + ":" + view];
    return e ? e.route : view;
  }
  function ensurePack(pid) {
    if (ctxs[pid] && ctxs[pid].mounted) return ctxs[pid];
    var host = document.createElement("div");
    host.dataset.ext = "";
    var p = ctxs[P.primary], foot = p.root.querySelector(PACKS[P.primary].meta.map.foot);
    if (foot) foot.parentNode.insertBefore(host, foot); else p.root.querySelector(".lp-root").appendChild(host);
    var ctx = makeCtx(pid, host);
    applyThemeTo(ctx);
    host.hidden = true;
    ctx.run();
    return ctx;
  }

  /* ---------- routing ---------- */
  function firstRoute() { var on = enabled(); return on.length ? on[0].route : LIB[0].route; }
  function go(route) { if (("#" + route) !== location.hash) location.hash = route; else onRoute(); }
  function onRoute() {
    var r = decodeURIComponent((location.hash || "").slice(1));
    if (r === "journal") r = "wellbeing";
    var e = libByRoute[r];
    if (!e || !isOn(e)) { r = firstRoute(); e = libByRoute[r]; if (location.hash && location.hash !== "#" + r) { history.replaceState(null, "", "#" + r); } }
    current = r;
    var target = ensurePack(e.pack);
    // tell every mounted pack, so each shows the right view (or none)
    Object.keys(ctxs).forEach(function (pid) {
      var c = ctxs[pid];
      if (!c.mounted) return;
      if (!c.primary) c.host.hidden = c !== target;
      c.hashListeners.forEach(function (f) { try { f({ type: "hashchange" }); } catch (err) { console.error(err); } });
    });
    var pc = ctxs[P.primary], pm = PACKS[P.primary].meta;
    pc.host.toggleAttribute("data-away", e.pack !== P.primary);
    pc.root.querySelectorAll(pm.viewSelector).forEach(function (s) {
      if (s.parentNode && s.getRootNode() === pc.root && e.pack !== P.primary) s.hidden = true;
    });
    renderNav();
  }

  /* ---------- navigation: the primary pack's own nav, with extra tabs added ---------- */
  function renderNav() {
    if (!current || !ctxs[P.primary]) return;
    var c = ctxs[P.primary], m = PACKS[P.primary].meta, root = c.root, on = enabled();
    root.querySelectorAll("[data-lp-extra]").forEach(function (n) { n.remove(); });
    var cur = libByRoute[current];
    function extraLink(e, cls) {
      var a = document.createElement("a");
      a.className = cls; a.setAttribute("href", "#" + e.route); a.setAttribute("data-lp-extra", ""); a.setAttribute("data-lp-route", "");
      a.setAttribute("role", "tab"); a.textContent = navLabel(e, on);
      a.setAttribute("aria-selected", String(e.route === current));
      return a;
    }
    if (m.navMode === "grouped") {
      var GROUPS = { plan: "week", work: "jobs" };
      var groupOf = function (e) { return e.pack === P.primary ? e.group : GROUPS[e.area] || "life"; };
      var curGroup = groupOf(cur);
      ["week", "jobs", "life"].forEach(function (g) {
        var sub = root.getElementById("sub-" + g), top = root.querySelector('.tab[data-top="' + g + '"]');
        var members = on.filter(function (e) { return groupOf(e) === g; });
        sub.querySelectorAll("[data-tab]").forEach(function (a) { var e = libById[P.primary + ":" + a.dataset.tab]; a.hidden = !isOn(e); a.setAttribute("aria-selected", String(e.route === current)); });
        members.filter(function (e) { return e.pack !== P.primary; }).forEach(function (e) { sub.appendChild(extraLink(e, "chip")); });
        if (top) {
          top.hidden = !members.length;
          if (members.length) top.setAttribute("href", "#" + members[0].route);
          top.setAttribute("aria-selected", String(g === curGroup));
        }
        sub.hidden = g !== curGroup;
      });
    } else {
      var nav = root.querySelector(m.nav);
      nav.querySelectorAll(m.navItem).forEach(function (a) {
        var e = libById[P.primary + ":" + a.getAttribute("href").slice(1)];
        if (!e) return;
        a.hidden = !isOn(e);
        a.setAttribute("aria-selected", String(e.route === current));
      });
      on.filter(function (e) { return e.pack !== P.primary; }).forEach(function (e) { nav.appendChild(extraLink(e, m.navItem.split(".")[1])); });
    }
  }

  /* ---------- themes ---------- */
  function applyThemeTo(ctx) {
    var t = settings.theme;
    ctx.host.setAttribute("data-lp-theme", t);
    ctx.host.setAttribute("data-skin", t === ctx.id ? "native" : "themed");
  }
  function applyTheme() {
    var t = settings.theme, th = THEMES[t];
    document.documentElement.setAttribute("data-lp-theme", t);
    document.documentElement.style.colorScheme = th.scheme || "light";
    var native = t === P.primary;
    document.documentElement.toggleAttribute("data-lp-native", native);
    var mast = document.getElementById("lp-mast"), decor = document.getElementById("lp-decor");
    mast.innerHTML = native ? "" : withAssets(th.mast || "").replace(/\{\{title\}\}/g, "Life Planner");
    mast.hidden = native;
    decor.innerHTML = native ? "" : withAssets(th.decor || "");
    Object.keys(ctxs).forEach(function (pid) { applyThemeTo(ctxs[pid]); });
    document.title = native ? PACKS[P.primary].meta.title : "Life Planner · " + th.name;
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", th.swatch[0]);
    window.dispatchEvent(new Event("resize")); // charts pick up the new colours
  }

  /* ---------- Customize panel ---------- */
  var dlg, toastEl, toastTimer;
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === "text") n.textContent = v; else if (k === "html") n.innerHTML = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, ""); else if (v !== false && v != null) n.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function toast(text, undo) {
    toastEl.innerHTML = "";
    toastEl.appendChild(h("span", { text: text }));
    if (undo) toastEl.appendChild(h("button", { type: "button", text: "Undo", onclick: function () { undo(); toastEl.hidden = true; } }));
    (dlg && dlg.open ? dlg : document.body).appendChild(toastEl);
    toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 7000);
  }
  function openCustomize(pane) {
    renderCustomize(pane || dlg.dataset.pane || "tabs");
    if (!dlg.open) dlg.showModal();
  }
  function setTab(e, on) {
    if (!on && enabled().length <= 1 && isOn(e)) { toast("Keep at least one tab switched on."); return false; }
    settings.tabs[e.id] = on; saveSettings();
    if (on) ensurePack(e.pack);
    onRoute();
    return true;
  }
  function renderCustomize(pane) {
    dlg.dataset.pane = pane;
    var body = dlg.querySelector(".lpc-body");
    dlg.querySelectorAll(".lpc-seg button").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.pane === pane)); });
    body.innerHTML = "";
    if (pane === "tabs") body.appendChild(tabsPane()); else body.appendChild(themesPane());
  }
  function tabRow(e, on) {
    var id = "lpc-" + e.id.replace(/[^a-z0-9]/g, "-");
    var input = h("input", { type: "checkbox", role: "switch", id: id, checked: on, "aria-describedby": id + "-d" });
    input.addEventListener("change", function () {
      if (!setTab(e, input.checked)) { input.checked = true; return; }
      toast(input.checked ? "“" + navLabel(e) + "” is now in your planner." : "“" + navLabel(e) + "” is hidden. Everything in it is kept.", function () { setTab(e, !input.checked); renderCustomize("tabs"); });
      renderCustomize("tabs");
      var again = dlg.querySelector("#" + id); if (again) again.focus();
    });
    return h("div", { "class": "lpc-tab" + (on ? " on" : "") }, [
      h("label", { "for": id, "class": "lpc-tabtext" }, [
        h("span", { "class": "lpc-name" }, [navLabel(e), e.pack !== P.primary ? h("span", { "class": "lpc-from", text: PACKS[e.pack].meta.name }) : null]),
        h("span", { "class": "lpc-desc", id: id + "-d", text: e.desc })
      ]),
      h("span", { "class": "lpc-switch" }, [input, h("span", { "class": "lpc-track", "aria-hidden": "true" })])
    ]);
  }
  function tabsPane() {
    var on = enabled(), wrap = h("div");
    wrap.appendChild(h("p", { "class": "lpc-lead", text: "Pick the tabs you want. Hiding a tab never deletes anything: switch it back on and everything is exactly where you left it." }));
    wrap.appendChild(h("h3", { text: "In your planner (" + on.length + ")" }));
    var list = h("div", { "class": "lpc-list" });
    on.forEach(function (e) { list.appendChild(tabRow(e, true)); });
    wrap.appendChild(list);
    wrap.appendChild(h("h3", { text: "Add more tabs" }));
    wrap.appendChild(h("p", { "class": "lpc-note", text: "Every planner has the same tab library. Tabs from another planner keep their own example content until you change it." }));
    AREAS.forEach(function (a) {
      var off = LIB.filter(function (e) { return e.area === a[0] && !isOn(e); });
      if (!off.length) return;
      var d = h("details", { "class": "lpc-area" }, [h("summary", null, [a[1], h("span", { "class": "lpc-count", text: off.length + (off.length === 1 ? " tab" : " tabs") })])]);
      var l = h("div", { "class": "lpc-list" });
      off.forEach(function (e) { l.appendChild(tabRow(e, false)); });
      d.appendChild(l);
      wrap.appendChild(d);
    });
    wrap.appendChild(h("div", { "class": "lpc-foot" }, [h("button", { type: "button", "class": "lpc-btn ghost", text: "Back to the original tabs", onclick: function () {
      var before = JSON.stringify(settings.tabs);
      settings.tabs = {}; saveSettings(); onRoute(); renderCustomize("tabs");
      toast("Tabs are back to how this planner started. Nothing was deleted.", function () { settings.tabs = JSON.parse(before); saveSettings(); onRoute(); renderCustomize("tabs"); });
    } })]));
    return wrap;
  }
  function preview(t) {
    var th = THEMES[t];
    return h("div", { "class": "lpc-preview", "data-lp-theme": t, "aria-hidden": "true", html: withAssets(th.preview || "") +
      '<div class="lpp-title">Life Planner</div><div class="lpp-tabs"><i class="on">Week</i><i>Goals</i><i>Life</i></div>' +
      '<div class="lpp-card"><b>This week</b><span class="lpp-line"></span><span class="lpp-line s"></span><span class="lpp-btn">Add</span></div>' });
  }
  function themesPane() {
    var wrap = h("div");
    wrap.appendChild(h("p", { "class": "lpc-lead", text: "Change the look any time. Your content and your tabs stay exactly the same." }));
    var grid = h("div", { "class": "lpc-themes", role: "radiogroup", "aria-label": "Themes" });
    B.themeOrder.forEach(function (t) {
      var th = THEMES[t], on = settings.theme === t;
      var b = h("button", { type: "button", role: "radio", "aria-checked": String(on), "class": "lpc-theme" + (on ? " on" : ""), onclick: function () {
        if (settings.theme === t) return;
        var before = settings.theme;
        settings.theme = t; saveSettings(); applyTheme(); renderCustomize("themes");
        var again = dlg.querySelector('.lpc-theme[data-t="' + t + '"]'); if (again) again.focus();
        toast("Theme changed to " + th.name + ".", function () { settings.theme = before; saveSettings(); applyTheme(); if (dlg.open) renderCustomize("themes"); });
      } }, [preview(t), h("span", { "class": "lpc-tname" }, [th.name, on ? h("span", { "class": "lpc-cur", text: "Current" }) : null, t === P.theme && !on ? h("span", { "class": "lpc-orig", text: "Original" }) : null]), h("span", { "class": "lpc-tdesc", text: th.blurb })]);
      b.dataset.t = t;
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    return wrap;
  }
  function buildChrome() {
    dlg = h("dialog", { "class": "lpc", "aria-labelledby": "lpcTitle" }, [
      h("div", { "class": "lpc-head" }, [
        h("h2", { id: "lpcTitle", text: "Customize" }),
        h("button", { type: "button", "class": "lpc-x", "aria-label": "Close", text: "×", onclick: function () { dlg.close(); } })
      ]),
      h("div", { "class": "lpc-seg", role: "tablist" }, [
        h("button", { type: "button", role: "tab", "data-pane": "tabs", text: "Tabs", onclick: function () { renderCustomize("tabs"); } }),
        h("button", { type: "button", role: "tab", "data-pane": "themes", text: "Themes", onclick: function () { renderCustomize("themes"); } })
      ]),
      h("div", { "class": "lpc-body" })
    ]);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    document.body.appendChild(dlg);
    toastEl = h("div", { "class": "lpc-toast", role: "status", hidden: true });
    document.body.appendChild(toastEl);
    document.body.appendChild(h("button", { type: "button", "class": "lpc-fab", "aria-label": "Customize tabs and theme", onclick: function () { openCustomize(); } }, [h("span", { "aria-hidden": "true", text: "✦" }), " Customize"]));
    // a button in the planner's own footer too
    var c = ctxs[P.primary], foot = c.root.querySelector(PACKS[P.primary].meta.map.foot);
    if (foot) {
      var btn = h("button", { type: "button", "class": PACKS[P.primary].meta.footBtn || "btn", "data-lp-customize": "", text: "Customize tabs & theme", onclick: function () { openCustomize(); } });
      var spot = foot.querySelector(PACKS[P.primary].meta.footSpot || "nothing");
      if (spot) spot.insertBefore(btn, spot.firstChild); else foot.insertBefore(btn, foot.firstChild);
    }
  }

  /* ---------- backup store: every pack plus settings ---------- */
  function snapshot() {
    var packs = {};
    ORDER.forEach(function (pid) {
      var c = ctxs[pid], d = null;
      if (c && c.source) { try { d = c.source(); } catch (e) { d = null; } }
      if (!d) d = readJSON(packKey(pid));
      if (d) packs[pid] = JSON.parse(JSON.stringify(d));
    });
    return { packs: packs, settings: JSON.parse(JSON.stringify(settings)) };
  }
  function writeSnapshot(s, exact) {
    var done = [];
    try {
      Object.keys(s.packs || {}).forEach(function (pid) { if (PACKS[pid]) { localStorage.setItem(packKey(pid), JSON.stringify(s.packs[pid])); done.push(pid); } });
      if (exact) ORDER.forEach(function (pid) { if (!s.packs || !s.packs[pid]) localStorage.removeItem(packKey(pid)); });
      if (s.settings) localStorage.setItem(SKEY, JSON.stringify(s.settings));
    } catch (e) { throw e; }
  }
  window.LP_BACKUP_CONFIG = {
    planner: P.id, key: KEY,
    mountNode: function () { var c = ctxs[P.primary]; return c && c.root.querySelector(PACKS[P.primary].meta.map.foot); },
    prepend: PACKS[P.primary].meta.backupPrepend !== false, btnClass: PACKS[P.primary].meta.footBtn || "btn",
    notePrefix: PACKS[P.primary].meta.notePrefix || "",
    store: {
      packs: (function () { var o = {}; ORDER.forEach(function (pid) { o[pid] = PACKS[pid].meta.name; }); return o; })(),
      read: snapshot, write: writeSnapshot,
      active: function (pid) { return packActive(pid); },
      enable: function (snap, ids) {
        snap.settings = snap.settings || {}; snap.settings.tabs = snap.settings.tabs || {};
        ids.forEach(function (pid) { LIB.forEach(function (e) { if (e.pack === pid && snap.settings.tabs[e.id] === undefined) snap.settings.tabs[e.id] = true; }); });
      }
    }
  };

  /* ---------- start ---------- */
  window.LP = {
    pack: function (id, fn) { packFns[id] = fn; },
    boot: function () {
      loadSettings();
      document.documentElement.setAttribute("data-lp-planner", P.id);
      primary = makeCtx(P.primary, document.getElementById("lp-app"));
      applyTheme();
      primary.run();
      // packs with tabs switched on load straight away, so backups and "coming up" lists see them
      ORDER.forEach(function (pid) { if (pid !== P.primary && packActive(pid)) ensurePack(pid); });
      buildChrome();
      window.addEventListener("hashchange", onRoute);
      onRoute();
    },
    openCustomize: openCustomize,
    refreshNav: function () { renderNav(); },
    _settings: function () { return settings; },
    _lib: LIB
  };
})();
