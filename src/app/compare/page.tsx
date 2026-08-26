"use client";

/**
 * Compare Perspectives: two-column research view. Documents first; beneath
 * them, cited statements about shared ground, information differences,
 * motive, language, and conflict. Either side can be locked while the other
 * changes.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Lock, LockOpen, Trash2 } from "lucide-react";
import type { ComparisonResult, SourceRecord } from "@/lib/types";
import {
  fetchCompare,
  fetchSource,
  readBasket,
  writeBasket,
  type CompareBasket,
} from "@/lib/client/api";
import { describePerspective } from "@/lib/search/perspective";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClassificationBadge } from "@/components/app/evidence";
import { Transcript } from "@/components/app/Transcript";

const STATEMENT_LABELS: Record<string, string> = {
  "shared-fact": "Shared factual ground",
  "information-differs": "Different information available",
  "motive-differs": "Different purposes and motives",
  "language-differs": "Different language",
  conflict: "Conflicts between the accounts",
};

function SideColumn({
  side,
  records,
  locked,
  onToggleLock,
  onRemove,
}: {
  side: "left" | "right";
  records: SourceRecord[];
  locked: boolean;
  onToggleLock: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section
      aria-label={`${side === "left" ? "Left" : "Right"} comparison column`}
      className="min-w-0 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Side {side === "left" ? "A" : "B"}
        </h2>
        <Button
          size="sm"
          variant={locked ? "secondary" : "ghost"}
          onClick={onToggleLock}
          aria-pressed={locked}
          aria-label={`${locked ? "Unlock" : "Lock"} side ${side === "left" ? "A" : "B"}`}
        >
          {locked ? <Lock aria-hidden /> : <LockOpen aria-hidden />}
          {locked ? "Locked" : "Lock"}
        </Button>
      </div>
      {records.length === 0 && (
        <div className="rounded-lg border border-dashed border-rule-strong bg-paper-raised p-6 text-center text-sm text-ink-faint">
          Empty. From <Link href="/" className="text-accent underline">Search</Link>,
          use the <strong>A</strong>/<strong>B</strong> buttons on any result to
          fill this side.
        </div>
      )}
      {records.map((r) => (
        <article key={r.id} className="rounded-lg border border-rule bg-paper-raised p-4">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <ClassificationBadge
              evidenceClass={r.classification.evidenceClass}
              confidence={r.classification.confidence}
            />
            <Badge>{r.formatLabel ?? r.format}</Badge>
            {!locked && (
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto h-7 w-7"
                aria-label={`Remove ${r.title} from this side`}
                onClick={() => onRemove(r.id)}
              >
                <Trash2 aria-hidden />
              </Button>
            )}
          </div>
          <h3 className="doc-serif text-[15px] font-semibold leading-snug">
            <Link
              href={`/source/${encodeURIComponent(r.id)}`}
              className="hover:underline"
            >
              {r.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-ink-soft">
            {[r.creator, r.dates.display ?? r.dates.created, r.place]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-[11px] text-ink-faint" title={r.perspective.note}>
            {describePerspective(r.perspective)}
          </p>
          <div className="mt-2">
            <Transcript transcript={r.transcript} />
          </div>
        </article>
      ))}
    </section>
  );
}

export default function ComparePage() {
  const [basket, setBasket] = useState<CompareBasket>({ left: [], right: [] });
  const [records, setRecords] = useState<Map<string, SourceRecord>>(new Map());
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockedLeft, setLockedLeft] = useState(false);
  const [lockedRight, setLockedRight] = useState(false);

  const refresh = useCallback(async () => {
    const b = readBasket();
    setBasket(b);
    const ids = [...b.left, ...b.right];
    const map = new Map<string, SourceRecord>();
    await Promise.all(
      ids.map(async (id) => {
        try {
          const { record } = await fetchSource(id);
          map.set(id, record);
        } catch {
          // Unresolvable record (expired cache) — drop it from the basket.
        }
      }),
    );
    setRecords(map);
    const left = b.left.filter((id) => map.has(id));
    const right = b.right.filter((id) => map.has(id));
    if (left.length !== b.left.length || right.length !== b.right.length) {
      writeBasket({ left, right });
      setBasket({ left, right });
    }
    if (left.length > 0 && right.length > 0) {
      setLoading(true);
      try {
        const { result } = await fetchCompare({ leftIds: left, rightIds: right });
        setResult(result);
      } finally {
        setLoading(false);
      }
    } else {
      setResult(null);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => refresh(), 0);
    const handler = () => refresh();
    window.addEventListener("archive-lens-basket", handler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("archive-lens-basket", handler);
    };
  }, [refresh]);

  const removeFrom = (side: "left" | "right", id: string) => {
    const b = readBasket();
    b[side] = b[side].filter((x) => x !== id);
    writeBasket(b);
  };

  const swap = () => {
    const b = readBasket();
    writeBasket({ left: b.right, right: b.left });
  };

  const leftRecords = basket.left
    .map((id) => records.get(id))
    .filter((r): r is SourceRecord => Boolean(r));
  const rightRecords = basket.right
    .map((id) => records.get(id))
    .filter((r): r is SourceRecord => Boolean(r));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="doc-serif text-xl font-semibold">Compare Perspectives</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-ink-soft">
            Documents first; analysis beneath, with every statement cited. Lock
            one side to hold it steady — for instance, a Kentucky Southern
            Unionist source — while you vary the other.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={swap} disabled={lockedLeft || lockedRight}>
          <ArrowLeftRight aria-hidden /> Swap sides
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SideColumn
          side="left"
          records={leftRecords}
          locked={lockedLeft}
          onToggleLock={() => setLockedLeft((v) => !v)}
          onRemove={(id) => removeFrom("left", id)}
        />
        <SideColumn
          side="right"
          records={rightRecords}
          locked={lockedRight}
          onToggleLock={() => setLockedRight((v) => !v)}
          onRemove={(id) => removeFrom("right", id)}
        />
      </div>

      <section aria-label="Comparison analysis">
        <h2 className="mb-2 text-sm font-semibold">Comparison</h2>
        {loading && (
          <div className="h-32 animate-pulse-soft rounded-lg border border-rule bg-paper-sunken" aria-busy="true" />
        )}
        {!loading && !result && (
          <p className="rounded-lg border border-dashed border-rule-strong bg-paper-raised p-6 text-center text-sm text-ink-faint">
            Add at least one source to each side to generate a cited comparison.
          </p>
        )}
        {!loading && result?.insufficient && (
          <p className="rounded-lg border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
            {result.insufficient.reason}
          </p>
        )}
        {!loading && result && !result.insufficient && (
          <div className="space-y-3">
            {result.statements.map((s, i) => (
              <div key={i} className="rounded-lg border border-rule bg-paper-raised p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {STATEMENT_LABELS[s.kind]}
                </h3>
                <p className="mt-1 text-sm leading-relaxed">{s.text}</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-ink-faint">
                  <span>
                    A:{" "}
                    {s.leftEvidence.map((id, j) => (
                      <span key={id}>
                        <Link
                          href={`/source/${encodeURIComponent(id)}`}
                          className="text-accent hover:underline"
                        >
                          {records.get(id)?.title.slice(0, 40) ?? id}
                        </Link>
                        {j < s.leftEvidence.length - 1 ? "; " : ""}
                      </span>
                    ))}
                  </span>
                  <span>
                    B:{" "}
                    {s.rightEvidence.map((id, j) => (
                      <span key={id}>
                        <Link
                          href={`/source/${encodeURIComponent(id)}`}
                          className="text-accent hover:underline"
                        >
                          {records.get(id)?.title.slice(0, 40) ?? id}
                        </Link>
                        {j < s.rightEvidence.length - 1 ? "; " : ""}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-ink-faint">
              Statements are generated mechanically from the documents&apos;
              own text, dates, and documented positions — disagreements between
              accounts are presented as evidence of the period&apos;s
              conflicts, not as equally valid versions of contested facts.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
