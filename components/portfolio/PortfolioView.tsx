"use client";

import { useMemo, useRef, useState } from "react";
import { Header } from "../dashboard/Header";
import { AddHoldingDialog } from "../dashboard/AddHoldingDialog";
import { useAuth } from "../AuthProvider";
import { Icon } from "../Icon";
import { HoldingsTable } from "./HoldingsTable";
import { EditHoldingDialog } from "./EditHoldingDialog";
import { WatchlistManager } from "./WatchlistManager";
import { CsvTools } from "./CsvTools";
import { ValueChart } from "./ValueChart";
import { AlertsManager } from "../alerts/AlertsManager";
import { useQuotes, useRates } from "@/lib/useMarketData";
import { usePortfolio } from "@/lib/usePortfolio";
import { computeTotals, priceHoldings } from "@/lib/portfolio";
import { money, pct, tone } from "@/lib/format";
import { CURRENCY_SYMBOLS } from "@/lib/sample-data";
import type { Currency } from "@/lib/types";

const CURRENCIES: Currency[] = ["USD", "NGN", "EUR"];

export function PortfolioView() {
  const { user, profile, enabled: authEnabled } = useAuth();
  const p = usePortfolio();
  const [currency, setCurrency] = useState<Currency>(profile?.baseCurrency ?? "USD");
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const addRef = useRef<HTMLDialogElement>(null);
  const editRef = useRef<HTMLDialogElement>(null);

  const symbols = useMemo(
    () => [
      ...p.positions.filter((x) => x.cls !== "cash").map((x) => x.sym),
      ...p.watchlists.flatMap((w) => w.items.map((i) => i.sym)),
    ],
    [p.positions, p.watchlists]
  );
  const { quotes, flash } = useQuotes(symbols);
  const { rates } = useRates();
  const holdings = useMemo(() => priceHoldings(p.positions, quotes), [p.positions, quotes]);
  const totals = useMemo(() => computeTotals(holdings, rates), [holdings, rates]);
  const loading = p.mode === "loading";
  const m = (usd: number, sign = false) => (hidden || loading ? "••••" : money(usd, currency, { rates, sign }));

  const startEdit = (sym: string) => {
    setEditing(sym);
    // Open after React renders the form for this holding
    requestAnimationFrame(() => editRef.current?.showModal());
  };
  const confirmDelete = (sym: string) => {
    const label = sym === "CASH" ? "your cash balance" : sym;
    if (window.confirm(`Remove ${label} from your portfolio?`)) p.removeHolding(sym);
  };

  return (
    <div className="app">
      <Header />

      {authEnabled && !user && (
        <div className="banner">
          <span>Changes are saved in this browser only. Sign in to keep your portfolio on every device.</span>
        </div>
      )}

      <section className="card portfolio-summary">
        <div className="card-head">
          <div className="title">Your portfolio</div>
          <div className="btns">
            <div className="seg small" role="tablist" aria-label="Currency">
              {CURRENCIES.map((c) => (
                <button key={c} className={`seg-btn ${c === currency ? "active" : ""}`} onClick={() => setCurrency(c)}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </button>
              ))}
            </div>
            <button className="icon-btn soft" aria-label={hidden ? "Show values" : "Hide values"} onClick={() => setHidden(!hidden)}>
              <Icon name={hidden ? "eye-off" : "eye"} />
            </button>
          </div>
        </div>
        <div className="summary-grid">
          <div><div className="label">Total value</div><div className="summary-val">{m(totals.value)}</div></div>
          <div>
            <div className="label">Today</div>
            <div className={`summary-val ${tone(totals.day)}`}>{m(totals.day, true)} <small>{loading ? "" : pct(totals.dayPct)}</small></div>
          </div>
          <div>
            <div className="label">Total gain</div>
            <div className={`summary-val ${tone(totals.gain)}`}>{m(totals.gain, true)} <small>{loading ? "" : pct(totals.gainPct)}</small></div>
          </div>
          <div><div className="label">Holdings</div><div className="summary-val">{loading ? "—" : p.positions.length}</div></div>
        </div>
        {!loading && holdings.length > 0 && <ValueChart holdings={holdings} rates={rates} currency={currency} hidden={hidden} />}
      </section>

      <section className="card">
        <div className="card-head">
          <div className="title"><span className="title-ic"><Icon name="pie" /></span>Holdings</div>
          <div className="btns">
            {!loading && <CsvTools positions={p.positions} onImport={(h) => p.addHolding(h.symbol, h.qty, h.cost, h.name)} />}
            <button className="btn primary small" onClick={() => addRef.current?.showModal()}>
              <Icon name="plus" size="sm" />Add holding
            </button>
          </div>
        </div>
        {loading ? (
          <p className="row-sub">Loading your portfolio…</p>
        ) : holdings.length === 0 ? (
          <p className="row-sub empty-hint">No holdings yet. Click <b>Add holding</b>, or open any stock and use its Add Holding button.</p>
        ) : (
          <HoldingsTable
            holdings={holdings}
            totalValueUSD={totals.value}
            currency={currency}
            rates={rates}
            hidden={hidden}
            flash={flash}
            onEdit={startEdit}
            onDelete={confirmDelete}
          />
        )}
      </section>

      {!loading && (
        <WatchlistManager
          watchlists={p.watchlists}
          quotes={quotes}
          flash={flash}
          onAdd={(sym, name, listId) => p.addToWatchlist(sym, name, undefined, listId)}
          onRemove={(sym, listId) => p.removeFromWatchlist(sym, listId)}
          onCreate={p.createWatchlist}
          onRename={p.renameWatchlist}
          onDelete={p.deleteWatchlist}
        />
      )}

      <AlertsManager />

      <footer className="foot">Values use live prices where available; gains use today’s exchange rates. Not financial advice.</footer>

      <AddHoldingDialog ref={addRef} onSave={(sym, qty, cost) => p.addHolding(sym, qty, cost)} />
      <EditHoldingDialog
        ref={editRef}
        position={p.positions.find((x) => x.sym === editing) ?? null}
        onSave={(sym, changes) => p.updateHolding(sym, changes)}
      />
    </div>
  );
}
