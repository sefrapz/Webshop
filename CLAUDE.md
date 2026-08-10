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
| `js/data.js` | Produkter, 12 färger, 9 storlekar, 3 placeringar, 25 motiv |
| `js/mockups.js` | SVG-motor: ritar plaggen i `viewBox 0 0 600 700` |
| `js/app.js` | Hash-router, konfigurator, varukorg (localStorage), kassa |

## Så hänger det ihop

- **Inga moduler.** Allt är globala `const`/`function`. Ordningen i
  `index.html` spelar roll: `data.js` → `mockups.js` → `app.js`.
- **Routern** är hash-baserad med fyra vyer: `#/`, `#/produkt/:id`, `#/kassa`,
  `#/tack`. Varje vy skriver hela `#app` via `innerHTML` och kopplar sedan
  events med `.onclick` direkt på elementen.
- **Mockuparna** returnerar SVG som sträng. Kroppen ritas tre gånger (färg,
  horisontell skugga, vertikal skugga) och gradienterna får unika id:n via
  `_uidCounter` — behåll det, annars krockar flera plagg på samma sida.
- **Motivet ritas bara** när placeringens `side` matchar sidan som visas, se
  `renderGarment()`. Placeringarnas tryckytor sitter i `getPrintRect()`, där
  hoodien har egna y-värden eftersom plagget är längre.
- **Konfiguratorn** har ett `configState`-objekt som nollställs vid produktbyte.
  Alla ändringar går genom `update()` inuti `renderProductPage()`; undantaget är
  motivval som ritar om hela sidan.
- **Varukorgen** ligger i `localStorage` under `motiv-cart`. Rader slås ihop på
  nyckeln `produkt|färg|storlek|motiv|placering`.

## Konventioner

- All UI-text är på svenska. Kommentarer i koden likaså.
- Priser är heltal kronor, formaterade som `${n} kr`.
- Nya motiv läggs i `MOTIFS` i `js/data.js` med `viewBox 0 0 100 100`.
- Nya färger läggs i `COLORS`; mockupmotorn tar hex rakt av, inget mer behövs.
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
