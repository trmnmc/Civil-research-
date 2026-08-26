"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  sourceCount: number;
}

export default function NotebookPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]));

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      setName("");
      setDescription("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this project and everything saved in it?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="doc-serif text-xl font-semibold">Research Notebook</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Projects live in a local database on this machine — no account, no
          cloud. Each saved source keeps its stable archive identifier and full
          metadata so it can be restored and re-cited even offline.
        </p>
      </header>

      <form
        onSubmit={create}
        className="rounded-lg border border-rule bg-paper-raised p-4"
        aria-label="Create a project"
      >
        <h2 className="mb-2 text-sm font-semibold">New project</h2>
        <div className="space-y-2">
          <div>
            <label htmlFor="project-name" className="sr-only">
              Project name
            </label>
            <Input
              id="project-name"
              placeholder="Project name — e.g. Kentucky loyalty, 1861"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="project-desc" className="sr-only">
              Project description
            </label>
            <Textarea
              id="project-desc"
              placeholder="Research question or scope (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy || !name.trim()}>
            <Plus aria-hidden /> Create project
          </Button>
        </div>
      </form>

      {projects === null && (
        <div className="h-24 animate-pulse-soft rounded-lg border border-rule bg-paper-sunken" aria-busy="true" />
      )}
      {projects?.length === 0 && (
        <p className="rounded-lg border border-dashed border-rule-strong bg-paper-raised p-6 text-center text-sm text-ink-faint">
          No projects yet. Create one above, then save sources into it from
          search results or the source workspace.
        </p>
      )}
      <ul className="space-y-2">
        {projects?.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-lg border border-rule bg-paper-raised p-4"
          >
            <FolderOpen className="size-5 shrink-0 text-ink-faint" aria-hidden />
            <div className="min-w-0 flex-1">
              <Link
                href={`/notebook/${p.id}`}
                className="doc-serif font-semibold hover:underline"
              >
                {p.name}
              </Link>
              {p.description && (
                <p className="truncate text-xs text-ink-soft">{p.description}</p>
              )}
              <p className="text-[11px] text-ink-faint">
                {p.sourceCount} source{p.sourceCount === 1 ? "" : "s"} · created{" "}
                {p.createdAt}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Delete project ${p.name}`}
              onClick={() => remove(p.id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
