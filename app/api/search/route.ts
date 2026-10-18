import type { NextRequest } from "next/server";
import { badRequest, cachedJson } from "@/lib/api";
import { searchSymbols } from "@/lib/providers";

// GET /api/search?q=apple
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length > 40) return badRequest("Query too long");
  return cachedJson({ results: await searchSymbols(q) }, 3600);
}
