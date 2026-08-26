import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { SaveSourceSchema } from "@/lib/api/schemas";
import { getDb, snapshotHash } from "@/lib/db/client";
import { projects, savedSources } from "@/lib/db/schema";
import { resolveRecord } from "@/lib/records/store";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const projectId = parseInt(idStr, 10);
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Bad project id" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = SaveSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const db = getDb();
  const project = db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const record = await resolveRecord(parsed.data.recordId);
  if (!record) {
    return NextResponse.json(
      { error: "Record not found — run the search again before saving." },
      { status: 404 },
    );
  }
  const existing = db
    .select()
    .from(savedSources)
    .where(
      and(
        eq(savedSources.projectId, projectId),
        eq(savedSources.recordId, record.id),
      ),
    )
    .get();
  if (existing) {
    return NextResponse.json({ saved: existing, alreadySaved: true });
  }
  const saved = db
    .insert(savedSources)
    .values({
      projectId,
      recordId: record.id,
      provider: record.provider,
      providerItemId: record.providerItemId,
      url: record.url,
      title: record.title,
      snapshot: JSON.stringify(record),
      snapshotHash: snapshotHash({
        title: record.title,
        url: record.url,
        date: record.dates.created,
      }),
    })
    .returning()
    .get();
  return NextResponse.json({ saved }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const projectId = parseInt(idStr, 10);
  const recordId = req.nextUrl.searchParams.get("recordId");
  if (!Number.isFinite(projectId) || !recordId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const db = getDb();
  db.delete(savedSources)
    .where(
      and(
        eq(savedSources.projectId, projectId),
        eq(savedSources.recordId, recordId),
      ),
    )
    .run();
  return NextResponse.json({ ok: true });
}
