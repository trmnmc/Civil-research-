"use client";

/**
 * "Worldview at the Time" — renders the evidence-grounded synthesis. Every
 * claim shows its citations inline; clicking one opens the record. The
 * factual layer (the sources) never changes with the lens; this panel is
 * explicitly the perspective layer.
 */

import { useState } from "react";
import { AlertTriangle, BookOpen, Quote } from "lucide-react";
import type { SourceRecord, WorldviewSynthesis } from "@/lib/types";
import {
  ALIGNMENT_LABELS,
  BAND_LABELS,
  SOCIAL_POSITION_LABELS,
} from "@/lib/search/perspective";
import { Badge } from "@/components/ui/badge";

const KIND_LABELS: Record<string, string> = {
  knowledge: "What they could know",
  stakes: "What they believed was at stake",
  "fears-hopes": "Fears and hopes",
  language: "Language and framing",
  limits: "Where understanding was limited or contested",
};

export function WorldviewPanel({
  synthesis,
  recordsById,
  onOpenRecord,
}: {
  synthesis: WorldviewSynthesis;
  recordsById: Map<string, SourceRecord>;
  onOpenRecord: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const p = synthesis.profile;

  const grouped = new Map<string, typeof synthesis.claims>();
  for (const claim of synthesis.claims) {
    grouped.set(claim.kind, [...(grouped.get(claim.kind) ?? []), claim]);
  }

  return (
    <section
      aria-label="Worldview at the time"
      className="rounded-lg border border-rule bg-paper-raised p-4 shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="doc-serif text-base font-semibold">
            Worldview at the Time
          </h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            {BAND_LABELS[p.region]}
            {p.socialPositions.length > 0 &&
              ` · ${p.socialPositions.map((s) => SOCIAL_POSITION_LABELS[s]).join(", ")}`}
            {p.alignments.length > 0 &&
              ` · ${p.alignments.map((a) => ALIGNMENT_LABELS[a]).join(", ")}`}
            {` · information as of ${p.asOf}`}
          </p>
        </div>
        <Badge title="How this synthesis was produced">
          {synthesis.method === "ai" ? "AI, evidence-validated" : "Rule-based"}
        </Badge>
      </div>

      <p className="mb-3 rounded border border-rule bg-paper-sunken px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-soft">
        An evidence-based synthesis from the retrieved sources — not
        role-play, and not a change to any fact. Claims are paraphrase only;
        exact wording lives in the cited documents. Beliefs, rumors, and
        propaganda are described as such.
      </p>

      {synthesis.insufficient ? (
        <div className="flex items-start gap-2 rounded border border-warn/30 bg-warn-soft p-3 text-sm text-warn">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Not enough evidence to synthesize</p>
            <p className="mt-0.5 text-xs">{synthesis.insufficient.reason}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {[...grouped.entries()].map(([kind, claims]) => (
            <div key={kind}>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {KIND_LABELS[kind] ?? kind}
              </h3>
              <ul className="space-y-2">
                {claims.map((claim, i) => (
                  <li key={i} className="text-sm leading-relaxed text-ink">
                    {claim.text}
                    {claim.caveat && (
                      <span className="ml-1 text-xs italic text-warn">
                        ({claim.caveat})
                      </span>
                    )}
                    <span className="ml-1.5 inline-flex flex-wrap gap-1 align-baseline">
                      {claim.evidence.map((id) => {
                        const rec = recordsById.get(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => onOpenRecord(id)}
                            title={rec ? rec.title : id}
                            className="inline-flex cursor-pointer items-center gap-0.5 rounded border border-rule bg-paper-sunken px-1.5 py-0.5 text-[10px] text-ink-soft hover:border-accent hover:text-accent"
                          >
                            <Quote className="size-2.5" aria-hidden />
                            {rec
                              ? rec.title.length > 34
                                ? `${rec.title.slice(0, 32)}…`
                                : rec.title
                              : id}
                          </button>
                        );
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {synthesis.limitations.length > 0 && (
        <div className="mt-3 border-t border-rule pt-2">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Limitations of this evidence
          </h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-ink-soft">
            {synthesis.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 border-t border-rule pt-2 text-xs text-ink-faint">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1 hover:text-ink"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          <BookOpen className="size-3.5" aria-hidden />
          {synthesis.consulted.length} sources consulted
        </button>
        {showAll && (
          <ul className="mt-1 space-y-0.5">
            {synthesis.consulted.map((id) => {
              const rec = recordsById.get(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onOpenRecord(id)}
                    className="cursor-pointer text-left hover:text-accent hover:underline"
                  >
                    {rec?.title ?? id}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
