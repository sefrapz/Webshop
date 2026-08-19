# TrendPyramid — Expert Advisor för MetaTrader 5

Samma logik som Pine-strategin, men körbar direkt i MT5. Ingen TradingView, inga
webhooks, inget som kan tappas på vägen — EA:n räknar själv och lägger ordern
hos mäklaren.

## Varför MT5 är ett bättre testlabb än TradingView

När du väl har mäklaren på plats blir MT5:s egen Strategy Tester ärligare än
TradingViews backtest, av tre skäl:

- Den kan köra på **riktiga ticks** från din mäklare, inte på 5-minutersstaplar.
- Den använder **din mäklares faktiska spread** och symbolspecifikation.
- Den gissar inte om stoppen eller vinstmålet träffades först inuti en bar — den
  vet, för den har tickarna.

Därför är planen: verifiera i MT5 mot riktiga ticks, inte i TradingView.

## Installera

1. MT5 → **Fil → Öppna datamapp** → `MQL5/Experts/` → lägg `TrendPyramid.mq5` där.
2. Öppna **MetaEditor** (F4), öppna filen, **Compile** (F7). Noll fel förväntas.
3. Tillbaka i MT5 → uppdatera Navigator → dra EA:n till en `US100`-graf på M5.
4. Tillåt **Algo Trading** (knappen i verktygsfältet) och kryssa i
   *Tillåt algoritmisk handel* i EA-dialogen.

## Ställ sessionen rätt — det här är den vanligaste tabben

Sessionsinställningarna är i **mäklarens servertid**, inte din. Servrar ligger
oftast på UTC+2/UTC+3, men det varierar och ändras vid sommartid.

EA:n skriver ut serverns klocka i Experts-loggen när den startar:

```
TrendPyramid start. Servertid nu: 2026.08.16 14:32. Session 15:30-22:00 servertid. Konto: hedging.
```

Jämför den raden med din egen klocka och justera `SessStartHour` / `SessEndHour`
tills fönstret täcker den amerikanska öppningen (15:30–22:00 svensk tid).
Default är satt för en server på UTC+2 — kontrollera, gissa inte.

## Backtesta

1. **Visa → Strategy Tester**.
2. Modell: **Every tick based on real ticks**. Allt annat är en gissning.
3. Period: minst 2 år. Dela upp i en trimningsperiod och en orörd testperiod.
4. Deposit: den summa du faktiskt tänker sätta in.
5. Kör. Titta på **max drawdown** och **profit factor**, inte på slutsumman.

Ladda ner tickhistoriken först (**Verktyg → Alternativ → Diagram → max staplar**,
och låt testern hämta hem data — det tar en stund första gången).

Kontrollera att courtaget faktiskt räknas med: kolla symbolspecifikationen
(högerklick på symbolen → Specifikation) och se om mäklaren tar en avgift per
lot utöver spreaden. Gör den det men testern inte visar det, dra av det för hand
— ungefär `antal affärer × lots × avgift × 2`.

## Vad EA:n gör

Identisk logik med Pine-versionen, med tre skillnader till det bättre:

| | Pine/TradingView | MT5-EA |
| --- | --- | --- |
| Stop | Simulerad i backtest | **Ligger hos mäklaren** — gäller även om terminalen kraschar |
| Insteg | Nästa bars öppning | Marknadsorder direkt vid barstängning |
| Omstart | — | Bygger upp sitt state från öppna positioner igen |

Utöver det: EA:n rör bara sina egna positioner (via magic number `725101`), så
du kan handla manuellt i samma konto utan att den lägger sig i.

**Skyddsmekanismerna** är desamma: risk per insteg räknas ur stoppavståndet,
dagligt förlusttak som stänger allt och blockerar resten av dagen, tak på antal
insteg per dag, sessionsfilter och stängning över natten. Dessutom hoppar den
över insteget helt om minsta tillåtna lot skulle riskera mer än din inställda
procent — hellre ingen affär än en för stor.

## Innan du sätter in en krona

Kör den på **demokonto hos samma mäklare** i minst en månad, med samma
lotstorlekar du tänkt köra på riktigt. Demo och live skiljer sig i fyllning och
slippage, men allt annat — spread, servertid, symbolnamn, stops level — är
detsamma, och det är där de flesta buggarna sitter.

## Checklista för mäklarvalet

Du sa certifierad mäklare, vilket är rätt instinkt. Det här är värt att
kontrollera innan du för över pengar:

- **Tillsyn.** Finansinspektionen, eller CySEC/FCA/BaFin med svensk
  gränsöverskridande registrering. Kolla numret i tillsynsmyndighetens register,
  inte bara logotypen på hemsidan.
- **Negativ saldoskydd.** Obligatoriskt för privatkunder inom EU. Utan det kan
  du bli skyldig pengar vid ett gap.
- **Segregerade klientmedel** och insättningsgaranti.
- **Faktisk spread på US100** under 15:30–22:00, inte marknadsföringssiffran.
  Öppna ett demokonto och titta själv en eftermiddag.
- **Courtage per lot** och **swap** över natten (mindre viktigt här eftersom
  strategin stänger vid sessionsslut).
- **Tillåter de EA:er?** De flesta gör det, men vissa har regler mot hög
  ordervolym eller mot att hålla positioner kortare än några minuter.
