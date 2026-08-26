/**
 * Valley of the Shadow adapter — https://valley.lib.virginia.edu/
 *
 * The Valley project (University of Virginia Library) documents two
 * communities through the war — Augusta County, Virginia and Franklin
 * County, Pennsylvania — with transcribed letters, diaries, newspapers,
 * church records, and soldiers' dossiers. It publishes no search API, so
 * this adapter provides verified collection-level deep links from a small
 * local index of real entries. It never scrapes the site.
 */

import type { ProviderInfo } from "@/lib/types";
import { DEMO_RECORDS } from "@/lib/demo/records";
import {
  okStatus,
  type ProviderSearchParams,
  type ProviderSearchResult,
  type SourceProvider,
} from "./base";
import { localSearch } from "./local";

const INFO: ProviderInfo = {
  id: "valley",
  name: "Valley of the Shadow",
  shortName: "Valley",
  homepage: "https://valley.lib.virginia.edu/",
  access: "deep-link-index",
  description:
    "Two communities — Augusta County, Va. and Franklin County, Pa. — documented in parallel through the war: letters, diaries, newspapers, records. No public API; Archive Lens links into the collections.",
};

const VALLEY_RECORDS = DEMO_RECORDS.filter((r) => r.provider === "valley");

export const valleyProvider: SourceProvider = {
  info: INFO,
  isConfigured: () => true,
  async search(params: ProviderSearchParams): Promise<ProviderSearchResult> {
    const started = Date.now();
    const records = localSearch(VALLEY_RECORDS, params);
    const status = okStatus(
      "valley",
      records.length,
      VALLEY_RECORDS.length,
      Date.now() - started,
    );
    status.detail =
      "Valley of the Shadow has no public search API; these are collection-level entry points into the archive.";
    if (records.length > 0) status.status = "partial";
    return { records, status };
  },
};
