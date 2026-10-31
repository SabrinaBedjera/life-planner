// Browser tests for the shared-codebase planners in planners/.
// Run with: npm test   (needs Playwright: npm install, then npx playwright install chromium)
// All data here is fictional. Each test uses a fresh browser profile, so nothing touches real planners.
import { chromium } from "playwright";
import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = mkdtempSync(join(tmpdir(), "lp-planners-"));
const shots = process.env.SHOTS_DIR;
if (shots) mkdirSync(shots, { recursive: true });
const IDS = ["arcade", "studio", "girly-pop"];
const THEMES = JSON.parse(readFileSync(join(root, "src", "themes", "order.json"), "utf8"));
const ORIGINAL_TABS = {
  arcade: ["Week", "Uni", "Work", "Social", "Gym"],
  studio: ["This week", "Home projects", "Wellbeing", "Family & friends", "Inspiration", "Books", "My channel"],
  "girly-pop": ["This week", "Jobs", "Life"]
};
const url = (dir, id, hash) => pathToFileURL(join(root, dir, id + ".html")).href + (hash ? "#" + hash : "");
const KEY = (id) => "life-planner-" + id + "-v1";
let failures = 0, passes = 0;
function check(cond, msg) { if (cond) { passes++; console.log("  ok   " + msg); } else { failures++; console.log("  FAIL " + msg); } }

const browser = await chromium.launch();
async function context(viewport) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: viewport || { width: 1280, height: 900 } });
  const net = [];
  await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  return { ctx, net };
}
async function openIn(ctx, dir, id, hash) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url(dir, id, hash));
  await page.waitForTimeout(500);
  return { page, errors };
}
const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const settings = (page, id) => stored(page, KEY(id) + ":settings");
const shadow = (page, fn, arg) => page.evaluate(([f, a]) => new Function("root", "a", f)(document.getElementById("lp-app").shadowRoot, a), [fn, arg]);
const navLabels = (page) => shadow(page, `return [...root.querySelectorAll("nav.tabs a.tab")].filter((a) => !a.hidden).map((a) => a.textContent.trim());`);
const visibleText = (page) => page.evaluate(() => {
  const out = [];
  const walk = (n) => { if (n.shadowRoot) walk(n.shadowRoot); for (const c of n.children || []) { if (c.hidden || (c.checkVisibility && !c.checkVisibility())) continue; if (c.matches && c.matches("textarea, input")) out.push(c.value); walk(c); } if (n.nodeType === 1 && !n.children.length) out.push(n.textContent); };
  walk(document.body); return out.join("\n");
});
async function openCustomize(page, pane) {
  await page.locator(".lpc-fab").click();
  if (pane) await page.locator(`.lpc-seg [data-pane="${pane}"]`).click();
  await page.locator("dialog.lpc[open]").waitFor();
}
async function toggleTab(page, libId) {
  const id = "lpc-" + libId.replace(/[^a-z0-9]/g, "-");
  await page.$$eval("dialog.lpc details.lpc-area", (ds) => ds.forEach((d) => (d.open = true)));
  await page.locator("#" + id).click({ force: true });
  await page.waitForTimeout(150);
}
async function exportBackup(page) {
  await page.locator("#lp-app").evaluate(() => {});
  const btn = page.locator("#lpBackup button", { hasText: "Export backup" }).first();
  await btn.scrollIntoViewIfNeeded();
  const [dl] = await Promise.all([page.waitForEvent("download"), btn.click()]);
  const path = join(tmp, "b-" + Date.now() + Math.random().toString(36).slice(2) + ".json");
  await dl.saveAs(path);
  return { path, json: JSON.parse(readFileSync(path, "utf8")), name: dl.suggestedFilename() };
}
async function importFile(page, file) {
  await page.locator("#lpBackup .lpb-file").setInputFiles(file);
  await page.locator("dialog.lpb-dialog[open]").waitFor();
}
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

