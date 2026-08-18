# MOTIV. — instruktioner för Claude Code

Statisk webbshop där kunden designar kläder med eget motiv. Ingen byggprocess,
inga beroenden, ingen backend — bara HTML, CSS och tre globala JS-filer som
laddas i ordning från `index.html`.

## Kör lokalt

```bash
npx http-server -p 8000 -c-1 .   # eller: python3 -m http.server 8000
```

## Filer

| Fil | Ansvar |
| --- | --- |
| `index.html` | Skal: header, footer, varukorgs-drawer, motiv-modal, toast |
| `css/style.css` | Designsystem i CSS-variabler, sektioner i samma ordning som vyerna |
| `js/data.js` | 4 produkter, färger, storlekar, 3 placeringar, 25 motiv, storleksguide |
| `js/mockups.js` | SVG-motor + foto-rendering av hoodien |
| `assets/hoodie/` | 17 färger × fram/bak/miniatyr som WebP |
| `assets/tshirt/` | 4 färger × fram/bak/miniatyr som WebP |
| `assets/sweatshirt/` | 4 färger × fram/bak/miniatyr som WebP |
| `tools/photos.mjs` | Normaliserar nya produktfoton till rutnätet |
| `js/app.js` | Hash-router, konfigurator, varukorg (localStorage), kassa |

## Så hänger det ihop

- **Inga moduler.** Allt är globala `const`/`function`. Ordningen i
  `index.html` spelar roll: `data.js` → `mockups.js` → `app.js`.
- **Routern** är hash-baserad med sju vyer: `#/`, `#/produkt/:id`, `#/kassa`,
  `#/tack`, `#/storleksguide`, `#/leverans`, `#/kontakt`. Varje vy skriver hela
  `#app` via `innerHTML` och kopplar sedan events med `.onclick` direkt på
  elementen. `route()` stänger mobilmenyn och motivmodalen vid varje byte.
- **Mockuparna** returnerar SVG som sträng. Kroppen ritas tre gånger (färg,
  horisontell skugga, vertikal skugga) och gradienterna får unika id:n via
  `_uidCounter` — behåll det, annars krockar flera plagg på samma sida.
- **Motivet ritas bara** när placeringens `side` matchar sidan som visas, se
  `renderGarment()`.
- **Trycket är skalat mot verkligheten.** `getPrintRect()` räknar om
  placeringens `cm` till SVG-enheter via `UNITS_PER_CM`, som utgår från att
  plaggets torso är ~296 enheter brett och jämför med bröstvidden i storlek M
  ur `SIZE_CHART`. Därför täcker 22 × 22 cm en mindre del av en oversized
  hoodie än av en t-shirt. `PRINT_TOP` styr höjdläget per plagg.
- **Motivet fyller tryckytan** tack vare `motifViewBox()`, som använder den
  uppmätta ytan i `MOTIF_BOX` och skalar motivets största sida till hela
  rutan. Utan det ritas t.ex. kaktusen (38 av 100 enheter bred) i en tredjedel
  av utlovade 22 cm. Nytt motiv ⇒ mät det och lägg in i `MOTIF_BOX`.
- **Hoodien, sweatshirten och t-shirten visas som riktiga foton**; långärmad
  är det enda plagget kvar som SVG-mockup.
  `renderGarment()` väljer väg: får den ett färg*objekt* och plagget har
  `photos` i `PRODUCTS` blir det `renderPhotoGarment()` med `<img>` plus en
  tryckyta lagd ovanpå i procent. Får den bara en hex-sträng ritas mockupen.
- **Fotona är normaliserade** per plagg till ett gemensamt rutnät: plagget
  skalas efter sin bredaste sammanhängande rad — ärmspets till ärmspets — och
  placeras med toppen på y = 22. Källbilderna är beskurna olika, så utan det
  glider tryckytan mellan färgerna. Kör alltid nya foton genom
  `node tools/photos.mjs <källmapp> <målmapp> <karta.json>`.
- **Fotots tryckskala** står i `PHOTO_GEOM` i `js/mockups.js`, en post per
  plagg. `bodyPct` är plaggets synliga bredd i bilden, avläst på rutnät;
  tryckets bredd räknas som `cm / bröstvidd i M × bodyPct`. Plaggen är fotade
  på osynlig docka och normaliserade var för sig, så skalan är *inte*
  gemensam mellan plaggen — nytt fotograferat plagg kräver en egen post.
