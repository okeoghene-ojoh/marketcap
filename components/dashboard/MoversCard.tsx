"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { TickerLogo } from "./TickerLogo";
import { money, pct, tone } from "@/lib/format";
import type { Mover } from "@/lib/types";

export function MoversCard({ items }: { items: Mover[] }) {
  const [dir, setDir] = useState<"up" | "down">("up");
  const list = items
    .filter((m) => (dir === "up" ? m.pct > 0 : m.pct < 0))
    .sort((a, b) => (dir === "up" ? b.pct - a.pct : a.pct - b.pct));

  return (
    <article className="card">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="bolt" /></span>Top Movers</div>
        <div className="seg small">
          <button className={`seg-btn ${dir === "up" ? "active" : ""}`} onClick={() => setDir("up")}>Gainers</button>
          <button className={`seg-btn ${dir === "down" ? "active" : ""}`} onClick={() => setDir("down")}>Losers</button>
        </div>
      </div>
      <ul className="movers">
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
