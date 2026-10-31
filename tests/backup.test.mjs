// Browser tests for universal backups, safe imports and save warnings.
// Run with: npm test   (needs Playwright: npm install, then npx playwright install chromium)
import { chromium } from "playwright";
import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = mkdtempSync(join(tmpdir(), "lp-test-"));
const shots = process.env.SHOTS_DIR;
if (shots) mkdirSync(shots, { recursive: true });
const PLANNERS = [
  { id: "arcade", key: "life-planner-arcade-v1" },
  { id: "studio", key: "life-planner-studio-v1" },
  { id: "girly-pop", key: "life-planner-girly-pop-v1" }
];
let failures = 0, passes = 0;
function check(cond, msg) { if (cond) { passes++; console.log("  ok   " + msg); } else { failures++; console.log("  FAIL " + msg); } }

const browser = await chromium.launch();

async function open(p, opts = {}) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: opts.viewport || { width: 1280, height: 900 } });
  // Simulate being offline: the current files may ask for web fonts or chart code; the planner must still work.
  await ctx.route(/^https?:/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(pathToFileURL(join(root, "themes", p.id + ".html")).href);
  await page.waitForTimeout(400);
  return { ctx, page, errors };
}
async function showFooter(page, p) {
  if (p.id === "girly-pop") { await page.evaluate(() => { const d = document.querySelector(".foot .export"); d.open = true; }); }
  await page.locator("#lpBackup").scrollIntoViewIfNeeded();
}
async function exportNow(page, p) {
  await showFooter(page, p);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#lpBackup button", { hasText: /JSON backup|Export backup/ }).first().click()]);
  const path = join(tmp, p.id + "-" + Date.now() + ".json");
  await dl.saveAs(path);
  return { path, json: JSON.parse(readFileSync(path, "utf8")), name: dl.suggestedFilename() };
}
async function importFile(page, p, file) {
  await showFooter(page, p);
  await page.locator("#lpBackup .lpb-file").setInputFiles(file);
  await page.locator("dialog.lpb-dialog[open]").waitFor();
}
const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
function firstCollection(data) {
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (Array.isArray(v) && v.every((x) => x && typeof x === "object")) return { k, type: "array" };
    if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length && Object.values(v).every((x) => x && typeof x === "object" && !Array.isArray(x)) && k !== "settings" && k !== "weeks") return { k, type: "object" };
  }
}
function addItem(data, c, item) {
  if (c.type === "array") data[c.k].push(item); else data[c.k]["imported-test-item"] = item;
}
function hasItem(data, c) {
  return c.type === "array" ? data[c.k].some((x) => x && x.title === "Imported test item") : !!data[c.k]["imported-test-item"];
}

