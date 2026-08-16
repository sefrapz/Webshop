//+------------------------------------------------------------------+
//| TrendPyramid.mq5                                                  |
//|                                                                   |
//| Samma logik som Pine-strategin trend-pyramid.pine, men körbar     |
//| direkt i MetaTrader 5 — ingen TradingView i loopen.               |
//|                                                                   |
//| Trendfilter (EMA) bestämmer riktning, supertrend ger insteget,    |
//| positionen fylls på i vinnare och stoppen ligger hos mäklaren så  |
//| att den gäller även om terminalen tappar kontakt.                 |
//|                                                                   |
//| Fungerar på både netting- och hedgingkonton.                      |
//+------------------------------------------------------------------+
#property copyright "Trend Pyramid"
#property version   "1.00"

#include <Trade\Trade.mqh>

//--- Trend
input group "Trend"
input int    TrendLen      = 200;    // Trendfilter EMA
input bool   UseSlope      = true;   // Kräv lutning på EMA:n
input int    SlopeLen      = 10;     // Lutning mätt över (barer)
input double StFactor      = 3.0;    // Supertrend faktor
input int    StAtrLen      = 10;     // Supertrend ATR

//--- Risk
input group "Risk"
input double RiskPct       = 0.5;    // Risk per insteg (% av kapital)
input int    AtrLen        = 14;     // ATR för stop
input double StopAtrMult   = 1.5;    // Initial stop (x ATR)
input double MaxDailyDD    = 3.0;    // Max dagsförlust (%)

//--- Pyramidering
input group "Pyramidering"
input int    MaxAdds       = 3;      // Antal påfyllnader
input double AddStepAtr    = 1.0;    // Avstånd mellan påfyllnader (x ATR)
input double AddSizePct    = 60.0;   // Storlek på påfyllnad (% av första)
input bool   TrailAfterAdd = true;   // Flytta stop till supertrend efter första påfyllnaden

//--- Filter
input group "Filter"
input bool   UseSession    = true;   // Handla bara i session
input int    SessStartHour = 15;     // Sessionsstart, timme (MÄKLARENS servertid)
input int    SessStartMin  = 30;     // Sessionsstart, minut
input int    SessEndHour   = 22;     // Sessionsslut, timme (MÄKLARENS servertid)
input int    SessEndMin    = 0;      // Sessionsslut, minut
input bool   FlatAtClose   = true;   // Stäng allt vid sessionsslut
input double MinAtrPct     = 0.05;   // Minsta ATR (% av pris)
input int    MaxTradesDay  = 6;      // Max insteg per dag

//--- Riktning
input group "Riktning"
input bool   AllowLong     = true;   // Tillåt long
input bool   AllowShort    = true;   // Tillåt short

//--- Exekvering
input group "Exekvering"
input ulong  MagicNumber   = 725101; // Magic number
input ulong  MaxDeviation  = 20;     // Max slippage (points)
input int    LookbackBars  = 1000;   // Barer att räkna supertrend på
input string TradeComment  = "TrendPyr";

CTrade   trade;

int      hEma      = INVALID_HANDLE;
int      hAtr      = INVALID_HANDLE;
int      hAtrSt    = INVALID_HANDLE;

datetime lastBarTime   = 0;
datetime dayStamp      = 0;
double   dayStartEquity = 0.0;
int      tradesToday   = 0;
bool     dayBlocked    = false;

// Positionsstate — speglar var-variablerna i Pine-versionen.
double   baseLots      = 0.0;   // storleken på första insteget
double   lastAddPx     = 0.0;   // priset där senaste insteget skedde
double   atrAtEntry    = 0.0;   // ATR vid första insteget
int      addsDone      = 0;
double   stopPx        = 0.0;   // aktuell stop, flyttas aldrig mot positionen

