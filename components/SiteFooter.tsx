import Link from "next/link";
import { SITE } from "@/lib/site";

/** Legal links shown at the bottom of every page. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} {SITE.name}</span>
      <nav aria-label="Legal">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/disclaimer">Disclaimer</Link>
      </nav>
      <span>Not financial advice.</span>
    </footer>
  );
}
