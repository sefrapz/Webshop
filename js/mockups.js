/* =========================================================
   MOTIV. — SVG-mockups av plaggen
   Renderar t-shirt, hoodie och långärmad tröja i valfri
   färg, fram- och baksida, med motiv på vald placering.
   viewBox: 0 0 600 700
   ========================================================= */

let _uidCounter = 0;

function _shadeDefs(uid) {
  return `
  <defs>
    <linearGradient id="shade${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".14"/>
      <stop offset=".16" stop-color="#000" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".07"/>
      <stop offset=".84" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".16"/>
    </linearGradient>
    <linearGradient id="vshade${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".06"/>
      <stop offset=".5" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".07"/>
    </linearGradient>
  </defs>`;
}

const OUTLINE = 'rgba(20,18,16,.32)';
const SEAM = 'rgba(0,0,0,.18)';

/* ------------------------- T-SHIRT ------------------------- */

function _tshirtBody(side) {
  const neckClose = side === 'front'
    ? 'C352 128 248 128 232 92'
    : 'C348 110 252 110 232 92';
  return `M232 92
    C205 97 172 108 152 121
    C116 142 68 198 42 236
    L92 302
    C110 292 136 274 158 256
    L152 632
    C222 654 378 654 448 632
    L442 256
    C464 274 490 292 508 302
    L558 236
    C532 198 484 142 448 121
    C428 108 395 97 368 92
    ${neckClose} Z`;
}

function _tshirtDetails(side, uid) {
  const collar = side === 'front'
    ? `<path d="M234 90 C250 130 350 130 366 90" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="16" stroke-linecap="round"/>
       <path d="M232 92 C248 126 352 126 368 92" fill="none" stroke="${OUTLINE}" stroke-width="3"/>
       <path d="M238 100 C252 118 348 118 362 100" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/>`
    : `<path d="M234 91 C250 112 350 112 366 91" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="12" stroke-linecap="round"/>
       <path d="M232 92 C248 110 352 110 368 92" fill="none" stroke="${OUTLINE}" stroke-width="3"/>`;
  return `
    ${collar}
    <path d="M96 296 L160 252" stroke="${SEAM}" stroke-width="3"/>
    <path d="M504 296 L440 252" stroke="${SEAM}" stroke-width="3"/>
    <path d="M156 616 C224 636 376 636 444 616" fill="none" stroke="${SEAM}" stroke-width="2.5" stroke-dasharray="7 5"/>
    <path d="M166 300 C176 340 174 400 172 470" stroke="rgba(0,0,0,.06)" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M434 300 C424 340 426 400 428 470" stroke="rgba(0,0,0,.06)" stroke-width="8" fill="none" stroke-linecap="round"/>`;
}

/* --------------------- LÅNGÄRMAD T-SHIRT --------------------- */

function _longsleeveBody(side) {
  const neckClose = side === 'front'
    ? 'C352 128 248 128 232 92'
    : 'C348 110 252 110 232 92';
  return `M232 92
    C205 97 172 108 152 121
    C110 145 80 190 68 250
    C58 310 52 430 50 540
    L108 552
    C114 450 122 330 158 256
    L152 632
    C222 654 378 654 448 632
    L442 256
    C478 330 486 450 492 552
    L550 540
    C548 430 542 310 532 250
    C520 190 490 145 448 121
    C428 108 395 97 368 92
    ${neckClose} Z`;
}

function _cuffs(color) {
  return `
    <path d="M46 536 L112 549 L107 596 L41 583 Z" fill="${color}"/>
    <path d="M46 536 L112 549 L107 596 L41 583 Z" fill="rgba(0,0,0,.14)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M62 541 L57 586 M78 544 L73 589 M94 547 L89 592" stroke="rgba(0,0,0,.15)" stroke-width="2.5"/>
    <path d="M554 536 L488 549 L493 596 L559 583 Z" fill="${color}"/>
    <path d="M554 536 L488 549 L493 596 L559 583 Z" fill="rgba(0,0,0,.14)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M538 541 L543 586 M522 544 L527 589 M506 547 L511 592" stroke="rgba(0,0,0,.15)" stroke-width="2.5"/>`;
}

