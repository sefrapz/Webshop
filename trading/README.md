# Trend Pyramid — trendföljande strategi för TradingView

Steg 1 av tre: en komplett Pine-strategi du kan backtesta själv. Ingen
exekvering, inga pengar inblandade ännu. Poängen med det här steget är att se
om det finns någon edge kvar **efter** kostnader, innan vi bygger automatik
ovanpå.

## Filer

| Fil | Innehåll |
| --- | --- |
| `pine/trend-pyramid.pine` | Strategin. Klistras in i TradingViews Pine Editor. |

## Kom igång

1. Öppna TradingView → valfri graf → **Pine Editor** (längst ner).
2. Nytt skript → klistra in hela `pine/trend-pyramid.pine` → **Save** → **Add to chart**.
3. Ställ grafen på `NAS100USD` (OANDA) och 5 minuter för att ligga nära referensen.
4. Öppna **Strategy Tester** → fliken **Properties** och sätt kostnaderna efter
   din egen mäklare innan du tittar på en enda siffra. Se nedan.

## Så funkar den

Tre lager, i den ordningen:

**Trendfilter.** En EMA (default 200) bestämmer vilket håll som är tillåtet.
Long bara över, short bara under. Med `Kräv lutning` måste EMA:n dessutom peka
åt rätt håll, mätt över 10 barer — det sållar bort sidledes marknad där en
platt EMA annars släpper igenom bägge riktningarna.

**Insteg.** En supertrend (ATR 10, faktor 3) ger triggern. Vänder den upp
medan priset ligger över EMA:n tas en long, och tvärtom för short. Insteget
sker på nästa bars öppning, inte på signalbarens stängning — det är avsiktligt
och en av anledningarna till att den här backtesten kommer se sämre ut än de i
klippen.

**Pyramidering.** Går affären din väg fylls det på var gång priset rört sig
ytterligare 1 × ATR (räknat från ATR vid första insteget). Upp till tre
påfyllnader, varje på 60 % av grundstorleken. Påfyllnad sker bara medan
supertrenden fortfarande pekar rätt.

**Stop.** Initialt 1,5 × ATR från snittpriset. Den flyttas aldrig mot
positionen. Efter första påfyllnaden hakar den på supertrend-linjen om det ger
en snävare stop — det är där en trendföljare hämtar hem sina vinster, genom att
låta stoppen springa ikapp priset i stället för att sätta ett vinstmål.

**Utgångar.** Stop, trendflip åt fel håll, dagligt förlusttak, eller
sessionsslut. Ingen fast take profit: en trendföljare med 35–45 % träffsäkerhet
lever på svansen, och kapar man den försvinner edgen.

## Riskhanteringen

Det här är den delen som skiljer en strategi från ett hasardspel, så den är
byggd först:

- **Storleken räknas ut från stoppen, inte tvärtom.** Varje insteg riskerar
  `Risk per insteg` (default 0,5 %) av aktuellt kapital. Ligger stoppen längre
  bort blir positionen mindre. Antal kontrakt = riskbelopp / (stopavstånd ×
  punktvärde).
- **Dagligt förlusttak.** Går dagen ner 3 % stängs allt och inga nya insteg tas
  förrän nästa dag. Bakgrunden färgas röd i grafen de dagarna.
- **Max 6 insteg per dag.** Skydd mot att strategin hackar sönder ett
  sidledes dygn i småförluster.
- **Inget över natten.** `Stäng allt vid sessionsslut` är på som default.

Notera att med tre påfyllnader riskerar du som mest ungefär 0,5 % × (1 + 0,6 ×
3) ≈ 1,4 % på en fullt uppbyggd position — men bara i det scenario där stoppen
inte hunnit dras med, vilket är ovanligt eftersom påfyllnad kräver att affären
redan går plus.

## Sätt kostnaderna rätt — annars är hela testet skräp

Defaultvärdena i skriptet (1,0 USD per kontrakt och order, 5 ticks slippage) är
en **gissning**, inte din verklighet. Så här tar du reda på dina egna:

1. Kolla din mäklares typiska spread på instrumentet under de timmar du tänker
   handla — inte marknadsföringssiffran, utan vad du ser i plattformen kl 15:30.
2. Halva spreaden per order är en rimlig proxy. Handlar du NAS100 med 1,5
   punkters spread och 1 USD per punkt och kontrakt sätter du `Commission`
   till ungefär 0,75 cash per contract.
3. Lägg på courtage separat om mäklaren tar det.
4. Slippage: minst 2–3 punkter på indexterminer i öppningen. Snåla inte här.

Testa sedan att dubbla kostnaderna. Överlever inte strategin det är den för
tunn för att köra live — då är du en spreadhöjning från att förlora pengar.

## Innan du ens tänker på riktiga pengar

Checklistan jag vill se avbockad, i ordning:

1. **In-sample.** Trimma parametrar på t.ex. 2015–2022. Bry dig inte om
   totalavkastningen, titta på profit factor och max drawdown.
2. **Out-of-sample.** Kör *samma* inställningar orörda på 2023–idag. Tappar
   resultatet mer än ungefär en tredjedel är det curve fitting, inte edge.
3. **Parameterkänslighet.** Ändra ATR-faktorn från 3 till 2,5 och 3,5. Rasar
   resultatet vid små ändringar sitter du på en slump, inte ett mönster.
4. **Kostnadsstress.** Dubbla spread och slippage enligt ovan.
5. **Pappershandel** i minst en månad, med samma storlekar du tänkt köra.
   Först här ser du hur den beter sig när fyllningarna inte är perfekta.

Ett par saker att veta om TradingViews backtest oavsett hur noggrann du är:
den vet inte om stoppen eller vinstmålet träffades först inuti samma bar (och
gissar till din fördel), Deep Backtest på intradagsdata har luckor bakåt i
tiden, och OANDA:s CFD-historik är inte samma sak som terminsdata. Räkna med
att verkligheten blir sämre än siffran du ser.

## Alerts

Strategin skickar redan en färdig JSON-payload vid varje insteg och utgång:

```json
{"strategy":"trend-pyramid","action":"entry","side":"long","symbol":"NAS100USD",
 "tf":"5","price":28873.0,"stop":28801.5,"qty":0.4,"time":1780000000000}
```

Den används inte till något ännu — den ligger där för steg 2. Vill du bara ha
signaler i telefonen: skapa en alert på strategin med `{{strategy.order.alert_message}}`
som meddelandetext.

## Vägen vidare

- **Steg 2 — halvautomatik.** Alert → webhook → liten server som lägger ordern
  hos mäklaren. Snabbt att bygga, men TradingViews alerts kan dröja och i
  sällsynta fall utebli. Duger för swing, är sämre för 30-sekundersgrafer.
- **Steg 3 — riktig bot.** Antingen en MQL5 Expert Advisor som kör direkt i
  MT5 (samma miljö som kontoutdraget i referensklippet), eller Python mot
  mäklarens API med backtrader/vectorbt för testerna. Ingen TradingView i
  loopen, kör på VPS, egen loggning och egna dödmansgrepp.

För steg 2 eller 3 behöver jag veta mäklare, instrument och kontostorlek —
exekveringsdelen ser helt olika ut för MT5, IBKR och en kryptobörs.

## Ansvar

Det här är kod, inte finansiell rådgivning. Backtestade resultat säger
ingenting säkert om framtiden, hävstång på indexCFD kan kosta mer än insatsen
hos vissa mäklare, och den enda siffran som betyder något är den du får efter
kostnader på riktigt konto.
