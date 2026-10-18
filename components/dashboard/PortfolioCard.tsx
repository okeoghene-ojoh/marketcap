import { Icon } from "../Icon";
import { money, pct, tone } from "@/lib/format";
import { CURRENCY_SYMBOLS } from "@/lib/sample-data";
import type { PortfolioTotals } from "@/lib/portfolio";
import type { Currency } from "@/lib/types";

const CURRENCIES: Currency[] = ["USD", "NGN", "EUR"];

interface Props {
  totals: PortfolioTotals;
  currency: Currency;
  onCurrency: (c: Currency) => void;
  hidden: boolean;
  onToggleHidden: () => void;
  onAddHolding: () => void;
}

export function PortfolioCard({ totals, currency, onCurrency, hidden, onToggleHidden, onAddHolding }: Props) {
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
            {hidden ? "••••" : `${money(totals.day, currency, { sign: true })} (${pct(totals.dayPct)})`}
          </div>
        </div>
      </div>

      <div className="label mt">Portfolio value</div>
      <div className="balance-row">
        <div className="balance">{hidden ? `${CURRENCY_SYMBOLS[currency]}••••••` : money(totals.value, currency)}</div>
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