- **Färger är per plagg.** `colorsFor()` och `colorById()` i `js/data.js` —
  hoodien har `HOODIE_COLORS` (17 fotograferade), t-shirten och sweatshirten
  fyra var, långärmad de tolv i `COLORS`.
  Färg-id:n skiljer sig mellan plaggen, så slå aldrig upp en färg utan att
  veta vilket plagg det gäller.
- **Konfiguratorn** har ett `configState`-objekt som nollställs vid produktbyte.
  Alla ändringar går genom `update()` inuti `renderProductPage()`; undantaget är
  motivval som ritar om hela sidan.
- **Designen ligger i adressfältet** som `#/produkt/hoodie?farg=svart&motiv=tiger&plats=rygg`.
  `update()` skriver den med `history.replaceState` (som medvetet *inte* triggar
  hashchange — annars startar routern om sidan vid varje klick), och
  `applyDesignParams()` läser tillbaka den. Okända värden ignoreras tyst, så en
  trasig länk aldrig kraschar sidan. Lägger du till ett val i konfiguratorn:
  ta med det i både `designHash()` och `applyDesignParams()`.
- **Varukorgen** ligger i `localStorage` under `motiv-cart`. Rader slås ihop på
  nyckeln `produkt|färg|storlek|motiv|placering`.

## Dialoger och tangentbord

Varukorgs-drawern och motivmodalen delar samma mönster — följ det när du lägger
till en ny dialog:

- Escape stänger den översta öppna dialogen (motivmodal före varukorg före meny).
- `trapFocus()` håller kvar tabbningen; `focusFirst()` flyttar in fokus.
- Fokus går tillbaka till elementet som öppnade dialogen när den stängs.
- `syncBodyScroll()` avgör om `body.no-scroll` ska sitta på — sätt den aldrig
  direkt, då slåss dialogerna om `overflow`.
- Val som är på/av (färg, storlek, placering, sida, motiv) ska ha `aria-pressed`
  som uppdateras i takt med `.selected`-klassen.

## Konventioner

- All UI-text är på svenska. Kommentarer i koden likaså.
- Priser är heltal kronor, formaterade som `${n} kr`.
- Nya motiv läggs i `MOTIFS` i `js/data.js` med `viewBox 0 0 100 100` — och i
  `MOTIF_BOX` med sin uppmätta yta.
- Nya färger läggs i `COLORS`; mockupmotorn tar hex rakt av, inget mer behövs.
- Storlekar är per plagg: `sizesFor()` i `js/data.js` returnerar plaggets
  `sizes` om det har några, annars hela `SIZES`. Hoodien går bara till 3XL.
  Både storleksrutnätet, storleksguiden och `applyDesignParams()` går via den.
- Nytt plagg kräver fyra saker: post i `PRODUCTS`, rad i `SIZE_CHART`, kropp och
  detaljer i `js/mockups.js` med en gren i `renderGarment()`, samt värden i
  `UNITS_PER_CM` och `PRINT_TOP`. Glöm inte länkarna i `index.html`.
- Nämn inte tryckteknik i UI-texter.
- Håll det beroendefritt — inget byggsteg, inga npm-paket i klienten.

## Titta på resultatet

Sessionen har Chromium förinstallerat. Efter en ändring, ta en skärmbild och
skicka den till användaren i stället för att beskriva den i ord:

```bash
node tools/shot.mjs '#/produkt/hoodie'          # en vy
node tools/shot.mjs '#/' '#/kassa' --mobile     # flera vyer, mobilbredd
```

Bilderna hamnar i `.shots/` (gitignorerad). Skicka dem med SendUserFile.

## Deploy

Pusha till `main` — inget mer. Workflowen `.github/workflows/mirror-to-gh-pages.yml`
speglar `main` till `gh-pages`, som är den branch GitHub Pages bygger från.
Sajten ligger på https://sefrapz.github.io/Webshop/ och uppdateras inom en
minut eller två. Rör inte `gh-pages` för hand — den skrivs över vid varje push.
