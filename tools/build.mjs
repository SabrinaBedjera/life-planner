// Builds the three standalone planner downloads from the shared source in src/.
//   node tools/build.mjs          -> writes planners/<id>.html
//   node tools/build.mjs --check  -> fails if planners/ is out of date
// Each output is one self-contained HTML file: fonts, pictures, charts and code are all
// inside it, so it works offline and needs no account, server or install.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const read = (...p) => readFileSync(join(...p), "utf8");
const json = (...p) => JSON.parse(read(...p));
const maybe = (...p) => (existsSync(join(...p)) ? read(...p) : "");

/* ---------- CSS helpers ---------- */
// Prefix every selector in a stylesheet. `:host` alone becomes the prefix itself.
function prefixCss(css, prefix) {
  let out = "", buf = "", stack = [];
  for (let i = 0; i < css.length; i++) {
    if (css.startsWith("/*", i)) { const k = css.indexOf("*/", i + 2); out += buf + css.slice(i, k + 2); buf = ""; i = k + 1; continue; }
    const c = css[i];
    if (c === "{") {
      const head = buf.trim(); buf = "";
      if (head.startsWith("@")) { stack.push(/^@(font-face|keyframes|-webkit-keyframes)/.test(head) ? "raw" : "at"); out += head + "{"; }
      else if (stack.length && stack[stack.length - 1].startsWith("raw")) { stack.push("rawin"); out += head + "{"; }
      else {
        stack.push("rule");
        out += head.split(/,(?![^(]*\))/).map((s) => {
          s = s.trim();
          if (s === ":host") return prefix;
          if (s.startsWith(":host ")) return prefix + s.slice(5);
          return prefix + " " + s;
        }).join(",") + "{";
      }
      continue;
    }
    if (c === "}") { out += buf + "}"; buf = ""; stack.pop(); continue; }
    buf += c;
  }
  return out + buf;
}
// %card%, %btn% ... -> the pack's own selectors (a selector list expands into several)
function expand(css, map) {
  return css.replace(/(^|[{}])([^{}@]*%[a-z]+%[^{}]*)\{/g, (m, lead, sel) => {
    const parts = sel.split(/,(?![^(]*\))/).flatMap((s) => {
      let list = [s];
      for (const [, name] of s.matchAll(/%([a-z]+)%/g)) {
        const alts = (map[name] || ".lp-none").split(/,(?![^(]*\))/).map((x) => x.trim());
        list = list.flatMap((x) => alts.map((a) => x.replace("%" + name + "%", a)));
      }
      return list;
    });
    return lead + parts.join(",") + "{";
  });
}

/* ---------- gather sources ---------- */
const packOrder = ["girly-pop", "arcade", "studio"];
const packs = {};
for (const id of packOrder) {
  const d = join(src, "packs", id);
  packs[id] = { meta: json(d, "pack.json"), html: read(d, "pack.html"), css: read(d, "pack.css"), js: read(d, "pack.js"), adapter: maybe(d, "adapter.css") };
}
const themeOrder = json(src, "themes", "order.json");
const themes = {};
for (const id of themeOrder) {
  const d = join(src, "themes", id);
  const t = json(d, "theme.json");
  themes[id] = { ...t, id, skin: maybe(d, "skin.css"), page: maybe(d, "page.css"), mast: maybe(d, "mast.html"), decor: maybe(d, "decor.html"), preview: maybe(d, "preview.html") };
}
const assets = {};
for (const dir of readdirSync(join(src, "assets"))) {
  const full = join(src, "assets", dir);
  if (!statSync(full).isDirectory()) continue;
  for (const f of readdirSync(full)) {
    const ext = extname(f).slice(1), type = { webp: "image/webp", png: "image/png", svg: "image/svg+xml", jpg: "image/jpeg" }[ext];
    if (!type) continue;
    const buf = readFileSync(join(full, f));
    assets[dir + "/" + basename(f, "." + ext)] = type === "image/svg+xml" ? "data:image/svg+xml," + encodeURIComponent(buf.toString("utf8").trim()) : "data:" + type + ";base64," + buf.toString("base64");
  }
}
const fonts = json(src, "fonts", "fonts.json").map((f) =>
  `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(data:font/woff2;base64,${readFileSync(join(src, "fonts", f.file)).toString("base64")}) format("woff2");unicode-range:${f.unicodeRange}}`).join("\n");

const themedBase = read(src, "shell", "themed.css");
const T = (id) => `:host([data-skin="themed"][data-lp-theme="${id}"])`;
function themedFor(pid) {
  const m = packs[pid].meta.map;
  let css = prefixCss(expand(themedBase, m), ':host([data-skin="themed"])');
  css += "\n" + prefixCss(expand(packs[pid].adapter, m), ':host([data-skin="themed"])');
  for (const id of themeOrder) if (themes[id].skin) css += "\n/* skin: " + id + " */\n" + prefixCss(expand(themes[id].skin, m), T(id));
  css += "\n" + prefixCss(expand(read(src, "shell", "ext.css"), m), ":host([data-ext])");
  return css;
}
function tokensCss() {
  return themeOrder.map((id) => {
    const t = themes[id];
    return `[data-lp-theme="${id}"]{${Object.entries(t.tokens).map(([k, v]) => `--t-${k}:${v}`).join(";")}}`;
  }).join("\n");
}
function pageCss() {
  return themeOrder.map((id) => themes[id].page
    .replaceAll("%page%", `html[data-lp-theme="${id}"]:not([data-lp-native])`)
    .replaceAll("%preview%", `.lpc-preview[data-lp-theme="${id}"]`)
    .replaceAll("%theme%", `[data-lp-theme="${id}"]`)).join("\n");
}

/* ---------- write each planner ---------- */
const safe = (s) => s.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");
const kit = read(root, "shared", "backup-kit.html");
const check = process.argv.includes("--check");
const outDir = join(root, "planners");
if (!check) mkdirSync(outDir, { recursive: true });
let stale = 0;
for (const f of readdirSync(join(src, "planners"))) {
  const planner = json(src, "planners", f);
  const build = {
    version: json(root, "package.json").version, planner, packOrder, themeOrder, assets,
    packs: Object.fromEntries(packOrder.map((id) => [id, { meta: packs[id].meta, html: packs[id].html }])),
    css: Object.fromEntries(packOrder.map((id) => [id, packs[id].css])),
    themed: Object.fromEntries(packOrder.map((id) => [id, themedFor(id)])),
    themes: Object.fromEntries(themeOrder.map((id) => { const { skin, page, ...rest } = themes[id]; return [id, rest]; }))
  };
  const html = `<!doctype html>
<html lang="en" data-lp-planner="${planner.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${themes[planner.theme].swatch[0]}">
<title>${packs[planner.primary].meta.title}</title>
<!-- Life Planner · ${planner.name}. Built from the shared source in src/ by tools/build.mjs. Edit the source, not this file. -->
<style>${fonts}</style>
<style>${read(src, "shell", "shell.css")}
${tokensCss()}
${pageCss()}</style>
</head>
<body>
<div id="lp-decor" aria-hidden="true"></div>
<header id="lp-mast" hidden></header>
<div id="lp-app"></div>
<script>window.LP_BUILD = ${safe(JSON.stringify(build))};</script>
<script>/* d3 v7.8.5 (ISC licence, Mike Bostock) */
${safe(read(src, "vendor", "d3.min.js"))}</script>
<script>/* d3-sankey v0.12.3 (BSD-3-Clause licence, Mike Bostock) */
${safe(read(src, "vendor", "d3-sankey.min.js"))}</script>
<script>${safe(read(src, "shell", "shell.js"))}</script>
${packOrder.map((id) => `<script>LP.pack(${JSON.stringify(id)}, function (document, window, location, localStorage, LPBackup) {\n${safe(packs[id].js)}\n});</script>`).join("\n")}
${kit}
<script>LP.boot();</script>
</body>
</html>
`;
  const out = join(outDir, planner.id + ".html");
  if (check) { if (!existsSync(out) || read(out) !== html) { console.error(basename(out) + ": out of date, run npm run build"); stale++; } else console.log(basename(out) + ": up to date"); }
  else { writeFileSync(out, html); console.log(`${basename(out)}: ${(html.length / 1024 / 1024).toFixed(2)} MB`); }
}
if (stale) process.exit(1);
