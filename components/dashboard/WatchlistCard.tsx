import Link from "next/link";
import { Icon } from "../Icon";
import { TickerLogo } from "./TickerLogo";
import { changePct, money, pct, tone } from "@/lib/format";
import type { WatchEntry } from "@/lib/usePortfolio";
import type { DataSource, Flash } from "@/lib/types";

export type WatchItem = WatchEntry & { price: number; prev: number; source: DataSource };

interface Props {
  items: WatchItem[];
  flash: Flash;
  showAlert: boolean;
  onDismissAlert: () => void;
}

export function WatchlistCard({ items, flash, showAlert, onDismissAlert }: Props) {
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
            <div className="alert-sub">Price alert triggered (sample)</div>
          </div>
          <button className="round ok" aria-label="Acknowledge" onClick={onDismissAlert}><Icon name="check" size="sm" /></button>
          <button className="round" aria-label="Dismiss" onClick={onDismissAlert}><Icon name="x" size="sm" /></button>
        </div>
      )}

      <ul className="watch">
        {items.length === 0 && <li><div className="row-sub">Search for a stock and tap “Add to Watchlist”.</div></li>}
        {items.map((h) => {
          const p = h.prev ? changePct(h.price, h.prev) : 0;
          return (
            // Keying on the price restarts the flash animation on each move
            <li key={`${h.sym}-${h.price}`} className={flash[h.sym] ? `flash-${flash[h.sym]}` : ""}>
              <Link href={`/quote/${h.sym}`} className="row-link">
                <TickerLogo sym={h.sym} cur={h.cur} />
                <div className="meta">
                  <div className="row-title">{h.name}</div>
                  <div className="row-sub">
                    {h.sym}{h.ex ? ` · ${h.ex}` : ""}{h.source === "sample" ? " · sample" : ""}
                  </div>
                </div>
                <div className="num">
                  {h.price ? money(h.price, h.cur, { native: true }) : "—"}
                  <div className={`pct ${tone(p)}`}>{pct(p)}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
