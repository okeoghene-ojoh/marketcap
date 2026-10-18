import { cachedJson } from "@/lib/api";
import { getMovers } from "@/lib/providers";

export const dynamic = "force-dynamic";

// GET /api/movers → { gainers, losers, source }
export async function GET() {
  return cachedJson(await getMovers(), 60);
}