//+------------------------------------------------------------------+
//| Init                                                              |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(SlopeLen >= LookbackBars || TrendLen >= LookbackBars)
     {
      Print("LookbackBars måste vara större än TrendLen och SlopeLen.");
      return(INIT_PARAMETERS_INCORRECT);
     }

   hEma   = iMA(_Symbol, PERIOD_CURRENT, TrendLen, 0, MODE_EMA, PRICE_CLOSE);
   hAtr   = iATR(_Symbol, PERIOD_CURRENT, AtrLen);
   hAtrSt = iATR(_Symbol, PERIOD_CURRENT, StAtrLen);

   if(hEma == INVALID_HANDLE || hAtr == INVALID_HANDLE || hAtrSt == INVALID_HANDLE)
     {
      Print("Kunde inte skapa indikatorhandtag.");
      return(INIT_FAILED);
     }

   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(MaxDeviation);
   trade.SetTypeFillingBySymbol(_Symbol);
   trade.LogLevel(LOG_LEVEL_ERRORS);

   dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   dayStamp       = DayStamp(TimeCurrent());

   RebuildStateFromPositions();

   // Servertiden är mäklarens, inte din. Skriv ut den så att sessionen
   // går att ställa rätt utan gissningar.
   PrintFormat("TrendPyramid start. Servertid nu: %s. Session %02d:%02d-%02d:%02d servertid. Konto: %s.",
               TimeToString(TimeCurrent(), TIME_DATE|TIME_MINUTES),
               SessStartHour, SessStartMin, SessEndHour, SessEndMin,
               IsHedging() ? "hedging" : "netting");

   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   if(hEma   != INVALID_HANDLE) IndicatorRelease(hEma);
   if(hAtr   != INVALID_HANDLE) IndicatorRelease(hAtr);
   if(hAtrSt != INVALID_HANDLE) IndicatorRelease(hAtrSt);
  }

//+------------------------------------------------------------------+
//| Hjälpare                                                          |
//+------------------------------------------------------------------+
bool IsHedging()
  {
   return((ENUM_ACCOUNT_MARGIN_MODE)AccountInfoInteger(ACCOUNT_MARGIN_MODE) == ACCOUNT_MARGIN_MODE_RETAIL_HEDGING);
  }

datetime DayStamp(datetime t)
  {
   MqlDateTime s;
   TimeToStruct(t, s);
   s.hour = 0; s.min = 0; s.sec = 0;
   return(StructToTime(s));
  }

// Total volym och volymviktat snittpris för EA:ns egna positioner.
// Netting ger en position, hedging kan ge flera — båda hanteras här.
void PositionSnapshot(double &netVolume, double &avgPrice, int &count, int &dir)
  {
   netVolume = 0.0; avgPrice = 0.0; count = 0; dir = 0;
   double weighted = 0.0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;

      double vol = PositionGetDouble(POSITION_VOLUME);
      double px  = PositionGetDouble(POSITION_PRICE_OPEN);
      int    d   = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? 1 : -1;

      if(dir == 0) dir = d;
      netVolume += vol;
      weighted  += vol * px;
      count++;
     }

   if(netVolume > 0.0) avgPrice = weighted / netVolume;
  }

// Efter omstart av terminalen är minnet tomt men positionerna finns kvar.
// Bygg ett rimligt state så att stop och påfyllnad fortsätter fungera.
void RebuildStateFromPositions()
  {
   double vol, avg; int cnt, dir;
   PositionSnapshot(vol, avg, cnt, dir);

   if(cnt == 0)
     {
      ResetPositionState();
      return;
     }

   addsDone   = MathMin(cnt - 1, MaxAdds);
   baseLots   = vol / (1.0 + addsDone * AddSizePct / 100.0);
   lastAddPx  = avg;
   stopPx     = 0.0;

   double atrBuf[];
   if(CopyBuffer(hAtr, 0, 1, 1, atrBuf) == 1)
      atrAtEntry = atrBuf[0];

   PrintFormat("State återuppbyggt efter omstart: %d position(er), %.2f lots, snittpris %.*f.",
               cnt, vol, _Digits, avg);
  }

void ResetPositionState()
  {
   baseLots   = 0.0;
   lastAddPx  = 0.0;
   atrAtEntry = 0.0;
   addsDone   = 0;
   stopPx     = 0.0;
  }

bool InSession(datetime t)
  {
   if(!UseSession) return(true);

   MqlDateTime s;
   TimeToStruct(t, s);
   int now   = s.hour * 60 + s.min;
   int start = SessStartHour * 60 + SessStartMin;
   int end   = SessEndHour   * 60 + SessEndMin;

   if(start == end)  return(true);
   if(start <  end)  return(now >= start && now < end);
   return(now >= start || now < end);   // session över midnatt
  }

