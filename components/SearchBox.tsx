"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import type { SearchResult } from "@/lib/types";

const TICKER_RE = /^[A-Za-z0-9.\-]{1,12}$/;

interface Props {
  /** Called with the chosen result instead of opening its quote page */
  onPick?: (result: SearchResult) => void;
  placeholder?: string;
  /** Always expanded, for use inside a card rather than the header */
  inline?: boolean;
}

/** Search field with autocomplete; picking a result opens its quote page (or calls `onPick`). */
export function SearchBox({ onPick, placeholder = "Search stocks & crypto…", inline = false }: Props = {}) {
  const listId = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced lookup; ignores responses for out-of-date queries
  useEffect(() => {
    const query = q.trim();
    if (!query) { setResults([]); setLoading(false); return; }
    setLoading(true);
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data: { results: SearchResult[] } = res.ok ? await res.json() : { results: [] };
        if (!stale) { setResults(data.results); setActive(0); }
      } finally {
        if (!stale) setLoading(false);
      }
    }, 250);
    return () => { stale = true; clearTimeout(t); };
  }, [q]);

  // Close when clicking outside; "/" opens search from anywhere
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if (e.key === "/" && !typing && !inline) {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [inline]);

  const go = (result: SearchResult) => {
    setOpen(false);
    setQ("");
    setResults([]);
    if (onPick) onPick({ ...result, symbol: result.symbol.toUpperCase() });
    else router.push(`/quote/${encodeURIComponent(result.symbol.toUpperCase())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    else if (e.key === "Enter") {
      if (results[active]) go(results[active]);
      else if (TICKER_RE.test(q.trim())) go({ symbol: q.trim(), name: "", type: "" });
    }
  };

  const showList = open && q.trim().length > 0;

  return (
    <div ref={wrapRef} className={`search ${open || inline ? "open" : ""} ${inline ? "inline" : ""}`}>
      <input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        aria-label="Search stocks and crypto"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <button
        className="icon-btn"
        aria-label="Search"
        onClick={() => {
          setOpen(!open);
          if (!open) inputRef.current?.focus();
        }}
      >
        <Icon name="search" />
      </button>

      {showList && (
        <ul className="search-results" id={listId} role="listbox">
          {loading && results.length === 0 && <li className="search-empty">Searching…</li>}
          {!loading && results.length === 0 && <li className="search-empty">No matches for “{q.trim()}”</li>}
          {results.map((r, i) => (
            <li
              key={`${r.symbol}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); go(r); }}
            >
              <span className="search-sym">{r.symbol}</span>
              <span className="search-name">{r.name}</span>
              <span className="tag">{r.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
