#!/usr/bin/env node
/* =========================================================
   Normaliserar produktfoton till ett gemensamt rutnät och
   skriver WebP i tre storlekar per färg.

   node tools/photos.mjs <källmapp> <målmapp> <karta.json>

   karta.json: { "filnamn.png": ["farg-id", "fram"|"bak"], ... }

   Varför normalisering: källbilderna är beskurna olika, och
   tryckytan anges i procent av bilden. Utan gemensamt rutnät
   glider trycket mellan färgerna. Plagget skalas efter sin
   bredaste sammanhängande rad — ärmspets till ärmspets — vilket
   är samma mått på fram- och baksida och okänsligt för skuggor
   i kanten.
   ========================================================= */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');

const [SRC, OUT, MAPFILE] = process.argv.slice(2);
if (!SRC || !OUT || !MAPFILE) {
  console.error('användning: node tools/photos.mjs <källmapp> <målmapp> <karta.json>');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const map = JSON.parse(readFileSync(MAPFILE, 'utf8'));
const jobs = Object.entries(map).map(([file, [color, side]]) => ({ file, color, side }));

const server = createServer((q, r) => {
  let b; try { b = readFileSync(SRC + '/' + decodeURIComponent(q.url.slice(1))); }
  catch { r.writeHead(404).end(); return; }
  r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(b);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(base).catch(() => {});

const CANVAS_W = 800, TARGET_W = 742, TOP_Y = 22;

/** Plaggets bredaste rad, dess mittpunkt och första/sista rad med tyg. */
const measure = src => page.evaluate(async src => {
  const img = new Image();
  await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;

  const rowRun = y => {              // bredaste sammanhängande tygstycket på raden
    let best = null, s = null;
    for (let x = 0; x < c.width; x++) {
      const on = d[(y * c.width + x) * 4 + 3] > 150;
      if (on && s === null) s = x;
      else if (!on && s !== null) {
        if (!best || x - 1 - s > best[1] - best[0]) best = [s, x - 1];
        s = null;
      }
    }
    if (s !== null && (!best || c.width - 1 - s > best[1] - best[0])) best = [s, c.width - 1];
    return best;
  };

  let widest = null, top = null, bottom = null;
  for (let y = 0; y < c.height; y++) {
    const r = rowRun(y);
    if (!r || r[1] - r[0] < c.width * 0.03) continue;
    if (top === null) top = y;
    bottom = y;
    if (!widest || r[1] - r[0] > widest.w) widest = { w: r[1] - r[0], mid: (r[0] + r[1]) / 2 };
  }
  return { imgW: img.width, imgH: img.height, widest, top, bottom };
}, src);

const boxes = [];
for (const j of jobs) boxes.push(await measure(base + encodeURIComponent(j.file)));
const CANVAS_H = Math.round(TOP_Y * 2 + Math.max(...boxes.map((b, i) =>
  (b.bottom - b.top) * (TARGET_W / b.widest.w))));

const rows = [];
for (let i = 0; i < jobs.length; i++) {
  const j = jobs[i], b = boxes[i];
  const r = await page.evaluate(async ({ src, b, CANVAS_W, CANVAS_H, TARGET_W, TOP_Y }) => {
    const img = new Image();
    await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = src; });
    const scale = TARGET_W / b.widest.w;
    const draw = W => {
      const k = W / CANVAS_W;
      const c = document.createElement('canvas');
      c.width = W; c.height = Math.round(CANVAS_H * k);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img,
        (W / 2) - b.widest.mid * scale * k, TOP_Y * k - b.top * scale * k,
        img.width * scale * k, img.height * scale * k);
      return c;
    };
    return {
      large: draw(CANVAS_W).toDataURL('image/webp', 0.86),
      small: draw(200).toDataURL('image/webp', 0.85),
    };
  }, { src: base + encodeURIComponent(j.file), b, CANVAS_W, CANVAS_H, TARGET_W, TOP_Y });

  const b64 = s => Buffer.from(s.split(',')[1], 'base64');
  writeFileSync(`${OUT}/${j.color}-${j.side}.webp`, b64(r.large));
  if (j.side === 'fram') writeFileSync(`${OUT}/${j.color}-thumb.webp`, b64(r.small));
  rows.push(`${j.color}-${j.side}`);
}
await browser.close(); server.close();
console.log(`duk ${CANVAS_W}×${CANVAS_H}, ${rows.length} bilder → ${OUT}`);
