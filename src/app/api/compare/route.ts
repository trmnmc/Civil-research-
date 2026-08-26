import { NextRequest, NextResponse } from "next/server";
import { CompareRequestSchema } from "@/lib/api/schemas";
import { comparePerspectives } from "@/lib/compare/compare";
import { resolveRecords } from "@/lib/records/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = CompareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid compare request", detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const [left, right] = await Promise.all([
    resolveRecords(parsed.data.leftIds),
    resolveRecords(parsed.data.rightIds),
  ]);
  const result = comparePerspectives(left, right);
  return NextResponse.json({ result });
}
