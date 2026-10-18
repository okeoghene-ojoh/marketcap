import { cachedJson, ttlFor } from "@/lib/api";
import { getMovers } from "@/lib/providers";

export const dynamic = "force-dynamic";

// GET /api/movers → { gainers, losers, source }
export async function GET() {
  const data = await getMovers();
  return cachedJson(data, ttlFor(data.source, 60));
}
