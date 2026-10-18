import { cachedJson, ttlFor } from "@/lib/api";
import { getRates } from "@/lib/providers";

export const dynamic = "force-dynamic";

// GET /api/fx → { rates: { USD: 1, NGN: …, EUR: … }, source }
export async function GET() {
  const data = await getRates();
  return cachedJson(data, ttlFor(data.source, 3600));
}
