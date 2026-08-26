/**
 * National Archives Catalog adapter — Catalog API v2.
 * Docs: https://www.archives.gov/research/catalog/help/api
 *
 * Verified against NARA's official Catalog-API repository
 * (github.com/usnationalarchives/Catalog-API):
 *  - Base: https://catalog.archives.gov/api/v2, search at GET /records/search
 *  - Auth: required `x-api-key` header. Keys are free, requested from
 *    Catalog_API@nara.gov (read-only is sufficient for this app).
 *  - Params: `q`, `limit`, `searchAfter` cursor (init `*`), and
 *    `availableOnline=true` to restrict to digitized records.
 *  - Response envelope: body.hits.hits[]._source.record — records carry
 *    naId, title, and digitalObjects[].objectUrl.
 *  - Rate limit: 10,000 queries per month per key. We cache aggressively
 *    and keep request rates minimal.
 *  - Required attribution (shown in the app footer): "This product uses the
 *    National Archives Catalog API but is not endorsed or certified by the
 *    National Archives and Records Administration."
 *
 * Without a key the provider reports `needs-setup` with guidance rather
 * than failing.
 */

import type { ProviderInfo, SourceFormat, SourceRecord } from "@/lib/types";
import { classifySource } from "@/lib/classify/classify";
import { naraApiKey } from "@/lib/env";
import { findStates } from "@/lib/search/aliases";
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

const INFO: ProviderInfo = {
  id: "nara",
  name: "National Archives Catalog",
  shortName: "NARA",
  homepage: "https://catalog.archives.gov",
  access: "api-key",
  description:
    "Federal records: military service, official correspondence, government documents, photographs. Requires a free API key from the National Archives.",
};

export const NARA_SETUP_GUIDANCE =
  "The National Archives Catalog API requires a free key. Email Catalog_API@nara.gov to request a read-only key (see https://www.archives.gov/research/catalog/help/api), then set NARA_API_KEY in .env.local and restart. Until then, National Archives results are simply omitted — everything else keeps working.";

interface NaraDigitalObject {
  objectUrl?: string;
  objectType?: string;
  objectFileSize?: number;
  [key: string]: unknown;
}

interface NaraRecord {
  naId?: number | string;
  title?: string;
  levelOfDescription?: string;
  scopeAndContentNote?: string;
  productionDates?: { logicalDate?: string; dateQualifier?: string }[];
  coverageStartDate?: { logicalDate?: string };
  coverageEndDate?: { logicalDate?: string };
  digitalObjects?: NaraDigitalObject[];
  generalRecordsTypes?: string[];
  recordGroupNumber?: number;
  creators?: { heading?: string }[];
  subjects?: { heading?: string }[];
  physicalOccurrences?: unknown[];
  useRestriction?: { status?: string; note?: string };
  [key: string]: unknown;
}

interface NaraSearchResponse {
  statusCode?: number;
  body?: {
    hits?: {
      total?: { value?: number };
      hits?: { _source?: { record?: NaraRecord }; sort?: unknown[] }[];
    };
  };
}

function mapNaraFormat(record: NaraRecord): { format: SourceFormat; label?: string } {
  const types = (record.generalRecordsTypes ?? []).map((t) => t.toLowerCase());
  const title = (record.title ?? "").toLowerCase();
  const label = record.generalRecordsTypes?.[0];
  if (types.some((t) => t.includes("photograph"))) return { format: "photograph", label };
  if (types.some((t) => t.includes("map") || t.includes("chart"))) return { format: "map", label };
  if (title.includes("muster roll")) return { format: "roster", label };
  if (title.includes("census")) return { format: "census", label };
  if (title.includes("order")) return { format: "military-order", label };
  if (title.includes("report")) return { format: "official-report", label };
  if (title.includes("letter") || title.includes("correspondence"))
    return { format: "letter", label };
  return { format: "government-document", label };
}

