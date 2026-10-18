"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export const THEME_KEY = "marketcap-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // The inline script in layout.tsx already set data-theme before first paint.
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    setTheme(next);
  };

  return (
    <button className="icon-btn" aria-label="Toggle dark mode" onClick={toggle}>
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
