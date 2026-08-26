/**
 * Citations built strictly from verified SourceRecord data. Missing fields
 * are omitted, never fabricated — a citation with gaps is honest; a padded
 * one is not.
 */

import type { SourceRecord } from "@/lib/types";
import { formatArchiveDate } from "@/lib/utils";

function citationDate(record: SourceRecord): string | undefined {
  const d = record.citation.date ?? record.dates.created;
  if (!d) return undefined;
  return formatArchiveDate(d);
}

/** Chicago/Turabian note-style full footnote. */
export function chicagoFootnote(record: SourceRecord): string {
  const c = record.citation;
  const parts: string[] = [];
  if (c.creator) parts.push(c.creator.replace(/,\s*$/, ""));
  parts.push(`“${c.title}”`);
  const date = citationDate(record);
  if (date) parts.push(date);
  if (c.collection) parts.push(c.collection);
  parts.push(c.archiveName);
  if (c.locator) parts.push(c.locator);
  parts.push(`${c.url} (accessed ${formatArchiveDate(c.accessed)})`);
  return parts.join(", ") + ".";
}

/** Chicago/Turabian shortened footnote. */
export function chicagoShortNote(record: SourceRecord): string {
  const c = record.citation;
  const surname = c.creator?.split(/[, ]/)[0];
  const shortTitle =
    c.title.length > 60 ? `${c.title.slice(0, 57).trimEnd()}…` : c.title;
  return [surname, `“${shortTitle}”`].filter(Boolean).join(", ") + ".";
}

/** Chicago/Turabian bibliography entry. */
export function chicagoBibliography(record: SourceRecord): string {
  const c = record.citation;
  const parts: string[] = [];
  if (c.creator) {
    // Invert the first personal name when it looks like "First Last".
    const m = c.creator.match(/^([A-Z][\w.'-]+(?:\s[A-Z]\.?)?)\s+([A-Z][\w'-]+)($|\s*\()/);
    parts.push(m ? `${m[2]}, ${m[1]}.` : `${c.creator}.`);
  }
  parts.push(`“${c.title}.”`);
  const date = citationDate(record);
  if (date) parts.push(`${date}.`);
  if (c.collection) parts.push(`${c.collection}.`);
  parts.push(`${c.archiveName}.`);
  if (c.locator) parts.push(`${c.locator}.`);
  parts.push(`${c.url} (accessed ${formatArchiveDate(c.accessed)}).`);
  return parts.join(" ");
}

/** BibTeX @misc entry; only fields the record actually has. */
export function bibtex(record: SourceRecord): string {
  const c = record.citation;
  const key = record.id
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const lines: string[] = [`@misc{${key},`];
  if (c.creator) lines.push(`  author = {${escapeBib(c.creator)}},`);
  lines.push(`  title = {${escapeBib(c.title)}},`);
  const year = record.dates.sortYear;
  if (year) lines.push(`  year = {${year}},`);
  if (c.collection) lines.push(`  series = {${escapeBib(c.collection)}},`);
  lines.push(`  howpublished = {${escapeBib(c.archiveName)}},`);
  if (c.locator) lines.push(`  note = {${escapeBib(c.locator)}},`);
  lines.push(`  url = {${c.url}},`);
  lines.push(`  urldate = {${c.accessed}},`);
  lines.push("}");
  return lines.join("\n");
}

function escapeBib(s: string): string {
  return s.replace(/[{}]/g, "").replace(/&/g, "\\&").replace(/%/g, "\\%");
}

const CSV_HEADERS = [
  "id",
  "archive",
  "title",
  "creator",
  "date",
  "place",
  "format",
  "evidence_class",
  "collection",
  "url",
  "accessed",
] as const;

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** CSV export of citation-relevant metadata for one or more records. */
export function toCsv(records: SourceRecord[]): string {
  const rows = records.map((r) =>
    [
      r.id,
      r.citation.archiveName,
      r.citation.title,
      r.citation.creator ?? "",
      r.citation.date ?? r.dates.display ?? "",
      r.place ?? "",
      r.format,
      r.classification.evidenceClass,
      r.citation.collection ?? "",
      r.citation.url,
      r.citation.accessed,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export interface CitationBundle {
  footnote: string;
  shortNote: string;
  bibliography: string;
  bibtex: string;
  stableLink: string;
}

export function citationBundle(record: SourceRecord): CitationBundle {
  return {
    footnote: chicagoFootnote(record),
    shortNote: chicagoShortNote(record),
    bibliography: chicagoBibliography(record),
    bibtex: bibtex(record),
    stableLink: record.url,
  };
}
