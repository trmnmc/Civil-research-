import { NextRequest, NextResponse } from "next/server";
import { SearchRequestSchema } from "@/lib/api/schemas";
import { runSearch } from "@/lib/search/orchestrator";
import { rememberRecords } from "@/lib/records/store";
import type { SearchRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = SearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search request", detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const response = await runSearch(parsed.data as SearchRequest);
  rememberRecords(response.results.map((r) => r.record));
  return NextResponse.json(response);
}