for (const p of PLANNERS) {
  console.log(`\n${p.id}`);
  const { ctx, page, errors } = await open(p);
  check(errors.length === 0, "opens offline with no script errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await showFooter(page, p);
  check(await page.locator("#lpBackup").isVisible(), "backup buttons show in the footer");
  check(/Last backup: never/.test(await page.locator("#lpBackup .lpb-note").textContent()), "footer says no backup yet");
  if (shots) await page.locator(p.id === "girly-pop" ? ".foot" : "#lpBackup").screenshot({ path: join(shots, `${p.id}-footer.png`) });

  // Export
  const ex = await exportNow(page, p);
  check(ex.json.format === "life-planner-backup" && ex.json.version === 1 && ex.json.planner === p.id, "export uses the universal format");
  check(ex.name === `life-planner-${p.id}-backup-${new Date().toISOString().slice(0, 10)}.json` || ex.name.startsWith(`life-planner-${p.id}-backup-`), "export file name: " + ex.name);
  check(ex.json.data && typeof ex.json.data === "object", "export carries the planner data");
  check(/Backup saved/.test(await page.locator("#lpBackup .lpb-note").textContent()), "footer confirms the backup was saved");
  check(await page.evaluate((k) => localStorage.getItem(k + ":last-backup"), p.key) === await page.evaluate(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }), "last backup date is remembered");
  const before = (await stored(page, p.key)) || ex.json.data;

  // Add to what I have
  const c = firstCollection(ex.json.data);
  check(!!c, "found a list to test with: " + (c && c.k));
  const backup = JSON.parse(JSON.stringify(ex.json));
  addItem(backup.data, c, { id: "imported-test-item", title: "Imported test item", text: "Imported test item" });
  const backupPath = join(tmp, p.id + "-edited.json");
  // Include a booby-trapped "__proto__" key, as a malicious file might
  writeFileSync(backupPath, JSON.stringify(backup).replace('"data":{', '"data":{"__proto__":{"polluted":"yes"},'));
  await importFile(page, p, backupPath);
  const dlgText = await page.locator("dialog.lpb-dialog").textContent();
  check(/In backup/.test(dlgText) && /In your planner now/.test(dlgText), "import shows a summary before changing anything");
  if (shots) await page.locator("dialog.lpb-dialog").screenshot({ path: join(shots, `${p.id}-import-dialog.png`) });
  check(!(await page.evaluate((k) => localStorage.getItem(k + ":restore-point"), p.key)), "nothing changes while the dialog is open");
  await Promise.all([page.waitForEvent("load"), page.locator("dialog.lpb-dialog button", { hasText: "Add to what I have" }).click()]);
  await page.waitForTimeout(400);
  let after = await stored(page, p.key);
  check(hasItem(after, c), "merge adds the new item");
  check(JSON.stringify(after[c.k]).length >= JSON.stringify(before[c.k] || "").length, "merge keeps existing items");
  check(await page.evaluate(() => ({}).polluted === undefined), "a booby-trapped backup can't tamper with the page");
  check(await page.locator(".lpb-bar.lpb-ok").isVisible(), "success message after import");
  check(!!(await page.evaluate((k) => localStorage.getItem(k + ":restore-point"), p.key)), "undo copy saved before the import");

  // Undo
  await showFooter(page, p);
  const undo = page.locator("#lpBackup button").nth(2);
  check(await undo.isVisible() && (await undo.textContent()) === "Undo last import", "Undo last import button shows");
  await undo.click();
  await Promise.all([page.waitForEvent("load"), undo.click()]);
  await page.waitForTimeout(400);
  after = await stored(page, p.key);
  check(!hasItem(after, c), "undo brings the planner back to before the import");
  check(!(await page.evaluate((k) => localStorage.getItem(k + ":restore-point"), p.key)), "undo copy is cleared after undoing");

  // Replace (needs two taps)
  await importFile(page, p, backupPath);
  const rep = page.locator("dialog.lpb-dialog .lpb-actions button").nth(1);
  await rep.click();
  check(/Tap again/.test(await rep.textContent()), "replace asks for a second tap");
  await Promise.all([page.waitForEvent("load"), rep.click()]);
  await page.waitForTimeout(400);
  after = await stored(page, p.key);
  check(hasItem(after, c), "replace loads the backup");

  // Wrong planner, broken file, newer version
  const other = PLANNERS.find((x) => x.id !== p.id);
  const otherPath = join(tmp, "other.json");
  writeFileSync(otherPath, JSON.stringify({ format: "life-planner-backup", version: 1, planner: other.id, exportedAt: new Date().toISOString(), data: { x: [] } }));
  const snap = JSON.stringify(await stored(page, p.key));
  await importFile(page, p, otherPath);
  check(/open your .* planner/.test(await page.locator("dialog.lpb-dialog").textContent()), "a backup from another planner is explained, not imported");
  await page.locator("dialog.lpb-dialog button", { hasText: "Close" }).click();
  writeFileSync(otherPath, "not json at all");
  await importFile(page, p, otherPath);
  check(/isn't a Life Planner backup/.test(await page.locator("dialog.lpb-dialog").textContent()), "a random file is refused");
  await page.locator("dialog.lpb-dialog button", { hasText: "Close" }).click();
  writeFileSync(otherPath, JSON.stringify({ format: "life-planner-backup", version: 99, planner: p.id, data: {} }));
  await importFile(page, p, otherPath);
  check(/newer version/.test(await page.locator("dialog.lpb-dialog").textContent()), "a backup from a newer version is refused");
  await page.locator("dialog.lpb-dialog button", { hasText: "Close" }).click();
  check(JSON.stringify(await stored(page, p.key)) === snap, "refused imports change nothing");

  // Save failure warning
  await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException("full", "QuotaExceededError"); }; });
  await page.evaluate(() => window.LPBackup.saveFailed(new DOMException("full", "QuotaExceededError")));
  const barText = await page.locator(".lpb-bar").textContent();
  check(/storage for your planner is full/.test(barText) && /including those changes/.test(barText), "save failure shows a visible warning");
  if (shots) await page.locator(".lpb-bar").screenshot({ path: join(shots, `${p.id}-save-warning.png`) });
  check(errors.length === 0, "no script errors during the whole run" + (errors.length ? ": " + errors.join(" | ") : ""));
  await ctx.close();

  // A real save failure from the planner itself
  {
    const { ctx, page } = await open(p);
    await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException("full", "QuotaExceededError"); }; });
    const field = page.locator("main input[type=text]:visible, main textarea:visible, input[type=text]:visible, textarea:visible").first();
    await field.fill("change that can't save");
    await field.press("Enter").catch(() => {});
    await field.blur().catch(() => {});
    await page.waitForTimeout(1200);
    check(await page.locator(".lpb-bar:not([hidden])").isVisible(), "typing when storage is full shows the warning");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator(".lpb-bar button", { hasText: "Export backup" }).click()]);
    const rescued = join(tmp, p.id + "-rescued.json"); await dl.saveAs(rescued);
    check(readFileSync(rescued, "utf8").includes("change that can't save"), "the warning's Export backup includes the change that didn't save");
    check(/including your latest changes/.test(await page.locator(".lpb-bar").textContent()), "after exporting, the message confirms the latest changes are in the backup");
    await ctx.close();
  }
  // Blocked storage on open
  {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException("denied", "SecurityError"); }; });
    await ctx.route(/^https?:/, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(join(root, "themes", p.id + ".html")).href);
    await page.waitForTimeout(300);
    check(/isn't letting your planner save/.test(await page.locator(".lpb-bar").textContent()), "blocked storage is flagged on open");
    await ctx.close();
  }
}

