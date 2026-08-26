/**
 * Core domain types for Archive Lens.
 *
 * A SourceRecord is the normalized shape every archive result is converted
 * into, whatever provider it came from. Normalized fields sit beside the
 * provider's original metadata (`raw`), which is always preserved.
 */

// ─── Providers ───────────────────────────────────────────────────────────────

export type ProviderId =
  | "loc" // Library of Congress (loc.gov JSON API)
  | "chronicling" // Chronicling America via loc.gov collection API
  | "nara" // National Archives Catalog API v2 (requires key)
  | "valley" // Valley of the Shadow (deep links + local index)
  | "docsouth" // Documenting the American South (deep links + local index)
  | "demo"; // Bundled verified reference records

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  shortName: string;
  homepage: string;
  access: "api" | "api-key" | "deep-link-index";
  description: string;
}

export type ProviderStatusKind =
  | "loading"
  | "ok"
  | "partial"
  | "rate-limited"
  | "needs-setup"
  | "unavailable"
  | "skipped";

export interface ProviderStatus {
  provider: ProviderId;
  status: ProviderStatusKind;
  /** Records contributed to this result set. */
  count: number;
  /** Total matches the provider reported, when known. */
  totalAvailable?: number;
  /** Human-readable detail (error summary, setup guidance, etc.). */
  detail?: string;
  tookMs?: number;
}

// ─── Source formats ──────────────────────────────────────────────────────────

export type SourceFormat =
  | "letter"
  | "diary"
  | "newspaper"
  | "speech"
  | "military-order"
  | "official-report"
  | "government-document"
  | "map"
  | "photograph"
  | "print-drawing"
  | "census"
  | "church-record"
  | "roster"
  | "pamphlet"
  | "broadside"
  | "book"
  | "memoir"
  | "narrative"
  | "sheet-music"
  | "manuscript"
  | "periodical"
  | "other";

// ─── Primary-source classification ───────────────────────────────────────────

/**
 * Evidence class. The key historiographical distinctions:
 *  - contemporaneous: created during or immediately around the events it records
 *  - retrospective-firsthand: an eyewitness writing later (memoirs, WPA narratives)
 *  - official-record: administrative/military/government record made in the course of business
 *  - public-argument: propaganda, editorials, speeches, broadsides meant to persuade
 *  - visual: photographs, maps, prints — created contemporaneously unless noted
 *  - index-or-finding-aid: points to an original record but is not itself one
 *  - secondary: modern description, scholarship, or context — never mixed into
 *    primary results without an explicit label
 */
export type EvidenceClass =
  | "contemporaneous"
  | "retrospective-firsthand"
  | "official-record"
  | "public-argument"
  | "visual"
  | "index-or-finding-aid"
  | "secondary";

export type Confidence = "high" | "medium" | "low";

