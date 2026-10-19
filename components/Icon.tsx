export type IconName =
  | "search" | "bell" | "moon" | "sun" | "eye" | "eye-off" | "arrow" | "plus" | "star" | "more"
  | "pie" | "trend" | "list" | "check" | "x" | "news" | "target" | "bolt" | "sparkle" | "user";

export function Icon({ name, size }: { name: IconName; size?: "sm" | "lg" }) {
  return (
    <svg className={`ic ${size ?? ""}`} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}

/** Rendered once in the layout; every <Icon> references these symbols. */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></symbol>
        <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></symbol>
        <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></symbol>
        <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></symbol>
        <symbol id="i-eye-off" viewBox="0 0 24 24"><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></symbol>
        <symbol id="i-star" viewBox="0 0 24 24"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" /></symbol>
        <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></symbol>
        <symbol id="i-pie" viewBox="0 0 24 24"><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15.5 3.7A9 9 0 0 1 20.3 8.5h-4.8z" /></symbol>
        <symbol id="i-trend" viewBox="0 0 24 24"><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></symbol>
        <symbol id="i-list" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></symbol>
        <symbol id="i-news" viewBox="0 0 24 24"><path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2Z" /><path d="M17 9h3v10a2 2 0 0 1-2 2" /><path d="M8 9h5M8 13h5M8 17h3" /></symbol>
        <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></symbol>
        <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></symbol>
        <symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M12 2c.5 4.5 2.5 7.5 10 10-7.5 2.5-9.5 5.5-10 10-.5-4.5-2.5-7.5-10-10 7.5-2.5 9.5-5.5 10-10Z" /></symbol>
      </defs>
    </svg>
  );
}
