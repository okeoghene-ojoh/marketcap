# Welcome to Marketcap 👋

Marketcap is our stock market web app: live prices, news, portfolios, watchlists,
a compare chart and price alerts. The live site is **https://marketcap-rosy.vercel.app**.

This guide gets you from zero to running the app on your own computer and building
features with Claude. It takes about 30 minutes. Ask Claude at any step: open the
project in Claude Code and say "help me with step N of ONBOARDING.md".

---

## 1. Get access
Ask the project owner to:
- add your **GitHub** username as a collaborator on `okeoghene-ojoh/marketcap`
  (accept the email invite from GitHub);
- send you the **Supabase Project URL** and **publishable key** through a password
  manager or another private channel. These two are safe for browsers, but keep them
  out of public chats anyway.

You'll get your **own** free market-data keys in step 4. Secret keys (Supabase secret
key, alert checker password, Resend) are **not** needed for normal development.

## 2. Install the tools (once)
- **Claude app** with **Claude Code**: https://claude.ai/download, then sign in with your team account
- **Node.js LTS**: https://nodejs.org
- **Git**: https://git-scm.com/downloads

On Windows you can install the last two from PowerShell instead:
```
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
```
Then close and reopen PowerShell.

## 3. Get the code
Pick a folder **outside OneDrive or iCloud** (synced folders slow things down and copy
your keys to the cloud), e.g. `C:\dev` or `~/dev`:
```
git clone https://github.com/okeoghene-ojoh/marketcap.git
cd marketcap
npm install
```
If `npm install` fails on a slow connection, run it again with `--fetch-retries=5`.

## 4. Add your keys
1. Get free keys from **https://finnhub.io** (dashboard → API key) and
   **https://twelvedata.com** (dashboard → API Keys).
2. Copy `.env.example` to a new file named `.env.local` in the `marketcap` folder.
   - Windows shortcut: run `powershell -ExecutionPolicy Bypass -File scripts\set-keys.ps1`,
     paste each value when asked, and press Enter to skip the ones you don't have.
3. Fill in `FINNHUB_API_KEY`, `TWELVEDATA_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

`.env.local` is git-ignored, so it never goes to GitHub. **Never paste key values into
chat, code or commits.** Without keys the app still runs, using data labelled "sample".

## 5. Run it
```
npm run dev
```
Open **http://localhost:3000**. You should see the dashboard with live prices.
Create your own account with **Sign in → Create account**.

## 6. Work on it with Claude
1. In the Claude app, open the **Code** tab and choose the `marketcap` folder.
2. Claude automatically reads `CLAUDE.md` (the project briefing), so it knows the
   stack, the folders and our rules.
3. Describe what you want in plain words, e.g. "add a market hours banner to the
   dashboard", or "explain how price alerts work".

## 7. Share your changes (team workflow)
We don't push straight to `main`: everything on `main` goes live within a minute.
1. Make a branch: `git checkout -b your-name/short-description`
2. Commit your work, then `git push -u origin your-name/short-description`
3. On GitHub, open a **Pull Request** and ask a teammate to review it.
4. The owner merges it, and Vercel deploys it automatically.

Claude can do these steps with you: say "commit this and open a pull request".

## Ground rules
- Never commit secrets; check `git status` before committing.
- Keep "sample" labels honest: never present sample data as live.
- Database changes = a new numbered file in `supabase/migrations/`, which the owner
  runs in Supabase.
- Run `npx tsc --noEmit` before you push.
- Marketcap shows information, not financial advice.
