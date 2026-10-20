import Link from "next/link";
import { Header } from "../dashboard/Header";
import { SITE } from "@/lib/site";

const PAGES = [
  { href: "/terms", label: "Terms of use" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

/** Shared layout for the Terms, Privacy and Disclaimer pages. */
export function LegalPage({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  return (
    <div className="app">
      <Header />
      <article className="card legal">
        <nav className="legal-nav" aria-label="Legal pages">
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} className={p.href === current ? "active" : ""}>{p.label}</Link>
          ))}
        </nav>
        <h1>{title}</h1>
        <p className="row-sub">Last updated {SITE.legalUpdated}</p>
        {children}
      </article>
    </div>
  );
}
