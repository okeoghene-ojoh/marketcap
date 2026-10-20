// Minimal CSV reading/writing for portfolio import and export (RFC 4180 style:
// commas or semicolons, "quoted, fields", "" for a quote inside quotes).

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, ""); // Excel's byte-order mark
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src.charAt(i);
    if (quoted) {
      if (c === '"' && src.charAt(i + 1) === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src.charAt(i + 1) === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: (string | number)[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";

export interface ImportedHolding { symbol: string; name?: string; qty: number; cost: number }
export interface ImportResult { holdings: ImportedHolding[]; errors: string[] }

const HEADERS = {
  symbol: ["symbol", "ticker", "code"],
  name: ["name", "company", "description"],
  qty: ["shares", "qty", "quantity", "units", "amount"],
  cost: ["avg_cost", "average cost", "avg cost", "cost", "buy_price", "buy price", "price", "purchase price"],
};

/** Turns CSV rows into holdings: needs symbol, shares and average cost columns (any common header names). */
export function readHoldings(text: string): ImportResult {
  const rows = parseCsv(text);
  if (rows.length < 2) return { holdings: [], errors: ["The file needs a header row and at least one holding."] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (names: string[]) => header.findIndex((h) => names.includes(h));
  const iSym = col(HEADERS.symbol), iName = col(HEADERS.name), iQty = col(HEADERS.qty), iCost = col(HEADERS.cost);
  const missing = [iSym < 0 && "symbol", iQty < 0 && "shares", iCost < 0 && "average cost"].filter(Boolean);
  if (missing.length) return { holdings: [], errors: [`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`] };

  const num = (s: string) => Number(s.replace(/[\s$₦€,]/g, ""));
  const holdings: ImportedHolding[] = [];
  const errors: string[] = [];
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const symbol = (r.at(iSym) ?? "").trim().toUpperCase();
    const qty = num(r.at(iQty) ?? "");
    const cost = num(r.at(iCost) ?? "");
    if (!/^[A-Z0-9.\-]{1,12}$/.test(symbol)) return errors.push(`Row ${line}: "${symbol || "(blank)"}" isn't a valid ticker.`);
    if (!(qty > 0)) return errors.push(`Row ${line} (${symbol}): shares must be a number above zero.`);
    if (!(cost >= 0) || Number.isNaN(cost)) return errors.push(`Row ${line} (${symbol}): average cost must be a number.`);
    holdings.push({ symbol, qty, cost, name: iName >= 0 ? (r.at(iName) ?? "").trim() || undefined : undefined });
  });
  return { holdings, errors };
}
