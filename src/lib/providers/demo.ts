/**
 * Demo provider — bundled verified reference records (newspaper titles and
 * issues from the Library's own published dataset, plus famous documents
 * with verbatim-attested text). Serves as the offline search index in demo
 * mode, and contributes curated reference records alongside live results
 * otherwise.
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
  id: "demo",
  name: "Verified reference records",
  shortName: "Reference",
  homepage: "https://www.loc.gov",
  access: "deep-link-index",
  description:
    "A bundled set of real, verified archive records — newspaper runs from the Library of Congress dataset and canonical documents with verbatim text — available offline and without credentials.",
};

const OWN_RECORDS = DEMO_RECORDS.filter((r) => r.provider === "demo");

export const demoProvider: SourceProvider = {
  info: INFO,
  isConfigured: () => true,
  async search(params: ProviderSearchParams): Promise<ProviderSearchResult> {
    const started = Date.now();
    const records = localSearch(OWN_RECORDS, params);
    return {
      records,
      status: okStatus("demo", records.length, OWN_RECORDS.length, Date.now() - started),
    };
  },
};
