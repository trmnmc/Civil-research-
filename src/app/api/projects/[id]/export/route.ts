import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { notes, projects, savedSources } from "@/lib/db/schema";
import { bibtex, chicagoBibliography, chicagoFootnote, toCsv } from "@/lib/cite/cite";
import type { SourceRecord } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Project exports. Formats:
 *  - bibliography: Chicago/Turabian bibliography (markdown/plain text)
 *  - packet: research packet — citations, notes, links, selected quotations
 *  - bibtex: BibTeX file
 *  - csv: metadata CSV
 * Full scans are never bundled: exports carry citations and links, honoring
 * archive redistribution limits.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const projectId = parseInt(idStr, 10);
  const format = req.nextUrl.searchParams.get("format") ?? "bibliography";
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Bad project id" }, { status: 400 });
  }
  if (!["bibliography", "packet", "bibtex", "csv"].includes(format)) {
    return NextResponse.json(
      { error: `Unknown export format "${format}". Use bibliography, packet, bibtex, or csv.` },
      { status: 400 },
    );
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
  const sourceRows = db
    .select()
    .from(savedSources)
    .where(eq(savedSources.projectId, projectId))
    .orderBy(asc(savedSources.savedAt))
    .all();
  const records = sourceRows.map(
    (r) => JSON.parse(r.snapshot) as SourceRecord,
  );
  const noteRows = db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(asc(notes.createdAt))
    .all();

  const filenameBase = project.name.replace(/[^\w-]+/g, "-").toLowerCase();

  if (format === "csv") {
    return new NextResponse(toCsv(records), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}-sources.csv"`,
      },
    });
  }

  if (format === "bibtex") {
    const body = records.map(bibtex).join("\n\n") + "\n";
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/x-bibtex; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.bib"`,
      },
    });
  }

  if (format === "packet") {
    const lines: string[] = [
      `# Research packet — ${project.name}`,
      "",
      project.description ?? "",
      "",
      `Exported ${new Date().toISOString().slice(0, 10)} from Archive Lens. Scans are not redistributed; every entry links to the holding archive.`,
      "",
      "## Sources",
      "",
    ];
    sourceRows.forEach((row, i) => {
      const rec = records[i];
      lines.push(`### ${i + 1}. ${rec.title}`);
      lines.push("");
      lines.push(`- Citation: ${chicagoBibliography(rec)}`);
      lines.push(`- Footnote: ${chicagoFootnote(rec)}`);
      lines.push(`- Archive link: ${rec.url}`);
      lines.push(
        `- Evidence class: ${rec.classification.evidenceClass.replace(/-/g, " ")} (${rec.classification.confidence} confidence)`,
      );
      if (rec.transcript.text && rec.transcript.isExcerpt) {
        lines.push(
          `- Bundled excerpt (verbatim; see transcript source note): ${JSON.stringify(rec.transcript.text.slice(0, 300))}`,
        );
      }
      const sourceNotes = noteRows.filter((n) => n.savedSourceId === row.id);
      for (const n of sourceNotes) {
        lines.push(`- Note (${n.createdAt}): ${n.body}`);
        if (n.quotation) lines.push(`  - Captured quotation: ${JSON.stringify(n.quotation)}`);
      }
      lines.push("");
    });
    const projectNotes = noteRows.filter((n) => !n.savedSourceId);
    if (projectNotes.length > 0) {
      lines.push("## Project notes", "");
      for (const n of projectNotes) {
        lines.push(`- (${n.createdAt}) ${n.body}`);
      }
      lines.push("");
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}-packet.md"`,
      },
    });
  }

  // Default: bibliography
  const bibliography = [
    `Bibliography — ${project.name}`,
    "",
    ...records
      .map(chicagoBibliography)
      .sort((a, b) => a.localeCompare(b))
      .map((entry) => entry),
  ].join("\n\n");
  return new NextResponse(bibliography, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}-bibliography.txt"`,
    },
  });
}
