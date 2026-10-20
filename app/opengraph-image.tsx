import { ImageResponse } from "next/og";

// Preview image shown when a Marketcap link is shared (WhatsApp, X, Slack, LinkedIn…)
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Marketcap: live prices, news and your portfolio";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#f1f1f1", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="140" height="140" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="16" fill="#1f4a12" />
            <path d="M14 46V22l14 14 19-19" fill="none" stroke="#b6ec6f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M35 17h12v12" fill="none" stroke="#b6ec6f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 96, fontWeight: 700, color: "#111" }}>Marketcap</div>
        </div>
        <div style={{ fontSize: 44, color: "#333", marginTop: 36 }}>Live prices, news and your portfolio, all in one place.</div>
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {["US stocks", "Crypto", "NGX", "Naira FX", "Price alerts"].map((t) => (
            <div key={t} style={{ fontSize: 28, padding: "10px 24px", borderRadius: 999, background: "#b6ec6f", color: "#142d0a" }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