- **Netting eller hedging** på kontot. EA:n klarar båda, men pyramideringen ser
  olika ut i historiken: netting slår ihop till en position, hedging visar tre.
- **Kontovaluta** — allt riskräknande utgår från kontots valuta, så en
  USD-symbol på ett SEK-konto fungerar men gör siffrorna lite trögare att läsa.

Är det en prop firm och inte en vanlig mäklare gäller deras regler dessutom:
daglig förlustgräns, total förlustgräns och ibland förbud mot att hålla över
helgen. Säg till om det är det du siktar på, då sätter jag `MaxDailyDD` och
sessionsfiltret efter deras regelverk i stället.

## Vad EA:n inte gör

- **Inget nyhetsfilter.** Den handlar rakt in i CPI och räntebesked. Vill du
  pausa runt siffror får vi lägga till en kalender.
- **Ingen slippagevakt** utöver `MaxDeviation` på ordern.
- **Ingen partiell hemtagning.** Hela positionen går ut på stop eller trendflip.

Alla tre går att lägga till — jag ville bara inte bygga dem på gissningar innan
vi sett hur den beter sig på riktig tickdata.

## FTMO — konkret uppsättning

### Plattform: MT5

Valet är redan gjort av koden. `TrendPyramid.mq5` är skriven i MQL5.

- **MT4** kör MQL4 — ett annat språk. Hela EA:n måste skrivas om, och MT4:s
  backtest är sämre (ingen riktig tickdata, sämre modell för stops).
- **cTrader** kör C# via cAlgo. Också en komplett omskrivning.
- **DXtrade** har ingen EA-miljö att tala om.

Utöver att koden redan finns är MT5 det enda av alternativen med en tester som
kan köra på riktiga ticks från FTMO:s egen datafeed. Välj MT5 vid registreringen
— plattformen går inte att byta på ett befintligt konto, du får skapa ett nytt.

### Free Trial: vad den duger till

FTMO:s gratistrial är 14 dagar per konto, ett steg, 5 % vinstmål, två
handelsdagar minimum, samma 5 % dagsförlust och 10 % totalförlust som den
riktiga utvärderingen. Ingen avgift, inget kort.

Använd den till att verifiera **rören**, inte strategin:

- att EA:n kompilerar och startar utan fel i deras miljö
- exakt symbolnamn (FTMO döper index med suffix, kolla Market Watch)
- serverns klocka, så sessionsfönstret hamnar rätt
- faktisk spread på US100 under de timmar du handlar
- att lotstorlekarna blir vettiga för kontostorleken

Vad den **inte** duger till: att säga något om edgen. Fjorton dagar med
sessionsfilter ger kanske 20–40 affärer. Det är statistiskt brus. Dra inga
slutsatser om strategin från trialen — det gör du i testern på flera års
tickdata.

### Inställningar att ändra från default

| Input | Default | FTMO | Varför |
| --- | --- | --- | --- |
| `SessStartHour` / `SessStartMin` | 15:30 | **16:30** | FTMO:s servrar kör EET, en timme före svensk tid på sommaren |
| `SessEndHour` / `SessEndMin` | 22:00 | **23:00** | samma sak |
| `MaxDailyDD` | 3.0 | **3.0** | FTMO fäller dig vid 5 %. Marginalen är avsiktlig |
| `MaxTotalDD` | 8.0 | **8.0** | FTMO fäller dig vid 10 %. Samma resonemang |
| `RiskPct` | 0.5 | **0.5** | ~1,4 % på en fullt uppbyggd pyramid |

Verifiera servertiden mot raden EA:n skriver i Experts-loggen vid start i
stället för att lita på tabellen ovan. Står det `Servertid nu: ... 16:32` när din
egen klocka visar 15:32 stämmer siffrorna.

Symbolen behöver du inte ställa in någonstans — EA:n handlar det instrument den
sitter på. Dra den till rätt graf, så är det gjort.

### Två spärrar mot att spräcka kontot

FTMO:s gränser är hårda: rör du 5 % på en dag eller 10 % totalt är kontot borta
direkt, oavsett hur bra det gick innan. Därför ligger EA:ns egna gränser under
deras:

- **Dagsstoppet** (3 %) stänger allt och blockerar resten av dagen.
- **Totalstoppet** (8 %) stänger allt och slutar handla helt. Startbalansen
  sparas i en global variabel så gränsen överlever en omstart av terminalen —
  annars hade totalstoppet nollställts varje gång du startade om.

Vill du sätta startbalansen för hand, till exempel om du installerar EA:n mitt i
en utvärdering, fyll i `StartBalance` med kontots ursprungliga balans.

### Det FTMO-specifika som fortfarande inte är löst

FTMO nollställer sin dagsgräns vid midnatt CE(S)T, medan EA:n räknar dygn efter
serverns midnatt — en timmes glapp. I praktiken spelar det ingen roll så länge
`FlatAtClose` är på, eftersom inga positioner lever över det glappet, men det är
värt att veta.

Och det viktigaste: FTMO har regler om vad som räknas som otillåten handel.
EA:n är ren på de vanliga punkterna — inga grid, ingen martingale, fasta stops —
men läs deras regelverk själv innan du kör den på ett betalt konto.
