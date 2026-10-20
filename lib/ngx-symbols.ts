// NGX (Nigerian Exchange) listings Marketcap knows by name. Shared by the browser and the
// server: it decides which tickers are Nigerian (priced in naira, fetched from EODHD).
// Refresh from EODHD's official list with:  node --env-file=.env.local scripts/fetch-ngx-symbols.mjs
// (that rewrites this file; until then it holds a starter set of large NGX companies).
export const NGX_LIST: { code: string; name: string }[] = [
  { code: "DANGCEM", name: "Dangote Cement" },
  { code: "MTNN", name: "MTN Nigeria" },
  { code: "ZENITHBANK", name: "Zenith Bank" },
  { code: "GTCO", name: "Guaranty Trust Holding" },
  { code: "OANDO", name: "Oando" },
];
