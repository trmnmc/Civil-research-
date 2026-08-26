import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  collectionMembers,
  collections,
  notes,
  projects,
  savedSources,
  sourceTags,
  tags,
} from "@/lib/db/schema";
import type { SourceRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Bad project id" }, { status: 400 });
  }
  const db = getDb();
  const project = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const sources = db
    .select()
    .from(savedSources)
    .where(eq(savedSources.projectId, id))
    .orderBy(asc(savedSources.savedAt))
    .all()
    .map((row) => ({
      ...row,
      record: JSON.parse(row.snapshot) as SourceRecord,
      snapshot: undefined,
    }));
  const noteRows = db
    .select()
    .from(notes)
    .where(eq(notes.projectId, id))
    .orderBy(asc(notes.createdAt))
    .all();
  const tagRows = db.select().from(tags).where(eq(tags.projectId, id)).all();
  const sourceTagRows = db
    .select({
      savedSourceId: sourceTags.savedSourceId,
      tagId: sourceTags.tagId,
      name: tags.name,
    })
    .from(sourceTags)
    .innerJoin(tags, eq(sourceTags.tagId, tags.id))
    .where(eq(tags.projectId, id))
    .all();
  const collectionRows = db
    .select()
    .from(collections)
    .where(eq(collections.projectId, id))
    .all();
  const memberRows = collectionRows.length
    ? db
        .select()
        .from(collectionMembers)
        .all()
        .filter((m) => collectionRows.some((c) => c.id === m.collectionId))
    : [];

  return NextResponse.json({
    project,
    sources,
    notes: noteRows,
    tags: tagRows,
    sourceTags: sourceTagRows,
    collections: collectionRows,
    collectionMembers: memberRows,
  });
}
