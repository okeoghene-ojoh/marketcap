import { Icon } from "../Icon";
import type { NewsItem } from "@/lib/types";

export function NewsCard({ items }: { items: NewsItem[] }) {
  return (
    <article className="card">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="news" /></span>Market News</div>
        <span className="pill">Sample headlines</span>
      </div>
      <ul className="news">
        {items.map((n) => (
          <li key={n.title}>
            <div className="thumb" style={{ background: n.color }}>{n.tag}</div>
            <div className="meta">
              <div className="row-title">{n.title}</div>
              <div className="row-sub">{n.src} · {n.time}</div>
            </div>
            <span className="tag">{n.tag}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
