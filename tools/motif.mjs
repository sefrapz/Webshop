#!/usr/bin/env node
/* =========================================================
   Frilägger ett motiv från vit botten och skriver WebP med
   alfakanal.

   node tools/motif.mjs <källbild> <mål.webp>

   Konstnären är en solid färg på vitt papper. Varje pixel är
   alltså P = a·C + (1−a)·vitt, där C är motivets färg. Ur den
   ekvationen går täckningsgraden a att lösa ut per kanal, vilket
   ger mjuka kanter i stället för en hackig tröskel — viktigt för
   penseldrag med tunna utlöpare.
   ========================================================= */

import { writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');

const [SRC, OUT] = process.argv.slice(2);
if (!SRC || !OUT) { console.error('användning: node tools/motif.mjs <källbild> <mål.webp>'); process.exit(1); }

const server = createServer((q, r) => {
  let b; try { b = readFileSync(SRC); } catch { r.writeHead(404).end(); return; }
  r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(b);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(base).catch(() => {});

const res = await page.evaluate(async src => {
  const img = new Image();
  await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  const px = d.data;

  /* Motivets färg: medianen bland de pixlar som tydligt inte är papper. */
  const ink = [];
  for (let i = 0; i < px.length; i += 4) {
    if (255 - Math.min(px[i], px[i + 1], px[i + 2]) > 120) ink.push([px[i], px[i + 1], px[i + 2]]);
  }
  const med = k => { const v = ink.map(p => p[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  const C = [med(0), med(1), med(2)];

  /* Täckningsgrad ur kanalen med störst avstånd till vitt. */
  let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      let a = 0;
      for (let k = 0; k < 3; k++) {
        const span = 255 - C[k];
        if (span < 40) continue;                 // kanalen säger för lite
        a = Math.max(a, (255 - px[i + k]) / span);
      }
      a = Math.max(0, Math.min(1, a));
      if (a < 0.04) a = 0;                        // rensa pappersbrus
      px[i] = C[0]; px[i + 1] = C[1]; px[i + 2] = C[2];
      px[i + 3] = Math.round(a * 255);
      if (a > 0.15) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(d, 0, 0);

  /* Beskär till motivet och skala till 900 px bredd. */
  const w = maxX - minX + 1, h = maxY - minY + 1;
  const scale = Math.min(1, 900 / w);
  const out = document.createElement('canvas');
  out.width = Math.round(w * scale); out.height = Math.round(h * scale);
  out.getContext('2d').drawImage(c, minX, minY, w, h, 0, 0, out.width, out.height);

  const hex = '#' + C.map(v => v.toString(16).padStart(2, '0')).join('');
  return { hex, src: `${img.width}×${img.height}`, box: `${w}×${h}`,
           size: `${out.width}×${out.height}`, data: out.toDataURL('image/webp', 0.92) };
}, base);

await browser.close(); server.close();
writeFileSync(OUT, Buffer.from(res.data.split(',')[1], 'base64'));
console.log(`färg ${res.hex}  källa ${res.src}  beskuren ${res.box}  utskriven ${res.size}`);
console.log(`${OUT} — ${(readFileSync(OUT).length / 1024).toFixed(0)} kB`);
