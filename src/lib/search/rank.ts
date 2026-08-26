/**
 * Hybrid ranking: text relevance + metadata relevance + date proximity +
 * place proximity + source-type fit + archive quality + Perspective Lens
 * weighting. Every score is decomposed into labeled parts so the UI can show
 * why a result matched.
 */

import type {
  LensState,
  MatchExplanation,
  QueryInterpretation,
  RankedRecord,
  SearchFilters,
  SourceRecord,
} from "@/lib/types";
import { perspectiveBoost, passesStrict } from "./perspective";
import { bandForState } from "./aliases";

const PROVIDER_QUALITY: Record<string, number> = {
  loc: 1.0,
  chronicling: 1.0,
  nara: 1.0,
  valley: 0.95,
  docsouth: 0.95,
  demo: 1.0,
};

interface FieldHit {
  term: string;
  field: string;
  weight: number;
}

function findTermHits(
  record: SourceRecord,
  interp: QueryInterpretation,
): FieldHit[] {
  const hits: FieldHit[] = [];
  const fields: { name: string; text: string; weight: number }[] = [
    { name: "title", text: record.title, weight: 3 },
    { name: "creator", text: record.creator ?? "", weight: 2.5 },
    { name: "subjects", text: record.subjects.join(" "), weight: 2 },
    { name: "description", text: record.description ?? "", weight: 1.5 },
    { name: "collection", text: record.collection ?? "", weight: 1 },
    { name: "place", text: `${record.place ?? ""} ${record.state ?? ""}`, weight: 2 },
    { name: "transcript", text: record.transcript.text ?? "", weight: 1.75 },
  ];
  const seen = new Set<string>();
  for (const term of interp.effectiveTerms) {
    if (term.length < 3) continue;
    const lower = term.toLowerCase();
    for (const f of fields) {
      if (!f.text) continue;
      if (f.text.toLowerCase().includes(lower)) {
        const key = `${lower}::${f.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({ term, field: f.name, weight: f.weight });
        break; // count each term once, in its best field
      }
    }
  }
  return hits;
}

function dateProximityScore(
  record: SourceRecord,
  interp: QueryInterpretation,
  lens: LensState,
): { score: number; label?: string } {
  const year = record.dates.sortYear;
  if (year === undefined) return { score: 0.2 };
  const [lo, hi] = interp.yearRange ?? lens.yearRange;
  if (year >= lo && year <= hi) {
    // Month precision when we have it.
    const mr = interp.monthRange ?? lens.monthRange;
    const created = record.dates.created ?? "";
    if (mr && /^\d{4}-\d{2}/.test(created)) {
      const ym = created.slice(0, 7);
      if (ym >= mr[0] && ym <= mr[1]) {
        return { score: 1.6, label: `created ${ym}, inside the asked window` };
      }
      return { score: 0.9, label: `created ${year}, inside the year range` };
    }
    return { score: 1.2, label: `created ${year}, inside the asked years` };
  }
  const dist = year < lo ? lo - year : year - hi;
  if (dist <= 2) return { score: 0.6, label: `created ${year}, near the asked years` };
  if (dist <= 10) return { score: 0.25 };
  return { score: 0 };
}

function placeProximityScore(
  record: SourceRecord,
  interp: QueryInterpretation,
): { score: number; label?: string } {
  if (interp.states.length === 0 && interp.places.length === 0)
    return { score: 0.3 };
  if (record.state && interp.states.includes(record.state)) {
    return { score: 1.2, label: `from ${record.state}, the asked state` };
  }
  const place = (record.place ?? "").toLowerCase();
  const hitPlace = interp.places.find((p) => place.includes(p.toLowerCase()));
  if (hitPlace) return { score: 1.4, label: `place matches ${hitPlace}` };
  // Same band as an asked state still counts a little.
  if (
    record.state &&
    interp.states.some((s) => bandForState(s) === bandForState(record.state))
  ) {
    return { score: 0.4, label: "same region as the asked state" };
  }
  return { score: 0.1 };
}

function formatFitScore(
  record: SourceRecord,
  interp: QueryInterpretation,
): { score: number; label?: string } {
  if (interp.formats.length === 0) return { score: 0.3 };
  if (interp.formats.includes(record.format)) {
    return { score: 1.2, label: `source type matches (${record.format.replace(/-/g, " ")})` };
  }
  return { score: 0.1 };
}

function applyFilters(record: SourceRecord, filters?: SearchFilters): boolean {
  if (!filters) return true;
  if (filters.providers?.length && !filters.providers.includes(record.provider))
    return false;
  if (filters.formats?.length && !filters.formats.includes(record.format))
    return false;
  if (
    filters.states?.length &&
    (!record.state || !filters.states.includes(record.state))
  )
    return false;
  if (
    filters.evidenceClasses?.length &&
    !filters.evidenceClasses.includes(record.classification.evidenceClass)
  )
    return false;
  if (filters.requireTranscript && !record.transcript.available) return false;
  if (filters.requireScan && !record.scanAvailable) return false;
  if (
    filters.creator &&
    !(record.creator ?? "")
      .toLowerCase()
      .includes(filters.creator.toLowerCase())
  )
    return false;
  if (
    filters.alignment?.length &&
    !filters.alignment.includes(record.perspective.alignment)
  )
    return false;
  return true;
}

export function rankRecords(
  records: SourceRecord[],
  interp: QueryInterpretation,
  lens: LensState,
  filters?: SearchFilters,
): RankedRecord[] {
  const ranked: RankedRecord[] = [];
  for (const record of records) {
    if (!applyFilters(record, filters)) continue;
    if (!passesStrict(record, lens)) continue;

    const hits = findTermHits(record, interp);
    const textScore = hits.reduce((s, h) => s + h.weight, 0);
    // Require at least one term hit unless the query interpreted to pure
    // date/place constraints (then metadata alone can qualify).
    const hasConstraints =
      interp.states.length > 0 ||
      interp.places.length > 0 ||
      interp.yearRange !== undefined;
    if (hits.length === 0 && !hasConstraints) continue;

    const date = dateProximityScore(record, interp, lens);
    const place = placeProximityScore(record, interp);
    const format = formatFitScore(record, interp);
    const quality = PROVIDER_QUALITY[record.provider] ?? 0.9;
    const { boost, reasons } = perspectiveBoost(record, lens);

    // Evidence-class nudge: contemporaneous evidence leads by default, but
    // nothing is hidden — retrospective and secondary just rank lower.
    const evidenceNudge =
      record.classification.evidenceClass === "contemporaneous" ||
      record.classification.evidenceClass === "official-record" ||
      record.classification.evidenceClass === "public-argument"
        ? 1.0
        : record.classification.evidenceClass === "visual"
          ? 0.9
          : record.classification.evidenceClass === "retrospective-firsthand"
            ? 0.75
            : record.classification.evidenceClass === "secondary"
              ? 0.5
              : 0.7;

    const core =
      (textScore * 1.0 + date.score * 1.4 + place.score * 1.3 + format.score * 0.9) *
      quality *
      evidenceNudge;
    const total = core * boost;
    if (total <= 0) continue;

    const scoreParts: MatchExplanation["scoreParts"] = [
      { label: "Text relevance", value: round2(textScore) },
      { label: "Date proximity", value: round2(date.score * 1.4) },
      { label: "Place proximity", value: round2(place.score * 1.3) },
      { label: "Source-type fit", value: round2(format.score * 0.9) },
      { label: "Perspective weighting", value: round2(boost) },
    ];

    const matchedTerms = hits.map((h) => ({ term: h.term, field: h.field }));
    const extraLabels = [date.label, place.label, format.label, ...reasons].filter(
      (l): l is string => !!l,
    );
    for (const label of extraLabels) {
      matchedTerms.push({ term: label, field: "why" });
    }

    ranked.push({
      record,
      explanation: { matchedTerms, scoreParts, totalScore: round2(total) },
    });
  }
  ranked.sort((a, b) => b.explanation.totalScore - a.explanation.totalScore);
  return ranked;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
