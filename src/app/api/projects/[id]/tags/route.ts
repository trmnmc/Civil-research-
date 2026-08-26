import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { TagSchema } from "@/lib/api/schemas";
import { getDb } from "@/lib/db/client";
import { sourceTags, tags } from "@/lib/db/schema";

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
  const parsed = TagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
  }
  const db = getDb();
  const name = parsed.data.name.trim().toLowerCase();
  let tag = db
    .select()
    .from(tags)
    .where(and(eq(tags.projectId, projectId), eq(tags.name, name)))
    .get();
  if (!tag) {
    tag = db.insert(tags).values({ projectId, name }).returning().get();
  }
  const existing = db
    .select()
    .from(sourceTags)
    .where(
      and(
        eq(sourceTags.savedSourceId, parsed.data.savedSourceId),
        eq(sourceTags.tagId, tag.id),
      ),
    )
    .get();
  if (!existing) {
    db.insert(sourceTags)
      .values({ savedSourceId: parsed.data.savedSourceId, tagId: tag.id })
      .run();
  }
  return NextResponse.json({ tag }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await ctx.params;
  const savedSourceId = parseInt(
    req.nextUrl.searchParams.get("savedSourceId") ?? "",
    10,
  );
  const tagId = parseInt(req.nextUrl.searchParams.get("tagId") ?? "", 10);
  if (!Number.isFinite(savedSourceId) || !Number.isFinite(tagId)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const db = getDb();
  db.delete(sourceTags)
    .where(
      and(
        eq(sourceTags.savedSourceId, savedSourceId),
        eq(sourceTags.tagId, tagId),
      ),
    )
    .run();
  return NextResponse.json({ ok: true });
}
