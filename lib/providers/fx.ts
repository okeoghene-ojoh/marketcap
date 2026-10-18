// ExchangeRate-API open endpoint (no key, updated daily): USD → NGN / EUR.
// Docs: https://www.exchangerate-api.com/docs/free
import { getJSON } from "./http";
import type { Rates } from "../types";

interface ERApi { result: string; rates: Record<string, number> }

export async function fxRates(): Promise<Rates> {
  const d = await getJSON<ERApi>("https://open.er-api.com/v6/latest/USD", 3600);
  if (d.result !== "success" || !d.rates.NGN || !d.rates.EUR) throw new Error("FX rates unavailable");
  return { USD: 1, NGN: d.rates.NGN, EUR: d.rates.EUR };
}
