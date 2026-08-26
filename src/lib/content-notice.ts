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

// This list is illustrative, not exhaustive: the absence of a notice is
// never a guarantee that a document contains no offensive language.
const FLAGGED_PATTERNS: RegExp[] = [
  /\bn[ie]gg[ea]r\w*/i, // the slur and period spellings/OCR variants
  /\bdarke?y\w*/i,
  /\bsambo\b/i,
  /\bpickaninn\w*/i,
  /\bredskins?\b/i,
  /\bhalf-?breeds?\b/i,
  // Anti-Native slur usage: the plural noun and noun phrases — NOT the bare
  // adjective, which saturates period battle reporting ("savage fighting").
  /\bsavages\b/i,
  /\bsavage (?:tribes?|indians?|nations?|foes?)\b/i,
];

/**
 * Historical vocabulary that merits a note but not a hard gate — including
 * period classification terms now considered offensive ("mulatto" was the
 * official federal census category 1850–1890 and appears throughout legal
 * and military records).
 */
const PERIOD_LANGUAGE = [
  /\bnegro\w*/i,
  /\bcolored\b/i,
  /\bcontraband\w*/i,
  /\bmulatto\w*/i,
  /\bwench(es)?\b/i,
];

export type ContentNoticeLevel = "none" | "period-language" | "offensive";

export function contentNoticeLevel(text?: string): ContentNoticeLevel {
  if (!text) return "none";
  if (FLAGGED_PATTERNS.some((p) => p.test(text))) return "offensive";
  if (PERIOD_LANGUAGE.some((p) => p.test(text))) return "period-language";
  return "none";
}

export const OFFENSIVE_NOTICE =
  "This document contains racist language, preserved exactly as written. It is shown for research accuracy; the language is the historical author's, not this application's. Detection is pattern-based and not exhaustive — the absence of a notice is not a guarantee.";

export const PERIOD_NOTICE =
  "This document uses period racial vocabulary, including classification terms now considered offensive, preserved as written for research accuracy.";
