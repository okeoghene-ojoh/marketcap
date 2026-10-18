import { NextResponse } from "next/server";

/** JSON response that Vercel's CDN may cache for `maxAge` seconds (shared by all visitors). */
export function cachedJson(data: unknown, maxAge: number) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}` },
  });
}

export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });

const SYMBOL_RE = /^[A-Z0-9.\-]{1,12}$/;

/** Uppercased, de-duplicated, validated symbols, or null if any are invalid. */
export function parseSymbols(raw: string | null, max: number): string[] | null {
  if (!raw) return null;
  const list = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (!list.length || list.length > max || !list.every((s) => SYMBOL_RE.test(s))) return null;
  return list;
}
