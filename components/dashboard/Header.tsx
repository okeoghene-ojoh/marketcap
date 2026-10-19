"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { SearchBox } from "../SearchBox";
import { ThemeToggle } from "../ThemeToggle";
import { LogoMark } from "../Logo";
import { useAuth } from "../AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";

// Markets and News pages arrive in later phases.
const TABS = [
  { label: "Overview", href: "/" },
  { label: "Markets", href: null },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Compare", href: "/compare" },
  { label: "News", href: null },
];

export function Header({ notifCount = 0 }: { notifCount?: number }) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const name = profile?.name || user?.email.split("@")[0] || "";

  return (
    <header className="topbar">
      <Link href="/" className="hello">
        <div className="avatar" aria-hidden="true">{name ? name[0].toUpperCase() : "M"}</div>
        <div>
          <div className="brand"><LogoMark size={14} />Marketcap</div>
          <h1>{name ? `Hello, ${name}` : "Welcome"}</h1>
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
        {user && (
          <button className="pill-btn" aria-label="Notifications">
            <span className="bell">
              <Icon name="bell" />
              {notifCount > 0 && <span className="dot" />}
            </span>
            <span>{notifCount}</span>
          </button>
        )}
        <AccountButton />
      </div>
    </header>
  );
}

function AccountButton() {
  const { user, enabled } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!enabled) return null;
  if (!user) return <Link href="/login" className="btn primary small">Sign in</Link>;

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="user" />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-email">{user.email}</div>
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>Account settings</Link>
          <button role="menuitem" onClick={signOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}
