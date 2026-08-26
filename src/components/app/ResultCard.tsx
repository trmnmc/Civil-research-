"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Columns2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import type { RankedRecord, RegionBand } from "@/lib/types";
import { encodeRecordId } from "@/lib/utils";
import { BAND_LABELS, describePerspective } from "@/lib/search/perspective";
import { addToBasket } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClassificationBadge } from "./evidence";

const BAND_VARIANT: Record<RegionBand, "north" | "border" | "south" | "national" | "default"> = {
  north: "north",
  border: "border",
  south: "south",
  national: "national",
  unknown: "default",
};

export function ResultCard({
  ranked,
  onOpen,
  onSave,
  selected,
}: {
  ranked: RankedRecord;
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  selected?: boolean;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [basketNote, setBasketNote] = useState<string | undefined>();
  const r = ranked.record;
  const why = ranked.explanation.matchedTerms.filter((m) => m.field !== "why");
  const extra = ranked.explanation.matchedTerms.filter((m) => m.field === "why");

  return (
    <article
      className={`rounded-lg border bg-paper-raised p-4 shadow-sm transition-colors ${
        selected ? "border-accent" : "border-rule"
      }`}
      aria-label={r.title}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <ClassificationBadge
          evidenceClass={r.classification.evidenceClass}
          confidence={r.classification.confidence}
        />
        <Badge variant={BAND_VARIANT[r.perspective.region]}>
          {BAND_LABELS[r.perspective.region]}
          {r.state ? ` · ${r.state}` : ""}
        </Badge>
        <Badge>{(r.formatLabel ?? r.format).toString()}</Badge>
        {r.provider === "demo" && (
          <Badge variant="accent" title={r.provenance}>
            Verified reference record
          </Badge>
        )}
        <span className="ml-auto text-[11px] text-ink-faint">
          {r.citation.archiveName}
        </span>
      </div>

      <h3 className="doc-serif text-[15px] font-semibold leading-snug">
        <button
          type="button"
          onClick={() => onOpen(r.id)}
          className="text-left hover:underline cursor-pointer"
        >
          {r.title}
        </button>
      </h3>

      <p className="mt-0.5 text-xs text-ink-soft">
        {[
          r.creator,
          r.dates.display ?? r.dates.created,
          r.place,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {r.dates.eventDate && r.dates.eventDate !== r.dates.created && (
        <p className="text-[11px] text-ink-faint">
          Concerns events of {r.dates.eventDate}
          {r.dates.publishedLater ? `; this edition published ${r.dates.publishedLater}` : ""}
        </p>
      )}

      {r.description && (
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {r.description}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <FileText className="size-3.5" aria-hidden />
          {r.transcript.available
            ? r.transcript.isOcr
              ? "OCR text (verify against scan)"
              : "Transcript"
            : "No transcript bundled"}
        </span>
        <span className="inline-flex items-center gap-1">
          <ImageIcon className="size-3.5" aria-hidden />
          {r.scanAvailable ? "Scan at archive" : "No scan digitized"}
        </span>
        <span title={r.perspective.note}>{describePerspective(r.perspective)}</span>
      </div>

      <div className="mt-2 border-t border-rule pt-2">
        <button
          type="button"
          onClick={() => setWhyOpen((v) => !v)}
          className="inline-flex cursor-pointer items-center gap-1 text-xs text-accent hover:underline"
          aria-expanded={whyOpen}
        >
          {whyOpen ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
          Why this matched
        </button>
        {whyOpen && (
          <div className="mt-1.5 space-y-1 text-xs text-ink-soft">
            {why.length > 0 && (
              <p>
                Matched terms:{" "}
                {why.map((m, i) => (
                  <span key={`${m.term}-${m.field}-${i}`}>
                    <mark>{m.term}</mark>
                    <span className="text-ink-faint"> in {m.field}</span>
                    {i < why.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {extra.length > 0 && (
              <ul className="list-inside list-disc text-ink-faint">
                {extra.map((m, i) => (
                  <li key={i}>{m.term}</li>
                ))}
              </ul>
            )}
            <p className="text-ink-faint">
              Score {ranked.explanation.totalScore} ={" "}
              {ranked.explanation.scoreParts
                .map((p) => `${p.label.toLowerCase()} ${p.value}`)
                .join(" · ")}
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="secondary" onClick={() => onOpen(r.id)}>
          Open workspace
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSave(r.id)}
          aria-label={`Save ${r.title} to a project`}
        >
          <BookmarkPlus aria-hidden /> Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Add ${r.title} to comparison, left side`}
          onClick={() => {
            addToBasket("left", r.id);
            setBasketNote("Added to comparison (left).");
          }}
        >
          <Columns2 aria-hidden /> A
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Add ${r.title} to comparison, right side`}
          onClick={() => {
            addToBasket("right", r.id);
            setBasketNote("Added to comparison (right).");
          }}
        >
          <Columns2 aria-hidden /> B
        </Button>
        {basketNote && (
          <span aria-live="polite" className="text-[11px] text-ok">
            {basketNote}{" "}
            <Link className="underline" href="/compare">
              Open compare
            </Link>
          </span>
        )}
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Archive record
        </a>
        <Link
          href={`/source/${encodeRecordId(r.id)}`}
          className="sr-only"
          aria-label={`Open full source workspace for ${r.title}`}
        >
          Full workspace
        </Link>
      </div>
    </article>
  );
}
