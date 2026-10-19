"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "./Header";
import { PortfolioCard } from "./PortfolioCard";
import { IndicesCard } from "./IndicesCard";
import { AllocationCard } from "./AllocationCard";
import { ReturnsCard } from "./ReturnsCard";
import { WatchlistCard, type WatchItem } from "./WatchlistCard";
import { NewsCard } from "./NewsCard";
import { MoversCard } from "./MoversCard";
import { AddHoldingDialog } from "./AddHoldingDialog";
import { useMarketData } from "@/lib/useMarketData";
import { usePortfolio } from "@/lib/usePortfolio";
import { useAuth } from "../AuthProvider";
import { computeTotals } from "@/lib/portfolio";
import { sampleQuote } from "@/lib/sample-data";
import type { AssetClass, Currency, Holding, Quote } from "@/lib/types";

/** Live quote if we have one, else sample data, else the given fallback price. */
function priceOf(sym: string, quotes: Record<string, Quote>, fallback: number) {
  const q = quotes[sym] ?? sampleQuote(sym);
  return q ? { price: q.price, prev: q.prev, source: q.source } : { price: fallback, prev: fallback, source: "sample" as const };
}

export function Dashboard() {
  const { user, profile, enabled: authEnabled } = useAuth();
  const { positions, watchlist, mode, importable, addHolding, importLocal, dismissImport } = usePortfolio();
  const symbols = useMemo(
    () => [...positions.filter((p) => p.cls !== "cash").map((p) => p.sym), ...watchlist.map((w) => w.sym)],
    [positions, watchlist]
  );
  const { quotes, indices, rates, ratesSource, news, movers, flash } = useMarketData(symbols);

  const [currency, setCurrency] = useState<Currency>(profile?.baseCurrency ?? "USD");
  const [hidden, setHidden] = useState(false);
  const [selectedClass, setSelectedClass] = useState<AssetClass>("us");
  // The sample price alert is only shown in the signed-out demo (real alerts arrive in phase 8)
  const [showAlert, setShowAlert] = useState(!user);
  const [notifCount, setNotifCount] = useState(user ? 0 : 3);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const holdings: Holding[] = useMemo(
    () =>
      positions.map((p) =>
        p.cls === "cash" ? { ...p, price: 1, prev: 1, source: "live" } : { ...p, ...priceOf(p.sym, quotes, p.cost) }
      ),
    [positions, quotes]
  );
  const watchItems: WatchItem[] = useMemo(
    () => watchlist.map((w) => ({ ...w, ...priceOf(w.sym, quotes, 0) })),
    [watchlist, quotes]
  );
  const totals = useMemo(() => computeTotals(holdings, rates), [holdings, rates]);

  const dismissAlert = () => {
    setShowAlert(false);
    setNotifCount((n) => Math.max(0, n - 1));
  };

  return (
    <div className="app">
      <Header notifCount={notifCount} />

      {authEnabled && !user && (
        <div className="banner">
          <span>You’re viewing a demo portfolio saved in this browser. Sign in to keep your own portfolio on every device.</span>
          <Link href="/login" className="btn primary small">Sign in</Link>
        </div>
      )}
      {importable > 0 && (
        <div className="banner">
          <span>
            You have {importable} item{importable === 1 ? "" : "s"} saved in this browser. Copy them into your account?
          </span>
          <div className="btns">
            <button className="btn primary small" onClick={importLocal}>Import</button>
            <button className="btn outline small" onClick={dismissImport}>No thanks</button>
          </div>
        </div>
      )}

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
          loading={mode === "loading"}
        />
        <IndicesCard indices={indices} />
      </section>

      <section className="row row-mid">
        <AllocationCard totals={totals} currency={currency} rates={rates} hidden={hidden} selected={selectedClass} onSelect={setSelectedClass} />
        <ReturnsCard totals={totals} currency={currency} rates={rates} hidden={hidden} />
        <WatchlistCard items={watchItems} flash={flash} showAlert={showAlert} onDismissAlert={dismissAlert} />
      </section>

      <section className="row row-bottom">
        <NewsCard data={news} />
        <MoversCard data={movers} />
      </section>

      <footer className="foot">
        Prices from Finnhub &amp; CoinGecko, FX from ExchangeRate-API. Items marked “sample” are demo data. Not financial advice.
      </footer>

      <AddHoldingDialog ref={dialogRef} onSave={(sym, qty, cost) => addHolding(sym, qty, cost)} />
    </div>
  );
}
