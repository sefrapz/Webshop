/* =========================================================
   MOTIV. — produktdata, färger, storlekar, placeringar, motiv
   ========================================================= */

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

const COLORS = [
  { id: 'vit',      name: 'Vit',         hex: '#f2f0ea' },
  { id: 'svart',    name: 'Svart',       hex: '#232327' },
  { id: 'marin',    name: 'Marinblå',    hex: '#28345c' },
  { id: 'gra',      name: 'Gråmelerad',  hex: '#aaaaaf' },
  { id: 'sand',     name: 'Sand',        hex: '#d9cba6' },
  { id: 'oliv',     name: 'Oliv',        hex: '#77755b' },
  { id: 'rod',      name: 'Röd',         hex: '#b42430' },
  { id: 'bordeaux', name: 'Bordeaux',    hex: '#722336' },
  { id: 'gron',     name: 'Grön',        hex: '#237a42' },
  { id: 'ljusbla',  name: 'Ljusblå',     hex: '#93bbdd' },
  { id: 'gul',      name: 'Gul',         hex: '#e9b62f' },
  { id: 'rosa',     name: 'Rosa',        hex: '#e9a6b8' },
];

/* `cm` är tryckytans sida i centimeter och styr hur stort motivet ritas.
   Mockupen skalar den mot plaggets verkliga bröstvidd — se UNITS_PER_CM
   i mockups.js — så samma tryck täcker en mindre del av en oversized
   hoodie än av en t-shirt, precis som i verkligheten.

   `price` är vad trycket kostar utöver plagget. Leverantören prissätter
   de två tryckytorna var för sig, så priset på sidan byggs som
   plagg + tryck — se priceFor() längre ner. */
const PLACEMENTS = [
  { id: 'hjarta', name: 'Hjärta', size: '10 × 10 cm', cm: 10, price: 75, side: 'front',
    desc: 'Diskret tryck på vänster bröst.' },
  { id: 'mage',   name: 'Mage',   size: '20 × 20 cm', cm: 20, price: 150, side: 'front',
    desc: 'Stort tryck mitt på framsidan.' },
  { id: 'rygg',   name: 'Rygg',   size: '20 × 20 cm', cm: 20, price: 150, side: 'back',
    desc: 'Stort tryck mitt på ryggen.' },
];

const PRODUCTS = {
  tshirt: {
    id: 'tshirt',
    name: 'T-shirt bas',
    price: 180,
    /* Fyra fotograferade färger — se TSHIRT_COLORS nedan. */
    get colors() { return TSHIRT_COLORS; },
    photos: 'assets/tshirt',
    tagline: 'Unisex XS–5XL · 150 gsm ringspunnen bomull',
    desc: 'Modern modell tillverkad av ringspunnen, kammad och certifierad ekologisk bomull med en mjuk och len känsla, 150 gsm.',
  },
  sweatshirt: {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    price: 280,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    /* Fyra fotograferade färger — se SWEATSHIRT_COLORS nedan. */
    get colors() { return SWEATSHIRT_COLORS; },
    photos: 'assets/sweatshirt',
    tagline: 'Unisex XS–3XL · borstad mjuk insida',
    desc: 'Den avslappnade passformen gör den perfekt för vardagsanvändning, rund hals, borstad mjuk insida av certifierad ekologisk bomull och certifierad återvunnen polyester gör den bekväm både i look och känsla.',
  },
  hoodie: {
    id: 'hoodie',
    name: 'Hoodie',
    price: 460,
    /* Hoodien går bara upp till 3XL — de övriga plaggen finns i hela XS–5XL. */
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    /* Egna färger och riktiga foton — se HOODIE_COLORS nedan. */
    get colors() { return HOODIE_COLORS; },
    photos: 'assets/hoodie',
    tagline: 'Unisex XS–3XL · 300 gsm tretrådigt tyg',
    desc: 'Modern hood i certifierad ekologisk bomull och certifierad återvunnen polyester i ett tungt 300 gsm tretrådigt tyg. Den är tvättbar i 60 grader, dubbelinfärgad och förkrympt för att behålla sin form. Den tidlösa designen har en mysig huva, en praktisk framficka och en halvmåne i nacken.',
  },
  longsleeve: {
    id: 'longsleeve',
    name: 'Longsleeve t-shirt',
    price: 195,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    /* Fyra färgställningar — vit kropp, färgad ärm. Se LONGSLEEVE_COLORS. */
    get colors() { return LONGSLEEVE_COLORS; },
    photos: 'assets/longsleeve',
    tagline: 'Unisex XS–3XL · raglanärm · enzymtvättad',
    desc: 'Tröjan är tillverkad av premium kammad, certifierad ekologisk bomull. Den har genomgått en enzymtvätt för en mjuk känsla och långvarig hållbarhet. T-shirten har en tvåfärgad design med raglanärmar och är försedd med egen ribb i halsringningen samt ärmslut med muddar.',
  },
};

