// Shown while a quote page fetches its data on the server
export default function QuoteLoading() {
  return (
    <div className="app" aria-busy="true" aria-label="Loading quote">
      <div className="skeleton skel-header" />
      <section className="row row-quote">
        <article className="card quote-main">
          <div className="skeleton skel-title" />
          <div className="skeleton skel-price" />
          <div className="skeleton skel-chart" />
        </article>
        <div className="quote-side">
          <article className="card"><div className="skeleton skel-block" /></article>
          <article className="card"><div className="skeleton skel-block short" /></article>
        </div>
      </section>
    </div>
  );
}