// Older Girly Pop export still imports
{
  const p = PLANNERS[2];
  const { ctx, page } = await open(p);
  const legacy = { exported: "2026-10-20", roles: [{ id: "r1", company: "Legacy Co", title: "Analyst", status: "Applied" }], contacts: [], projects: [], creative: [], workouts: [], targets: [], profile: [], weeks: [], settings: { linkedinStage: 2 } };
  const lp = join(tmp, "legacy.json"); writeFileSync(lp, JSON.stringify(legacy));
  await importFile(page, p, lp);
  check(/older Girly Pop export/.test(await page.locator("dialog.lpb-dialog").textContent()), "\ngirly-pop: older export is recognised");
  await Promise.all([page.waitForEvent("load"), page.locator("dialog.lpb-dialog button", { hasText: "Add to what I have" }).click()]);
  await page.waitForTimeout(400);
  const data = await stored(page, p.key);
  check(data.jobs && data.jobs.r1 && data.jobs.r1.company === "Legacy Co", "girly-pop: older export's roles are added");
  check(await page.getByText("Legacy Co").first().count() > 0, "girly-pop: imported role shows in the planner");
  await ctx.close();
}

// Phone width
{
  const { ctx, page } = await open(PLANNERS[1], { viewport: { width: 390, height: 844 } });
  await showFooter(page, PLANNERS[1]);
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!over, "studio: no sideways scrolling on a phone");
  if (shots) await page.locator(".foot").screenshot({ path: join(shots, "studio-footer-phone.png") });
  await ctx.close();
}

// Tabs keep working when a planner is shown inside a preview frame (AI chats, file viewers)
for (const p of PLANNERS) {
  const html = readFileSync(join(root, "themes", p.id + ".html"), "utf8");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/^https?:/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.setContent('<iframe id="f" sandbox="allow-scripts allow-same-origin" style="width:1280px;height:900px"></iframe>');
  await page.evaluate((h) => { document.getElementById("f").srcdoc = h; }, html);
  await page.waitForTimeout(1000);
  const f = page.frameLocator("#f");
  const links = f.locator('a[href^="#"]:visible');
  const n = Math.min(await links.count(), 4);
  let ok = n > 1;
  for (let i = 1; i < n; i++) {
    const href = await links.nth(i).getAttribute("href");
    await links.nth(i).click(); await page.waitForTimeout(250);
    const still = await f.locator(".lpb").count() > 0;
    const hash = still ? await f.locator("body").evaluate(() => location.hash) : "";
    if (!still || hash !== href) { ok = false; console.log("    " + href + " -> " + (still ? hash : "page went blank")); }
  }
  check(ok, `${p.id}: tabs work inside a preview frame`);
  await ctx.close();
}

await browser.close();
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
