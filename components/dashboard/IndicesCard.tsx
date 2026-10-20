"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { changePct, num, pct , sourceNote } from "@/lib/format";
import { INDEX_SYMBOLS } from "@/lib/sample-data";
import { isUSMarketOpen } from "@/lib/marketHours";
import type { IndexKey, Quote } from "@/lib/types";

export function IndicesCard({ indices }: { indices: Record<IndexKey, Quote | null> }) {
  // Computed on the client only, so server and browser render the same HTML.
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    setOpen(isUSMarketOpen());
    const id = setInterval(() => setOpen(isUSMarketOpen()), 60000);
    return () => clearInterval(id);
  }, []);

  const spx = indices.spx;
  const spxPct = spx ? changePct(spx.price, spx.prev) : 0;

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
      <div className="label dark">
        {INDEX_SYMBOLS.spx.label}{sourceNote(spx?.source)}
      </div>
      <div className="index-row">
        <div className="index-val">{spx ? num(spx.price) : "—"}</div>
        {spx && <span className={`chip ${spxPct < 0 ? "neg" : ""}`}>{pct(spxPct)} today</span>}
      </div>
      <div className="tiles">
        <IndexTile label={INDEX_SYMBOLS.ndx.label} quote={indices.ndx} />
        <IndexTile label={INDEX_SYMBOLS.ngx.label} quote={indices.ngx} />
      </div>
    </article>
  );
}

function IndexTile({ label, quote }: { label: string; quote: Quote | null }) {
  return (
    <div className="tile">
      <div className="tile-top">
        <span>{label}{sourceNote(quote?.source)}</span>
        {quote && <span className="tile-chg">{pct(changePct(quote.price, quote.prev))}</span>}
      </div>
      <div className="tile-val"><Icon name="trend" size="sm" /><span>{quote ? num(quote.price) : "—"}</span></div>
    </div>
  );
}
