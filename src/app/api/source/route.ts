import { NextRequest, NextResponse } from "next/server";
import { citationBundle } from "@/lib/cite/cite";
import { fetchChroniclingFullText } from "@/lib/providers/chronicling";
import { resolveRecord } from "@/lib/records/store";
import { isDemoMode } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const record = await resolveRecord(id);
  if (!record) {
    return NextResponse.json(
      {
        error:
          "This record is not available right now. It may have expired from the session cache — run the search again, or open it from a saved project.",
      },
      { status: 404 },
    );
  }

  // On-demand full OCR text for Chronicling America pages (live mode only).
  let fullText: string | undefined;
  if (
    record.provider === "chronicling" &&
    !isDemoMode() &&
    /loc\.gov\/resource\//.test(record.url)
  ) {
    fullText = await fetchChroniclingFullText(record.url);
  }

  return NextResponse.json({
    record,
    citations: citationBundle(record),
    fullText,
  });
}
