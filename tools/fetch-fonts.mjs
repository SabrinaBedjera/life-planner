// Developer tool: downloads the Latin subsets of the Google Fonts the planners use into
// src/fonts/, so every planner can embed them and work fully offline.
// Run once with: node tools/fetch-fonts.mjs   (all fonts are under the SIL Open Font License)
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src", "fonts");
mkdirSync(out, { recursive: true });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// family query strings, exactly as Google Fonts css2 expects them
export const FAMILIES = [
  // Arcade
  "Chakra+Petch:wght@500;600;700", "IBM+Plex+Sans:wght@400;500;600", "Press+Start+2P",
  // Girly Pop
  "DM+Serif+Display:ital@0;1", "Manrope:wght@400;500;600;700;800", "VT323", "DM+Mono:wght@400;500",
  // Studio
  "Archivo+Black", "Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500", "Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700",
  // Cottagecore
  "Cormorant+Garamond:ital,wght@0,600;0,700;1,600", "Quicksand:wght@400;500;600;700", "Caveat:wght@600;700",
  // Goth / Witchy
  "UnifrakturMaguntia", "Cinzel:wght@500;600;700", "EB+Garamond:ital,wght@0,400;0,500;0,600;1,400",
  // Windows 93
  "Pixelify+Sans:wght@400;500;600;700",
  // Streetwear
  "Anton", "Space+Grotesk:wght@400;500;600;700", "Permanent+Marker",
  // Dark Academia
  "Playfair+Display:ital,wght@0,500;0,700;0,800;1,500", "Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400",
  // 70s Retro Groove
  "Shrikhand", "Karla:wght@400;500;600;700"
];

const faces = [];
for (const fam of FAMILIES) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`, { headers: { "User-Agent": UA } })).text();
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g)].filter((m) => m[1] === "latin");
  const byUrl = new Map();
  for (const [, , body] of blocks) {
    const get = (p) => (body.match(new RegExp(p + ":\\s*([^;]+);")) || [])[1];
    const url = body.match(/url\(([^)]+)\)/)[1];
    const family = get("font-family").replace(/['"]/g, "");
    const style = get("font-style");
    const weight = Number(get("font-weight").split(" ")[0]);
    const range = get("unicode-range");
    const f = byUrl.get(url) || { family, style, min: weight, max: weight, url, range };
    f.min = Math.min(f.min, weight); f.max = Math.max(f.max, weight);
    byUrl.set(url, f);
  }
  for (const f of byUrl.values()) {
    const slug = `${f.family}-${f.style}-${f.min}${f.max !== f.min ? "-" + f.max : ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const buf = Buffer.from(await (await fetch(f.url)).arrayBuffer());
    writeFileSync(join(out, slug + ".woff2"), buf);
    faces.push({ family: f.family, style: f.style, weight: f.min === f.max ? String(f.min) : `${f.min} ${f.max}`, file: slug + ".woff2", unicodeRange: f.range, bytes: buf.length });
    console.log(slug, buf.length);
  }
}
writeFileSync(join(out, "fonts.json"), JSON.stringify(faces, null, 2) + "\n");
