import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { CreateNoteSchema } from "@/lib/api/schemas";
import { getDb } from "@/lib/db/client";
import { notes, projects } from "@/lib/db/schema";

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
  const parsed = CreateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note" }, { status: 400 });
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
  const note = db
    .insert(notes)
    .values({
      projectId,
      savedSourceId: parsed.data.savedSourceId,
      body: parsed.data.body,
      quotation: parsed.data.quotation,
    })
    .returning()
    .get();
  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await ctx.params;
  const noteId = parseInt(req.nextUrl.searchParams.get("noteId") ?? "", 10);
  if (!Number.isFinite(noteId)) {
    return NextResponse.json({ error: "Bad note id" }, { status: 400 });
  }
  const db = getDb();
  db.delete(notes).where(eq(notes.id, noteId)).run();
  return NextResponse.json({ ok: true });
}
