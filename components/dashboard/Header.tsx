"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";
import { SearchBox } from "../SearchBox";
import { ThemeToggle } from "../ThemeToggle";

// Only Overview has a page so far; the rest arrive in later phases.
const TABS = [
  { label: "Overview", href: "/" },
  { label: "Markets", href: null },
  { label: "Portfolio", href: null },
  { label: "News", href: null },
];

interface Props {
  name: string;
  notifCount?: number;
}

export function Header({ name, notifCount = 0 }: Props) {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <Link href="/" className="hello">
        <div className="avatar" aria-hidden="true">{name[0]}</div>
        <div>
          <div className="brand">Marketcap</div>
          <h1>Hello, {name}</h1>
        </div>
      </Link>

      <nav className="tabs" aria-label="Main">
        {TABS.map((t) =>
          t.href ? (
            <Link key={t.label} href={t.href} className={`tab ${pathname === t.href ? "active" : ""}`}>
              {t.label}
            </Link>
          ) : (
            <button key={t.label} className="tab" title="Coming soon" disabled>
              {t.label}
            </button>
          )
        )}
      </nav>

      <div className="actions">
        <SearchBox />
        <ThemeToggle />
        <button className="pill-btn" aria-label="Notifications">
          <span className="bell">
            <Icon name="bell" />
            {notifCount > 0 && <span className="dot" />}
          </span>
          <span>{notifCount}</span>
        </button>
      </div>
    </header>
  );
}
