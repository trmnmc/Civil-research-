"use client";

/**
 * The source workspace: scan beside transcription, primary-source analysis,
 * and one-click citations. Archive metadata and application inference are
 * visibly separated throughout.
 */

import { useEffect, useState } from "react";
import {
  BookmarkPlus,
  Check,
  Copy,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { SourceRecord } from "@/lib/types";
import type { CitationBundle } from "@/lib/cite/cite";
import { fetchSource } from "@/lib/client/api";
import { describePerspective, BAND_LABELS } from "@/lib/search/perspective";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassificationBadge, EVIDENCE_DISPLAY } from "./evidence";
import { Transcript } from "./Transcript";
import { SaveToProjectDialog } from "./SaveToProject";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard unavailable — show the text for manual copy.
          window.prompt(`Copy ${label}:`, text);
        }
      }}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

/** Primary-source analysis: methodology questions, honestly answered. */
function AnalysisPanel({ record }: { record: SourceRecord }) {
  const evidence = EVIDENCE_DISPLAY[record.classification.evidenceClass];
  const rows: { q: string; metadata?: string; inference?: string }[] = [
    {
      q: "Who created it?",
      metadata: record.creator ?? "Not recorded in the archive metadata.",
    },
    {
      q: "Who received or read it?",
      metadata: record.recipient,
      inference: record.recipient
        ? undefined
        : record.format === "newspaper"
          ? "A newspaper's audience was its subscribers and exchange papers; contents were commonly read aloud and reprinted."
          : record.classification.evidenceClass === "public-argument"
            ? "Made for a public audience by design."
            : "Not recorded; consider who plausibly saw this kind of document.",
    },
    {
      q: "When and where was it created?",
      metadata: [record.dates.display ?? record.dates.created, record.place]
        .filter(Boolean)
        .join(" — ") || "Not recorded.",
    },
    {
      q: "What type of document is it?",
      metadata: record.formatLabel ?? record.format.replace(/-/g, " "),
      inference: `${evidence.label}: ${evidence.short}.`,
    },
    {
      q: "Why was it likely created?",
      inference: record.classification.explanation,
    },
    {
      q: "What was happening at the time?",
      inference: record.dates.eventDate
        ? `The document concerns events of ${record.dates.eventDate}; check what its author could and could not yet know.`
        : record.dates.sortYear
          ? `Created in ${record.dates.sortYear}. Place it against that year's events before drawing conclusions.`
          : "Date uncertain — establish the date before using this as time-bound evidence.",
    },
    {
      q: "What does it uniquely contribute?",
      inference:
        record.transcript.available && record.transcript.text
          ? "Its own words, quoted above exactly. What it emphasizes — and omits — is evidence."
          : "Its metadata locates an original record; the contribution is in the document itself at the archive.",
    },
    {
      q: "What are its limitations?",
      inference: [
        record.classification.evidenceClass === "retrospective-firsthand"
          ? "Written after the fact: memory and hindsight shape it."
          : undefined,
        record.classification.evidenceClass === "public-argument"
          ? "Composed to persuade: treat assertions as claims, not findings."
          : undefined,
        record.transcript.isOcr
          ? "Text is machine OCR and may contain reading errors."
          : undefined,
        record.perspective.basis === "inferred"
          ? "Regional attribution is inferred from place metadata only — location is not loyalty."
          : undefined,
        "One document is one vantage point; corroborate before generalizing.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      q: "What evidence would corroborate it?",
      inference:
        record.format === "newspaper"
          ? "Other papers of different politics covering the same days; letters or diaries mentioning the same events; official reports."
          : record.format === "letter" || record.format === "diary"
            ? "Newspapers from the same weeks, other letters from the same community, and official records naming the same people or units."
            : "Documents of a different class (private, press, official) concerning the same event, place, and dates.",
    },
  ];
  return (
    <div className="space-y-3">
      <p className="rounded border border-rule bg-paper-sunken px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-soft">
        <strong className="font-semibold">Archive metadata</strong> is shown as
        recorded by the holding archive.{" "}
        <strong className="font-semibold">Application inference</strong> is
        Archive Lens&apos;s reading of that metadata, and is labeled as such.
      </p>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.q} className="border-b border-rule pb-2 last:border-0">
            <dt className="doc-serif text-sm font-semibold">{row.q}</dt>
            {row.metadata && (
              <dd className="mt-0.5 text-sm text-ink">
                <Badge className="mr-1.5 align-middle">metadata</Badge>
                {row.metadata}
              </dd>
            )}
            {row.inference && (
              <dd className="mt-0.5 text-sm text-ink-soft">
                <Badge variant="accent" className="mr-1.5 align-middle">
                  inference
                </Badge>
                {row.inference}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SourceWorkspace({
  recordId,
  initialSearchTerm,
}: {
  recordId: string;
  initialSearchTerm?: string;
}) {
  // State is keyed by the record id it was loaded for, so switching records
  // shows the loading state without a synchronous reset inside the effect.
  const [loaded, setLoaded] = useState<{
    forId: string;
    data?: { record: SourceRecord; citations: CitationBundle; fullText?: string };
    error?: string;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSource(recordId)
      .then((d) => active && setLoaded({ forId: recordId, data: d }))
      .catch(
        (e) =>
          active &&
          setLoaded({
            forId: recordId,
            error: e instanceof Error ? e.message : "Failed to load",
          }),
      );
    return () => {
      active = false;
    };
  }, [recordId]);

  const current = loaded?.forId === recordId ? loaded : null;
  const data = current?.data ?? null;
  const error = current?.error;

  if (error) {
    return (
      <div className="rounded-lg border border-err/30 bg-err-soft p-4 text-sm text-err">
        <p className="font-semibold">Source unavailable</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading source">
        <div className="h-8 w-2/3 animate-pulse-soft rounded bg-paper-sunken" />
        <div className="h-40 animate-pulse-soft rounded bg-paper-sunken" />
        <div className="h-24 animate-pulse-soft rounded bg-paper-sunken" />
      </div>
    );
  }

  const { record, citations, fullText } = data;

  return (
    <article aria-label={record.title} className="space-y-4">
      <header>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <ClassificationBadge
            evidenceClass={record.classification.evidenceClass}
            confidence={record.classification.confidence}
          />
          <Badge>{record.formatLabel ?? record.format}</Badge>
          <Badge>{BAND_LABELS[record.perspective.region]}</Badge>
          {record.provider === "demo" && (
            <Badge variant="accent" title={record.provenance}>
              Verified reference record
            </Badge>
          )}
        </div>
        <h1 className="doc-serif text-xl font-semibold leading-snug">
          {record.title}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {[record.creator, record.dates.display ?? record.dates.created, record.place]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <dl className="mt-2 grid gap-x-6 gap-y-0.5 text-xs text-ink-faint sm:grid-cols-2">
          {record.dates.created && (
            <div>Document created: {record.dates.created}</div>
          )}
          {record.dates.eventDate && record.dates.eventDate !== record.dates.created && (
            <div>Events concerned: {record.dates.eventDate}</div>
          )}
          {record.dates.publishedLater && (
            <div>Later edition/transcription: {record.dates.publishedLater}</div>
          )}
          <div title={record.perspective.note}>
            Perspective: {describePerspective(record.perspective)} (
            {record.perspective.basis === "archive-metadata"
              ? "archive metadata"
              : record.perspective.basis})
          </div>
        </dl>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              <ExternalLink aria-hidden /> Open at {record.citation.archiveName}
            </Button>
          </a>
          <Button size="sm" variant="secondary" onClick={() => setSaveOpen(true)}>
            <BookmarkPlus aria-hidden /> Save to project
          </Button>
        </div>
      </header>

      <div className="mb-1 rounded border border-rule bg-paper-sunken px-2.5 py-1.5 text-xs leading-relaxed text-ink-soft">
        Classification: {record.classification.explanation}{" "}
        <span className="text-ink-faint">
          (signals: {record.classification.signals.join("; ")})
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Scan side */}
        <section aria-label="Scan" className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Scan</h2>
            {record.thumbnailUrl && (
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Zoom out"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut aria-hidden />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Zoom in"
                  onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                >
                  <ZoomIn aria-hidden />
                </Button>
              </div>
            )}
          </div>
          {record.thumbnailUrl ? (
            <div className="max-h-[560px] overflow-auto rounded border border-rule bg-paper-sunken p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={record.thumbnailUrl}
                alt={`Scan of ${record.title} (served by the archive)`}
                style={{ width: `${zoom * 100}%` }}
                className="mx-auto"
              />
            </div>
          ) : record.scanAvailable ? (
            <div className="rounded border border-rule bg-paper-sunken p-4 text-sm text-ink-soft">
              A scan exists at the archive but is not embedded here. Use{" "}
              <a
                className="text-accent underline"
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                the archive record
              </a>{" "}
              to view pages, zoom, and navigate.
            </div>
          ) : (
            <div className="rounded border border-rule bg-paper-sunken p-4 text-sm text-ink-soft">
              No digitized scan is recorded for this item. The original may
              exist only on paper or microfilm — the archive record explains
              access.
            </div>
          )}
          <p className="mt-1 text-[11px] text-ink-faint">
            Rights: {record.rights.statement}
          </p>
        </section>

        {/* Text side */}
        <section aria-label="Transcription" className="min-w-0">
          <h2 className="mb-1.5 text-sm font-semibold">Transcription</h2>
          <Transcript
            transcript={record.transcript}
            fullText={fullText}
            initialSearch={initialSearchTerm}
          />
        </section>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">Source analysis</TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
          <TabsTrigger value="metadata">Raw metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="analysis">
          <AnalysisPanel record={record} />
        </TabsContent>
        <TabsContent value="citations">
          <div className="space-y-4">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Chicago / Turabian footnote
              </h3>
              <p className="doc-serif rounded border border-rule bg-paper-sunken p-3 text-sm">
                {citations.footnote}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Shortened footnote
              </h3>
              <p className="doc-serif rounded border border-rule bg-paper-sunken p-3 text-sm">
                {citations.shortNote}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Bibliography entry
              </h3>
              <p className="doc-serif rounded border border-rule bg-paper-sunken p-3 text-sm">
                {citations.bibliography}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={citations.footnote} label="footnote" />
              <CopyButton text={citations.shortNote} label="short note" />
              <CopyButton text={citations.bibliography} label="bibliography" />
              <CopyButton text={citations.bibtex} label="BibTeX" />
              <CopyButton text={citations.stableLink} label="stable link" />
            </div>
            <p className="text-xs text-ink-faint">
              Citations are built only from verified archive metadata; missing
              fields are omitted rather than invented.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="metadata">
          <div className="space-y-2">
            <MetaRow label="Record id" value={record.id} />
            <MetaRow label="Provider item id" value={record.providerItemId} />
            <MetaRow label="Collection" value={record.collection} />
            <MetaRow
              label="Subjects"
              value={record.subjects.length ? record.subjects.join("; ") : undefined}
            />
            <MetaRow label="Provenance" value={record.provenance} />
            <details className="text-xs">
              <summary className="cursor-pointer text-ink-soft">
                Original provider metadata (preserved verbatim)
              </summary>
              <pre className="mt-1 max-h-72 overflow-auto rounded border border-rule bg-paper-sunken p-3 text-[11px] leading-relaxed">
                {JSON.stringify(record.raw, null, 2)}
              </pre>
            </details>
          </div>
        </TabsContent>
      </Tabs>

      <SaveToProjectDialog
        recordId={record.id}
        open={saveOpen}
        onOpenChange={setSaveOpen}
      />
    </article>
  );
}