function _longsleeveDetails(side, uid, color) {
  const collar = side === 'front'
    ? `<path d="M234 90 C250 130 350 130 366 90" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="16" stroke-linecap="round"/>
       <path d="M232 92 C248 126 352 126 368 92" fill="none" stroke="${OUTLINE}" stroke-width="3"/>
       <path d="M238 100 C252 118 348 118 362 100" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/>`
    : `<path d="M234 91 C250 112 350 112 366 91" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="12" stroke-linecap="round"/>
       <path d="M232 92 C248 110 352 110 368 92" fill="none" stroke="${OUTLINE}" stroke-width="3"/>`;
  return `
    ${collar}
    ${_cuffs(color)}
    <path d="M118 300 C126 340 122 420 118 500" stroke="rgba(0,0,0,.08)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M482 300 C474 340 478 420 482 500" stroke="rgba(0,0,0,.08)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M158 256 C150 200 152 160 152 121" stroke="${SEAM}" stroke-width="2.5" fill="none"/>
    <path d="M442 256 C450 200 448 160 448 121" stroke="${SEAM}" stroke-width="2.5" fill="none"/>
    <path d="M156 616 C224 636 376 636 444 616" fill="none" stroke="${SEAM}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
}

/* --------------------------- HOODIE --------------------------- */

function _hoodieBody(side) {
  const neckClose = side === 'front'
    ? 'C356 140 244 140 226 96'
    : 'C350 112 250 112 226 96';
  return `M226 96
    C200 102 168 114 148 128
    C104 154 74 200 62 260
    C50 322 44 440 42 548
    L104 562
    C110 460 118 340 152 268
    L146 600
    C220 626 380 626 454 600
    L448 268
    C482 340 490 460 496 562
    L558 548
    C556 440 550 322 538 260
    C526 200 496 154 452 128
    C432 114 400 102 374 96
    ${neckClose} Z`;
}

function _hoodieDetails(side, uid, color) {
  if (side === 'front') {
    return `
    <!-- luva bakom axlarna -->
    <path d="M208 108 C214 56 258 30 300 30 C342 30 386 56 392 108 C360 88 240 88 208 108Z"
      fill="${color}"/>
    <path d="M208 108 C214 56 258 30 300 30 C342 30 386 56 392 108 C360 88 240 88 208 108Z"
      fill="rgba(0,0,0,.10)" stroke="${OUTLINE}" stroke-width="3"/>
    <!-- luvans insida -->
    <path d="M214 104 C220 54 260 32 300 32 C340 32 380 54 386 104 C386 132 350 150 300 150 C250 150 214 132 214 104Z" fill="${color}"/>
    <path d="M214 104 C220 54 260 32 300 32 C340 32 380 54 386 104 C386 132 350 150 300 150 C250 150 214 132 214 104Z" fill="rgba(0,0,0,.48)"/>
    <path d="M214 104 C214 136 250 152 300 152 C350 152 386 136 386 104" fill="none" stroke="rgba(0,0,0,.32)" stroke-width="12" stroke-linecap="round"/>
    <path d="M216 108 C218 138 252 156 300 156 C348 156 382 138 384 108" fill="none" stroke="${OUTLINE}" stroke-width="3"/>
    <!-- dragskor -->
    <path d="M284 152 C282 176 282 194 284 212" stroke="rgba(0,0,0,.55)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M316 152 C318 176 318 194 316 212" stroke="rgba(0,0,0,.55)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="284" cy="216" r="5" fill="rgba(0,0,0,.55)"/>
    <circle cx="316" cy="216" r="5" fill="rgba(0,0,0,.55)"/>
    <!-- känguruficka -->
    <path d="M204 606 L210 476 L390 476 L396 606 C338 622 262 622 204 606Z"
      fill="rgba(0,0,0,.07)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M210 476 L248 556 M390 476 L352 556" stroke="${SEAM}" stroke-width="3"/>
    <!-- muddar & hälsöm -->
    ${_hoodieCuffs(color)}
    <path d="M150 584 C224 610 376 610 450 584" fill="none" stroke="${SEAM}" stroke-width="2.5" stroke-dasharray="8 5"/>
    <path d="M150 596 C224 622 376 622 450 596" fill="none" stroke="${SEAM}" stroke-width="2.5"/>`;
  }
  return `
    <!-- hängande luva på ryggen -->
    <path d="M216 98 C226 62 374 62 384 98 C396 152 372 208 300 216 C228 208 204 152 216 98Z"
      fill="${color}"/>
    <path d="M216 98 C226 62 374 62 384 98 C396 152 372 208 300 216 C228 208 204 152 216 98Z"
      fill="rgba(0,0,0,.08)" stroke="${OUTLINE}" stroke-width="3"/>
    <path d="M232 112 C244 92 356 92 368 112" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3"/>
    <path d="M300 216 C298 190 298 150 300 118" stroke="rgba(0,0,0,.12)" stroke-width="3" fill="none"/>
    ${_hoodieCuffs(color)}
    <path d="M150 584 C224 610 376 610 450 584" fill="none" stroke="${SEAM}" stroke-width="2.5" stroke-dasharray="8 5"/>
    <path d="M150 596 C224 622 376 622 450 596" fill="none" stroke="${SEAM}" stroke-width="2.5"/>`;
}

function _hoodieCuffs(color) {
  return `
    <path d="M38 544 L108 558 L103 606 L33 592 Z" fill="${color}"/>
    <path d="M38 544 L108 558 L103 606 L33 592 Z" fill="rgba(0,0,0,.14)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M56 549 L51 596 M74 553 L69 600 M92 557 L87 602" stroke="rgba(0,0,0,.15)" stroke-width="2.5"/>
    <path d="M562 544 L492 558 L497 606 L567 592 Z" fill="${color}"/>
    <path d="M562 544 L492 558 L497 606 L567 592 Z" fill="rgba(0,0,0,.14)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M544 549 L549 596 M526 553 L531 600 M508 557 L513 602" stroke="rgba(0,0,0,.15)" stroke-width="2.5"/>`;
}

/* ------------------------- SWEATSHIRT ------------------------- */

function _sweatshirtBody(side) {
  const neckClose = side === 'front'
    ? 'C354 132 246 132 228 94'
    : 'C350 112 250 112 228 94';
  return `M228 94
    C202 100 170 112 150 126
    C108 152 78 198 66 256
    C55 316 49 434 47 542
    L107 556
    C113 456 121 338 154 268
    L149 588
    C222 612 378 612 451 588
    L446 268
    C479 338 487 456 493 556
    L553 542
    C551 434 545 316 534 256
    C522 198 492 152 450 126
    C430 112 398 100 372 94
    ${neckClose} Z`;
}

function _sweatshirtCuffs(color) {
  return `
    <path d="M43 538 L111 552 L106 600 L38 586 Z" fill="${color}"/>
    <path d="M43 538 L111 552 L106 600 L38 586 Z" fill="rgba(0,0,0,.14)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M61 543 L56 590 M79 546 L74 594 M97 550 L92 598" stroke="rgba(0,0,0,.15)" stroke-width="2.5"/>
    <path d="M557 538 L489 552 L494 600 L562 586 Z" fill="${color}"/>
    <path d="M557 538 L489 552 L494 600 L562 586 Z" fill="rgba(0,0,0,.14)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M539 543 L544 590 M521 546 L526 594 M503 550 L508 598" stroke="rgba(0,0,0,.15)" stroke-width="2.5"/>`;
}

/** Ribbad midja — det som skiljer collegetröjan från t-shirten. */
function _sweatshirtWaistband(color) {
  const band = 'M149 584 C222 608 378 608 451 584 L455 622 C378 648 222 648 145 622 Z';
  return `
    <path d="${band}" fill="${color}"/>
    <path d="${band}" fill="rgba(0,0,0,.13)" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M180 596 L182 634 M215 604 L217 641 M250 609 L251 645 M285 611 L286 647
             M320 611 L319 647 M355 609 L354 645 M390 604 L388 641 M425 596 L423 634"
      stroke="rgba(0,0,0,.13)" stroke-width="2.5"/>`;
}

function _sweatshirtDetails(side, uid, color) {
  /* Ribbad krage ritad som ett band innanför halslinjen. Ett tjockt streck
     längs kanten hade spillt ut ovanför plagget och synts mot bakgrunden. */
  const band = side === 'front'
    ? 'M228 94 C246 132 354 132 372 94 L372 108 C354 146 246 146 228 108 Z'
    : 'M228 94 C250 113 350 113 372 94 L372 107 C350 126 250 126 228 107 Z';
  const ribs = side === 'front'
    ? 'M252 116 L252 130 M276 126 L276 140 M300 129 L300 143 M324 126 L324 140 M348 116 L348 130'
    : 'M252 105 L252 118 M276 110 L276 123 M300 111 L300 124 M324 110 L324 123 M348 105 L348 118';
  const collar = `
    <path d="${band}" fill="${color}"/>
    <path d="${band}" fill="rgba(0,0,0,.26)" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${ribs}" stroke="rgba(0,0,0,.16)" stroke-width="2.5"/>`;
  return `
    ${collar}
    ${_sweatshirtCuffs(color)}
    ${_sweatshirtWaistband(color)}
    <path d="M154 268 C147 208 149 162 150 126" stroke="${SEAM}" stroke-width="2.5" fill="none"/>
    <path d="M446 268 C453 208 451 162 450 126" stroke="${SEAM}" stroke-width="2.5" fill="none"/>
    <path d="M120 300 C128 340 124 420 120 500" stroke="rgba(0,0,0,.07)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M480 300 C472 340 476 420 480 500" stroke="rgba(0,0,0,.07)" stroke-width="7" fill="none" stroke-linecap="round"/>`;
}

