import { Icon } from "../Icon";
import { timeAgo } from "@/lib/format";
import type { NewsResponse } from "@/lib/types";

const THUMB_COLORS = ["var(--lime)", "#9fc7f5", "#f5c99f", "#d8c4f5"];

export function NewsCard({ data }: { data: NewsResponse | null }) {
  return (
    <article className="card">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="news" /></span>Market News</div>
        <span className="pill">{!data ? "Loading…" : data.source === "live" ? "Live" : "Sample headlines"}</span>
      </div>
      <ul className="news">
        {!data && <li><div className="row-sub">Loading headlines…</div></li>}
        {data?.articles.slice(0, 5).map((n, i) => (
          <li key={n.id}>
            {n.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- images come from many news domains
              <img className="thumb" src={n.image} alt="" loading="lazy" />
            ) : (
              <div className="thumb" style={{ background: THUMB_COLORS[i % THUMB_COLORS.length] }}>{n.source.slice(0, 6)}</div>
            )}
            <div className="meta">
              {n.url === "#" ? (
                <div className="row-title">{n.headline}</div>
              ) : (
                <a className="row-title news-link" href={n.url} target="_blank" rel="noopener noreferrer">{n.headline}</a>
              )}
              <div className="row-sub">{n.source} · {timeAgo(n.time)}</div>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
