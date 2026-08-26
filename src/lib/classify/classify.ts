/**
 * Primary-source classification.
 *
 * Distinguishes contemporaneous documents, retrospective firsthand accounts,
 * official records, public arguments, visual sources, indexes/finding aids,
 * and secondary context. Every classification carries a confidence level, a
 * plain-language explanation, and the metadata signals that produced it.
 *
 * Rule of caution: a modern archive DESCRIPTION of a primary source is not
 * itself a primary source. When we only have catalog metadata (no document
 * date, no digitized original), confidence drops and the explanation says so.
 */

import type {
  Classification,
  EvidenceClass,
  SourceDates,
  SourceFormat,
} from "@/lib/types";
import { extractYear } from "@/lib/utils";

export interface ClassificationInput {
  format: SourceFormat;
  formatLabel?: string;
  title: string;
  description?: string;
  dates: SourceDates;
  subjects?: string[];
  /** True when the digitized original (scan) exists. */
  scanAvailable: boolean;
  /** True when this record is a catalog entry pointing at an undigitized original. */
  catalogOnly?: boolean;
  provider: string;
}

const WAR_ERA: [number, number] = [1850, 1877];

const RETROSPECTIVE_HINTS = [
  "memoir", "reminiscence", "recollection", "looking back", "years after",
  "veteran", "as i remember", "autobiography", "life and times",
];

const OFFICIAL_HINTS = [
  "official report", "general order", "special order", "muster roll",
  "official records", "war department", "adjutant general", "ordnance",
  "census", "record group", "correspondence of the", "headquarters",
  "circular", "proclamation", "act of", "statute", "court-martial",
];

const PUBLIC_ARGUMENT_HINTS = [
  "editorial", "address", "speech", "oration", "pamphlet", "broadside",
  "appeal to", "manifesto", "resolutions", "platform", "tract",
];

const INDEX_HINTS = [
  "index", "finding aid", "guide to", "calendar of", "checklist",
  "bibliography", "catalog of", "catalogue of",
];

const SECONDARY_HINTS = [
  "history of", "a study", "essay on", "centennial", "commemorat",
  "anniversary", "historical society quarterly", "biography of",
];

function containsAny(text: string, hints: string[]): string | undefined {
  const lower = text.toLowerCase();
  return hints.find((h) => lower.includes(h));
}

