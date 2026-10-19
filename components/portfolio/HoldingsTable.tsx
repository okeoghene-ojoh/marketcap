import Link from "next/link";
import { Icon } from "../Icon";
import { TickerLogo } from "../dashboard/TickerLogo";
import { changePct, money, pct, toUSD, tone } from "@/lib/format";
import type { Currency, Flash, Holding, Rates } from "@/lib/types";

interface Props {
  holdings: Holding[];
  totalValueUSD: number;
  currency: Currency;
  rates: Rates;
  hidden: boolean;
  flash: Flash;
  onEdit: (sym: string) => void;
  onDelete: (sym: string) => void;
}

export function HoldingsTable({ holdings, totalValueUSD, currency, rates, hidden, flash, onEdit, onDelete }: Props) {
  const rows = holdings
    .map((h) => ({ h, valueUSD: toUSD(h.price * h.qty, h.cur, rates) }))
    .sort((a, b) => b.valueUSD - a.valueUSD);

  const native = (v: number, cur: Currency, sign = false) => (hidden ? "••••" : money(v, cur, { native: true, sign }));

  return (
    <div className="table-wrap">
      <table className="holdings">
        <thead>
          <tr>
            <th>Asset</th>
            <th className="num">Shares</th>
            <th className="num">Avg. cost</th>
            <th className="num">Price</th>
            <th className="num">Today</th>
            <th className="num">Value</th>
            <th className="num">Total gain</th>
            <th className="num">Weight</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ h, valueUSD }) => {
            const isCash = h.cls === "cash";
            const day = changePct(h.price, h.prev);
            const gain = (h.price - h.cost) * h.qty;
            const gainPct = h.cost ? ((h.price - h.cost) / h.cost) * 100 : 0;
            return (
              <tr key={h.sym} className={flash[h.sym] ? `flash-${flash[h.sym]}` : ""}>
                <td>
                  {isCash ? (
                    <div className="asset"><span className="logo">$</span><div><div className="row-title">Cash</div></div></div>
                  ) : (
                    <Link href={`/quote/${h.sym}`} className="asset">
                      <TickerLogo sym={h.sym} cur={h.cur} />
                      <div>
                        <div className="row-title">{h.sym}</div>
                        <div className="row-sub">{h.name}{h.source === "sample" ? " · sample" : ""}</div>
                      </div>
                    </Link>
                  )}
                </td>
                <td className="num">{isCash ? "—" : hidden ? "••" : h.qty.toLocaleString("en-US", { maximumFractionDigits: 6 })}</td>
                <td className="num">{isCash ? "—" : native(h.cost, h.cur)}</td>
                <td className="num">{isCash ? "—" : money(h.price, h.cur, { native: true })}</td>
                <td className={`num ${isCash ? "" : tone(day)}`}>{isCash ? "—" : pct(day)}</td>
                <td className="num strong">{hidden ? "••••" : money(valueUSD, currency, { rates })}</td>
                <td className={`num ${isCash ? "" : tone(gain)}`}>
                  {isCash ? "—" : <>{native(gain, h.cur, true)}<div className="row-sub">{pct(gainPct)}</div></>}
                </td>
                <td className="num">{totalValueUSD ? `${((valueUSD / totalValueUSD) * 100).toFixed(1)}%` : "—"}</td>
                <td className="actions-cell">
                  <button className="round" aria-label={`Edit ${h.sym}`} title="Edit" onClick={() => onEdit(h.sym)}>
                    <Icon name="edit" size="sm" />
                  </button>
                  <button className="round" aria-label={`Delete ${h.sym}`} title="Delete" onClick={() => onDelete(h.sym)}>
                    <Icon name="trash" size="sm" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
