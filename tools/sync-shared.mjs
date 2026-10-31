// Copies shared/backup-kit.html into every planner file, between the
// "life-planner:backup-kit" markers, so each planner stays one standalone file.
// Run with: npm run sync   (or: node tools/sync-shared.mjs)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const kit = readFileSync(join(root, "shared", "backup-kit.html"), "utf8").trim();
const START = "<!-- life-planner:backup-kit:start (generated from shared/backup-kit.html; edit that file, then run npm run sync) -->";
const END = "<!-- life-planner:backup-kit:end -->";
const re = /<!-- life-planner:backup-kit:start[^>]*-->[\s\S]*?<!-- life-planner:backup-kit:end -->/;

let changed = 0;
for (const name of readdirSync(join(root, "themes")).filter((f) => f.endsWith(".html"))) {
  const file = join(root, "themes", name);
  const html = readFileSync(file, "utf8");
  if (!re.test(html)) { console.error(`${name}: no backup-kit markers, skipped`); process.exitCode = 1; continue; }
  const next = html.replace(re, () => `${START}\n${kit}\n${END}`);
  if (next !== html) { writeFileSync(file, next); changed++; console.log(`${name}: updated`); }
  else console.log(`${name}: already up to date`);
}
if (process.argv.includes("--check") && changed) { console.error("Planner files were out of date with shared/backup-kit.html"); process.exitCode = 1; }
