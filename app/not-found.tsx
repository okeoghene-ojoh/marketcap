import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app">
      <article className="card not-found">
        <h2>Page not found</h2>
        <p className="row-sub">That page doesn&apos;t exist. Try searching for a stock or coin, or go back to the overview.</p>
        <div className="btns" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn primary">Back to Overview</Link>
          <Link href="/markets" className="btn outline">See markets</Link>
        </div>
      </article>
    </div>
  );
}
