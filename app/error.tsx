"use client";

import { useEffect } from "react";
import Link from "next/link";

// Shown when a page crashes, instead of a blank screen
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="app">
      <article className="card not-found">
        <h2>Something went wrong</h2>
        <p className="row-sub">
          This page hit an unexpected problem. It may be a hiccup with one of our data providers. Try again, or head back
          to the overview.
        </p>
        <div className="btns" style={{ justifyContent: "center" }}>
          <button className="btn primary" onClick={reset}>Try again</button>
          <Link href="/" className="btn outline">Back to Overview</Link>
        </div>
        {error.digest && <p className="row-sub">Error reference: {error.digest}</p>}
      </article>
    </div>
  );
}
