import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { CollectionMemberSchema, CollectionSchema } from "@/lib/api/schemas";
import { getDb } from "@/lib/db/client";
import { collectionMembers, collections } from "@/lib/db/schema";
import { z } from "zod";

export const runtime = "nodejs";

const PostSchema = z.union([
  z.object({ action: z.literal("create"), collection: CollectionSchema }),
  z.object({
    action: z.literal("add-member"),
    collectionId: z.number().int(),
    member: CollectionMemberSchema,
  }),
  z.object({
    action: z.literal("remove-member"),
    collectionId: z.number().int(),
    savedSourceId: z.number().int(),
  }),
]);

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
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const db = getDb();
  const data = parsed.data;
  if (data.action === "create") {
    const created = db
      .insert(collections)
      .values({
        projectId,
        name: data.collection.name,
        kind: data.collection.kind,
      })
      .returning()
      .get();
    return NextResponse.json({ collection: created }, { status: 201 });
  }
  if (data.action === "add-member") {
    const existing = db
      .select()
      .from(collectionMembers)
      .where(
        and(
          eq(collectionMembers.collectionId, data.collectionId),
          eq(collectionMembers.savedSourceId, data.member.savedSourceId),
        ),
      )
      .get();
    if (existing) {
      db.update(collectionMembers)
        .set({ side: data.member.side ?? existing.side })
        .where(eq(collectionMembers.id, existing.id))
        .run();
      return NextResponse.json({ member: { ...existing, side: data.member.side ?? existing.side } });
    }
    const member = db
      .insert(collectionMembers)
      .values({
        collectionId: data.collectionId,
        savedSourceId: data.member.savedSourceId,
        side: data.member.side,
      })
      .returning()
      .get();
    return NextResponse.json({ member }, { status: 201 });
  }
  db.delete(collectionMembers)
    .where(
      and(
        eq(collectionMembers.collectionId, data.collectionId),
        eq(collectionMembers.savedSourceId, data.savedSourceId),
      ),
    )
    .run();
  return NextResponse.json({ ok: true });
}
