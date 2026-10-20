/** Regular NYSE/NASDAQ session: Mon–Fri 9:30–16:00 New York time (ignores holidays). */
export function isUSMarketOpen(now = new Date()) {
  const ny = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const mins = ny.getHours() * 60 + ny.getMinutes();
  return ny.getDay() >= 1 && ny.getDay() <= 5 && mins >= 570 && mins < 960;
}
