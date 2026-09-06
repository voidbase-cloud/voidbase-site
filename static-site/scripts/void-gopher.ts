// The void gopher: recolors a gopher image whose fur is warm (pink or tan) into the site's fur color (defaults: the first violet;
// the dark theme uses `0 0 0.36 0.7` = neutral gray), keeping the
// drawing, the white coat, the eyes and the line work. Chrome does the pixel work through Playwright, so run it from a
// checkout that has playwright installed (../voidbase does):
//   cd ../voidbase && CHROME_PATH=/usr/bin/google-chrome bun ../voidbase-site/scripts/void-gopher.ts <in.png> <out.png> [scale]
// The hero (static/images/gopher.png and the inline copy in src/routes/(blank)/+page.svelte) was made this way from
// the PocketBase site's gopher; the eye-tracking overlay keeps working because the geometry is unchanged.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
const [src, out, scale = "1", hueArg = "262", satArg = "0.24", lminArg = "0.09", lmaxArg = "0.47"] = process.argv.slice(2); // hue/sat/L range of the new fur
const b64 = readFileSync(src!).toString("base64");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome" });
const page = await browser.newPage();
const result = await page.evaluate(async ({ b64, scale, hue, sat, lmin, lmax }) => {
  const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, w, h); const p = d.data;
  const rgb2hsl = (r: number, g: number, b: number) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const dd = mx - mn; const s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); let hh = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return [hh * 60, s, l]; };
  const hsl2rgb = (hh: number, s: number, l: number) => { const k = (n: number) => (n + hh / 30) % 12; const a = s * Math.min(l, 1 - l); const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0) * 255, f(8) * 255, f(4) * 255]; };
  let fur = 0;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3]! < 8) continue;
    const [hh, s, l] = rgb2hsl(p[i]!, p[i + 1]!, p[i + 2]!);
    const a = p[i + 3]!;
    const warm = hh >= 320 || hh <= 30;
    // fur: warm hue with some saturation; the silhouette's anti-aliased edge pixels are paler and semi-transparent, so
    // they pass on hue alone. White coat, black lines and the eyes stay (they are not warm or not saturated).
    const pink = warm && ((s > 0.08 && l > 0.2 && l < 0.94) || (a < 250 && s > 0.03 && l < 0.97));
    if (!pink) continue;
    fur++;
    // keep the shading, move it into the void: violet hue, muted, dark
    const L = lmin + Math.max(0, l - 0.2) / 0.77 * (lmax - lmin); // 0.2..0.97 -> lmin..lmax: the shading survives
    const [r, g, b] = hsl2rgb(hue, sat === 0 ? 0 : sat + s * 0.2, L);
    p[i] = r!; p[i + 1] = g!; p[i + 2] = b!;
  }
  ctx.putImageData(d, 0, 0);
  const sc = Number(scale); let outCanvas = c;
  if (sc !== 1) { outCanvas = document.createElement("canvas"); outCanvas.width = Math.round(w * sc); outCanvas.height = Math.round(h * sc); const o = outCanvas.getContext("2d")!; o.imageSmoothingQuality = "high"; o.drawImage(c, 0, 0, outCanvas.width, outCanvas.height); }
  return { fur, png: outCanvas.toDataURL("image/png").split(",")[1] };
}, { b64, scale, hue: Number(hueArg), sat: Number(satArg), lmin: Number(lminArg), lmax: Number(lmaxArg) });
await browser.close();
writeFileSync(out!, Buffer.from(result.png, "base64"));
console.log(`recolored ${result.fur} fur pixels -> ${out}`);
