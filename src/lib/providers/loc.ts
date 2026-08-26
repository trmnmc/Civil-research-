/**
 * Library of Congress adapter — the loc.gov JSON API.
 * Docs: https://www.loc.gov/apis/json-and-yaml/
 *
 * Verified against the Library's official data-exploration repository
 * (github.com/LibraryOfCongress/data-exploration):
 *  - `fo=json` selects JSON; `at=results,pagination` trims the response.
 *  - `q=` keyword query, `c=` per page (options 20/40/80/160), `sp=` page,
 *    `fa=facet:value` filters joined with `|`, `dates=YYYY/YYYY`.
 *  - `pagination.of` = total results; `pagination.next` = next-page URL.
 *  - No API key. Rate limits are enforced server-side (429 when blocked);
 *    the Library's own examples sleep between requests, so we throttle to
 *    ~1 request/second sustained and never retry a 429.
 *
 * The Chronicling America collection is excluded here; its dedicated
 * adapter handles newspapers (avoids duplicates).
 */

import type { ProviderInfo } from "@/lib/types";
import { stateByCode } from "@/lib/search/aliases";
import {
  errorStatus,
  okStatus,
  type ProviderSearchParams,
  type ProviderSearchResult,
  type SourceProvider,
} from "./base";
import {
  providerFetch,
  ProviderHttpError,
  ProviderRateLimitError,
} from "./fetch";
import { normalizeLocItem, type LocSearchResponse } from "./locCommon";

const INFO: ProviderInfo = {
  id: "loc",
  name: "Library of Congress",
  shortName: "LOC",
  homepage: "https://www.loc.gov",
  access: "api",
  description:
    "Digitized collections of the Library of Congress: manuscripts, photographs, maps, printed material, and more, via the official loc.gov JSON API.",
};

/** Build the loc.gov search URLs for a query (exported for tests). */
export function buildLocUrls(params: ProviderSearchParams): string[] {
  const { interpretation, yearRange, limit, page } = params;
  const urls: string[] = [];

  const base = new URL("https://www.loc.gov/search/");
  base.searchParams.set("q", interpretation.originalQuery.trim());
  base.searchParams.set("fo", "json");
  base.searchParams.set("at", "results,pagination");
  base.searchParams.set("c", String(Math.min(Math.max(limit, 20), 40)));
  if (page && page > 1) base.searchParams.set("sp", String(page));
  base.searchParams.set("dates", `${yearRange[0]}/${yearRange[1]}`);
  urls.push(base.toString());

  // When a state is named, add a location-faceted query using the state's
  // full lowercase name (the facet vocabulary loc.gov uses).
  if (interpretation.states.length > 0) {
    const stateName = stateByCode(interpretation.states[0])?.name.toLowerCase();
    if (stateName) {
      const u = new URL("https://www.loc.gov/search/");
      const topicTerms = interpretation.effectiveTerms
        .filter((t) => t.length > 3 && !t.includes(" "))
        .slice(0, 5)
        .join(" ");
      u.searchParams.set("q", topicTerms || interpretation.originalQuery.trim());
      u.searchParams.set("fo", "json");
      u.searchParams.set("at", "results,pagination");
      u.searchParams.set("c", "25");
      u.searchParams.set("dates", `${yearRange[0]}/${yearRange[1]}`);
      u.searchParams.set("fa", `location:${stateName}`);
      urls.push(u.toString());
    }
  }
  return urls.slice(0, 2);
}

export const locProvider: SourceProvider = {
  info: INFO,
  isConfigured: () => true,
  async search(params): Promise<ProviderSearchResult> {
    const started = Date.now();
    const urls = buildLocUrls(params);
    const records = new Map<string, NonNullable<ReturnType<typeof normalizeLocItem>>>();
    let total: number | undefined;
    let firstError: unknown;
    let successes = 0;

    for (const url of urls) {
      try {
        const data = await providerFetch<LocSearchResponse>(url, {
          provider: "loc",
          ratePerSec: 1,
          burst: 3,
        });
        successes++;
        const of = data.pagination?.of;
        if (typeof of === "number") total = Math.max(total ?? 0, of);
        for (const item of data.results ?? []) {
          const idStr = String(item.id ?? "");
          const urlStr = String(item.url ?? "");
          // Keep catalog items/resources; skip site pages and collections.
          if (!/\/(item|resource)\//.test(idStr) && !/\/(item|resource)\//.test(urlStr)) {
            continue;
          }
          // Chronicling America pages come from the dedicated adapter.
          if (
            (item.partof ?? []).some((p) =>
              p.toLowerCase().includes("chronicling america"),
            )
          ) {
            continue;
          }
          const rec = normalizeLocItem(item, "loc", url);
          if (rec) records.set(rec.id, rec);
        }
      } catch (err) {
        firstError = firstError ?? err;
      }
    }

    const list = [...records.values()];
    const tookMs = Date.now() - started;

    if (successes === 0) {
      const err = firstError;
      if (err instanceof ProviderRateLimitError) {
        return {
          records: [],
          status: errorStatus(
            "loc",
            "rate-limited",
            "The Library of Congress API is rate limiting requests. Pause a moment and search again.",
          ),
        };
      }
      const detail =
        err instanceof ProviderHttpError
          ? `loc.gov responded HTTP ${err.status}.`
          : err instanceof Error
            ? err.message
            : "Unknown error reaching loc.gov.";
      return { records: [], status: errorStatus("loc", "unavailable", detail) };
    }

    const status = okStatus("loc", list.length, total, tookMs);
    if (successes < urls.length) {
      status.status = "partial";
      status.detail =
        "One of the Library of Congress queries failed; results may be incomplete.";
    }
    return { records: list, status };
  },
};
