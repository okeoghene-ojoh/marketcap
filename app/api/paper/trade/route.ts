import { NextResponse, type NextRequest } from "next/server";
import { parseSymbols } from "@/lib/api";
import { getQuotes } from "@/lib/providers";
import { NGX_SYMBOLS, SYMBOL_NAMES } from "@/lib/sample-data";
import { adminEnabled, supabaseAdmin } from "@/lib/supabase/admin";
import { jsonError, noStore, sameOrigin, verifiedUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  insufficient_cash: "You don't have enough practice cash for that.",
  insufficient_shares: "You don't own that many to sell.",
  bad_amount: "Enter an amount above zero.",
};

// POST /api/paper/trade  { symbol, side: "buy" | "sell", qty? , amount? (USD), name? }
// The price is fetched HERE, never taken from the browser, so trades can't be faked.
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Forbidden", 403);
  if (!adminEnabled()) return jsonError("Practice trading isn't set up yet.", 503);
  const user = await verifiedUser();
  if (!user) return jsonError("Sign in to trade.", 401);

  const body = await req.json().catch(() => null);
  const symbol = parseSymbols(typeof body?.symbol === "string" ? body.symbol : null, 1)?.[0];
  const side = body?.side;
  if (!symbol) return jsonError("Pick a valid symbol.", 400);
  if (side !== "buy" && side !== "sell") return jsonError("Choose buy or sell.", 400);
  if (NGX_SYMBOLS.includes(symbol)) return jsonError("NGX stocks can't be traded yet: their prices are sample data.", 400);

  const quote = (await getQuotes([symbol]))[symbol];
  if (!quote || quote.source !== "live") return jsonError(`No live price for ${symbol} right now. Try again shortly.`, 400);

  // Either a quantity, or a dollar amount turned into a quantity at today's price (6 decimals, rounded down)
  let qty = Number(body?.qty);
  if (!(qty > 0) && Number(body?.amount) > 0) qty = Math.floor((Number(body.amount) / quote.price) * 1e6) / 1e6;
  qty = Math.floor(qty * 1e6) / 1e6;
  if (!(qty > 0) || qty > 1e9) return jsonError(ERRORS.bad_amount, 400);

  const name = String(body?.name || SYMBOL_NAMES[symbol] || symbol).slice(0, 80);
  const { data, error } = await supabaseAdmin().rpc("paper_execute", {
    p_user: user.id, p_symbol: symbol, p_name: name, p_side: side, p_qty: qty, p_price: quote.price,
  });
  if (error) {
    const code = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (!code) console.error("[paper] trade failed", error.message);
    return jsonError(code ? ERRORS[code] : "The trade didn't go through. Try again.", code ? 400 : 500);
  }
  return NextResponse.json({ ...(data as object), symbol, side, qty, price: quote.price }, { headers: noStore });
}