/* --------------------- TRYCKYTOR (placeringar) --------------------- */

/* Plaggets torso är ~296 enheter brett i mockupen. Delat med den
   verkliga bröstvidden i storlek M (SIZE_CHART) ger det hur många
   enheter en centimeter motsvarar — olika per plagg, eftersom en
   oversized hoodie är bredare än en t-shirt. Därför täcker ett
   stort tryck en mindre del av hoodien, precis som på riktigt. */
const TORSO_UNITS = 296;

const UNITS_PER_CM = {
  tshirt:     TORSO_UNITS / 52,
  longsleeve: TORSO_UNITS / 52,
  sweatshirt: TORSO_UNITS / 55,
  hoodie:     TORSO_UNITS / 58,
};

/* Tryckytans överkant. Hoodien och sweatshirten är längre plagg och
   har lägre halsringning, så deras tryck sitter längre ned. */
const PRINT_TOP = {
  tshirt:     { hjarta: 216, mage: 284, rygg: 248 },
  longsleeve: { hjarta: 216, mage: 284, rygg: 248 },
  sweatshirt: { hjarta: 232, mage: 296, rygg: 260 },
  hoodie:     { hjarta: 250, mage: 310, rygg: 272 },
};

/* Hjärtat sitter på bärarens vänstra bröst — till höger i bild. */
const PRINT_CENTER_X = { hjarta: 367, mage: 300, rygg: 300 };

