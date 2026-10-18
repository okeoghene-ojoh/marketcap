"use client";

import { useMemo, useRef, useState } from "react";
import { Header } from "./Header";
import { PortfolioCard } from "./PortfolioCard";
import { IndicesCard } from "./IndicesCard";
import { AllocationCard } from "./AllocationCard";
import { ReturnsCard } from "./ReturnsCard";
import { WatchlistCard } from "./WatchlistCard";
import { NewsCard } from "./NewsCard";
import { MoversCard } from "./MoversCard";
import { AddHoldingDialog } from "./AddHoldingDialog";
import { useMarketData } from "@/lib/useMarketData";
import { computeTotals } from "@/lib/portfolio";
import { watchSyms } from "@/lib/sample-data";
import type { AssetClass, Currency, Holding } from "@/lib/types";

export function Dashboard({ userName }: { userName: string }) {
  const { holdings, indices, rates, ratesSource, news, movers, flash, addHolding } = useMarketData();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [hidden, setHidden] = useState(false);
  const [selectedClass, setSelectedClass] = useState<AssetClass>("us");
  const [query, setQuery] = useState("");
  const [showAlert, setShowAlert] = useState(true);
  const [notifCount, setNotifCount] = useState(3);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const totals = useMemo(() => computeTotals(holdings, rates), [holdings, rates]);
  const watchItems = useMemo(
    () => watchSyms.map((s) => holdings.find((h) => h.sym === s)).filter((h): h is Holding => !!h),
    [holdings]
  );

  const dismissAlert = () => {
    setShowAlert(false);
    setNotifCount((n) => Math.max(0, n - 1));
  };

  return (
    <div className="app">
      <Header name={userName} query={query} onQuery={setQuery} notifCount={notifCount} />

      <section className="row row-top">
        <PortfolioCard
          totals={totals}
          currency={currency}
          rates={rates}
          ratesSource={ratesSource}
          onCurrency={setCurrency}
          hidden={hidden}
          onToggleHidden={() => setHidden((h) => !h)}
          onAddHolding={() => dialogRef.current?.showModal()}
        />
        <IndicesCard indices={indices} />
      </section>

      <section className="row row-mid">
        <AllocationCard totals={totals} currency={currency} rates={rates} hidden={hidden} selected={selectedClass} onSelect={setSelectedClass} />
        <ReturnsCard totals={totals} currency={currency} rates={rates} hidden={hidden} />
        <WatchlistCard items={watchItems} query={query} flash={flash} showAlert={showAlert} onDismissAlert={dismissAlert} />
      </section>

      <section className="row row-bottom">
        <NewsCard data={news} />
        <MoversCard data={movers} />
      </section>

      <footer className="foot">
        Prices from Finnhub &amp; CoinGecko, FX from ExchangeRate-API. Items marked “sample” are demo data. Not financial advice.
      </footer>

      <AddHoldingDialog ref={dialogRef} onSave={addHolding} />
    </div>
  );
}