/** Storlekar för ett plagg. Saknas `sizes` finns plagget i hela XS–5XL. */
function sizesFor(productId) {
  return (PRODUCTS[productId] && PRODUCTS[productId].sizes) || SIZES;
}

/* ---------------------------------------------------------
   Hoodien säljs på riktiga produktfoton, inte mockup. Filerna
   ligger i assets/hoodie/ som `<färg>-fram.webp`, `<färg>-bak.webp`
   och `<färg>-thumb.webp`. Hex används bara som reservfärg innan
   bilden laddats — själva färgprovet är fotot.
   --------------------------------------------------------- */

const HOODIE_COLORS = [
  { id: 'vit',        name: 'Vit',          hex: '#d8d8d8' },
  { id: 'graddvit',   name: 'Gräddvit',     hex: '#ede8de' },
  { id: 'benvit',     name: 'Benvit',       hex: '#c6c3bb' },
  { id: 'ljusgul',    name: 'Ljusgul',      hex: '#eae5b0' },
  { id: 'gramelerad', name: 'Gråmelerad',   hex: '#a6a6a6' },
  { id: 'stalgra',    name: 'Stålgrå',      hex: '#6b6b6b' },
  { id: 'morkgra',    name: 'Mörkgrå',      hex: '#5b5a5a' },
  { id: 'antracit',   name: 'Antracit',     hex: '#474747' },
  { id: 'dimbla',     name: 'Dimblå',       hex: '#899da5' },
  { id: 'mellanbla',  name: 'Mellanblå',    hex: '#5177a2' },
  { id: 'marin',      name: 'Marinblå',     hex: '#2d3e5e' },
  { id: 'petrol',     name: 'Petrolblå',    hex: '#364353' },
  { id: 'mint',       name: 'Mint',         hex: '#afc6b8' },
  { id: 'grasalvia',  name: 'Gråsalvia',    hex: '#6c756c' },
  { id: 'gron',       name: 'Grön',         hex: '#617f67' },
  { id: 'oliv',       name: 'Oliv',         hex: '#787461' },
  { id: 'rosa',       name: 'Rosa',         hex: '#d68189' },
];

const LONGSLEEVE_COLORS = [
  { id: 'svart', name: 'Vit / Svart',     hex: '#2f2f2f' },
  { id: 'gron',  name: 'Vit / Mörkgrön',  hex: '#2d3a33' },
  { id: 'marin', name: 'Vit / Marinblå',  hex: '#24374f' },
  { id: 'khaki', name: 'Vit / Khaki',     hex: '#8a7a63' },
];

const SWEATSHIRT_COLORS = [
  { id: 'gramelerad', name: 'Gråmelerad', hex: '#b4b4b4' },
  { id: 'stalgra',    name: 'Stålgrå',    hex: '#5f5f5f' },
  { id: 'antracit',   name: 'Antracit',   hex: '#3f3f3f' },
  { id: 'marin',      name: 'Marinblå',   hex: '#2b3346' },
];

const TSHIRT_COLORS = [
  { id: 'vit',        name: 'Vit',        hex: '#f0f0f0' },
  { id: 'gramelerad', name: 'Gråmelerad', hex: '#9b9b9b' },
  { id: 'morkgra',    name: 'Mörkgrå',    hex: '#585856' },
  { id: 'marin',      name: 'Marinblå',   hex: '#232f47' },
];

/** Färger för ett plagg. Saknas egna används de tolv standardfärgerna. */
function colorsFor(productId) {
  return (PRODUCTS[productId] && PRODUCTS[productId].colors) || COLORS;
}

