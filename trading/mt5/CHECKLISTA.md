# Din del — 30 minuter, i ordning

Det här är de moment jag inte kan göra åt dig. Allt annat är förberett.

## 1. Konto och installation (~15 min)

- [ ] ftmo.com → **Free Trial** → registrera med din e-post. Välj **MT5** som
      plattform och största kontostorleken de erbjuder på trial.
- [ ] Ladda ner **MetaTrader 5** via länken FTMO ger dig (deras installer är
      förkopplad mot deras server) och logga in med kontouppgifterna från
      mejlet.
- [ ] Hitta US100-symbolen: högerklicka i **Market Watch** → *Symboler* → sök
      "US100" eller "NAS". Notera exakta namnet, med eventuellt suffix.

## 2. EA:n in i terminalen (~10 min)

- [ ] **Fil → Öppna datamapp** → `MQL5/Experts/` → kopiera in `TrendPyramid.mq5`.
- [ ] Lägg `presets/FTMO-Trial.set` var som helst där du hittar den.
- [ ] Tryck **F4** (MetaEditor) → öppna filen → **F7** (Compile).
      Grönt = klart. Fel? Kopiera hela felmeddelandet till mig — hela raden,
      inte en skärmdump av halva.
- [ ] Tillbaka i MT5: öppna US100-grafen, sätt tidsramen till **M5**.
- [ ] Dra **TrendPyramid** från Navigator till grafen. I dialogen:
      fliken *Inputs* → **Load** → `FTMO-Trial.set`. Bocka i
      *Allow Algo Trading*. OK.
- [ ] Tryck på **Algo Trading**-knappen i verktygsfältet så den lyser grönt.

## 3. Kontrollera (~5 min)

- [ ] Fliken **Experts** (längst ner): där ska stå två rader från EA:n med
      servertid, session och startbalans. Kopiera dem till mig.
- [ ] Jämför servertiden med din klocka. Diffar den mot antagandet (EET, en
      timme före svensk tid) säger du till, så räknar jag om sessionen.

## 4. Skicka till mig

När den snurrat ett tag, eller när du kört en backtest
(**Visa → Strategy Tester** → modell *Every tick based on real ticks*):

- Backtest: högerklicka på resultatet → **Report** → spara som HTML och ladda
  upp filen här. Jag läser hela — affär för affär om det behövs.
- Live/demo-loggar: fliken Experts → högerklicka → *Öppna* → filen ligger i
  `MQL5/Logs/`. Ladda upp den vid konstigheter.

Sedan trimmar jag parametrar, fixar buggar och skriver om tills det håller.
