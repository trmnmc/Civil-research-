/**
 * Chronicling America adapter — historic American newspapers, searched
 * through the loc.gov collection API.
 * Docs: https://www.loc.gov/apis/additional-apis/chronicling-america-api/
 *
 * Verified against the Library's official data-exploration repository:
 *  - Endpoint: https://www.loc.gov/collections/chronicling-america/
 *  - `qs=` full-text query (words joined with +), `ops=PHRASE|AND|OR|~5|~10`,
 *    `dl=page|issue|all` display level, `start_date`/`end_date` (YYYY-MM-DD),
 *    `location_state=` lowercase state name, `fa=number_lccn:{lccn}`,
 *    `front_pages_only=true`, plus universal `fo=json`, `at`, `c`, `sp`.
 *  - Page results carry `id` like
 *    http://www.loc.gov/resource/{lccn}/{YYYY-MM-DD}/ed-{n}/?sp={seq},
 *    `partof_title` (newspaper title), `number_lccn`, `location_state`,
 *    `description` (OCR excerpt), `image_url` (IIIF service URLs).
 *  - Full page OCR is in the `full_text` field of the /resource/ JSON.
 *  - Rate limits are enforced server-side; official examples throttle to
 *    ≥0.7s between requests and stop on HTTP 429. We do the same.
 */