export function normalizeNaraRecord(
  record: NaraRecord,
  requestUrl: string,
): SourceRecord | undefined {
  const naId = record.naId;
  if (!naId || !record.title) return undefined;
  const url = `https://catalog.archives.gov/id/${naId}`;
  const title = toPlainText(record.title);
  const description = record.scopeAndContentNote
    ? toPlainText(record.scopeAndContentNote)
    : undefined;
  const created =
    record.productionDates?.[0]?.logicalDate?.slice(0, 10) ??
    record.coverageStartDate?.logicalDate?.slice(0, 10);
  const eventRange =
    record.coverageStartDate?.logicalDate && record.coverageEndDate?.logicalDate
      ? `${record.coverageStartDate.logicalDate.slice(0, 4)}–${record.coverageEndDate.logicalDate.slice(0, 4)}`
      : undefined;
  const sortYear = extractYear(created ?? eventRange);
  const digital = (record.digitalObjects ?? []).filter((d) => safeUrl(d.objectUrl));
  const scanAvailable = digital.length > 0;
  const thumbnailUrl = scanAvailable ? safeUrl(digital[0].objectUrl) : undefined;
  const { format, label } = mapNaraFormat(record);
  const creator = record.creators?.[0]?.heading
    ? toPlainText(record.creators[0].heading)
    : undefined;
  const subjects = (record.subjects ?? [])
    .map((s) => (s.heading ? toPlainText(s.heading) : ""))
    .filter(Boolean);
  const stateHit = findStates(`${title} ${subjects.join(" ")}`)[0];

  const classification = classifySource({
    format,
    formatLabel: label,
    title,
    description,
    dates: { created, eventDate: eventRange, sortYear, display: created ?? eventRange },
    subjects,
    scanAvailable,
    catalogOnly: !scanAvailable,
    provider: "nara",
  });

  return {
    id: makeRecordId("nara", String(naId)),
    provider: "nara",
    providerItemId: String(naId),
    url,
    title,
    creator,
    dates: { created, eventDate: eventRange, sortYear, display: created ?? eventRange },
    place: stateHit?.name,
    state: stateHit?.code,
    format,
    formatLabel: label,
    collection: record.recordGroupNumber
      ? `Record Group ${record.recordGroupNumber}`
      : undefined,
    subjects,
    description,
    transcript: {
      available: false,
      isOcr: false,
      sourceNote:
        "Transcriptions, when contributed, are on the National Archives Catalog page for this record.",
    },
    scanAvailable,
    scanUrl: thumbnailUrl,
    thumbnailUrl,
    rights: {
      statement:
        record.useRestriction?.note ??
        record.useRestriction?.status ??
        "NARA archival metadata is in the public domain; check the record for use restrictions on the documents.",
      allowsRedistribution: false,
      link: url,
    },
    citation: {
      creator,
      title,
      date: created ?? eventRange,
      collection: record.recordGroupNumber
        ? `Record Group ${record.recordGroupNumber}`
        : undefined,
      archiveName: "National Archives and Records Administration",
      url,
      locator: `National Archives Identifier ${naId}`,
      accessed: new Date().toISOString().slice(0, 10),
    },
    classification,
    perspective: {
      region: "national",
      state: stateHit?.code,
      socialPositions: [],
      alignment: "unknown",
      basis: "inferred",
      note:
        "Federal records are held nationally; the people documented in them come from every region. Location is not loyalty.",
    },
    raw: record as Record<string, unknown>,
    provenance: `Live NARA Catalog API v2 response (${requestUrl.replace(/x-api-key[^&]*/i, "")})`,
  };
}

export function buildNaraUrl(params: ProviderSearchParams): string {
  const { interpretation, limit } = params;
  const u = new URL("https://catalog.archives.gov/api/v2/records/search");
  const q = [interpretation.originalQuery.trim()].join(" ");
  u.searchParams.set("q", q);
  u.searchParams.set("limit", String(Math.min(limit, 25)));
  u.searchParams.set("availableOnline", "true");
  return u.toString();
}

export const naraProvider: SourceProvider = {
  info: INFO,
  isConfigured: () => Boolean(naraApiKey()),
  setupGuidance: () => NARA_SETUP_GUIDANCE,
  async search(params): Promise<ProviderSearchResult> {
    const key = naraApiKey();
    if (!key) {
      return {
        records: [],
        status: errorStatus("nara", "needs-setup", NARA_SETUP_GUIDANCE),
      };
    }
    const started = Date.now();
    const url = buildNaraUrl(params);
    try {
      const data = await providerFetch<NaraSearchResponse>(url, {
        provider: "nara",
        // 10k requests/month budget → keep the rate very low and cache long.
        ratePerSec: 0.5,
        burst: 2,
        cacheTtlMs: 60 * 60 * 1000,
        headers: { "x-api-key": key, "Content-Type": "application/json" },
      });
      const hits = data.body?.hits?.hits ?? [];
      const records: SourceRecord[] = [];
      for (const hit of hits) {
        const rec = hit._source?.record
          ? normalizeNaraRecord(hit._source.record, url)
          : undefined;
        if (rec) {
          // Keep the research period front and center: NARA searches the
          // whole federal catalog, so filter to the requested years when
          // the record has a usable date.
          const y = rec.dates.sortYear;
          if (y !== undefined && (y < params.yearRange[0] - 5 || y > params.yearRange[1] + 5)) {
            continue;
          }
          records.push(rec);
        }
      }
      return {
        records,
        status: okStatus(
          "nara",
          records.length,
          data.body?.hits?.total?.value,
          Date.now() - started,
        ),
      };
    } catch (err) {
      if (err instanceof ProviderRateLimitError) {
        return {
          records: [],
          status: errorStatus(
            "nara",
            "rate-limited",
            "The National Archives API monthly quota or rate limit was hit. Results will resume when the limit resets.",
          ),
        };
      }
      if (err instanceof ProviderHttpError && (err.status === 401 || err.status === 403)) {
        return {
          records: [],
          status: errorStatus(
            "nara",
            "needs-setup",
            "The National Archives rejected the API key (HTTP " +
              err.status +
              "). Check NARA_API_KEY in .env.local. " +
              NARA_SETUP_GUIDANCE,
          ),
        };
      }
      const detail =
        err instanceof ProviderHttpError
          ? `catalog.archives.gov responded HTTP ${err.status}.`
          : err instanceof Error
            ? err.message
            : "Unknown error reaching the National Archives.";
      return { records: [], status: errorStatus("nara", "unavailable", detail) };
    }
  },
};