export function classifySource(input: ClassificationInput): Classification {
  const signals: string[] = [];
  const text = `${input.title} ${input.formatLabel ?? ""} ${input.description ?? ""} ${(input.subjects ?? []).join(" ")}`;
  const createdYear =
    input.dates.sortYear ?? extractYear(input.dates.created ?? input.dates.display);
  const eventYear = extractYear(input.dates.eventDate);
  const laterEditionYear = extractYear(input.dates.publishedLater);

  const inWarEra =
    createdYear !== undefined &&
    createdYear >= WAR_ERA[0] &&
    createdYear <= WAR_ERA[1];

  // ── Index / finding aid ──
  const indexHit = containsAny(text, INDEX_HINTS);
  if (indexHit) {
    signals.push(`title/description contains “${indexHit}”`);
    return {
      evidenceClass: "index-or-finding-aid",
      confidence: "medium",
      explanation:
        "This looks like an index or finding aid: it points to original records but is not itself the original. Use it to locate the underlying document.",
      signals,
    };
  }

  // ── Secondary context ──
  const secondaryHit = containsAny(text, SECONDARY_HINTS);
  const clearlyModern = createdYear !== undefined && createdYear > 1900 && !eventYear;
  if (secondaryHit || (createdYear !== undefined && createdYear > 1930 && input.format !== "memoir" && input.format !== "narrative")) {
    if (secondaryHit) signals.push(`description suggests scholarship (“${secondaryHit}”)`);
    if (clearlyModern) signals.push(`created ${createdYear}, long after the period`);
    return {
      evidenceClass: "secondary",
      confidence: secondaryHit ? "medium" : "low",
      explanation:
        "This appears to be later scholarship or commemorative material — context about the period, not evidence from it. It is labeled so it is never mixed silently into primary results.",
      signals,
    };
  }

  // ── Retrospective firsthand ──
  const retroHit = containsAny(text, RETROSPECTIVE_HINTS);
  // A late edition makes a document retrospective only when the document
  // itself wasn't created near the events (a battle report of 1862 printed
  // in an 1886 compilation is still a contemporaneous official record).
  const publishedWellAfter =
    laterEditionYear !== undefined &&
    eventYear !== undefined &&
    laterEditionYear - eventYear > 10 &&
    (createdYear === undefined || createdYear - eventYear > 10);
  const createdWellAfterEvent =
    createdYear !== undefined &&
    eventYear !== undefined &&
    createdYear - eventYear > 10;
  if (
    input.format === "memoir" ||
    retroHit ||
    publishedWellAfter ||
    createdWellAfterEvent ||
    (input.format === "narrative" && createdYear !== undefined && createdYear > 1877)
  ) {
    if (retroHit) signals.push(`language of recollection (“${retroHit}”)`);
    if (publishedWellAfter)
      signals.push(
        `published ${laterEditionYear}, ${laterEditionYear! - eventYear!} years after the events`,
      );
    if (createdWellAfterEvent)
      signals.push(`written ${createdYear}, well after the events described`);
    if (input.format === "memoir") signals.push("cataloged as a memoir");
    return {
      evidenceClass: "retrospective-firsthand",
      confidence: retroHit || input.format === "memoir" ? "high" : "medium",
      explanation:
        "A firsthand account written or published years after the events. Valuable testimony, but memory, hindsight, and postwar politics shape it — it is not equivalent to a document written at the time.",
      signals,
    };
  }

  // ── Visual sources ──
  if (
    input.format === "photograph" ||
    input.format === "map" ||
    input.format === "print-drawing"
  ) {
    signals.push(`cataloged format: ${input.format}`);
    if (inWarEra) signals.push(`created ${createdYear}, within the period`);
    return {
      evidenceClass: "visual",
      confidence: inWarEra ? "high" : "medium",
      explanation: inWarEra
        ? "A visual source created during the period. Composition and captioning still carry a point of view — photographers and mapmakers chose what to show."
        : "A visual source. Its creation date is uncertain, so treat the image's relationship to the events with care.",
      signals,
    };
  }

  // ── Contemporaneous private/press documents ──
  if (
    input.format === "letter" ||
    input.format === "diary" ||
    input.format === "newspaper" ||
    input.format === "manuscript" ||
    input.format === "periodical"
  ) {
    signals.push(`format: ${input.format}`);
    if (inWarEra) {
      signals.push(`created ${createdYear}, within the research period`);
      return {
        evidenceClass: "contemporaneous",
        confidence: "high",
        explanation:
          input.format === "newspaper"
            ? "Published at the time of the events. Newspapers mixed reporting, rumor, and open partisanship — contemporaneous, but read the editorial stance."
            : "Written during the period, close in time to what it describes. This is the strongest kind of evidence for what people knew and said at the time.",
        signals,
      };
    }
    signals.push(
      createdYear === undefined
        ? "no creation date in the metadata"
        : `created ${createdYear}`,
    );
    return {
      evidenceClass: "contemporaneous",
      confidence: "low",
      explanation:
        "Format suggests a contemporaneous document, but the metadata does not establish when it was written. Verify the date on the document itself before treating it as written at the time.",
      signals,
    };
  }

  // ── Official / administrative records ──
  const officialHit = containsAny(text, OFFICIAL_HINTS);
  if (
    officialHit ||
    input.format === "military-order" ||
    input.format === "official-report" ||
    input.format === "census" ||
    input.format === "roster" ||
    input.format === "government-document"
  ) {
    if (officialHit) signals.push(`official-record vocabulary (“${officialHit}”)`);
    signals.push(`format: ${input.format}`);
    const laterCompilation =
      laterEditionYear !== undefined && laterEditionYear > 1877;
    if (laterCompilation)
      signals.push(`this text printed ${laterEditionYear} (later compilation)`);
    return {
      evidenceClass: "official-record",
      confidence: inWarEra || officialHit ? "high" : "medium",
      explanation: laterCompilation
        ? "An official record created in the course of government or military business, as printed in a later compilation. The record is contemporaneous; the printing is not — check the compilation's editing."
        : "An official record created in the course of government or military business. Authoritative about what officials recorded, but officials had institutional reasons to record it that way.",
      signals,
    };
  }

  // ── Public arguments ──
  const argumentHit = containsAny(text, PUBLIC_ARGUMENT_HINTS);
  if (
    argumentHit ||
    input.format === "speech" ||
    input.format === "pamphlet" ||
    input.format === "broadside"
  ) {
    if (argumentHit) signals.push(`persuasive genre (“${argumentHit}”)`);
    signals.push(`format: ${input.format}`);
    return {
      evidenceClass: "public-argument",
      confidence: inWarEra ? "high" : "medium",
      explanation:
        "A document made to persuade a public audience — a speech, editorial, pamphlet, or broadside. Primary evidence of what arguments were made and heard, not of the facts it asserts.",
      signals,
    };
  }

  // ── Catalog-only entries ──
  if (input.catalogOnly && !input.scanAvailable) {
    signals.push("catalog description without a digitized original");
    return {
      evidenceClass: "index-or-finding-aid",
      confidence: "medium",
      explanation:
        "The archive's catalog entry describes an original record that is not digitized here. The description is modern; the underlying record is the primary source.",
      signals,
    };
  }

  // ── Fallback ──
  signals.push(`format: ${input.format}`);
  if (inWarEra) {
    signals.push(`created ${createdYear}, within the period`);
    return {
      evidenceClass: "contemporaneous",
      confidence: "medium",
      explanation:
        "Created during the research period. The exact genre is unclear from the metadata, so inspect the document to judge how close it stands to the events.",
      signals,
    };
  }
  return {
    evidenceClass: "contemporaneous",
    confidence: "low",
    explanation:
      "The metadata does not establish what kind of evidence this is or when it was created. Treat the classification as provisional and check the document.",
    signals,
  };
}
