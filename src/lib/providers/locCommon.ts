/**
 * Shared normalization for loc.gov JSON API results (used by both the
 * Library of Congress adapter and the Chronicling America adapter — the
 * latter is served through the same API as a collection).
 *
 * Response structure per the Library's official API documentation
 * (https://www.loc.gov/apis/json-and-yaml/): a search response carries
 * `results` (array of item summaries) and `pagination` (`total`, `of`,
 * `current`, `perpage`, ...). Item summaries include `id`, `title`, `date`,
 * `dates`, `url`, `image_url`, `original_format`, `online_format`,
 * `partof`, `contributor`, `subject`, `location`, `description`.
 */

import type {
  PerspectiveProfile,
  SourceFormat,
  SourceRecord,
} from "@/lib/types";
import { classifySource } from "@/lib/classify/classify";
import { bandForState, STATES } from "@/lib/search/aliases";
import { safeUrl, toPlainText } from "@/lib/sanitize";
import { extractYear } from "@/lib/utils";
import { makeRecordId } from "./base";

export interface LocSearchResponse {
  results?: LocItem[];
  pagination?: {
    total?: number;
    of?: number;
    current?: number;
    perpage?: number;
  };
}

export interface LocItem {
  id?: string;
  title?: string;
  date?: string;
  dates?: string[];
  url?: string;
  image_url?: string[];
  original_format?: string[];
  online_format?: string[];
  partof?: string[];
  contributor?: string[];
  subject?: string[];
  location?: string[];
  description?: string[];
  language?: string[];
  mime_type?: string[];
  number_lccn?: string[];
  rights?: string | string[];
  item?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Map loc.gov original_format values to our SourceFormat vocabulary. */
export function mapLocFormat(
  originalFormats: string[] | undefined,
  title: string,
): { format: SourceFormat; label?: string } {
  const formats = (originalFormats ?? []).map((f) => f.toLowerCase());
  const t = title.toLowerCase();
  const label = originalFormats?.[0];
  if (formats.some((f) => f.includes("newspaper"))) return { format: "newspaper", label };
  if (formats.some((f) => f.includes("periodical"))) return { format: "periodical", label };
  if (formats.some((f) => f.includes("map"))) return { format: "map", label };
  if (formats.some((f) => f.includes("photo"))) {
    return { format: "photograph", label };
  }
  if (formats.some((f) => f.includes("manuscript") || f.includes("mixed material"))) {
    if (t.includes("diary") || t.includes("journal")) return { format: "diary", label };
    if (t.includes("letter") || t.includes("correspondence"))
      return { format: "letter", label };
    return { format: "manuscript", label };
  }
  if (formats.some((f) => f.includes("book") || f.includes("printed text"))) {
    if (t.includes("memoir") || t.includes("reminiscence"))
      return { format: "memoir", label };
    if (t.includes("speech") || t.includes("address")) return { format: "speech", label };
    if (t.includes("pamphlet")) return { format: "pamphlet", label };
    return { format: "book", label };
  }
  if (formats.some((f) => f.includes("notated music"))) {
    return { format: "sheet-music", label };
  }
  if (t.includes("broadside")) return { format: "broadside", label };
  return { format: "other", label };
}

/** Derive a state code from loc.gov `location` facets, when unambiguous. */
export function stateFromLocations(locations: string[] | undefined): string | undefined {
  if (!locations) return undefined;
  for (const loc of locations) {
    const l = loc.toLowerCase().trim();
    const hit = STATES.find((s) => s.name.toLowerCase() === l);
    if (hit) return hit.code;
  }
  // Try substring match for entries like "united states--kentucky--frankfort".
  for (const loc of locations) {
    const l = loc.toLowerCase();
    const hit = STATES.find((s) => l.includes(s.name.toLowerCase()));
    if (hit) return hit.code;
  }
  return undefined;
}

export function normalizeLocItem(
  item: LocItem,
  provider: "loc" | "chronicling",
  requestUrl: string,
): SourceRecord | undefined {
  const rawId = item.id ?? item.url;
  if (!rawId || !item.title) return undefined;
  const url = safeUrl(item.url ?? item.id);
  if (!url) return undefined;

  // Provider item id: the stable loc.gov identifier path.
  const providerItemId = rawId
    .replace(/^https?:\/\/(www\.)?loc\.gov\//, "")
    .replace(/\/+$/, "");

  const title = toPlainText(item.title);
  const description = item.description?.length
    ? toPlainText(item.description.join(" "))
    : undefined;
  const created = item.date;
  const sortYear = extractYear(created ?? item.dates?.[0]);
  const state = stateFromLocations(item.location);
  const { format, label } = mapLocFormat(item.original_format, title);
  const scanAvailable = Boolean(item.image_url?.length);
  const thumbnailUrl = item.image_url?.length ? safeUrl(item.image_url[0]) : undefined;
  const subjects = (item.subject ?? []).map((s) => toPlainText(s));
  const creator = item.contributor?.length
    ? toPlainText(item.contributor[0])
    : undefined;
  const collection = item.partof?.length ? toPlainText(item.partof[0]) : undefined;

  const classification = classifySource({
    format,
    formatLabel: label,
    title,
    description,
    dates: { created, sortYear, display: created },
    subjects,
    scanAvailable,
    provider,
  });

  const perspective: PerspectiveProfile = {
    region: state ? bandForState(state) : "unknown",
    state,
    place: item.location?.[0] ? toPlainText(item.location[0]) : undefined,
    socialPositions: format === "newspaper" ? ["newspaper-editor"] : [],
    alignment: "unknown",
    basis: "inferred",
    note: state
      ? "Region inferred from the archive's place metadata. Location is not loyalty."
      : "No place metadata; region unknown.",
  };

  const rights =
    typeof item.rights === "string"
      ? item.rights
      : Array.isArray(item.rights)
        ? item.rights.join(" ")
        : undefined;

  return {
    id: makeRecordId(provider, providerItemId),
    provider,
    providerItemId,
    url,
    title,
    creator,
    dates: { created, sortYear, display: created },
    place: item.location?.[0] ? toPlainText(item.location[0]) : undefined,
    state,
    format,
    formatLabel: label,
    collection,
    subjects,
    description,
    transcript: {
      available: false,
      isOcr: false,
      sourceNote:
        provider === "chronicling"
          ? "Full page text is available on the Library of Congress page for this newspaper page."
          : undefined,
    },
    scanAvailable,
    scanUrl: thumbnailUrl,
    thumbnailUrl,
    rights: {
      statement:
        rights ??
        "Rights vary by item. Consult the item's rights information at the Library of Congress.",
      allowsRedistribution: false,
      link: url,
    },
    citation: {
      creator,
      title,
      date: created,
      collection,
      archiveName: "Library of Congress",
      url,
      accessed: new Date().toISOString().slice(0, 10),
    },
    classification,
    perspective,
    raw: item as Record<string, unknown>,
    provenance: `Live loc.gov API response (${requestUrl})`,
  };
}
