"use client";

/** Dialog to save a record into a notebook project (create-on-the-fly). */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectRow {
  id: number;
  name: string;
  sourceCount: number;
}

export function SaveToProjectDialog({
  recordId,
  open,
  onOpenChange,
}: {
  recordId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects ?? []);
        setMessage(undefined);
      })
      .catch(() => setProjects([]));
  }, [open]);

  async function saveTo(projectId: number) {
    if (!recordId) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const res = await fetch(`/api/projects/${projectId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage(
        data.alreadySaved ? "Already saved in that project." : "Saved.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function createAndSave() {
    if (!newName.trim()) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create project");
      setNewName("");
      await saveTo(data.project.id);
      const list = await fetch("/api/projects").then((r) => r.json());
      setProjects(list.projects ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not create project");
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="save-desc">
        <DialogTitle>Save to project</DialogTitle>
        <DialogDescription id="save-desc">
          Saved sources keep their stable archive identifier and full metadata,
          so they restore even when the archive is unreachable.
        </DialogDescription>
        {projects.length > 0 ? (
          <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => saveTo(p.id)}
                  className="flex w-full cursor-pointer items-center justify-between rounded border border-rule px-3 py-2 text-left text-sm hover:bg-paper-sunken disabled:opacity-50"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-ink-faint">
                    {p.sourceCount} source{p.sourceCount === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-ink-faint">
            No projects yet — create the first one below.
          </p>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            createAndSave();
          }}
        >
          <label htmlFor="new-project-name" className="sr-only">
            New project name
          </label>
          <Input
            id="new-project-name"
            placeholder="New project name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={busy || !newName.trim()}>
            Create &amp; save
          </Button>
        </form>
        {message && (
          <p aria-live="polite" className="mt-2 text-sm text-ok">
            {message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
