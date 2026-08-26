/**
 * Documenting the American South adapter — https://docsouth.unc.edu/
 *
 * DocSouth (University of North Carolina) publishes full-text electronic
 * editions of Southern primary sources, including the North American Slave
 * Narratives and First-Person Narratives collections. It exposes no search
 * API, so this adapter serves a local index of real, verified titles with
 * deep links into the collections. It never scrapes the site.
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
  id: "docsouth",
  name: "Documenting the American South",
  shortName: "DocSouth",
  homepage: "https://docsouth.unc.edu/",
  access: "deep-link-index",
  description:
    "Full-text electronic editions of Southern primary sources from UNC, including the North American Slave Narratives. No public API; Archive Lens serves a verified local index with deep links.",
};

const DOCSOUTH_RECORDS = DEMO_RECORDS.filter((r) => r.provider === "docsouth");

export const docsouthProvider: SourceProvider = {
  info: INFO,
  isConfigured: () => true,
  async search(params: ProviderSearchParams): Promise<ProviderSearchResult> {
    const started = Date.now();
    const records = localSearch(DOCSOUTH_RECORDS, params);
    const status = okStatus(
      "docsouth",
      records.length,
      DOCSOUTH_RECORDS.length,
      Date.now() - started,
    );
    status.detail =
      "DocSouth has no public search API; results come from a verified local index of its collections.";
    if (records.length > 0) status.status = "partial";
    return { records, status };
  },
};
