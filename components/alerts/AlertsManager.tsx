"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import { useAlerts } from "../AlertsProvider";
import { useAuth } from "../AuthProvider";
import { describeAlert } from "@/lib/alerts/describe";
import { money, timeAgo } from "@/lib/format";

/** All of the user's price alerts: pause, re-arm or delete them. */
export function AlertsManager() {
  const { enabled: authEnabled } = useAuth();
  const { enabled, alerts, setActive, deleteAlert } = useAlerts();

  const active = alerts.filter((a) => a.active);
  const done = alerts.filter((a) => !a.active);

  return (
    <article className="card" id="alerts">
      <div className="card-head">
        <div className="title"><span className="title-ic"><Icon name="bell" /></span>Price alerts</div>
        {enabled && <span className="pill">{active.length} active</span>}
      </div>

      {!enabled ? (
        <p className="row-sub empty-hint">
          {authEnabled ? <><Link href="/login">Sign in</Link> to get emailed when a price hits your target.</> : "Alerts need accounts, which aren't set up yet."}
        </p>
      ) : alerts.length === 0 ? (
        <p className="row-sub empty-hint">No alerts yet. Open any stock or coin and tap <b>Set alert</b>.</p>
      ) : (
        <ul className="alerts-list">
          {[...active, ...done].map((a) => (
            <li key={a.id} className={a.active ? "" : "off"}>
              <Link href={`/quote/${a.symbol}`} className="row-link">
                <div className="meta">
                  <div className="row-title">{describeAlert(a)}</div>
                  <div className="row-sub">
                    {a.name && a.name !== a.symbol ? `${a.name} · ` : ""}
                    {a.active
                      ? "Watching"
                      : a.lastTriggeredAt
                        ? `Triggered ${timeAgo(Date.parse(a.lastTriggeredAt))}${a.lastPrice !== null ? ` at ${money(a.lastPrice, a.currency, { native: true })}` : ""}`
                        : "Paused"}
                  </div>
                </div>
              </Link>
              <button className="btn outline small" onClick={() => setActive(a.id, !a.active)}>
                {a.active ? "Pause" : a.lastTriggeredAt ? "Re-arm" : "Resume"}
              </button>
              <button className="round" aria-label={`Delete alert ${describeAlert(a)}`} title="Delete" onClick={() => deleteAlert(a.id)}>
                <Icon name="trash" size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
