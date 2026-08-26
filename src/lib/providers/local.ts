/**
 * Shared local-index search used by the demo, Valley of the Shadow, and
 * DocSouth providers. These search a bundled set of verified records; the
 * ranking layer does the real scoring — this just returns candidates.
 */

import type { SourceRecord } from "@/lib/types";
import type { ProviderSearchParams } from "./base";

export function localSearch(
  records: SourceRecord[],
  params: ProviderSearchParams,
): SourceRecord[] {
  const { interpretation, yearRange } = params;
  const terms = interpretation.effectiveTerms.filter((t) => t.length >= 3);
  const states = interpretation.states;

  return records.filter((r) => {
    // Year overlap (records without a year are kept — honesty over hiding).
    const y = r.dates.sortYear;
    const yearOk =
      y === undefined || (y >= yearRange[0] - 3 && y <= yearRange[1] + 3);
    if (!yearOk) return false;
    if (terms.length === 0 && states.length === 0) return true;

    const haystack = [
      r.title,
      r.description ?? "",
      r.subjects.join(" "),
      r.place ?? "",
      r.state ?? "",
      r.creator ?? "",
      r.collection ?? "",
      r.transcript.text ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const termHit = terms.some((t) => haystack.includes(t.toLowerCase()));
    const stateHit = states.some((s) => r.state === s);
    return termHit || stateHit;
  });
}
