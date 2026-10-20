"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Header } from "../dashboard/Header";
import { SearchBox } from "../SearchBox";
import { TickerLogo } from "../dashboard/TickerLogo";
import { Icon } from "../Icon";
import { useAuth } from "../AuthProvider";
import { useQuotes } from "@/lib/useMarketData";
import { usePaper, type PaperPosition } from "@/lib/usePaper";
import { NGX_SYMBOLS, SYMBOL_NAMES } from "@/lib/sample-data";
import { money, pct, tone } from "@/lib/format";

// Money amounts (values, totals, gains): whole cents, so rounding crumbs never show as "−$0.0001"
const usd = (v: number, sign = false) => money(Math.round(v * 100) / 100 || 0, "USD", { native: true, sign, digits: 2 });
// Prices: extra decimals for coins under $1 (e.g. DOGE)
const usdPrice = (v: number) => money(v, "USD", { native: true });
const shares = (q: number) => q.toLocaleString("en-US", { maximumFractionDigits: 6 });

export function PracticeView({ initialSymbol }: { initialSymbol?: string }) {
  const { user, enabled: authEnabled } = useAuth();
  const paper = usePaper();
  const [pick, setPick] = useState<{ symbol: string; name: string } | null>(
    initialSymbol ? { symbol: initialSymbol, name: SYMBOL_NAMES[initialSymbol] ?? initialSymbol } : null
  );

  const symbols = useMemo(() => [...paper.positions.map((p) => p.symbol), ...(pick ? [pick.symbol] : [])], [paper.positions, pick]);
  const { quotes, flash } = useQuotes(symbols);

  const invested = paper.positions.reduce((s, p) => s + p.qty * (quotes[p.symbol]?.price ?? p.avgCost), 0);
  const value = paper.cash + invested;
  const ret = value - paper.startingCash;

  if (!authEnabled || !user) {
    return (
      <div className="app">
        <Header />
        <article className="card not-found">
          <h2>Practice trading</h2>
          <p className="row-sub">
            Trade real stocks and crypto at live prices with <b>$100,000 of pretend money</b>. No risk, no real money.
          </p>
          {authEnabled && <Link href="/login" className="btn primary">Sign in to start</Link>}
        </article>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      {paper.ready === false && (
        <div className="banner"><span>Practice trading isn&apos;t switched on yet. The site owner needs to run the paper-trading database setup.</span></div>
      )}

      <section className="card portfolio-summary">
        <div className="card-head">
          <div className="title"><span className="title-ic"><Icon name="target" /></span>Practice account</div>
          <span className="pill">Pretend money · real prices</span>
        </div>
        <div className="summary-grid">
          <div><div className="label">Account value</div><div className="summary-val">{usd(value)}</div></div>
          <div>
            <div className="label">Total return</div>
            <div className={`summary-val ${tone(ret)}`}>{usd(ret, true)} <small>{pct((ret / paper.startingCash) * 100)}</small></div>
          </div>
          <div><div className="label">Cash</div><div className="summary-val">{usd(paper.cash)}</div></div>
          <div><div className="label">Invested</div><div className="summary-val">{usd(invested)}</div></div>
        </div>
      </section>

      <section className="row practice-row">
        <TradeTicket
          pick={pick}
          onPick={setPick}
          price={pick ? quotes[pick.symbol] : undefined}
          owned={paper.positions.find((p) => p.symbol === pick?.symbol)?.qty ?? 0}
          cash={paper.cash}
          onTrade={paper.trade}
        />

        <article className="card">
          <div className="card-head"><div className="title"><span className="title-ic"><Icon name="pie" /></span>Positions</div></div>
          {paper.positions.length === 0 ? (
            <p className="row-sub empty-hint">No positions yet. Search for a stock or coin and place your first trade.</p>
          ) : (
            <div className="table-wrap">
              <table className="holdings practice-table">
                <thead><tr><th>Asset</th><th className="num">Shares</th><th className="num">Avg. cost</th><th className="num">Price</th><th className="num">Value</th><th className="num">Gain</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {paper.positions.map((p) => (
                    <PositionRow key={p.symbol} p={p} price={quotes[p.symbol]?.price} flash={flash[p.symbol]} onSell={() => setPick({ symbol: p.symbol, name: p.name })} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="card">
        <div className="card-head">
          <div className="title"><span className="title-ic"><Icon name="list" /></span>Trade history</div>
          <button
            className="btn outline small"
            onClick={async () => {
              if (window.confirm("Reset your practice account? This clears all positions and history and starts again with $100,000.")) await paper.reset();
            }}
          >
            Reset account
          </button>
        </div>
        {paper.trades.length === 0 ? (
          <p className="row-sub empty-hint">Your trades will appear here.</p>
        ) : (
          <div className="table-wrap">
            <table className="holdings">
              <thead><tr><th>Date</th><th>Trade</th><th className="num">Shares</th><th className="num">Price</th><th className="num">Total</th><th className="num">Profit / loss</th></tr></thead>
              <tbody>
                {paper.trades.map((t) => (
                  <tr key={t.id}>
                    <td className="row-sub">{new Date(t.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                    <td><span className={`side-badge ${t.side}`}>{t.side === "buy" ? "Buy" : "Sell"}</span> <Link href={`/quote/${t.symbol}`} className="row-link-inline"><b>{t.symbol}</b></Link></td>
                    <td className="num">{shares(t.qty)}</td>
                    <td className="num">{usdPrice(t.price)}</td>
                    <td className="num">{usd(t.qty * t.price)}</td>
                    <td className={`num ${t.realized === null ? "" : tone(t.realized)}`}>{t.realized === null ? "—" : usd(t.realized, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {paper.startedAt && <p className="row-sub">Account started {new Date(paper.startedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}.</p>}
      </section>

      <footer className="foot">Practice trades use pretend money at live prices, filled instantly at the last price, with no fees. Not financial advice.</footer>
    </div>
  );
}

function PositionRow({ p, price, flash, onSell }: { p: PaperPosition; price?: number; flash?: "up" | "down"; onSell: () => void }) {
  const now = price ?? p.avgCost;
  const gain = (now - p.avgCost) * p.qty;
  return (
    <tr className={flash ? `flash-${flash}` : ""}>
      <td>
        <Link href={`/quote/${p.symbol}`} className="asset">
          <TickerLogo sym={p.symbol} />
          <div><div className="row-title">{p.symbol}</div><div className="row-sub">{p.name}</div></div>
        </Link>
      </td>
      <td className="num">{shares(p.qty)}</td>
      <td className="num">{usdPrice(p.avgCost)}</td>
      <td className="num">{price ? usdPrice(price) : "—"}</td>
      <td className="num strong">{usd(now * p.qty)}</td>
      <td className={`num ${tone(gain)}`}>{usd(gain, true)}<div className="row-sub">{pct(((now - p.avgCost) / p.avgCost) * 100)}</div></td>
      <td className="actions-cell"><button className="btn outline small" onClick={onSell}>Trade</button></td>
    </tr>
  );
}

interface TicketProps {
  pick: { symbol: string; name: string } | null;
  onPick: (p: { symbol: string; name: string } | null) => void;
  price?: { price: number; changePct: number; source: string };
  owned: number;
  cash: number;
  onTrade: (o: { symbol: string; side: "buy" | "sell"; qty?: number; amount?: number; name?: string }) => Promise<string | null>;
}

function TradeTicket({ pick, onPick, price, owned, cash, onTrade }: TicketProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [mode, setMode] = useState<"amount" | "qty">("amount");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const n = parseFloat(value);
  const live = price?.source === "live";
  const blocked = pick && NGX_SYMBOLS.includes(pick.symbol);
  const qty = price && n > 0 ? (mode === "qty" ? n : n / price.price) : 0;
  const total = price && n > 0 ? (mode === "qty" ? n * price.price : n) : 0;
  const problem =
    !pick ? null
    : blocked ? "NGX prices are sample data, so they can't be traded yet."
    : !price ? "Getting the live price…"
    : !live ? "No live price right now, so trading is paused for this symbol."
    : side === "buy" && total > cash ? `That's more than your ${usd(cash)} of cash.`
    : side === "sell" && qty > owned + 1e-9 ? `You own ${shares(owned)}.`
    : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pick || problem || !(n > 0)) return;
    setBusy(true);
    setMsg(null);
    const err = await onTrade({ symbol: pick.symbol, name: pick.name, side, ...(mode === "qty" ? { qty: n } : { amount: n }) });
    setBusy(false);
    if (err) return setMsg({ ok: false, text: err });
    setMsg({ ok: true, text: `${side === "buy" ? "Bought" : "Sold"} about ${shares(Math.floor(qty * 1e6) / 1e6)} ${pick.symbol} for about ${usd(total)}.` });
    setValue("");
  }

  return (
    <article className="card ticket">
      <div className="card-head"><div className="title"><span className="title-ic"><Icon name="bolt" /></span>Place a trade</div></div>

      {!pick ? (
        <SearchBox inline placeholder="Search a stock or coin to trade…" onPick={(r) => { onPick({ symbol: r.symbol, name: r.name || r.symbol }); setMsg(null); }} />
      ) : (
        <div className="ticket-pick">
          <TickerLogo sym={pick.symbol} />
          <div className="meta">
            <div className="row-title">{pick.symbol}</div>
            <div className="row-sub">{pick.name}</div>
          </div>
          <div className="num">
            {price ? usdPrice(price.price) : "…"}
            {price && <div className={`pct ${tone(price.changePct)}`}>{pct(price.changePct)}</div>}
          </div>
          <button className="chip-x" aria-label="Choose another" onClick={() => { onPick(null); setValue(""); setMsg(null); }}><Icon name="x" size="sm" /></button>
        </div>
      )}

      <form className="auth-form" onSubmit={submit}>
        <div className="seg ticket-seg" role="tablist" aria-label="Buy or sell">
          <button type="button" className={`seg-btn ${side === "buy" ? "active" : ""}`} onClick={() => setSide("buy")}>Buy</button>
          <button type="button" className={`seg-btn ${side === "sell" ? "active" : ""}`} onClick={() => setSide("sell")}>Sell</button>
        </div>
        <div className="seg small ticket-seg" role="tablist" aria-label="Enter shares or dollars">
          <button type="button" className={`seg-btn ${mode === "amount" ? "active" : ""}`} onClick={() => setMode("amount")}>Dollars</button>
          <button type="button" className={`seg-btn ${mode === "qty" ? "active" : ""}`} onClick={() => setMode("qty")}>Shares</button>
        </div>
        <label>
          {mode === "amount" ? "Amount (USD)" : "Number of shares"}
          <input type="number" step="any" min="0" inputMode="decimal" value={value} placeholder={mode === "amount" ? "1000" : "5"} onChange={(e) => { setValue(e.target.value); setMsg(null); }} />
        </label>
        {side === "sell" && owned > 0 && (
          <button type="button" className="link-btn" onClick={() => { setMode("qty"); setValue(String(owned)); }}>Sell all {shares(owned)}</button>
        )}
        {pick && price && n > 0 && !problem && (
          <p className="row-sub ticket-est">
            ≈ {shares(Math.floor(qty * 1e6) / 1e6)} {pick.symbol} for {usd(total)} · cash after: {usd(side === "buy" ? cash - total : cash + total)}
          </p>
        )}
        {problem && <p className="auth-error">{problem}</p>}
        {msg && <p className={msg.ok ? "auth-notice" : "auth-error"} role="status">{msg.text}</p>}
        <button className={`btn ${side === "buy" ? "primary" : "danger"} auth-submit`} disabled={busy || !pick || Boolean(problem) || !(n > 0)}>
          {busy ? "Placing…" : side === "buy" ? "Buy" : "Sell"}
        </button>
      </form>
    </article>
  );
}
