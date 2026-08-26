import { NextRequest, NextResponse } from "next/server";
import { WorldviewRequestSchema } from "@/lib/api/schemas";
import { resolveRecords } from "@/lib/records/store";
import { synthesizeWorldview } from "@/lib/worldview/synthesize";
import type { LensState } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = WorldviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid worldview request", detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const records = await resolveRecords(parsed.data.recordIds);
  const synthesis = await synthesizeWorldview(
    records,
    parsed.data.lens as LensState,
    parsed.data.asOf,
  );
  return NextResponse.json({ synthesis });
}
