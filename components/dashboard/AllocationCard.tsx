import { Icon } from "../Icon";
import { money, tone } from "@/lib/format";
import { CLASSES } from "@/lib/sample-data";
import type { PortfolioTotals } from "@/lib/portfolio";
import type { AssetClass, Currency } from "@/lib/types";

const R = 80;
const C = 2 * Math.PI * R;
const GAP = 14;

interface Props {
  totals: PortfolioTotals;
  currency: Currency;
  hidden: boolean;
  selected: AssetClass;
  onSelect: (k: AssetClass) => void;
}

export function AllocationCard({ totals, currency, hidden, selected, onSelect }: Props) {
  const keys = (Object.keys(CLASSES) as AssetClass[]).filter((k) => (totals.byClass[k] ?? 0) > 0);

  let offset = 0;
  const segments = keys.map((k) => {
    const frac = (totals.byClass[k] ?? 0) / totals.value;
    const len = Math.max(frac * C - GAP, 2);
    const seg = { k, len, offset };
    offset += frac * C;
    return seg;
  });

  const selValue = totals.byClass[selected] ?? 0;

  // Best performing (non-cash) class today
  const best = keys
    .filter((k) => k !== "cash")
    .map((k) => [k, totals.dayPctByClass[k] ?? 0] as const)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <article className="card">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="pie" /></span>Allocation</div>
        <span className="pill">All assets</span>
      </div>

      <div className="donut-wrap">
        <svg className="donut" viewBox="0 0 200 200">
          {segments.map(({ k, len, offset }) => (
            <circle
              key={k}
              cx={100} cy={100} r={R}
              stroke={CLASSES[k].color}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              className={k === selected ? "" : "dim"}
              onClick={() => onSelect(k)}
            />
          ))}
        </svg>
        <div className="donut-center">
          <div className="donut-val">{hidden ? "••••" : money(selValue, currency, { digits: 0 })}</div>
          <div className="donut-sub">{CLASSES[selected].name} · {((selValue / totals.value) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {best && (
        <div className="insight">
          <Icon name="sparkle" size="sm" />
          {CLASSES[best[0]].name} is {best[1] >= 0 ? "up" : "down"}{" "}
          <b className={tone(best[1])}>{Math.abs(best[1]).toFixed(1)}%</b> today
        </div>
      )}

      <div className="legend">
        {keys.map((k) => (
          <button key={k} className={k === selected ? "active" : ""} onClick={() => onSelect(k)}>
            <span className="swatch" style={{ background: CLASSES[k].color }} />
            {CLASSES[k].name} {hidden ? "" : money(totals.byClass[k] ?? 0, currency, { digits: 0 })}
          </button>
        ))}
      </div>
    </article>
  );
}