/** Slår upp en färg inom rätt plagg — färg-id:n skiljer sig mellan plaggen. */
function colorById(productId, colorId) {
  return colorsFor(productId).find(c => c.id === colorId) || null;
}

/** Mappen med produktfoton, om plagget har några. */
function photoDir(productId) {
  return (PRODUCTS[productId] && PRODUCTS[productId].photos) || null;
}

/* ---------------------------------------------------------
   Storleksguide — plaggmått i cm, mätta på plagget som det
   ligger platt. Bröstvidd mäts rakt över från söm till söm.
   --------------------------------------------------------- */

const SIZE_CHART = {
  tshirt: {
    columns: ['Bröstvidd', 'Längd'],
    rows: {
      XS: [46, 66], S: [49, 68], M: [52, 70], L: [55, 72], XL: [58, 74],
      '2XL': [61, 76], '3XL': [64, 78], '4XL': [67, 80], '5XL': [70, 82],
    },
  },
  sweatshirt: {
    columns: ['Bröstvidd', 'Längd', 'Ärmlängd'],
    rows: {
      XS: [49, 65, 60], S: [52, 67, 61], M: [55, 69, 62], L: [58, 71, 63], XL: [61, 73, 64],
      '2XL': [64, 75, 65], '3XL': [67, 77, 66],
    },
  },
  hoodie: {
    columns: ['Bröstvidd', 'Längd', 'Ärmlängd'],
    rows: {
      XS: [52, 64, 60], S: [55, 66, 61], M: [58, 68, 62], L: [61, 70, 63], XL: [64, 72, 64],
      '2XL': [67, 74, 65], '3XL': [70, 76, 66],
    },
  },
  longsleeve: {
    columns: ['Bröstvidd', 'Längd', 'Ärmlängd'],
    rows: {
      XS: [46, 66, 60], S: [49, 68, 61], M: [52, 70, 62], L: [55, 72, 63], XL: [58, 74, 64],
      '2XL': [61, 76, 65], '3XL': [64, 78, 66],
    },
  },
};

/* ---------------------------------------------------------
   Motiv. Riktiga tryckfärdiga motiv, inte platshållare.

   Ett bildmotiv är friläggt från vit botten med
   `node tools/motif.mjs <källbild> assets/motiv/<id>.webp`
   och ritas med `preserveAspectRatio="xMidYMid meet"`, så det
   ryms i tryckytan utan att beskäras.

   Ett handritat motiv anges i stället med `svg` i viewBox
   0 0 100 100 — och måste då mätas in i MOTIF_BOX nedan.
   --------------------------------------------------------- */

const MOTIFS = [
  { id: 'attyd', name: 'ATTYD', type: 'image', src: 'assets/motiv/attyd.webp' },
];

/* ---------------------------------------------------------
   Handritade motivs uppmätta yta [x, y, bredd, höjd] inom sin
   viewBox. Behövs bara för `svg`-motiv: utan den ritas ett
   smalt motiv mindre än de centimetermått butiken lovar.
   Bildmotiv skalar sig själva och står inte här.
   --------------------------------------------------------- */

const MOTIF_BOX = {};

const MOTIF_BY_ID = Object.fromEntries(MOTIFS.map(m => [m.id, m]));
const COLOR_BY_ID = Object.fromEntries(COLORS.map(c => [c.id, c]));
const PLACEMENT_BY_ID = Object.fromEntries(PLACEMENTS.map(p => [p.id, p]));

/* ---------------------------------------------------------
   Pris = plagg + tryck. Grundpriset i PRODUCTS är plagget utan
   tryck; tryckytan kostar olika mycket beroende på storlek och
   ligger som `price` på placeringen. Utan vald placering visar
   sidan lägsta möjliga pris ("från").
   --------------------------------------------------------- */

/** Vad trycket kostar för en placering. */
function printPrice(placementId) {
  const pl = PLACEMENT_BY_ID[placementId];
  return pl ? pl.price : 0;
}

/** Färdigt pris för ett plagg med tryck på en viss placering. */
function priceFor(productId, placementId) {
  return PRODUCTS[productId].price + printPrice(placementId);
}

/** Lägsta pris plagget kan hamna på — plagg + billigaste trycket. */
function priceFrom(productId) {
  return PRODUCTS[productId].price + Math.min(...PLACEMENTS.map(p => p.price));
}
