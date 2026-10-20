"use client";

import { useRef, useState } from "react";
import { readHoldings, toCsv, type ImportResult } from "@/lib/csv";
import type { Position } from "@/lib/usePortfolio";

interface Props {
  positions: Position[];
  onImport: (h: { symbol: string; qty: number; cost: number; name?: string }) => Promise<void>;
}

/** Export holdings to a CSV file, or import them from one (with a preview first). */
export function CsvTools({ positions, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  function exportCsv() {
    const rows = [
      ["symbol", "name", "shares", "avg_cost", "currency", "buy_date"],
      ...positions.map((p) => [p.sym, p.name, p.qty, p.cost, p.cur, p.date ?? ""]),
    ];
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `marketcap-holdings-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function pickFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) {
      setResult({ holdings: [], errors: ["That file is over 1 MB. Export just your holdings and try again."] });
    } else {
      setResult(readHoldings(await file.text()));
    }
    dialogRef.current?.showModal();
    if (fileRef.current) fileRef.current.value = ""; // allow picking the same file again
  }

  async function confirmImport() {
    if (!result?.holdings.length) return;
    setBusy(true);
    for (const h of result.holdings) await onImport(h);
    setBusy(false);
    dialogRef.current?.close();
    setResult(null);
  }

  return (
    <>
      <button className="btn outline small" onClick={() => fileRef.current?.click()}>Import CSV</button>
      <button className="btn outline small" onClick={exportCsv} disabled={!positions.length}>Export CSV</button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => pickFile(e.target.files?.[0])} />

      <dialog ref={dialogRef} className="dialog csv-dialog">
        <h2>Import holdings</h2>
        {result && (
          <>
            {result.holdings.length > 0 && (
              <>
                <p className="row-sub">
                  {result.holdings.length} holding{result.holdings.length === 1 ? "" : "s"} found. Symbols you already hold are added to,
                  averaging the cost.
                </p>
                <div className="csv-preview">
                  <table className="holdings">
                    <thead><tr><th>Symbol</th><th className="num">Shares</th><th className="num">Avg. cost</th></tr></thead>
                    <tbody>
                      {result.holdings.slice(0, 50).map((h, i) => (
                        <tr key={`${h.symbol}-${i}`}><td><b>{h.symbol}</b> <span className="row-sub">{h.name}</span></td><td className="num">{h.qty}</td><td className="num">{h.cost}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {result.errors.length > 0 && (
              <ul className="csv-errors">
                {result.errors.slice(0, 8).map((e) => <li key={e} className="auth-error">{e}</li>)}
                {result.errors.length > 8 && <li className="row-sub">…and {result.errors.length - 8} more.</li>}
              </ul>
            )}
            <p className="row-sub">Columns needed: <b>symbol</b>, <b>shares</b> and <b>avg_cost</b> (a name column is optional).</p>
          </>
        )}
        <div className="dialog-btns">
          <button className="btn outline" onClick={() => { dialogRef.current?.close(); setResult(null); }}>Cancel</button>
          {Boolean(result?.holdings.length) && (
            <button className="btn primary" onClick={confirmImport} disabled={busy}>
              {busy ? "Importing…" : `Import ${result!.holdings.length}`}
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}
