// CoinGecko public API (no key needed, low rate limit): crypto prices.
// Docs: https://docs.coingecko.com/reference/simple-price
import { getJSON } from "./http";
import { CRYPTO_IDS as IDS } from "../sample-data";
import type { Quote } from "../types";

export const CRYPTO_SYMBOLS = Object.keys(IDS);
export const isCrypto = (symbol: string) => symbol in IDS;

export interface CoinMarket {
  name: string; image?: string; market_cap?: number; total_volume?: number;
  high_24h?: number; low_24h?: number; ath?: number; atl?: number;
}

export async function coingeckoMarket(symbol: string): Promise<CoinMarket | null> {
  const id = IDS[symbol];
  if (!id) return null;
  const list = await getJSON<CoinMarket[]>(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}`,
    120
  );
  return list[0] ?? null;
}

type Prices =Record<string, { usd: number; usd_24h_change?: number }>;

/** Always asks for the full list, so every caller shares one cached request. */
export async function coingeckoQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const ids = Object.values(IDS).join(",");
  const data = await getJSON<Prices>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    60
  );
  const out: Record<string, Quote> = {};
  for (const symbol of symbols) {
    const d = data[IDS[symbol]];
    if (!d) continue;
    const pct = d.usd_24h_change ?? 0;
    out[symbol] = {
      symbol,
      price: d.usd,
      prev: d.usd / (1 + pct / 100),
      changePct: pct,
      time: Date.now(),
      source: "live",
    };
  }
  return out;
}
