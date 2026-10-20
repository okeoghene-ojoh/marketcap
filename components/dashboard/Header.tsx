"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { SearchBox } from "../SearchBox";
import { ThemeToggle } from "../ThemeToggle";
import { LogoMark } from "../Logo";
import { useAuth } from "../AuthProvider";
import { useAlerts } from "../AlertsProvider";
import { timeAgo } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";

// Main navigation; every tab now has a page.
const TABS = [
  { label: "Overview", href: "/" },
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Compare", href: "/compare" },
  { label: "Practice", href: "/practice" },
  { label: "News", href: "/news" },
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
        {user ? (
          <NotificationsBell />
        ) : notifCount > 0 ? (
          // Signed-out demo: a static count to match the sample alert on the dashboard
          <span className="pill-btn" aria-label={`${notifCount} sample notifications`}>
            <span className="bell"><Icon name="bell" /><span className="dot" /></span>
            <span>{notifCount}</span>
          </span>
        ) : null}
        <AccountButton />
      </div>
    </header>
  );
}

function NotificationsBell() {
  const { notifications, unread, markRead, markAllRead } = useAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="pill-btn" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="bell">
          <Icon name="bell" />
          {unread > 0 && <span className="dot" />}
        </span>
        <span>{unread}</span>
      </button>
      {open && (
        <div className="menu notif-menu" role="menu">
          <div className="notif-head">
            <b>Notifications</b>
            {unread > 0 && <button className="link-btn" onClick={markAllRead}>Mark all read</button>}
          </div>
          {notifications.length === 0 && <p className="row-sub notif-empty">No alerts yet. Open any stock and tap “Set alert”.</p>}
          <ul className="notif-list">
            {notifications.slice(0, 8).map((n) => (
              <li key={n.id} className={n.read ? "" : "unread"}>
                <Link
                  href={n.symbol ? `/quote/${n.symbol}` : "/portfolio#alerts"}
                  onClick={() => { if (!n.read) markRead(n.id); setOpen(false); }}
                >
                  <div className="row-title">{n.title}</div>
                  <div className="row-sub">{n.body}</div>
                  <div className="row-sub">{timeAgo(Date.parse(n.createdAt))}</div>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/portfolio#alerts" className="notif-foot" onClick={() => setOpen(false)}>Manage alerts</Link>
        </div>
      )}
    </div>
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
