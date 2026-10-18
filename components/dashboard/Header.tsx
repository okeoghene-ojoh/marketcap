"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { ThemeToggle } from "../ThemeToggle";

const TABS = ["Overview", "Markets", "Portfolio", "News"];

interface Props {
  name: string;
  query: string;
  onQuery: (q: string) => void;
  notifCount: number;
}

export function Header({ name, query, onQuery, notifCount }: Props) {
  const [tab, setTab] = useState("Overview");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="hello">
        <div className="avatar" aria-hidden="true">{name[0]}</div>
        <div>
          <div className="brand">Marketcap</div>
          <h1>Hello, {name}</h1>
        </div>
      </div>

      <nav className="tabs" aria-label="Main">
        {TABS.map((t) => (
          <button key={t} className={`tab ${t === tab ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      <div className="actions">
        <div className={`search ${searchOpen ? "open" : ""}`}>
          <input
            type="search"
            placeholder="Search tickers…"
            aria-label="Search tickers"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            ref={(el) => { if (searchOpen) el?.focus(); }}
          />
          <button
            className="icon-btn"
            aria-label="Search"
            onClick={() => {
              if (searchOpen) onQuery("");
              setSearchOpen(!searchOpen);
            }}
          >
            <Icon name="search" />
          </button>
        </div>
        <ThemeToggle />
        <button className="pill-btn" aria-label="Notifications">
          <span className="bell">
            <Icon name="bell" />
            {notifCount > 0 && <span className="dot" />}
          </span>
          <span>{notifCount}</span>
        </button>
      </div>
    </header>
  );
}
