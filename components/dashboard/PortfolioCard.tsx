import { Icon } from "../Icon";
import { money, pct, tone } from "@/lib/format";
import { CURRENCY_SYMBOLS } from "@/lib/sample-data";
import type { PortfolioTotals } from "@/lib/portfolio";
import type { Currency, DataSource, Rates } from "@/lib/types";

const CURRENCIES: Currency[] = ["USD", "NGN", "EUR"];

interface Props {
  totals: PortfolioTotals;
  currency: Currency;
  rates: Rates;
  ratesSource: DataSource;
  onCurrency: (c: Currency) => void;
  hidden: boolean;
  onToggleHidden: () => void;
  onAddHolding: () => void;
  /** account data still loading */
  loading?: boolean;
}

export function PortfolioCard({ totals, currency, rates, ratesSource, onCurrency, hidden, onToggleHidden, onAddHolding, loading }: Props) {
  const masked = hidden || loading;
  return (
    <article className="card hero">
      <div className="hero-head">
        <div className="seg" role="tablist" aria-label="Currency">
          {CURRENCIES.map((c) => (
            <button key={c} className={`seg-btn ${c === currency ? "active" : ""}`} onClick={() => onCurrency(c)}>
              <span className="flag">{CURRENCY_SYMBOLS[c]}</span>
              {c}
            </button>
          ))}
        </div>
        <div className="day-change">
          <div className="label">Today&apos;s change</div>
          <div className={`value ${tone(totals.day)}`}>
            {masked ? "••••" : `${money(totals.day, currency, { rates, sign: true })} (${pct(totals.dayPct)})`}
          </div>
        </div>
      </div>

      <div className="label mt">
        Portfolio value
        {currency !== "USD" && (
          <span className="rate-note">
            {" "}· $1 = {CURRENCY_SYMBOLS[currency]}{rates[currency].toLocaleString("en-US", { maximumFractionDigits: 2 })}
            {ratesSource === "sample" ? " (sample rate)" : ""}
          </span>
        )}
      </div>
      <div className="balance-row">
        <div className="balance">
          {loading ? <span className="loading-text">Loading…</span> : hidden ? `${CURRENCY_SYMBOLS[currency]}••••••` : money(totals.value, currency, { rates })}
        </div>
        <button className="icon-btn soft" aria-label={hidden ? "Show balance" : "Hide balance"} onClick={onToggleHidden}>
          <Icon name={hidden ? "eye-off" : "eye"} />
        </button>
      </div>

      <div className="hero-foot">
        <div className="btns">
          <button className="btn primary" onClick={onAddHolding}><Icon name="plus" size="sm" />Add Holding</button>
          <button className="btn outline"><Icon name="star" size="sm" />Add to Watchlist</button>
          <button className="icon-btn ghost" aria-label="More"><Icon name="more" /></button>
        </div>
        <button className="fab" aria-label="Open portfolio"><Icon name="arrow" size="lg" /></button>
      </div>
    </article>
  );
}
