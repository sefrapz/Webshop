#!/usr/bin/env node
/* =========================================================
   Skärmbilder av sajten — så att en session utan skärm
   (t.ex. Claude Code från mobilen) kan visa hur det blev.

   node tools/shot.mjs '#/produkt/hoodie'
   node tools/shot.mjs '#/' '#/kassa' --mobile
   node tools/shot.mjs '#/produkt/hoodie' --mobile --scroll=1400

   Startar en lokal server, renderar varje vy i Chromium och
   sparar PNG i .shots/.
   ========================================================= */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, '.shots');

const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const full = args.includes('--full');
/* --scroll=1200 skrollar ner innan bilden tas — för att se under vikningen
   utan att fasta element (sticky köpknapp) hamnar mitt i en helsidesbild. */
const scroll = Number((args.find(a => a.startsWith('--scroll=')) || '').split('=')[1] || 0);
const routes = args.filter(a => !a.startsWith('--'));
if (routes.length === 0) routes.push('#/');

/* Playwright är globalt installerat i den här miljön, inte i projektet. */
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require(join(
    process.execPath.replace(/\/bin\/node$/, ''), 'lib/node_modules/playwright')));
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const rel = normalize(path === '/' ? '/index.html' : path).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'Content-Type': TYPES[extname(rel)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('404');
  }
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 950 },
  deviceScaleFactor: 2,
  isMobile: mobile,
  hasTouch: mobile,
});

const files = [];
for (const route of routes) {
  const hash = route.startsWith('#') ? route : '#' + route;
  await page.goto(base + hash, { waitUntil: 'networkidle' });
  /* Routern ritar om vid hashchange; gå via location för vy 2 och framåt. */
  await page.evaluate(h => { if (location.hash !== h) location.hash = h; }, hash);
  await page.waitForTimeout(350);
  if (scroll) {
    /* html har scroll-behavior: smooth — hoppa direkt, annars hinner
       bilden tas mitt i animeringen. */
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scroll);
    await page.waitForTimeout(400);
  }

  const name = (hash.replace(/^#\/?/, '') || 'start').replace(/\//g, '-')
    + (mobile ? '-mobil' : '') + '.png';
  const file = join(OUT, name);
  await page.screenshot({ path: file, fullPage: full });
  files.push(file);
  console.log(file);
}

await browser.close();
server.close();
