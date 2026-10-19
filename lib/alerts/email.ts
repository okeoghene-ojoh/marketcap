// Sends alert emails through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Without RESEND_API_KEY, emails are skipped and alerts still appear in the app.

const API_KEY = () => process.env.RESEND_API_KEY ?? "";
// Until you verify your own domain in Resend, only "onboarding@resend.dev" can send,
// and only to the email address you signed up to Resend with.
const FROM = () => process.env.ALERT_EMAIL_FROM || "Marketcap <onboarding@resend.dev>";
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://marketcap-rosy.vercel.app";

export const emailEnabled = () => Boolean(API_KEY());

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendAlertEmail(to: string, opts: { title: string; body: string; symbol: string }) {
  if (!emailEnabled()) return { sent: false as const, reason: "no RESEND_API_KEY" };
  const link = `${SITE()}/quote/${encodeURIComponent(opts.symbol)}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM(),
      to: [to],
      subject: `Marketcap alert: ${opts.title}`,
      text: `${opts.title}\n\n${opts.body}\n\nView ${opts.symbol}: ${link}\n\nManage alerts: ${SITE()}/portfolio#alerts`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px">
  <p style="font-size:12px;letter-spacing:.08em;color:#666;text-transform:uppercase">Marketcap price alert</p>
  <h2 style="margin:0 0 8px">${escape(opts.title)}</h2>
  <p style="color:#333">${escape(opts.body)}</p>
  <p><a href="${link}" style="display:inline-block;background:#1f4a12;color:#e9ffd0;padding:10px 18px;border-radius:999px;text-decoration:none">View ${escape(opts.symbol)}</a></p>
  <p style="font-size:12px;color:#888">This alert is now switched off. <a href="${SITE()}/portfolio#alerts">Manage your alerts</a>. Not financial advice.</p>
</div>`,
    }),
  });
  if (!res.ok) return { sent: false as const, reason: `Resend HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  return { sent: true as const };
}
