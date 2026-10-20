# Marketcap: project briefing for Claude

Marketcap is a Google-Finance-style web app: live prices, market news, a portfolio
with gains, watchlists, a compare chart, and price alerts (in-app + email).
Live at https://marketcap-rosy.vercel.app (deploys automatically from `main`).

The team includes beginners: explain steps plainly, give click-by-click
instructions for anything done in a website dashboard, and ask before anything
hard to undo.

## Stack
- **Next.js 15 (App Router) + React 19 + TypeScript**, hosted on **Vercel**
- Styling: one stylesheet, `app/globals.css` (Tailwind is installed, but the design uses plain CSS classes and `--` colour tokens; light and dark themes via `data-theme`)
- Charts: `lightweight-charts` v5 (keep the TradingView attribution logo, which its licence requires)
- Accounts and database: **Supabase** (`@supabase/ssr`, Row-Level Security on every table)
- Market data: **Finnhub** (US quotes, news, search, profiles), **Twelve Data** (history), **CoinGecko** (crypto), **open.er-api.com** (FX). Live BTC also streams from Binance in the browser.
- Email: **Resend** (alert emails)

## Where things are
| Path | What |
|---|---|
| `app/` | Pages: `/` dashboard, `/markets`, `/news`, `/quote/[symbol]`, `/portfolio`, `/compare`, `/login`, `/account`, `/terms`, `/privacy`, `/disclaimer` |
| `app/api/*` | JSON routes: `quotes`, `history`, `news`, `search`, `fx`, `movers`, `cron/check-alerts`, `account/delete` |
| `lib/site.ts` | Company name, contact email and jurisdiction used by the legal pages (placeholders to fill in) |
| `lib/providers/` | **The only code that talks to data providers.** `index.ts` is the facade the app uses. |
| `lib/sample-data.ts` | Demo portfolio, symbol names, and **sample fallbacks** |
| `lib/usePortfolio.ts` | Holdings and watchlists store: Supabase when signed in, localStorage when signed out |
| `components/AlertsProvider.tsx` | Alerts and notifications for the signed-in user |
| `lib/alerts/` | Alert rules, the server-side checker, Resend email |
| `lib/supabase/` | `client.ts` (browser), `server.ts` (requests), `admin.ts` (**secret key, server-only**) |
| `supabase/migrations/` | SQL run by hand in Supabase → SQL Editor, in number order |
| `scripts/set-keys.ps1` | Asks for API keys and writes `.env.local` (keys stay hidden) |
| `scripts/make-alert-schedule.ps1` | Writes the git-ignored SQL that schedules the alert checker |

## Rules that matter
- **Never commit or print secrets.** Keys live only in `.env.local` (git-ignored) and Vercel env vars. Never paste key values into chat, code, commits or logs. Before committing, check `git status` for stray files (e.g. `*keys*.txt`, `*.local.sql` are ignored on purpose). When checking a key, show only its length or prefix.
- `NEXT_PUBLIC_*` variables reach the browser. Only the Supabase URL and the **publishable** key may use that prefix. `SUPABASE_SECRET_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `FINNHUB_API_KEY` and `TWELVEDATA_API_KEY` are server-only.
- **Label data honestly.** Every quote, series and article carries `source: "live" | "delayed" | "sample"`, and the UI shows "sample" when it isn't live. NGX (Nigerian) prices are sample data until an NGX feed is connected. Alerts never fire on sample data.
- **All provider calls go through `lib/providers/index.ts`**, which falls back to sample data when a key is missing or a provider fails. Pages and components never call providers directly.
- **Free-plan limits:** Finnhub 60 calls/min, Twelve Data 8 calls/min (charts), CoinGecko low. API responses are CDN-cached via `cachedJson()` in `lib/api.ts`, and sample fallbacks are cached for only 30 s.
- **Server components can't import values from `"use client"` files** (they arrive as placeholders). Shared constants belong in `lib/types.ts` or `lib/sample-data.ts`.
- New tables need **RLS policies** in a new numbered migration file, and the SQL is run by hand in Supabase.
- Money: `money(amount, currency, { rates })` converts from USD; `{ native: true }` formats an amount already in that currency.
- Not financial advice: keep the disclaimers, and don't build real trading without a licensed partner.

## Commands (run inside `marketcap/`)
- `npm install`: install packages (slow networks: add `--fetch-retries=5`)
- `npm run dev`: dev server at http://localhost:3000
- `npx tsc --noEmit`: type-check (do this before every commit)
- `npm test`: unit tests for money, portfolio, alert and market-hours logic (Vitest; `*.test.ts` next to the code)
- `npm run build`: production build. **Stop the dev server first**, because both write to `.next`.
- Deploying = pushing to `main` on GitHub; Vercel builds it in about a minute.

## Alerts pipeline
Supabase `pg_cron` calls `POST /api/cron/check-alerts` every 5 minutes with
`Authorization: Bearer $CRON_SECRET`. The checker reads active alerts with the secret
key, fetches quotes, claims each triggered alert (`active=false`) so it fires once,
inserts a notification, and emails via Resend. Until a domain is verified in Resend,
email only reaches the Resend account owner's address.

## Roadmap
Done: dashboard, live data, quote pages and search, accounts, portfolio page, compare,
markets, news, price alerts, logo, legal pages, account deletion, error/404/loading pages,
link previews and SEO, unit tests.
Next: a verified email domain (Resend + Supabase SMTP), filling in `lib/site.ts` and a legal
review, a live NGX feed (e.g. EODHD), then optional paper trading, "buy on broker" links,
a portfolio value-over-time chart and CSV import/export.