// Lotstorlek så att avståndet till stoppen kostar exakt RiskPct av kapitalet.
double LotsForRisk(double stopDistance)
  {
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickValue <= 0.0 || tickSize <= 0.0 || stopDistance <= 0.0) return(0.0);

   double riskAmount = AccountInfoDouble(ACCOUNT_EQUITY) * RiskPct / 100.0;
   double lossPerLot = stopDistance / tickSize * tickValue;
   if(lossPerLot <= 0.0) return(0.0);

   return(NormalizeLots(riskAmount / lossPerLot));
  }

double NormalizeLots(double lots)
  {
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(lotStep <= 0.0) lotStep = 0.01;

   double normalized = MathFloor(lots / lotStep) * lotStep;
   normalized = MathMin(normalized, maxLot);

   // Hellre ingen affär än en affär som riskerar mer än tänkt: minsta
   // tillåtna lot kan vara större än risken tillåter.
   if(normalized < minLot) return(0.0);

   // Antal decimaler följer mäklarens lotsteg — 0.01 hos de flesta, men
   // 0.001 förekommer och då får man inte runda till två.
   int lotDigits = (int)MathRound(-MathLog10(lotStep));
   lotDigits = (int)MathMax(0, MathMin(8, lotDigits));

   return(NormalizeDouble(normalized, lotDigits));
  }

// Mäklaren tillåter inte stop hur nära pris som helst.
double RespectStopLevel(double price, double stop, bool isLong)
  {
   long   stopsLevel = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minDist    = stopsLevel * _Point;
   double spread     = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) * _Point;
   minDist = MathMax(minDist, spread);

   if(isLong  && price - stop < minDist) stop = price - minDist;
   if(!isLong && stop - price < minDist) stop = price + minDist;

   return(NormalizeDouble(stop, _Digits));
  }

bool EnoughMargin(ENUM_ORDER_TYPE type, double lots, double price)
  {
   double margin = 0.0;
   if(!OrderCalcMargin(type, _Symbol, lots, price, margin)) return(false);
   return(margin < AccountInfoDouble(ACCOUNT_MARGIN_FREE) * 0.9);
  }

//+------------------------------------------------------------------+
//| Supertrend — MT5 saknar den inbyggd, så den räknas för hand.      |
//| Samma definition som Pines ta.supertrend (hl2 +/- faktor * ATR,   |
//| ATR med SMMA-utjämning). dir: 1 = upp, -1 = ner.                  |
//+------------------------------------------------------------------+
int CalcSupertrend(MqlRates &rates[], double &atrBuf[], int bars, double &st[], int &dir[])
  {
   ArrayResize(st, bars);
   ArrayResize(dir, bars);

   double fUp[], fDn[];
   ArrayResize(fUp, bars);
   ArrayResize(fDn, bars);

   double hl2 = (rates[0].high + rates[0].low) / 2.0;
   fUp[0] = hl2 + StFactor * atrBuf[0];
   fDn[0] = hl2 - StFactor * atrBuf[0];
   dir[0] = 1;
   st[0]  = fDn[0];

   for(int i = 1; i < bars; i++)
     {
      hl2 = (rates[i].high + rates[i].low) / 2.0;
      double up = hl2 + StFactor * atrBuf[i];
      double dn = hl2 - StFactor * atrBuf[i];

      fUp[i] = (up < fUp[i-1] || rates[i-1].close > fUp[i-1]) ? up : fUp[i-1];
      fDn[i] = (dn > fDn[i-1] || rates[i-1].close < fDn[i-1]) ? dn : fDn[i-1];

      if(rates[i].close > fUp[i-1])       dir[i] = 1;
      else if(rates[i].close < fDn[i-1])  dir[i] = -1;
      else                                dir[i] = dir[i-1];

      st[i] = (dir[i] == 1) ? fDn[i] : fUp[i];
     }

   return(bars);
  }

//+------------------------------------------------------------------+
//| Tick                                                              |
//+------------------------------------------------------------------+
void OnTick()
  {
   // All logik körs på stängd bar, precis som i Pine-versionen.
   datetime barTime = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(barTime == lastBarTime) return;
   lastBarTime = barTime;

   UpdateDayCounters();
   Process();
  }

