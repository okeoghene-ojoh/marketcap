import { Icon } from "../Icon";
import { money, pct, tone } from "@/lib/format";
import { CLASSES, RETURN_GOAL_USD } from "@/lib/sample-data";
import type { PortfolioTotals } from "@/lib/portfolio";
import type { AssetClass, Currency } from "@/lib/types";

interface Props {
  totals: PortfolioTotals;
  currency: Currency;
  hidden: boolean;
}

export function ReturnsCard({ totals, currency, hidden }: Props) {
  const entries = (Object.entries(totals.gainByClass) as [AssetClass, number][]).filter(([k]) => k !== "cash");
  const maxAbs = Math.max(...entries.map(([, g]) => Math.abs(g)), 1);
  const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0])?.[0];
  const posTotal = entries.reduce((s, [, g]) => s + Math.max(g, 0), 0);
  const goalPct = Math.min(100, Math.max(0, (totals.gain / RETURN_GOAL_USD) * 100));

  return (
    <article className="card">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="trend" /></span>Returns</div>
        <div className="goal">
          <div className="goal-top"><Icon name="target" size="sm" /><span>{money(RETURN_GOAL_USD, currency, { digits: 0 })}</span></div>
          <div className="goal-bar"><span style={{ width: `${goalPct}%` }} /></div>
        </div>
      </div>

      <div className={`big ${totals.gain < 0 ? "neg" : ""}`}>
        {hidden ? "••••" : money(totals.gain, currency, { sign: true })}
      </div>
      <div className="sub-pos"><b className={tone(totals.gainPct)}>{pct(totals.gainPct)}</b> all-time return</div>

      <div className="bars">
        {entries.map(([k, g]) => {
          const w = (Math.abs(g) / maxAbs) * 100;
          const hi = k === top;
          const share = posTotal ? Math.round((Math.max(g, 0) / posTotal) * 100) : 0;
          return (
            <div key={k}>
              <div className={`bar-label ${hi ? "hi" : ""}`}>
                <span>{CLASSES[k].name}</span>
                <span className={g < 0 ? "neg" : ""}>{hidden ? "••••" : money(g, currency, { sign: true })}</span>
              </div>
              <div className="track">
                <div className={`fill ${hi ? "hi" : ""}`} style={{ width: `${w}%` }} />
                {hi && <span className="fill-pill" style={{ left: `${Math.min(Math.max(w * 0.62, 12), 88)}%` }}>{share}%</span>}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