/* ---------------------------------------------------------------- */
for (const id of IDS) {
  console.log(`\n${id}: first open`);
  {
    const { ctx, net } = await context();
    const { page, errors } = await openIn(ctx, "planners", id);
    check(errors.length === 0, "opens with no script errors" + (errors.length ? ": " + errors.join(" | ") : ""));
    check(net.length === 0, "makes no network requests at all (fully offline)" + (net.length ? ": " + net.join(", ") : ""));
    check((await settings(page, id) || {}).theme === undefined || (await settings(page, id)).theme === id, "starts with its original theme");
    check(await page.evaluate(() => document.documentElement.hasAttribute("data-lp-native")), "the original look is used as is");
    check(JSON.stringify(await navLabels(page)) === JSON.stringify(ORIGINAL_TABS[id]), "shows exactly the original tabs: " + (await navLabels(page)).join(", "));
    check(await page.locator(".lpc-fab").isVisible(), "Customize button is visible");
    check(await shadow(page, `return !!root.querySelector("[data-lp-customize]")`), "Customize is also in the footer");
    check(!!(await stored(page, KEY(id))) || id !== "arcade", "example content saves under the same key as before (" + KEY(id) + ")" + (id !== "arcade" ? ": this one saves after your first change, as before" : ""));
    check(await page.evaluate(() => [...document.querySelectorAll("script[src], link[href^='http']")].length === 0), "no outside scripts or stylesheets");
    await ctx.close();
  }

  console.log(`${id}: data saved by the current file carries over`);
  {
    const { ctx } = await context();
    const legacy = await openIn(ctx, "themes", id);
    const marker = "Fictional marker " + id;
    await legacy.page.locator("#sched textarea").first().fill("Fictional plan for Monday");
    await legacy.page.waitForTimeout(900);
    await legacy.page.evaluate(([k, m]) => {
      const d = JSON.parse(localStorage.getItem(k));
      d.lpTestMarker = m;
      localStorage.setItem(k, JSON.stringify(d));
    }, [KEY(id), marker]);
    const before = await stored(legacy.page, KEY(id));
    await legacy.page.close();
    const { page, errors } = await openIn(ctx, "planners", id);
    const after = await stored(page, KEY(id));
    check(errors.length === 0, "opens existing data with no errors");
    check(after && after.lpTestMarker === marker, "existing saved data is still there");
    const keys = Object.keys(before).filter((k) => k !== "lpTestMarker");
    check(keys.every((k) => k in after), "no saved section went missing (" + keys.length + " sections)");
    check(await page.evaluate((k) => Object.keys(localStorage).filter((x) => x.startsWith(k + ":pack:")).length === 0, KEY(id)), "no extra storage is created for tabs you haven't switched on");
    await ctx.close();
  }

  console.log(`${id}: customize tabs`);
  {
    const { ctx } = await context();
    const { page, errors } = await openIn(ctx, "planners", id);
    const lib = await page.evaluate(() => LP._lib.map((e) => ({ id: e.id, pack: e.pack, route: e.route, label: e.label })));
    const own = lib.filter((e) => e.pack === id);
    const other = lib.filter((e) => e.pack !== id);
    check(lib.length === 21, "every planner has the full tab library (" + lib.length + " tabs)");
    const before = JSON.stringify(await stored(page, KEY(id)));
    await openCustomize(page, "tabs");
    const target = own[1];
    await toggleTab(page, target.id);
    check((await settings(page, id)).tabs[target.id] === false, "switching a tab off is saved");
    const hiddenNow = id === "girly-pop"
      ? await shadow(page, `return root.querySelector('.subtabs [data-tab="${target.route}"]').hidden`)
      : !(await navLabels(page)).includes(target.label);
    check(hiddenNow, "the hidden tab disappears from the menu");
    check(JSON.stringify(await stored(page, KEY(id))) === before, "hiding a tab doesn't change any saved content");
    await page.keyboard.press("Escape");
    await page.evaluate((r) => (location.hash = r), target.route);
    await page.waitForTimeout(200);
    check(await page.evaluate((r) => location.hash !== "#" + r, target.route), "a link to a hidden tab goes to a visible tab instead");
    await openCustomize(page, "tabs");
    await toggleTab(page, target.id);
    check((await settings(page, id)).tabs[target.id] === true, "switching it back on is saved");
    check(JSON.stringify(await stored(page, KEY(id))) === before, "content is exactly the same after switching it back on");
    // can't switch off the last tab
    for (const e of own) await page.evaluate((i) => { const s = LP._settings(); s.tabs[i] = false; }, e.id);
    await page.evaluate((i) => { const s = LP._settings(); s.tabs[i] = true; }, own[0].id);
    await page.locator('.lpc-seg [data-pane="themes"]').click(); await page.locator('.lpc-seg [data-pane="tabs"]').click();
    const lastSwitch = page.locator("#lpc-" + own[0].id.replace(/[^a-z0-9]/g, "-"));
    await lastSwitch.click({ force: true });
    await page.waitForTimeout(150);
    check(await lastSwitch.isChecked(), "the last tab can't be switched off");
    check(await page.locator(".lpc-toast").isVisible() && /at least one/i.test(await page.locator(".lpc-toast").textContent()), "it explains why");
    await page.locator(".lpc-foot button").click();
    check(Object.keys((await settings(page, id)).tabs).length === 0, "“Back to the original tabs” resets the choice");
    check((await page.locator(".lpc-toast").textContent()).includes("Nothing was deleted"), "and says nothing was deleted");
    // switch on a tab from another planner
    const extra = other.find((e) => e.label === "Books" || e.label === "Gym");
    await toggleTab(page, extra.id);
    await page.keyboard.press("Escape");
    await page.evaluate((r) => (location.hash = r), extra.route);
    await page.waitForTimeout(500);
    const extraKey = KEY(id) + ":pack:" + extra.pack;
    check(await page.evaluate((r) => location.hash === "#" + r, extra.route), "a tab from another planner opens: " + extra.label + " from " + extra.pack);
    check(await shadow(page, `const h = root.querySelector('[data-pack="${extra.pack}"]'); return !!h && !h.hidden && h.shadowRoot.querySelector('#view-${extra.route.split("-").pop()}, #panel-${extra.route.split("-").pop()}').hidden === false`), "its content shows");
    await shadow(page, `const h = root.querySelector('[data-pack="${extra.pack}"]').shadowRoot; const f = h.querySelector('form.addrow input, form input[type=text], form input:not([type])'); if (f) { f.value = "Fictional entry"; f.form.requestSubmit(); }`);
    await page.waitForTimeout(400);
    check(!!(await stored(page, extraKey)), "what you add there saves separately (" + extraKey + ")");
    check(JSON.stringify(await stored(page, KEY(id))) === before, "this planner's own content is untouched");
    const navNow = id === "girly-pop" ? await shadow(page, `return [...root.querySelectorAll(".subtabs [data-lp-extra]")].map((a) => a.textContent)`) : await navLabels(page);
    check(navNow.includes(extra.label), "it appears in the menu");
    check(errors.length === 0, "no script errors while customizing" + (errors.length ? ": " + errors.join(" | ") : ""));
    await ctx.close();
  }

  console.log(`${id}: themes`);
  {
    const { ctx } = await context();
    const { page, errors } = await openIn(ctx, "planners", id);
    const before = JSON.stringify(await stored(page, KEY(id)));
    await openCustomize(page, "themes");
    check(await page.locator(".lpc-theme").count() === THEMES.length, "the gallery shows all " + THEMES.length + " themes");
    for (let round = 0; round < 2; round++) for (const t of THEMES) {
      await page.locator(`.lpc-theme[data-t="${t}"]`).click();
      await page.waitForTimeout(60);
    }
    check(errors.length === 0, "switching through every theme twice causes no errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));
    check(JSON.stringify(await stored(page, KEY(id))) === before, "content is identical after all that switching");
    await page.locator(`.lpc-theme[data-t="goth"]`).click();
    await page.locator(".lpc-toast button").click();
    check((await settings(page, id)).theme === THEMES[THEMES.length - 1], "Undo puts the previous theme back");
    await page.locator(`.lpc-theme[data-t="cottagecore"]`).click();
    await page.reload(); await page.waitForTimeout(400);
    check(await page.evaluate(() => document.documentElement.getAttribute("data-lp-theme")) === "cottagecore", "the chosen theme is remembered after reloading");
    check(!(await page.evaluate(() => document.documentElement.hasAttribute("data-lp-native"))), "another planner's look is applied");
    check(JSON.stringify(await navLabels(page)) === JSON.stringify(ORIGINAL_TABS[id]) || id === "girly-pop", "tabs stay the same when the theme changes");
    check(await shadow(page, `return root.host.getAttribute("data-skin")`) === "themed", "the planner is restyled by the theme");
    check(await page.locator("#lp-mast").isVisible(), "the theme's own header shows");
    await page.locator(".lpc-fab").click(); await page.locator('.lpc-seg [data-pane="themes"]').click();
    await page.locator(`.lpc-theme[data-t="${id}"]`).click();
    check(await page.evaluate(() => document.documentElement.hasAttribute("data-lp-native")), "switching back restores the original look");
    await ctx.close();
  }

  console.log(`${id}: phone`);
  for (const t of [id, "goth", "desktop93", "streetwear"]) {
    const { ctx } = await context({ width: 375, height: 760 });
    await ctx.addInitScript(([k, t]) => localStorage.setItem(k, JSON.stringify({ theme: t, tabs: {} })), [KEY(id) + ":settings", t]);
    const { page, errors } = await openIn(ctx, "planners", id);
    check(await noSideScroll(page) && errors.length === 0, "no sideways scrolling on a phone in the " + t + " theme");
    if (shots) await page.screenshot({ path: join(shots, `phone-${id}-${t}.png`) });
    await ctx.close();
  }
}

/* ---------------------------------------------------------------- */
console.log("\nbackups");
{
  const { ctx } = await context();
  const { page, errors } = await openIn(ctx, "planners", "arcade");
  await page.evaluate(() => { const s = LP._settings(); s.tabs["studio:books"] = true; localStorage.setItem("life-planner-arcade-v1:settings", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(500);
  const b = await exportBackup(page);
  check(b.json.format === "life-planner-backup" && b.json.version === 2 && b.json.planner === "arcade", "exports a version 2 backup");
  check(/^life-planner-arcade-backup-\d{4}-\d\d-\d\d\.json$/.test(b.name), "file name is clear: " + b.name);
  check(b.json.data.packs.arcade && b.json.data.packs.studio && !b.json.data.packs["girly-pop"], "it holds every part you use (Arcade + Studio), nothing else");
  check(b.json.data.settings && b.json.data.settings.tabs["studio:books"] === true, "it holds your tab and theme choices");
  check(JSON.stringify(b.json.data.packs.arcade) === JSON.stringify(await stored(page, KEY("arcade"))), "Arcade content matches what's saved");

  // merge back in: nothing duplicated, nothing lost
  await importFile(page, b.path);
  const dlgText = await page.locator("dialog.lpb-dialog").textContent();
  check(/Studio · /.test(dlgText) && /Add to what I have/.test(dlgText), "import preview lists each part and section");
  await Promise.all([page.waitForEvent("load"), page.locator("dialog.lpb-dialog button", { hasText: "Add to what I have" }).click()]);
  await page.waitForTimeout(400);
  check(JSON.stringify(await stored(page, KEY("arcade"))) === JSON.stringify(b.json.data.packs.arcade), "importing your own backup again changes nothing");
  check(errors.length === 0, "no errors");
  await ctx.close();
}
{
  // a backup from the old single-file Girly Pop goes into the Girly Pop tabs of the Arcade planner
  const { ctx } = await context();
  const g = await openIn(ctx, "themes", "girly-pop");
  await g.page.locator("#sched textarea").first().fill("Fictional plan");
  await g.page.waitForTimeout(900);
  await g.page.evaluate(() => { const d = JSON.parse(localStorage.getItem("life-planner-girly-pop-v1")); d.jobs["fictional-role"] = { title: "Fictional Role (test)", company: "Example Co.", status: "pool" }; localStorage.setItem("life-planner-girly-pop-v1", JSON.stringify(d)); });
  await g.page.reload(); await g.page.waitForTimeout(400);
  await g.page.evaluate(() => { const d = document.querySelector(".foot .export"); if (d) d.open = true; });
  const btn = g.page.locator("#lpBackup button", { hasText: "Export backup" }).first();
  const [dl] = await Promise.all([g.page.waitForEvent("download"), btn.click()]);
  const v1 = join(tmp, "girly-v1.json"); await dl.saveAs(v1);
  await g.page.close();
  await ctx.close();

  const fresh = await context();
  const { page, errors } = await openIn(fresh.ctx, "planners", "arcade");
  const arcadeBefore = JSON.stringify(await stored(page, KEY("arcade")));
  await importFile(page, v1);
  const text = await page.locator("dialog.lpb-dialog").textContent();
  check(/different planner/.test(text), "explains the backup is from a different planner");
  check(/switched on/.test(text), "says the Girly Pop tabs will be switched on");
  check(/Girly Pop · /.test(text), "previews the Girly Pop sections");
  await page.locator("dialog.lpb-dialog button", { hasText: "Cancel" }).click();
  check(!(await stored(page, KEY("arcade") + ":pack:girly-pop")), "Cancel changes nothing");
  await importFile(page, v1);
  await Promise.all([page.waitForEvent("load"), page.locator("dialog.lpb-dialog button", { hasText: "Add to what I have" }).click()]);
  await page.waitForTimeout(500);
  const moved = await stored(page, KEY("arcade") + ":pack:girly-pop");
  check(moved && moved.jobs && moved.jobs["fictional-role"], "the Girly Pop content arrives in the Arcade planner");
  check(JSON.stringify(await stored(page, KEY("arcade"))) === arcadeBefore, "Arcade's own content is untouched");
  check(Object.entries((await settings(page, "arcade")).tabs).some(([k, v]) => k.startsWith("girly-pop:") && v), "Girly Pop tabs are switched on to show it");
  check(await page.locator(".lpb-bar.lpb-ok").isVisible(), "a success message confirms it");
  // undo puts everything back exactly, including removing the new part
  const undo = page.locator("#lpBackup button", { hasText: "Undo last import" }).elementHandle ? await page.locator("#lpBackup button", { hasText: "Undo last import" }).elementHandle() : null;
  await undo.click();
  await Promise.all([page.waitForEvent("load"), undo.click()]);
  await page.waitForTimeout(500);
  check(!(await stored(page, KEY("arcade") + ":pack:girly-pop")), "Undo removes what the import added");
  check(!Object.keys(((await settings(page, "arcade")) || { tabs: {} }).tabs).some((k) => k.startsWith("girly-pop:")), "Undo puts the tabs back too");
  check(errors.length === 0, "no errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await fresh.ctx.close();
}
{
  // a backup from a new planner can go back into the old single file
  const { ctx } = await context();
  const { page } = await openIn(ctx, "planners", "studio");
  const b = await exportBackup(page);
  await page.close(); await ctx.close();
  const c2 = await context();
  const legacy = await openIn(c2.ctx, "themes", "studio");
  await legacy.page.locator("#lpBackup .lpb-file").setInputFiles(b.path);
  await legacy.page.locator("dialog.lpb-dialog[open]").waitFor();
  const t = await legacy.page.locator("dialog.lpb-dialog").textContent();
  check(/Add to what I have/.test(t), "the current Studio file accepts a backup from the new Studio planner");
  await c2.ctx.close();
  const c3 = await context();
  const legacyA = await openIn(c3.ctx, "themes", "arcade");
  await legacyA.page.locator("#lpBackup .lpb-file").setInputFiles(b.path);
  await legacyA.page.locator("dialog.lpb-dialog[open]").waitFor();
  check(/doesn't have any Arcade content/.test(await legacyA.page.locator("dialog.lpb-dialog").textContent()), "the current Arcade file explains a Studio-only backup has nothing for it");
  await c3.ctx.close();
}
{
  // Restore sample content only adds, in every part you use
  const { ctx } = await context();
  const { page } = await openIn(ctx, "planners", "studio");
  await page.evaluate(() => { const s = LP._settings(); s.tabs["arcade:uni"] = true; localStorage.setItem("life-planner-studio-v1:settings", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(500);
  await page.locator("#sched textarea:visible").first().fill("Fictional plan");
  await page.evaluate(() => (location.hash = "arcade-uni"));
  await page.waitForTimeout(300);
  await page.locator('form[data-add="deadlines"] input[name="title"]:visible').fill("Fictional essay");
  await page.locator('form[data-add="deadlines"] button:visible').click();
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("life-planner-studio-v1")); d.books = [{ id: "mine", title: "My own fictional book", author: "A. Writer", shelf: "now" }]; localStorage.setItem("life-planner-studio-v1", JSON.stringify(d));
    const a = JSON.parse(localStorage.getItem("life-planner-studio-v1:pack:arcade")); a.deadlines = []; localStorage.setItem("life-planner-studio-v1:pack:arcade", JSON.stringify(a));
  });
  await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => LPBackup.restoreSamples());
  await Promise.all([page.waitForEvent("load"), page.locator("dialog.lpb-dialog button", { hasText: "Add sample content" }).click()]);
  await page.waitForTimeout(500);
  const s = await stored(page, KEY("studio")), a = await stored(page, KEY("studio") + ":pack:arcade");
  check(s.books.some((b) => b.title === "My own fictional book") && s.books.length > 1, "your own items stay and samples come back");
  check(a.deadlines.length > 0, "samples also come back in tabs from other planners you've switched on");
  await ctx.close();
}
{
  // Studio's old "hide this tab" choices carry over to Customize
  const { ctx } = await context();
  const legacy = await openIn(ctx, "themes", "studio");
  await legacy.page.evaluate(() => { const d = JSON.parse(localStorage.getItem("life-planner-studio-v1")); d.custom = { tabs: { books: { hide: true }, ideas: { name: "Mood board" } } }; localStorage.setItem("life-planner-studio-v1", JSON.stringify(d)); });
  await legacy.page.close();
  const { page, errors } = await openIn(ctx, "planners", "studio");
  const labels = await navLabels(page);
  check(!labels.includes("Books"), "a tab hidden in the old Studio stays hidden");
  check(labels.includes("Mood board"), "a renamed Studio tab keeps its name");
  check((await settings(page, "studio")).tabs["studio:books"] === false, "the choice now lives in Customize");
  check(errors.length === 0, "no errors");
  await ctx.close();
}

await browser.close();
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
