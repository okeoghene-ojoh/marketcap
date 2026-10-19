import { ImageResponse } from "next/og";

// Home-screen icon for iPhone/iPad ("Add to Home Screen"); same mark as app/icon.svg
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1f4a12" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M14 46V22l14 14 19-19" fill="none" stroke="#b6ec6f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M35 17h12v12" fill="none" stroke="#b6ec6f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size
  );
}
