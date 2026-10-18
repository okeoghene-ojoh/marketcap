import { Icon } from "../Icon";
import { TickerLogo } from "./TickerLogo";
import { changePct, money, pct, tone } from "@/lib/format";
import type { Flash, Holding } from "@/lib/types";

interface Props {
  items: Holding[];
  query: string;
  flash: Flash;
  showAlert: boolean;
  onDismissAlert: () => void;
}

export function WatchlistCard({ items, query, flash, showAlert, onDismissAlert }: Props) {
  const q = query.trim().toUpperCase();
  const rows = items.filter((h) => !q || h.sym.includes(q) || h.name.toUpperCase().includes(q));

  return (
    <article className="card">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="list" /></span>Watchlist</div>
        <button className="icon-btn soft" aria-label="More"><Icon name="more" /></button>
      </div>

      {showAlert && (
        <div className="alert-row">
          <span className="logo dark-logo"><Icon name="bolt" size="sm" /></span>
          <div className="alert-text">
            <div className="row-title">NVDA crossed $135.00</div>
            <div className="alert-sub">Price alert triggered</div>
          </div>
          <button className="round ok" aria-label="Acknowledge" onClick={onDismissAlert}><Icon name="check" size="sm" /></button>
          <button className="round" aria-label="Dismiss" onClick={onDismissAlert}><Icon name="x" size="sm" /></button>
        </div>
      )}

      <ul className="watch">
        {rows.length === 0 && <li><div className="row-sub">No matches for “{query}”</div></li>}
        {rows.map((h) => {
          const p = changePct(h.price, h.prev);
          // Keying on the flash direction restarts the CSS animation on each tick
          return (
            <li key={`${h.sym}-${flash[h.sym] ?? ""}-${h.price}`} className={flash[h.sym] ? `flash-${flash[h.sym]}` : ""}>
              <TickerLogo sym={h.sym} cur={h.cur} />
              <div className="meta">
                <div className="row-title">{h.name}</div>
                <div className="row-sub">
                  {h.sym}{h.ex ? ` · ${h.ex}` : ""}{h.cur === "NGN" ? " · delayed" : ""}
                </div>
              </div>
              <div className="num">
                {money(h.price, h.cur, { native: true })}
                <div className={`pct ${tone(p)}`}>{pct(p)}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
