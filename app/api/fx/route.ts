import { cachedJson } from "@/lib/api";
import { getRates } from "@/lib/providers";

export const dynamic = "force-dynamic";

// GET /api/fx → { rates: { USD: 1, NGN: …, EUR: … }, source }
export async function GET() {
  return cachedJson(await getRates(), 3600);
}
