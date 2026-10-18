"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { TickerLogo } from "./TickerLogo";
import { money, pct, tone } from "@/lib/format";
import type { MoversResponse } from "@/lib/types";

export function MoversCard({ data }: { data: MoversResponse | null }) {
  const [dir, setDir] = useState<"up" | "down">("up");
  const list = data ? (dir === "up" ? data.gainers : data.losers) : [];

  return (
    <article className="card">
      <div className="card-head">
        <div className="title">
          <span className="title-ic"><Icon name="bolt" /></span>Top Movers
          {data?.source === "sample" && <span className="tag">sample</span>}
        </div>
        <div className="seg small">
          <button className={`seg-btn ${dir === "up" ? "active" : ""}`} onClick={() => setDir("up")}>Gainers</button>
          <button className={`seg-btn ${dir === "down" ? "active" : ""}`} onClick={() => setDir("down")}>Losers</button>
        </div>
      </div>
      <ul className="movers">
        {!data && <li><div className="row-sub">Loading…</div></li>}
        {data && list.length === 0 && <li><div className="row-sub">Nothing {dir === "up" ? "up" : "down"} right now</div></li>}
        {list.map((m) => (
          <li key={m.sym}>
            <TickerLogo sym={m.sym} cur={m.cur} />
            <div>
              <div className="row-title">{m.sym}</div>
              <div className="row-sub">{m.name} · {money(m.price, m.cur ?? "USD", { native: true })}</div>
            </div>
            <span className={`pct-pill ${tone(m.pct)}`}>{pct(m.pct)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