void UpdateDayCounters()
  {
   datetime today = DayStamp(TimeCurrent());
   if(today != dayStamp)
     {
      dayStamp       = today;
      dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
      tradesToday    = 0;
      dayBlocked     = false;
     }

   if(dayStartEquity > 0.0)
     {
      double pnlPct = (AccountInfoDouble(ACCOUNT_EQUITY) - dayStartEquity) / dayStartEquity * 100.0;
      if(pnlPct <= -MaxDailyDD && !dayBlocked)
        {
         dayBlocked = true;
         PrintFormat("Dagsstopp: %.2f%% ner. Inga fler insteg idag.", pnlPct);
        }
     }
  }

void Process()
  {
   int bars = LookbackBars;

   MqlRates rates[];
   ArraySetAsSeries(rates, false);
   int copied = CopyRates(_Symbol, PERIOD_CURRENT, 0, bars, rates);
   if(copied < TrendLen + SlopeLen + 5) return;

   double atrBuf[], atrStBuf[], emaBuf[];
   ArraySetAsSeries(atrBuf,   false);
   ArraySetAsSeries(atrStBuf, false);
   ArraySetAsSeries(emaBuf,   false);

   if(CopyBuffer(hAtr,   0, 0, copied, atrBuf)   != copied) return;
   if(CopyBuffer(hAtrSt, 0, 0, copied, atrStBuf) != copied) return;
   if(CopyBuffer(hEma,   0, 0, copied, emaBuf)   != copied) return;

   double st[]; int dir[];
   CalcSupertrend(rates, atrStBuf, copied, st, dir);

   int i = copied - 2;               // senast stängda bar
   if(i < SlopeLen + 1) return;

   double closePx = rates[i].close;
   double ema     = emaBuf[i];
   double atr     = atrBuf[i];
   double stLine  = st[i];

   bool flipUp    = (dir[i] ==  1 && dir[i-1] == -1);
   bool flipDown  = (dir[i] == -1 && dir[i-1] ==  1);
   bool dirUp     = (dir[i] ==  1);

   bool emaRising  = ema > emaBuf[i - SlopeLen];
   bool emaFalling = ema < emaBuf[i - SlopeLen];

   bool inSess    = InSession(TimeCurrent());
   bool atrOk     = (closePx > 0.0) && (atr / closePx * 100.0 >= MinAtrPct);

   double vol, avg; int cnt, posDir;
   PositionSnapshot(vol, avg, cnt, posDir);
   bool flat = (cnt == 0);

   if(flat) ResetPositionState();

   //--- Utgångar först, så att en vändning inte möts av ny påfyllnad
   if(!flat && ((posDir > 0 && flipDown) || (posDir < 0 && flipUp)))
     {
      CloseAll("trendflip");
      return;
     }

   if(!flat && dayBlocked)
     {
      CloseAll("dagsstopp");
      return;
     }

   if(!flat && FlatAtClose && UseSession && !inSess)
     {
      CloseAll("sessionsslut");
      return;
     }

   //--- Stop: dras med, aldrig tillbaka
   if(!flat)
     {
      // Efter en omstart kan ATR vid insteget saknas — utan den står
      // påfyllnaden still. Ta dagens ATR som ersättning.
      if(atrAtEntry <= 0.0) atrAtEntry = atr;
      if(lastAddPx  <= 0.0) lastAddPx  = avg;

      ManageStop(posDir, avg, atr, stLine);
      TryAdd(posDir, atr, closePx, dirUp, inSess);
      return;
     }

   //--- Insteg
   if(!inSess || !atrOk || dayBlocked || tradesToday >= MaxTradesDay) return;

   bool longSetup  = AllowLong  && flipUp   && closePx > ema && (!UseSlope || emaRising);
   bool shortSetup = AllowShort && flipDown && closePx < ema && (!UseSlope || emaFalling);

   if(longSetup)  OpenFirst(true,  atr);
   if(shortSetup) OpenFirst(false, atr);
  }