export interface Classification {
  evidenceClass: EvidenceClass;
  confidence: Confidence;
  /** Plain-language explanation of why the record was classified this way. */
  explanation: string;
  /** Signals that produced the classification (shown as chips in the UI). */
  signals: string[];
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/**
 * The three dates that matter and must never be conflated:
 * when the event happened, when the document was created, and when a later
 * edition/transcription was published.
 */
export interface SourceDates {
  /** ISO-ish date or range the document itself was created ("1861-04-20", "1862/1863"). */
  created?: string;
  /** Date or range of the events the document concerns, when distinct. */
  eventDate?: string;
  /** Publication date of a later edition or transcription, when distinct. */
  publishedLater?: string;
  /** Sortable year extracted from `created` (or best available). */
  sortYear?: number;
  /** Display string exactly as the archive gave it. */
  display?: string;
}

// ─── Geography & perspective ─────────────────────────────────────────────────

/**
 * Evidence-backed regional bands for the Perspective Lens. These are
 * geographic origin bands — NOT loyalty. Location is not loyalty.
 */
export type RegionBand =
  | "north" // Free states that stayed with the Union
  | "border" // Slave states that did not secede + contested areas (KY, MO, MD, DE, WV, ETN)
  | "south" // Seceded states
  | "national" // Washington DC / federal-level or nationally circulated
  | "unknown";

export type SocialPosition =
  | "civilian"
  | "enlisted-soldier"
  | "officer"
  | "political-actor"
  | "newspaper-editor"
  | "enslaved-person"
  | "free-black-resident"
  | "woman-home-front"
  | "clergy"
  | "unknown";

export type PoliticalAlignment =
  | "unionist"
  | "abolitionist"
  | "antiwar-northern-democrat"
  | "divided-uncertain"
  | "southern-unionist"
  | "confederate-aligned"
  | "unknown";

export interface PerspectiveProfile {
  region: RegionBand;
  /** State two-letter code when known (e.g. "KY", "VA", "PA"). */
  state?: string;
  place?: string;
  socialPositions: SocialPosition[];
  alignment: PoliticalAlignment;
  /** Why we believe this (archive metadata vs. inference). */
  basis: "archive-metadata" | "inferred" | "curated";
  note?: string;
}

// ─── Rights & citation ───────────────────────────────────────────────────────

export interface RightsInfo {
  statement?: string;
  /** Whether full scans may be redistributed by this app. */
  allowsRedistribution?: boolean;
  link?: string;
}

export interface CitationData {
  /** Author/creator formatted for citation, when known. */
  creator?: string;
  title: string;
  date?: string;
  collection?: string;
  archiveName: string;
  url: string;
  /** e.g. newspaper page/column, or item call number. */
  locator?: string;
  accessed: string;
}

// ─── Transcript ──────────────────────────────────────────────────────────────

export interface TranscriptInfo {
  available: boolean;
  /** Plain-text transcript or OCR excerpt (sanitized). */
  text?: string;
  /** True when text is machine OCR that may contain errors. */
  isOcr: boolean;
  /** Portion of characters flagged as low-confidence OCR, when detectable. */
  ocrQualityNote?: string;
  /** True if the stored text is an excerpt, not the full document. */
  isExcerpt?: boolean;
  /** Where the transcript text came from (provider page, fixture provenance). */
  sourceNote?: string;
}

// ─── The normalized record ───────────────────────────────────────────────────

export interface SourceRecord {
  /** Stable internal id: `${provider}:${providerItemId}` (URL-safe encoded). */
  id: string;
  provider: ProviderId;
  /** Provider's own stable identifier (LOC item id, LCCN/date/ed/seq, naId…). */
  providerItemId: string;
  /** Stable URL of the item at the archive. */
  url: string;
  title: string;
  creator?: string;
  recipient?: string;
  dates: SourceDates;
  place?: string;
  state?: string;
  format: SourceFormat;
  formatLabel?: string;
  collection?: string;
  subjects: string[];
  description?: string;
  transcript: TranscriptInfo;
  scanAvailable: boolean;
  scanUrl?: string;
  thumbnailUrl?: string;
  rights: RightsInfo;
  citation: CitationData;
  classification: Classification;
  perspective: PerspectiveProfile;
  /** Original provider metadata, preserved verbatim. */
  raw: Record<string, unknown>;
  /**
   * For fixture/demo records: exactly where every field came from.
   * Live provider records carry the API request URL.
   */
  provenance?: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface LensState {
  /** 0..100 — position on the North ⟷ Border ⟷ South bar. */
  position: number;
  /** Snapped band derived from position. */
  band: RegionBand;
  socialPositions: SocialPosition[];
  alignments: PoliticalAlignment[];
  /** Inclusive year window, e.g. [1850, 1877]. */
  yearRange: [number, number];
  /** Optional month precision: ISO "YYYY-MM" bounds within yearRange. */
  monthRange?: [string, string];
  /** Strict mode: filter to the selection instead of re-weighting. */
  strict: boolean;
}

export interface QueryInterpretation {
  originalQuery: string;
  /** Terms actually sent to providers. */
  effectiveTerms: string[];
  /** Historical aliases/spelling variants applied, with reasons. */
  expansions: { term: string; expandedTo: string[]; reason: string }[];
  people: string[];
  places: string[];
  states: string[];
  units: string[];
  events: string[];
  formats: SourceFormat[];
  /** Year range detected in the query, if any. */
  yearRange?: [number, number];
  monthRange?: [string, string];
  topics: string[];
  /** How the interpretation was produced. */
  method: "rules" | "rules+ai";
}

export interface MatchExplanation {
  /** Which query/alias terms matched, and where (title, transcript, subject…). */
  matchedTerms: { term: string; field: string }[];
  /** Score components for transparency. */
  scoreParts: { label: string; value: number }[];
  totalScore: number;
}

export interface RankedRecord {
  record: SourceRecord;
  explanation: MatchExplanation;
}

export interface SearchFilters {
  providers?: ProviderId[];
  formats?: SourceFormat[];
  states?: string[];
  evidenceClasses?: EvidenceClass[];
  requireTranscript?: boolean;
  requireScan?: boolean;
  creator?: string;
  unit?: string;
  alignment?: PoliticalAlignment[];
}

export interface SearchRequest {
  query: string;
  lens: LensState;
  filters?: SearchFilters;
  page?: number;
}

export interface SearchResponse {
  interpretation: QueryInterpretation;
  results: RankedRecord[];
  providerStatuses: ProviderStatus[];
  /** True when demo mode answered the search. */
  demoMode: boolean;
  totalBeforeRanking: number;
}

// ─── Worldview synthesis ─────────────────────────────────────────────────────

export interface WorldviewClaim {
  text: string;
  /** SourceRecord ids supporting the claim. Must reference retrieved records. */
  evidence: string[];
  kind:
    | "knowledge" // what they could know
    | "stakes" // what they believed was at stake
    | "fears-hopes"
    | "language" // framing and vocabulary in their sources
    | "limits"; // where understanding was incomplete/propagandistic/disputed
  /** Present when the claim concerns rumor/propaganda/uncertainty. */
  caveat?: string;
}

export interface WorldviewSynthesis {
  /** The perspective being synthesized. */
  profile: {
    region: RegionBand;
    socialPositions: SocialPosition[];
    alignments: PoliticalAlignment[];
    asOf: string; // information horizon date
  };
  claims: WorldviewClaim[];
  /** Plain statement of evidence limitations (sparse, narrow, contradictory…). */
  limitations: string[];
  /** ids of all records consulted. */
  consulted: string[];
  method: "rules" | "ai";
  /** Set when evidence is insufficient to synthesize responsibly. */
  insufficient?: { reason: string };
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export interface ComparisonStatement {
  kind:
    | "shared-fact"
    | "information-differs"
    | "motive-differs"
    | "language-differs"
    | "conflict";
  text: string;
  /** Which side(s) each cited record supports: ids from left and right. */
  leftEvidence: string[];
  rightEvidence: string[];
}

export interface ComparisonResult {
  left: SourceRecord[];
  right: SourceRecord[];
  statements: ComparisonStatement[];
  /** Set when the two sides can't be responsibly compared. */
  insufficient?: { reason: string };
}
