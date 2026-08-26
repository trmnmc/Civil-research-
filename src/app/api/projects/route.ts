import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { CreateProjectSchema } from "@/lib/api/schemas";
import { getDb } from "@/lib/db/client";
import { projects, savedSources } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const rows = db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      sourceCount: sql<number>`(select count(*) from ${savedSources} where ${savedSources.projectId} = ${projects.id})`,
    })
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .all();
  return NextResponse.json({ projects: rows });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project", detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const db = getDb();
  const inserted = db
    .insert(projects)
    .values({ name: parsed.data.name, description: parsed.data.description })
    .returning()
    .get();
  return NextResponse.json({ project: inserted }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = parseInt(req.nextUrl.searchParams.get("id") ?? "", 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const db = getDb();
  db.delete(projects).where(eq(projects.id, id)).run();
  return NextResponse.json({ ok: true });
}
