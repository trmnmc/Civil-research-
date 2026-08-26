/**
 * Content-notice detection for historical documents.
 *
 * Period sources on slavery, race, and the war contain language that is
 * racist and offensive. The application never repeats such language in its
 * own narration; when it appears inside a source's text, the transcript is
 * shown behind a clear notice with a reveal control, unaltered — accuracy
 * requires preserving the document, and honesty requires warning the reader.
 *
 * The term list below exists solely to DETECT such language for gating.
 */

const FLAGGED_PATTERNS: RegExp[] = [
  /\bn[ie]gg[ea]r\w*/i, // the slur and period spellings/OCR variants
  /\bdarke?y\w*/i,
  /\bsambo\b/i,
  /\bmulatto\w*/i, // period racial-classification language
  /\bsavages?\b/i,
];

/** Softer historical vocabulary that merits a note but not a hard gate. */
const PERIOD_LANGUAGE = [/\bnegro\w*/i, /\bcolored\b/i, /\bcontraband\w*/i];

export type ContentNoticeLevel = "none" | "period-language" | "offensive";

export function contentNoticeLevel(text?: string): ContentNoticeLevel {
  if (!text) return "none";
  if (FLAGGED_PATTERNS.some((p) => p.test(text))) return "offensive";
  if (PERIOD_LANGUAGE.some((p) => p.test(text))) return "period-language";
  return "none";
}

export const OFFENSIVE_NOTICE =
  "This document contains racist language and/or descriptions of violence, preserved exactly as written. It is shown for research accuracy; the language is the historical author's, not this application's.";

export const PERIOD_NOTICE =
  "This document uses period racial vocabulary, preserved as written for research accuracy.";
