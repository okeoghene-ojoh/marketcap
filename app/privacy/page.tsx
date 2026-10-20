import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy – Marketcap" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" current="/privacy">
      <p>
        This policy explains what personal data {SITE.company} (&quot;we&quot;) collects when you use {SITE.name}, why,
        and the choices you have. We aim to follow the Nigeria Data Protection Act 2023 and, where it applies, the EU and
        UK GDPR.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your email address, name, password (stored only as a secure hash by our login provider) and your default currency.</li>
        <li><b>What you save:</b> holdings (symbols, shares, buy price and date), watchlists, price alerts and the notifications they create.</li>
        <li><b>Technical data:</b> cookies that keep you signed in, and your IP address and browser details, which our hosting provider processes to deliver the site and protect it from abuse.</li>
        <li>
          <b>Visit statistics:</b> anonymous counts of page views, plus the referring site, country and device type,
          collected by Vercel Web Analytics without cookies and without identifying you.
        </li>
        <li><b>Stored in your browser only:</b> your light/dark theme and, if you aren&apos;t signed in, a demo portfolio. These never leave your device.</li>
      </ul>
      <p>We don&apos;t sell your data, show ads, or use advertising or tracking cookies.</p>

      <h2>Why we use it</h2>
      <ul>
        <li>To provide your account and save your portfolio, watchlists and alerts (performing our contract with you).</li>
        <li>To send emails you asked for: sign-up confirmation, password resets and price alerts.</li>
        <li>To keep the service secure and working (our legitimate interests).</li>
      </ul>

      <h2>Who processes it for us</h2>
      <ul>
        <li><b>Supabase</b>: login and database (your account and saved data).</li>
        <li><b>Vercel</b>: website hosting and anonymous visit statistics.</li>
        <li><b>Resend</b>: sending emails.</li>
        <li>
          <b>Market data providers</b> (Finnhub, Twelve Data, CoinGecko, ExchangeRate-API, Binance): we request prices
          from them. They receive ticker symbols, not your personal data. Your browser connects to Binance directly for
          live Bitcoin prices, so Binance can see your IP address.
        </li>
      </ul>
      <p>
        Some of these providers store data outside Nigeria (for example in the EU or US). We use providers that offer
        appropriate safeguards for international transfers.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data while your account exists. Notifications are limited to your latest 100. When you delete your
        account, your profile, holdings, watchlists, alerts and notifications are deleted straight away; backups held by
        our providers expire on their normal schedule.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see and change most of your data in the app, and you can delete your account at any time from{" "}
        <Link href="/account">Account settings</Link>. You can also ask us for a copy of your data, to correct it, to
        restrict or object to how we use it, or to delete it, by emailing <b>{SITE.contactEmail}</b>. You may also
        complain to the Nigeria Data Protection Commission (or your local data protection authority).
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit (HTTPS). Database rules ensure each account can only access its own data, and
        secret keys are kept on our servers only.
      </p>

      <h2>Children</h2>
      <p>{SITE.name} is not intended for anyone under 18, and we don&apos;t knowingly collect their data.</p>

      <h2>Changes and contact</h2>
      <p>
        If we change this policy we&apos;ll update the date above, and tell you by email for significant changes.
        Questions: <b>{SITE.contactEmail}</b>.
      </p>
    </LegalPage>
  );
}
