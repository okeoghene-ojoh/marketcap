"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { changePct, num, pct } from "@/lib/format";
import type { IndexKey, IndexQuote } from "@/lib/types";

function isUSMarketOpen() {
  const ny = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const mins = ny.getHours() * 60 + ny.getMinutes();
  return ny.getDay() >= 1 && ny.getDay() <= 5 && mins >= 570 && mins < 960;
}

export function IndicesCard({ indices }: { indices: Record<IndexKey, IndexQuote> }) {
  // Computed on the client only, so server and browser render the same HTML.
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    setOpen(isUSMarketOpen());
    const id = setInterval(() => setOpen(isUSMarketOpen()), 60000);
    return () => clearInterval(id);
  }, []);

  const spxPct = changePct(indices.spx.price, indices.spx.prev);

  return (
    <article className="card lime">
      <svg className="lime-star" aria-hidden="true"><use href="#i-sparkle" /></svg>
      <div className="lime-head">
        <div className="status-pill">
          <span>{open === null ? "US MARKET" : open ? "US MARKET OPEN" : "US MARKET CLOSED"}</span>
          <span className="status-ic"><Icon name="sparkle" size="sm" /></span>
        </div>
        <button className="icon-btn lime-more" aria-label="More"><Icon name="more" /></button>
      </div>
      <div className="label dark">S&amp;P 500</div>
      <div className="index-row">
        <div className="index-val">{num(indices.spx.price)}</div>
        <span className={`chip ${spxPct < 0 ? "neg" : ""}`}>{pct(spxPct)} today</span>
      </div>
      <div className="tiles">
        <IndexTile label="NASDAQ" quote={indices.ndx} />
        <IndexTile label="NGX ASI" quote={indices.ngx} />
      </div>
    </article>
  );
}

function IndexTile({ label, quote }: { label: string; quote: IndexQuote }) {
  return (
    <div className="tile">
      <div className="tile-top">
        <span>{label}</span>
        <span className="tile-chg">{pct(changePct(quote.price, quote.prev))}</span>
      </div>
      <div className="tile-val"><Icon name="trend" size="sm" /><span>{num(quote.price)}</span></div>
    </div>
  );
}