//+------------------------------------------------------------------+
//| Order                                                             |
//+------------------------------------------------------------------+
void OpenFirst(bool isLong, double atr)
  {
   double price    = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double stopDist = StopAtrMult * atr;
   double stop     = RespectStopLevel(price, isLong ? price - stopDist : price + stopDist, isLong);
   double realDist = MathAbs(price - stop);

   double lots = LotsForRisk(realDist);
   if(lots <= 0.0)
     {
      Print("Hoppar över insteg: minsta lot skulle riskera mer än ", RiskPct, "% av kapitalet.");
      return;
     }

   ENUM_ORDER_TYPE type = isLong ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   if(!EnoughMargin(type, lots, price))
     {
      Print("Hoppar över insteg: för lite fri marginal.");
      return;
     }

   bool ok = isLong
             ? trade.Buy(lots,  _Symbol, 0.0, stop, 0.0, TradeComment)
             : trade.Sell(lots, _Symbol, 0.0, stop, 0.0, TradeComment);

   if(!ok)
     {
      PrintFormat("Insteg misslyckades: %d %s", trade.ResultRetcode(), trade.ResultRetcodeDescription());
      return;
     }

   baseLots   = lots;
   atrAtEntry = atr;
   lastAddPx  = price;
   stopPx     = stop;
   addsDone   = 0;
   tradesToday++;

   PrintFormat("%s %.2f lots @ %.*f, stop %.*f (risk %.2f%%).",
               isLong ? "Long" : "Short", lots, _Digits, price, _Digits, stop, RiskPct);
  }

void TryAdd(int posDir, double atr, double closePx, bool dirUp, bool inSess)
  {
   if(!inSess || dayBlocked) return;
   if(addsDone >= MaxAdds) return;
   if(atrAtEntry <= 0.0 || lastAddPx <= 0.0 || baseLots <= 0.0) return;

   bool isLong = (posDir > 0);
   if(isLong  && !dirUp) return;
   if(!isLong &&  dirUp) return;

   double step = AddStepAtr * atrAtEntry;
   bool   moved = isLong ? (closePx >= lastAddPx + step) : (closePx <= lastAddPx - step);
   if(!moved) return;

   double lots = NormalizeLots(baseLots * AddSizePct / 100.0);
   if(lots <= 0.0) return;

   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   ENUM_ORDER_TYPE type = isLong ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   if(!EnoughMargin(type, lots, price)) return;

   // Stoppen sätts av ManageStop på nästa bar; skicka med den nuvarande
   // så att påfyllnaden aldrig ligger oskyddad ens en sekund.
   double stop = stopPx > 0.0 ? RespectStopLevel(price, stopPx, isLong) : 0.0;

   bool ok = isLong
             ? trade.Buy(lots,  _Symbol, 0.0, stop, 0.0, TradeComment + " pyr")
             : trade.Sell(lots, _Symbol, 0.0, stop, 0.0, TradeComment + " pyr");

   if(!ok)
     {
      PrintFormat("Påfyllnad misslyckades: %d %s", trade.ResultRetcode(), trade.ResultRetcodeDescription());
      return;
     }

   addsDone++;
   lastAddPx = price;

   PrintFormat("Påfyllnad %d: %.2f lots @ %.*f.", addsDone, lots, _Digits, price);
  }

void ManageStop(int posDir, double avgPrice, double atr, double stLine)
  {
   bool   isLong = (posDir > 0);
   double cand;

   if(isLong)
     {
      cand = avgPrice - StopAtrMult * atr;
      if(TrailAfterAdd && addsDone > 0) cand = MathMax(cand, stLine);
      stopPx = (stopPx <= 0.0) ? cand : MathMax(stopPx, cand);
     }
   else
     {
      cand = avgPrice + StopAtrMult * atr;
      if(TrailAfterAdd && addsDone > 0) cand = MathMin(cand, stLine);
      stopPx = (stopPx <= 0.0) ? cand : MathMin(stopPx, cand);
     }

   double price  = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_BID) : SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double target = RespectStopLevel(price, stopPx, isLong);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;

      double current = PositionGetDouble(POSITION_SL);
      if(MathAbs(current - target) < _Point) continue;

      // Flytta aldrig en befintlig stop åt fel håll.
      if(current > 0.0)
        {
         if(isLong  && target <= current) continue;
         if(!isLong && target >= current) continue;
        }

      if(!trade.PositionModify(ticket, target, PositionGetDouble(POSITION_TP)))
         PrintFormat("Kunde inte flytta stop på %I64u: %d %s",
                     ticket, trade.ResultRetcode(), trade.ResultRetcodeDescription());
     }
  }

void CloseAll(string reason)
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)MagicNumber) continue;

      if(!trade.PositionClose(ticket))
         PrintFormat("Kunde inte stänga %I64u: %d %s",
                     ticket, trade.ResultRetcode(), trade.ResultRetcodeDescription());
     }

   ResetPositionState();
   Print("Allt stängt: ", reason);
  }
//+------------------------------------------------------------------+
