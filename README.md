# MOTIV. — webbshop för kläder med eget motiv

En modern, komplett webbshop-demo där kunden designar sitt eget plagg:
väljer plagg, färg, storlek, motiv och tryckplacering — och ser resultatet
live innan beställning.

## Kom igång

Ingen byggprocess eller server krävs — allt är statisk HTML/CSS/JS:

```bash
# öppna direkt
open index.html

# eller servera lokalt
python3 -m http.server 8000
# → http://localhost:8000
```

## Flödet

1. **Startsida** — fyra klickbara kategorier: T-shirt bas, Longsleeve t-shirt,
   Sweatshirt och Hoodie.
2. **Produktsida** — stor produktbild med fram-/baksida och färgminiatyrer
   (klick på miniatyr byter den stora bilden), storleksval samt antal.
   T-shirt bas finns i XS–5XL, övriga plagg i XS–3XL. Hoodien har 17
   fotograferade färger, de andra tre fyra var.
3. **Motiv** — knapp som öppnar motivgalleriet. Motiven är riktiga
   tryckfiler med alfakanal, inte ritade platshållare.
4. **Placering** — Hjärta 10 × 10 cm, Mage 22 × 22 cm eller Rygg 22 × 22 cm.
5. **Live-förhandsvisning** — plagget renderas i vald färg med valt motiv på
   vald plats (väljer man rygg vänds plagget automatiskt till baksidan).
6. **Varukorg → Kassa** — kunduppgifter och betalning i Klarna-stil
   (Betala nu / Betala om 30 dagar / Delbetala). Demobetalning — ingen
   riktig transaktion sker.

Därtill finns **Storleksguide**, **Leverans & retur** och **Kontakta oss**
under `#/storleksguide`, `#/leverans` och `#/kontakt`.

**Designen går att dela.** Valen ligger i adressfältet, så en länk som
`#/produkt/hoodie?farg=antracit&motiv=tiger&plats=rygg` öppnar exakt det plagget
hos mottagaren. Knappen *Dela designen* använder mobilens delningsmeny när den
finns och kopierar annars länken. Designen överlever också omladdning.

Sajten fungerar på mobil: hamburgermeny under 720 px, varukorg och motivgalleri
i helskärm, sticky köpknapp och tumvänliga träffytor. Escape stänger öppna
dialoger, fokus hålls kvar i dem och återgår dit det kom ifrån.

## Teknik

| Fil | Ansvar |
| --- | --- |
| `index.html` | Skal: header, footer, varukorgs-drawer, motiv-modal |
| `css/style.css` | Hela designsystemet, responsivt ned till mobil |
| `js/data.js` | 4 produkter, färger och storlekar per plagg, 3 placeringar, motiv |
| `js/mockups.js` | SVG-motor för mockuperna + foto-rendering av hoodien |
| `js/app.js` | Hash-router, konfigurator, varukorg (localStorage), kassa |

Alla fyra plagg visas med riktiga produktfoton, fram och bak. SVG-mockuparna
finns kvar i `js/mockups.js` som reserv för plagg som ännu saknar foton.
Motivet läggs i båda fallen ovanpå plagget i en tryckyta som är skalad mot
plaggets verkliga bröstvidd, så 22 × 22 cm blir 22 cm på riktigt.

Fotona ligger i `assets/<plagg>/` som WebP och normaliseras med
`tools/photos.mjs` — källbilderna är beskurna olika, och utan normalisering
hamnar trycket olika på olika färger.
Vill man byta ut fler plagg mot foton: lägg bilderna i `assets/<plagg>/`,
peka `photos` dit i `PRODUCTS` och ge plagget egna `colors`. `renderGarment()`
väljer sedan fotovägen automatiskt.

## Klarna på riktigt

Kassan är förberedd för Klarna Checkout: ersätt demo-logiken i
`renderCheckoutPage()` (`js/app.js`) med ett anrop till Klarnas
`orders`-API från en backend och montera deras checkout-snippet i
betalningskortet. Kräver Klarna-merchantkonto och serverdel för
API-nycklarna.

## Uppdatera sajten

Shoppen ligger live på <https://sefrapz.github.io/Webshop/>. Pusha till `main`
— inget mer. Workflowen `.github/workflows/mirror-to-gh-pages.yml` speglar
`main` till `gh-pages`, som är den branch GitHub Pages bygger från, och sajten
uppdateras inom någon minut.

`gh-pages` skrivs över vid varje push — gör aldrig ändringar direkt där.
Speglingen lägger på `?v=<commit>` på CSS- och JS-länkarna så att en besökare
inte blir kvar på en cachad version när bilder eller kod ändrats.

## Utveckla från mobilen

Projektet är satt upp för att skötas helt från telefonen via Claude Code på
webben (Claude-appens Code-flik eller <https://claude.ai/code>). Sessionen kör
i en molncontainer med repot klonat, så du behöver varken dator eller lokal
git:

- `CLAUDE.md` beskriver kodbasens konventioner, så varje ny session är
  insatt direkt — du slipper förklara projektet på nytt.
- Deployen är automatisk, så en ändring går live utan git-kommandon.
- Skärmbilder gör att du kan se resultatet i chatten i stället för att läsa
  en beskrivning av det:

```bash
node tools/shot.mjs '#/produkt/hoodie'          # en vy
node tools/shot.mjs '#/' '#/kassa' --mobile     # flera vyer, mobilbredd
node tools/shot.mjs '#/' --full                 # hela sidan, inte bara vyporten
```

Bilderna hamnar i `.shots/` (gitignorerad). Chromium finns förinstallerat i
sessionen — inget att installera.
