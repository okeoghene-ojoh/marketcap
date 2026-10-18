import Link from "next/link";

export default function QuoteNotFound() {
  return (
    <div className="app">
      <article className="card not-found">
        <h2>We couldn’t find that symbol</h2>
        <p className="row-sub">Check the ticker, or search for a company or coin by name.</p>
        <Link href="/" className="btn primary">Back to Overview</Link>
      </article>
    </div>
  );
}