function getPrintRect(productId, placementId) {
  const pl = PLACEMENT_BY_ID[placementId];
  if (!pl) return null;
  const scale = UNITS_PER_CM[productId] || UNITS_PER_CM.tshirt;
  const size = Math.round(pl.cm * scale);
  const tops = PRINT_TOP[productId] || PRINT_TOP.tshirt;
  return {
    /* Inte avrundat — en udda tryckbredd ska ändå hamna exakt i mitten. */
    x: PRINT_CENTER_X[placementId] - size / 2,
    y: tops[placementId],
    w: size,
    h: size,
    side: pl.side,
  };
}

/**
 * Motivets innehåll, ritat i sin viewBox. Riktiga motiv är bilder med
 * alfakanal; `svg`-varianten finns kvar för handritade motiv.
 */
function motifMarkup(motif) {
  if (!motif) return '';
  if (motif.type === 'image') {
    /* meet gör att motivet ryms i tryckytan utan att beskäras — ett brett
       motiv fyller bredden och centreras i höjd, precis som ett tryck. */
    return `<image href="${motif.src}" x="0" y="0" width="100" height="100"
      preserveAspectRatio="xMidYMid meet"/>`;
  }
  return motif.svg || '';
}

/**
 * viewBox som gör att motivets största sida fyller hela tryckytan.
 * Utan detta ritas motivet i sin 100×100-ruta och blir mindre än
 * de centimetermått butiken lovar.
 */
