"use client";

/**
 * Transcript display: exact document text, never silently repaired.
 * - OCR text carries a visible warning and uncertain-character note.
 * - Offensive historical language sits behind a content notice with an
 *   explicit reveal control; the text itself is never altered.
 * - A search box highlights matches without changing the text.
 */

import { useMemo, useState } from "react";
import { AlertTriangle, Eye, ScanSearch } from "lucide-react";
import {
  contentNoticeLevel,
  OFFENSIVE_NOTICE,
  PERIOD_NOTICE,
} from "@/lib/content-notice";
import type { TranscriptInfo } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function highlight(text: string, term: string): React.ReactNode {
  if (!term.trim() || term.length < 2) return text;
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();
  let idx = 0;
  let key = 0;
  while (true) {
    const found = lower.indexOf(needle, idx);
    if (found === -1) {
      parts.push(text.slice(idx));
      break;
    }
    parts.push(text.slice(idx, found));
    parts.push(<mark key={key++}>{text.slice(found, found + term.length)}</mark>);
    idx = found + term.length;
  }
  return parts;
}

export function Transcript({
  transcript,
  fullText,
  initialSearch,
}: {
  transcript: TranscriptInfo;
  fullText?: string;
  initialSearch?: string;
}) {
  const text = fullText ?? transcript.text;
  const [revealed, setRevealed] = useState(false);
  const [term, setTerm] = useState(initialSearch ?? "");
  const notice = useMemo(() => contentNoticeLevel(text), [text]);

  if (!text) {
    return (
      <div className="rounded border border-rule bg-paper-sunken p-4 text-sm text-ink-soft">
        <p className="font-medium text-ink">No transcription bundled here.</p>
        <p className="mt-1 text-xs leading-relaxed">
          {transcript.sourceNote ??
            "This record has no machine-readable text in Archive Lens. Open the archive record to check for a transcription or to read the scan."}
        </p>
      </div>
    );
  }

  const gated = notice === "offensive" && !revealed;

  return (
    <div className="space-y-2">
      {transcript.isOcr && (
        <p className="flex items-start gap-1.5 rounded border border-warn/30 bg-warn-soft px-2.5 py-1.5 text-xs leading-relaxed text-warn">
          <ScanSearch className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Machine OCR — characters may be misread and are never silently
            corrected here. Verify wording against the scan before quoting.
            {transcript.ocrQualityNote ? ` ${transcript.ocrQualityNote}` : ""}
          </span>
        </p>
      )}
      {notice === "period-language" && (
        <p className="rounded border border-rule bg-paper-sunken px-2.5 py-1.5 text-xs text-ink-soft">
          {PERIOD_NOTICE}
        </p>
      )}
      {notice === "offensive" && (
        <div className="flex items-start gap-2 rounded border border-warn/30 bg-warn-soft px-2.5 py-2 text-xs leading-relaxed text-warn">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p>{OFFENSIVE_NOTICE}</p>
            {!revealed && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-1.5"
                onClick={() => setRevealed(true)}
              >
                <Eye aria-hidden /> Show the document text
              </Button>
            )}
          </div>
        </div>
      )}

      {!gated && (
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="transcript-search" className="sr-only">
              Search within transcript
            </label>
            <Input
              id="transcript-search"
              placeholder="Search within this text…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="h-8 max-w-xs text-xs"
            />
          </div>
          <div className="doc-serif whitespace-pre-wrap rounded border border-rule bg-paper-raised p-4 text-[15px] leading-relaxed">
            {highlight(text, term)}
          </div>
          {transcript.isExcerpt && (
            <p className="text-xs text-ink-faint">
              Excerpt only — the full document is at the archive link.
            </p>
          )}
          {transcript.sourceNote && (
            <p className="text-xs text-ink-faint">
              Text source: {transcript.sourceNote}
            </p>
          )}
        </>
      )}
    </div>
  );
}
