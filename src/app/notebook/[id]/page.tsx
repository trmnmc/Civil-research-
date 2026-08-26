"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Columns2,
  Download,
  StickyNote,
  Tag,
  Trash2,
} from "lucide-react";
import type { SourceRecord } from "@/lib/types";
import { addToBasket } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClassificationBadge } from "@/components/app/evidence";

interface ProjectData {
  project: { id: number; name: string; description: string | null };
  sources: {
    id: number;
    recordId: string;
    url: string;
    title: string;
    savedAt: string;
    freshness: string;
    record: SourceRecord;
  }[];
  notes: {
    id: number;
    savedSourceId: number | null;
    body: string;
    quotation: string | null;
    createdAt: string;
  }[];
  sourceTags: { savedSourceId: number; tagId: number; name: string }[];
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [noteBody, setNoteBody] = useState("");
  const [noteTarget, setNoteTarget] = useState<number | "project">("project");
  const [tagInputs, setTagInputs] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    fetch(`/api/projects/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    await fetch(`/api/projects/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: noteBody.trim(),
        savedSourceId: noteTarget === "project" ? undefined : noteTarget,
      }),
    });
    setNoteBody("");
    load();
  }

  async function addTag(savedSourceId: number) {
    const name = (tagInputs[savedSourceId] ?? "").trim();
    if (!name) return;
    await fetch(`/api/projects/${id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedSourceId, name }),
    });
    setTagInputs((t) => ({ ...t, [savedSourceId]: "" }));
    load();
  }

  async function removeSource(recordId: string) {
    await fetch(
      `/api/projects/${id}/sources?recordId=${encodeURIComponent(recordId)}`,
      { method: "DELETE" },
    );
    load();
  }

  if (error) {
    return (
      <p className="rounded border border-err/30 bg-err-soft p-4 text-sm text-err">
        {error} — <Link href="/notebook" className="underline">back to the notebook</Link>.
      </p>
    );
  }
  if (!data) {
    return (
      <div className="h-40 animate-pulse-soft rounded-lg border border-rule bg-paper-sunken" aria-busy="true" />
    );
  }

  const projectNotes = data.notes.filter((n) => !n.savedSourceId);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-faint">
            <Link href="/notebook" className="hover:underline">
              Notebook
            </Link>{" "}
            / {data.project.name}
          </p>
          <h1 className="doc-serif text-xl font-semibold">{data.project.name}</h1>
          {data.project.description && (
            <p className="mt-0.5 text-sm text-ink-soft">{data.project.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Exports">
          {(
            [
              ["bibliography", "Bibliography"],
              ["packet", "Research packet"],
              ["bibtex", "BibTeX"],
              ["csv", "CSV"],
            ] as const
          ).map(([format, label]) => (
            <a key={format} href={`/api/projects/${id}/export?format=${format}`}>
              <Button size="sm" variant="secondary">
                <Download aria-hidden /> {label}
              </Button>
            </a>
          ))}
        </div>
      </header>
      <p className="text-xs text-ink-faint">
        Exports contain citations, notes, links, and permitted excerpts only —
        never redistributed scans.
      </p>

      <section aria-label="Saved sources" className="space-y-3">
        <h2 className="text-sm font-semibold">
          Saved sources ({data.sources.length})
        </h2>
        {data.sources.length === 0 && (
          <p className="rounded-lg border border-dashed border-rule-strong bg-paper-raised p-6 text-center text-sm text-ink-faint">
            Nothing saved yet. Save sources from{" "}
            <Link href="/" className="text-accent underline">
              search results
            </Link>{" "}
            or a source workspace.
          </p>
        )}
        {data.sources.map((s) => {
          const tags = data.sourceTags.filter((t) => t.savedSourceId === s.id);
          const notes = data.notes.filter((n) => n.savedSourceId === s.id);
          return (
            <article key={s.id} className="rounded-lg border border-rule bg-paper-raised p-4">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <ClassificationBadge
                  evidenceClass={s.record.classification.evidenceClass}
                  confidence={s.record.classification.confidence}
                />
                {s.freshness === "changed" && (
                  <Badge variant="warn">Archive record changed since saving</Badge>
                )}
                {s.freshness === "unreachable" && (
                  <Badge variant="err">Archive currently unreachable — showing saved copy</Badge>
                )}
                <span className="ml-auto text-[11px] text-ink-faint">
                  saved {s.savedAt}
                </span>
              </div>
              <h3 className="doc-serif text-[15px] font-semibold leading-snug">
                <Link
                  href={`/source/${encodeURIComponent(s.recordId)}`}
                  className="hover:underline"
                >
                  {s.title}
                </Link>
              </h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                {[
                  s.record.creator,
                  s.record.dates.display ?? s.record.dates.created,
                  s.record.place,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <Badge key={t.tagId}>
                    <Tag aria-hidden /> {t.name}
                  </Badge>
                ))}
                <form
                  className="flex items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTag(s.id);
                  }}
                >
                  <label htmlFor={`tag-${s.id}`} className="sr-only">
                    Add tag to {s.title}
                  </label>
                  <Input
                    id={`tag-${s.id}`}
                    placeholder="add tag…"
                    className="h-7 w-28 text-xs"
                    value={tagInputs[s.id] ?? ""}
                    onChange={(e) =>
                      setTagInputs((t) => ({ ...t, [s.id]: e.target.value }))
                    }
                  />
                  <Button type="submit" size="sm" variant="ghost">
                    Add
                  </Button>
                </form>
                <span className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Add ${s.title} to comparison left side`}
                    onClick={() => addToBasket("left", s.recordId)}
                  >
                    <Columns2 aria-hidden /> A
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Add ${s.title} to comparison right side`}
                    onClick={() => addToBasket("right", s.recordId)}
                  >
                    <Columns2 aria-hidden /> B
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove ${s.title} from project`}
                    onClick={() => removeSource(s.recordId)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </span>
              </div>

              {notes.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-rule pt-2">
                  {notes.map((n) => (
                    <li key={n.id} className="text-sm text-ink-soft">
                      <StickyNote className="mr-1 inline size-3.5 text-ink-faint" aria-hidden />
                      {n.body}
                      {n.quotation && (
                        <span className="doc-serif block pl-5 text-xs text-ink-faint">
                          Captured quotation: “{n.quotation}”
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      <section aria-label="Notes" className="rounded-lg border border-rule bg-paper-raised p-4">
        <h2 className="mb-2 text-sm font-semibold">Add a note</h2>
        <form onSubmit={addNote} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="note-target" className="text-xs text-ink-soft">
              Attach to
            </label>
            <select
              id="note-target"
              className="h-8 rounded-md border border-rule-strong bg-paper-raised px-2 text-xs"
              value={noteTarget === "project" ? "project" : String(noteTarget)}
              onChange={(e) =>
                setNoteTarget(
                  e.target.value === "project"
                    ? "project"
                    : parseInt(e.target.value, 10),
                )
              }
            >
              <option value="project">Whole project</option>
              {data.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>
          <label htmlFor="note-body" className="sr-only">
            Note text
          </label>
          <Textarea
            id="note-body"
            placeholder="Observations, leads, questions…"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
          <Button type="submit" disabled={!noteBody.trim()}>
            <StickyNote aria-hidden /> Save note
          </Button>
        </form>
        {projectNotes.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-rule pt-2">
            {projectNotes.map((n) => (
              <li key={n.id} className="text-sm text-ink-soft">
                <span className="text-[11px] text-ink-faint">{n.createdAt}</span>{" "}
                {n.body}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