function motifViewBox(motifId) {
  const box = MOTIF_BOX[motifId];
  if (!box) return '0 0 100 100';
  const [x, y, w, h] = box;
  const side = Math.max(w, h);
  return `${(x + w / 2 - side / 2).toFixed(1)} ${(y + h / 2 - side / 2).toFixed(1)} ${side} ${side}`;
}

/* --------------------------- RENDER --------------------------- */

/* --------------------- FOTOGRAFERADE PLAGG --------------------- */

/* Tryckytorna uttryckta i procent av fotots bredd. Alla foton är
   normaliserade till samma rutnät per plagg, så samma procentsatser
   gäller varje färg.

   `bodyPct` är plaggets synliga bredd i bilden, avläst på ett rutnät.
   Plaggen är fotade på osynlig docka, så den synliga bredden är mindre än
   plattmåttet — men eftersom trycket förhåller sig till samma synliga yta
   som kunden ser, räknas tryckets bredd som

       tryck-% = placeringens cm / bröstvidden i storlek M × bodyPct

   Varje plagg är dessutom normaliserat var för sig och fyller sin egen
   bild, så skalan är inte gemensam mellan plaggen — därav en post per
   plagg i stället för en global konstant.

   `top` är tryckytans överkant i procent av bildens HÖJD. Bredden är i
   procent av BREDDEN och höjden sätts av `aspect-ratio` i CSS. */
const PHOTO_GEOM = {
  hoodie: {
    bodyPct: 56,
    print: {
      hjarta: { cx: 63, top: 30 },
      mage:   { cx: 50, top: 36 },
      rygg:   { cx: 50, top: 32 },
    },
  },
  longsleeve: {
    bodyPct: 65,
    print: {
      hjarta: { cx: 62, top: 17 },
      mage:   { cx: 50, top: 26 },
      rygg:   { cx: 50, top: 20 },
    },
  },
  sweatshirt: {
    bodyPct: 62,
    print: {
      hjarta: { cx: 62, top: 19 },
      mage:   { cx: 50, top: 28 },
      rygg:   { cx: 50, top: 22 },
    },
  },
  tshirt: {
    bodyPct: 60,
    print: {
      hjarta: { cx: 62, top: 17 },
      mage:   { cx: 50, top: 26 },
      rygg:   { cx: 50, top: 20 },
    },
  },
};

/** Hur många procent av bildbredden en centimeter på plagget motsvarar. */
function photoCmPct(productId) {
  const geom = PHOTO_GEOM[productId];
  const chart = SIZE_CHART[productId];
  if (!geom || !chart) return null;
  return geom.bodyPct / chart.rows.M[0];   // första kolumnen är bröstvidden
}

function getPhotoPrintRect(productId, placementId) {
  const pl = PLACEMENT_BY_ID[placementId];
  const geom = PHOTO_GEOM[productId];
  const geo = geom && geom.print[placementId];
  const cm = photoCmPct(productId);
  if (!pl || !geo || !cm) return null;
  const w = pl.cm * cm;
  return { left: geo.cx - w / 2, top: geo.top, w, side: pl.side };
}

