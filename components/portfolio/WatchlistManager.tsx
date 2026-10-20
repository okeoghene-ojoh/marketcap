"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "../Icon";
import { SearchBox } from "../SearchBox";
import { TickerLogo } from "../dashboard/TickerLogo";
import { changePct, money, pct, tone , sourceNote } from "@/lib/format";
import { priceOf } from "@/lib/portfolio";
import type { Watchlist } from "@/lib/usePortfolio";
import type { Flash, Quote } from "@/lib/types";

interface Props {
  watchlists: Watchlist[];
  quotes: Record<string, Quote>;
  flash: Flash;
  onAdd: (sym: string, name: string, listId: string) => void;
  onRemove: (sym: string, listId: string) => void;
  onCreate: (name: string) => Promise<string | null>;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function WatchlistManager({ watchlists, quotes, flash, onAdd, onRemove, onCreate, onRename, onDelete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [creating, setCreating] = useState(false);

  const list = watchlists.find((w) => w.id === selectedId) ?? watchlists[0];

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name"));
    const id = await onCreate(name);
    setCreating(false);
    if (id) setSelectedId(id);
  }

  function rename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (list) onRename(list.id, String(new FormData(e.currentTarget).get("name")));
    setRenaming(false);
  }

  function remove() {
    if (!list) return;
    if (!window.confirm(`Delete the list “${list.name}” and its ${list.items.length} item(s)?`)) return;
    onDelete(list.id);
    setSelectedId(null);
  }

  return (
    <article className="card" id="watchlists">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="list" /></span>Watchlists</div>
        {!creating && (
          <button className="btn outline small" onClick={() => setCreating(true)}><Icon name="plus" size="sm" />New list</button>
        )}
      </div>

      {creating && (
        <form className="inline-form" onSubmit={create}>
          <input name="name" placeholder="List name, e.g. Tech stocks" maxLength={60} required autoFocus />
          <button className="btn primary small">Create</button>
          <button type="button" className="btn outline small" onClick={() => setCreating(false)}>Cancel</button>
        </form>
      )}

      {watchlists.length > 1 && (
        <div className="seg list-tabs" role="tablist" aria-label="Watchlists">
          {watchlists.map((w) => (
            <button
              key={w.id}
              role="tab"
              aria-selected={w.id === list?.id}
              className={`seg-btn ${w.id === list?.id ? "active" : ""}`}
              onClick={() => { setSelectedId(w.id); setRenaming(false); }}
            >
              {w.name} <span className="count">{w.items.length}</span>
            </button>
          ))}
        </div>
      )}

      {list && (
        <>
          <div className="list-head">
            {renaming ? (
              <form className="inline-form" onSubmit={rename}>
                <input name="name" defaultValue={list.name} maxLength={60} required autoFocus />
                <button className="btn primary small">Save</button>
                <button type="button" className="btn outline small" onClick={() => setRenaming(false)}>Cancel</button>
              </form>
            ) : (
              <>
                <h3>{list.name}</h3>
                <div className="btns">
                  <button className="round" title="Rename list" aria-label="Rename list" onClick={() => setRenaming(true)}>
                    <Icon name="edit" size="sm" />
                  </button>
                  {watchlists.length > 1 && (
                    <button className="round" title="Delete list" aria-label="Delete list" onClick={remove}>
                      <Icon name="trash" size="sm" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <SearchBox
            inline
            placeholder={`Add a stock or coin to “${list.name}”…`}
            onPick={(r) => onAdd(r.symbol, r.name, list.id)}
          />

          <ul className="watch manage">
            {list.items.length === 0 && <li><div className="row-sub">This list is empty. Search above to add something.</div></li>}
            {list.items.map((w) => {
              const p = priceOf(w.sym, quotes, 0);
              const chg = p.prev ? changePct(p.price, p.prev) : 0;
              return (
                <li key={w.sym} className={flash[w.sym] ? `flash-${flash[w.sym]}` : ""}>
                  <Link href={`/quote/${w.sym}`} className="row-link">
                    <TickerLogo sym={w.sym} cur={w.cur} />
                    <div className="meta">
                      <div className="row-title">{w.name}</div>
                      <div className="row-sub">{w.sym}{w.ex ? ` · ${w.ex}` : ""}{sourceNote(p.source)}</div>
                    </div>
                    <div className="num">
                      {p.price ? money(p.price, w.cur, { native: true }) : "—"}
                      <div className={`pct ${tone(chg)}`}>{pct(chg)}</div>
                    </div>
                  </Link>
                  <button className="round" aria-label={`Remove ${w.sym}`} title="Remove" onClick={() => onRemove(w.sym, list.id)}>
                    <Icon name="x" size="sm" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
