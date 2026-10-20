import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use – Marketcap" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" current="/terms">
      <p>
        These terms are an agreement between you and {SITE.company} (&quot;we&quot;) about your use of {SITE.name}.
        By using {SITE.name} or creating an account, you agree to them. If you don&apos;t agree, please don&apos;t use
        the service.
      </p>

      <h2>1. What {SITE.name} is</h2>
      <p>
        {SITE.name} provides market prices, charts, news, portfolio tracking, watchlists and price alerts for
        information only. It is not a broker or exchange, doesn&apos;t execute trades, and doesn&apos;t give financial
        advice. Please read our <Link href="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must be at least 18 and give a valid email address.</li>
        <li>Keep your password safe. You&apos;re responsible for activity on your account.</li>
        <li>You can delete your account at any time from <Link href="/account">Account settings</Link>.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>Don&apos;t:</p>
      <ul>
        <li>break the law or anyone else&apos;s rights using {SITE.name};</li>
        <li>try to access other people&apos;s accounts or data, or get around our security;</li>
        <li>scrape, resell or redistribute our data feeds, or overload the service with automated requests;</li>
        <li>interfere with how {SITE.name} works for others.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>

      <h2>4. Data and third-party content</h2>
      <p>
        Prices, company information and news come from third-party providers. They may be delayed or inaccurate and
        remain the property of their owners. News links open on the publisher&apos;s website, which has its own terms.
      </p>

      <h2>5. Our content</h2>
      <p>
        The {SITE.name} name, logo, design and software belong to {SITE.company}. You may use the service for your own
        personal, non-commercial purposes.
      </p>

      <h2>6. No warranty</h2>
      <p>
        {SITE.name} is provided &quot;as is&quot; and &quot;as available&quot;. We don&apos;t promise it will be
        uninterrupted, error-free or accurate, or that alerts will always arrive on time.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the extent the law allows, we aren&apos;t liable for investment losses, lost profits, or indirect or
        consequential losses arising from your use of {SITE.name}, including decisions made using its data or alerts.
        Nothing in these terms limits liability that can&apos;t be limited by law.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update the service and these terms. We&apos;ll change the date above and, for significant changes,
        tell you by email. Continuing to use {SITE.name} means you accept the updated terms.
      </p>

      <h2>9. Law and contact</h2>
      <p>
        These terms are governed by the laws of {SITE.jurisdiction}. Questions: <b>{SITE.contactEmail}</b>.
      </p>
    </LegalPage>
  );
}