/** Plagget som produktfoto, med motivet lagt i tryckytan. */
function renderPhotoGarment(productId, side, color, opts = {}) {
  const dir = photoDir(productId);
  const file = `${dir}/${color.id}-${side === 'back' ? 'bak' : 'fram'}.webp`;
  const name = `${PRODUCTS[productId].name} i ${color.name.toLowerCase()}, ` +
    (side === 'back' ? 'baksida' : 'framsida');

  let overlay = '';
  if (opts.motifId && opts.placementId) {
    const rect = getPhotoPrintRect(productId, opts.placementId);
    const motif = MOTIF_BY_ID[opts.motifId];
    if (rect && motif && rect.side === side) {
      overlay = `
        <span class="print-area" style="left:${rect.left}%;top:${rect.top}%;width:${rect.w}%">
          <svg viewBox="${motifViewBox(motif.id)}" aria-hidden="true">${motifMarkup(motif)}</svg>
        </span>`;
    }
  }

  let areas = '';
  if (opts.showPrintAreas) {
    areas = PLACEMENTS.filter(p => PLACEMENT_BY_ID[p.id].side === side).map(p => {
      const r = getPhotoPrintRect(productId, p.id);
      return `<span class="print-outline" style="left:${r.left}%;top:${r.top}%;width:${r.w}%"></span>`;
    }).join('');
  }

  return `
  <span class="garment-photo${opts.className ? ' ' + opts.className : ''}">
    <img src="${file}" alt="${name}" loading="lazy" decoding="async">
    ${areas}${overlay}
  </span>`;
}

/**
 * Renderar ett plagg som SVG-sträng.
 * opts: { motifId, placementId, showPrintAreas, className }
 * Motivet ritas bara ut om placeringens sida matchar `side`.
 */
function renderGarment(productId, side, color, opts = {}) {
  /* `color` är antingen ett färgobjekt eller bara en hex-sträng (kategorikorten). */
  const colorHex = typeof color === 'string' ? color : color.hex;
  if (typeof color === 'object' && color && photoDir(productId)) {
    return renderPhotoGarment(productId, side, color, opts);
  }
  const uid = ++_uidCounter;
  let bodyPath, details;

  if (productId === 'hoodie') {
    bodyPath = _hoodieBody(side);
    details = _hoodieDetails(side, uid, colorHex);
  } else if (productId === 'sweatshirt') {
    bodyPath = _sweatshirtBody(side);
    details = _sweatshirtDetails(side, uid, colorHex);
  } else if (productId === 'longsleeve') {
    bodyPath = _longsleeveBody(side);
    details = _longsleeveDetails(side, uid, colorHex);
  } else {
    bodyPath = _tshirtBody(side);
    details = _tshirtDetails(side, uid);
  }

  let motifEl = '';
  if (opts.motifId && opts.placementId) {
    const rect = getPrintRect(productId, opts.placementId);
    const motif = MOTIF_BY_ID[opts.motifId];
    if (rect && motif && rect.side === side) {
      motifEl = `
        <svg x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}"
             viewBox="${motifViewBox(motif.id)}" overflow="visible">
          ${motifMarkup(motif)}
        </svg>`;
    }
  }

  let printAreas = '';
  if (opts.showPrintAreas) {
    printAreas = PLACEMENTS
      .filter(p => getPrintRect(productId, p.id).side === side)
      .map(p => {
        const r = getPrintRect(productId, p.id);
        return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"
          fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2" stroke-dasharray="6 5" rx="4"/>`;
      }).join('');
  }

  return `
  <svg viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg" role="img"
       class="garment${opts.className ? ' ' + opts.className : ''}">
    ${_shadeDefs(uid)}
    <ellipse cx="300" cy="668" rx="215" ry="16" fill="rgba(0,0,0,.07)"/>
    <path d="${bodyPath}" fill="${colorHex}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${bodyPath}" fill="url(#shade${uid})"/>
    <path d="${bodyPath}" fill="url(#vshade${uid})"/>
    ${details}
    ${printAreas}
    ${motifEl}
  </svg>`;
}

/** Miniatyr för färgval — plagg framifrån i liten storlek. */
function renderThumb(productId, color) {
  const dir = photoDir(productId);
  if (dir && typeof color === 'object' && color) {
    return `<span class="garment-photo"><img src="${dir}/${color.id}-thumb.webp"
      alt="" loading="lazy" decoding="async"></span>`;
  }
  return renderGarment(productId, 'front', color);
}