import type { ProviderInfo, SourceRecord } from "@/lib/types";
import { classifySource } from "@/lib/classify/classify";
import { bandForState, stateByCode } from "@/lib/search/aliases";
import { safeUrl, toPlainText } from "@/lib/sanitize";
import { extractYear } from "@/lib/utils";
import {
  errorStatus,
  makeRecordId,
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
import { stateFromLocations, type LocItem, type LocSearchResponse } from "./locCommon";

const INFO: ProviderInfo = {
  id: "chronicling",
  name: "Chronicling America",
  shortName: "ChronAm",
  homepage: "https://www.loc.gov/collections/chronicling-america/",
  access: "api",
  description:
    "Millions of digitized historic newspaper pages from the National Digital Newspaper Program, with full-text search — the richest source for how events read in the press at the time.",
};

export function buildChroniclingUrl(params: ProviderSearchParams): string {
  const { interpretation, yearRange, monthRange, limit, page } = params;
  const u = new URL("https://www.loc.gov/collections/chronicling-america/");
  // Full-text search over page OCR: qs= with +-joined words. Use the
  // researcher's content words rather than the raw sentence.
  const words = interpretation.effectiveTerms
    .filter((t) => !t.includes(" ") && t.length >= 3)
    .slice(0, 8);
  const q = words.length > 0 ? words.join("+") : interpretation.originalQuery.trim().replace(/\s+/g, "+");
  u.searchParams.set("qs", q);
  // Proximity search keeps multi-topic queries from requiring adjacency.
  u.searchParams.set("ops", words.length > 2 ? "~10" : "AND");
  u.searchParams.set("dl", "page");
  const start = monthRange ? `${monthRange[0]}-01` : `${yearRange[0]}-01-01`;
  const end = monthRange ? endOfMonth(monthRange[1]) : `${yearRange[1]}-12-31`;
  u.searchParams.set("start_date", start);
  u.searchParams.set("end_date", end);
  if (interpretation.states.length === 1) {
    const name = stateByCode(interpretation.states[0])?.name.toLowerCase();
    if (name) u.searchParams.set("location_state", name);
  }
  u.searchParams.set("fo", "json");
  u.searchParams.set("at", "results,pagination");
  u.searchParams.set("c", String(Math.min(Math.max(limit, 20), 40)));
  if (page && page > 1) u.searchParams.set("sp", String(page));
  return u.toString();
}

function endOfMonth(ym: string): string {
  const [y, m] = ym.split("-").map((s) => parseInt(s, 10));
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(last).padStart(2, "0")}`;
}

export function normalizeChroniclingItem(
  item: LocItem,
  requestUrl: string,
): SourceRecord | undefined {
  const idStr = String(item.id ?? item.url ?? "");
  if (!idStr || !item.title) return undefined;
  // Page identity: /resource/{lccn}/{YYYY-MM-DD}/ed-{n}/?sp={page}
  const m = idStr.match(
    /resource\/([a-z0-9]+)\/(\d{4}-\d{2}-\d{2})\/ed-(\d+)\/?(?:\?sp=(\d+))?/i,
  );
  const lccn = item.number_lccn?.[0] ?? m?.[1];
  const date = m?.[2] ?? item.date;
  const edition = m?.[3];
  const seq = m?.[4] ?? "1";
  const providerItemId = m
    ? `${lccn}/${date}/ed-${edition}/seq-${seq}`
    : idStr.replace(/^https?:\/\/(www\.)?loc\.gov\//, "").replace(/\/+$/, "");

  const url =
    safeUrl(idStr.replace(/^http:\/\//, "https://")) ?? safeUrl(item.url);
  if (!url) return undefined;

  const paperTitle = item.partof_title
    ? toPlainText(String((item.partof_title as string[])[0] ?? ""))
    : undefined;
  const title = toPlainText(item.title);
  const stateList = (item.location_state as string[] | undefined) ?? item.location;
  const state = stateFromLocations(stateList);
  const ocrExcerpt = item.description?.length
    ? toPlainText(item.description.join(" "))
    : undefined;
  const thumbnailUrl = item.image_url?.length
    ? safeUrl(item.image_url[item.image_url.length - 1])
    : undefined;
  const sortYear = extractYear(date);

  const classification = classifySource({
    format: "newspaper",
    formatLabel: "newspaper page",
    title,
    description: ocrExcerpt?.slice(0, 400),
    dates: { created: date, sortYear, display: date },
    subjects: (item.subject ?? []).map((s) => toPlainText(s)),
    scanAvailable: true,
    provider: "chronicling",
  });

  return {
    id: makeRecordId("chronicling", providerItemId),
    provider: "chronicling",
    providerItemId,
    url,
    title: paperTitle && !title.toLowerCase().includes(paperTitle.toLowerCase())
      ? `${paperTitle} — ${title}`
      : title,
    creator: paperTitle,
    dates: { created: date, sortYear, display: date },
    place: stateList?.[0] ? toPlainText(String(stateList[0])) : undefined,
    state,
    format: "newspaper",
    formatLabel: "Newspaper page",
    collection: "Chronicling America",
    subjects: (item.subject ?? []).map((s) => toPlainText(s)),
    description: ocrExcerpt ? `${ocrExcerpt.slice(0, 500)}${ocrExcerpt.length > 500 ? "…" : ""}` : undefined,
    transcript: {
      available: Boolean(ocrExcerpt),
      text: ocrExcerpt,
      isOcr: true,
      ocrQualityNote:
        "Machine OCR of a historic newspaper page. Characters may be misread; verify wording against the scan before quoting.",
      isExcerpt: true,
      sourceNote: `OCR excerpt from the loc.gov search response. Full page text: ${url}${url.includes("?") ? "&" : "?"}fo=json (full_text field).`,
    },
    scanAvailable: true,
    scanUrl: thumbnailUrl,
    thumbnailUrl,
    rights: {
      statement:
        "Chronicling America newspaper pages are generally in the public domain; the Library of Congress provides rights guidance per title.",
      allowsRedistribution: false,
      link: url,
    },
    citation: {
      creator: undefined,
      title: paperTitle ?? title,
      date,
      collection: "Chronicling America: Historic American Newspapers",
      archiveName: "Library of Congress",
      url,
      locator: m ? `ed. ${edition}, p. seq ${seq}` : undefined,
      accessed: new Date().toISOString().slice(0, 10),
    },
    classification,
    perspective: {
      region: state ? bandForState(state) : "unknown",
      state,
      place: stateList?.[0] ? toPlainText(String(stateList[0])) : undefined,
      socialPositions: ["newspaper-editor"],
      alignment: "unknown",
      basis: "inferred",
      note:
        "Region reflects where the paper was published. Location is not loyalty — editorial stance must be read from the paper itself.",
    },
    raw: item as Record<string, unknown>,
    provenance: `Live loc.gov Chronicling America API response (${requestUrl})`,
  };
}

export const chroniclingProvider: SourceProvider = {
  info: INFO,
  isConfigured: () => true,
  async search(params): Promise<ProviderSearchResult> {
    const started = Date.now();
    const url = buildChroniclingUrl(params);
    try {
      const data = await providerFetch<LocSearchResponse>(url, {
        provider: "chronicling",
        ratePerSec: 1,
        burst: 2,
      });
      const records: SourceRecord[] = [];
      for (const item of data.results ?? []) {
        const rec = normalizeChroniclingItem(item, url);
        if (rec) records.push(rec);
      }
      return {
        records,
        status: okStatus(
          "chronicling",
          records.length,
          data.pagination?.of,
          Date.now() - started,
        ),
      };
    } catch (err) {
      if (err instanceof ProviderRateLimitError) {
        return {
          records: [],
          status: errorStatus(
            "chronicling",
            "rate-limited",
            "Chronicling America is rate limiting requests. Pause a moment and search again.",
          ),
        };
      }
      const detail =
        err instanceof ProviderHttpError
          ? `Chronicling America responded HTTP ${err.status}.`
          : err instanceof Error
            ? err.message
            : "Unknown error reaching Chronicling America.";
      return {
        records: [],
        status: errorStatus("chronicling", "unavailable", detail),
      };
    }
  },
};

/**
 * Fetch full OCR text for one newspaper page (server-side, on demand from
 * the source workspace). Returns undefined when unavailable.
 */
export async function fetchChroniclingFullText(
  pageUrl: string,
): Promise<string | undefined> {
  const url = safeUrl(pageUrl);
  if (!url || !/loc\.gov\/resource\//.test(url)) return undefined;
  try {
    const withJson = `${url}${url.includes("?") ? "&" : "?"}fo=json`;
    const data = await providerFetch<{ full_text?: string }>(withJson, {
      provider: "chronicling",
      ratePerSec: 1,
      burst: 2,
      cacheTtlMs: 60 * 60 * 1000,
    });
    return typeof data.full_text === "string"
      ? toPlainText(data.full_text)
      : undefined;
  } catch {
    return undefined;
  }
}
