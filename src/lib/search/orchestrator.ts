/**
 * Search orchestration: fan a query out to every enabled provider, collect
 * per-provider statuses independently (one provider failing never discards
 * another's results), normalize, dedupe, and rank.
 */

import type {
  ProviderStatus,
  SearchRequest,
  SearchResponse,
  SourceRecord,
} from "@/lib/types";
import { isDemoMode } from "@/lib/env";
import { ALL_PROVIDERS, LOCAL_PROVIDER_IDS } from "@/lib/providers/registry";
import type { ProviderSearchParams } from "@/lib/providers/base";
import { interpretQuery } from "./interpret";
import { rankRecords } from "./rank";
import { expandWithAi } from "@/lib/worldview/anthropic";

const PER_PROVIDER_LIMIT = 30;
const MAX_RESULTS = 60;

export async function runSearch(
  req: SearchRequest,
  providersOverride?: typeof ALL_PROVIDERS,
): Promise<SearchResponse> {
  let interpretation = interpretQuery(req.query);
  // Optional AI query expansion — additive only; never replaces the rule layer.
  try {
    interpretation = await expandWithAi(interpretation);
  } catch {
    // AI expansion is best-effort; the rule interpretation stands.
  }

  const demoMode = isDemoMode();
  // The query's own dates win over the lens default range; explicit lens
  // narrowing (non-default) wins over both.
  const lens = req.lens;
  const lensIsDefault = lens.yearRange[0] === 1850 && lens.yearRange[1] === 1877;
  const yearRange: [number, number] =
    interpretation.yearRange && lensIsDefault
      ? interpretation.yearRange
      : lens.yearRange;
  const monthRange = interpretation.monthRange ?? lens.monthRange;

  const params: ProviderSearchParams = {
    interpretation,
    yearRange,
    monthRange,
    limit: PER_PROVIDER_LIMIT,
    page: req.page,
  };

  const enabled = (providersOverride ?? ALL_PROVIDERS).filter((p) => {
    if (demoMode && !LOCAL_PROVIDER_IDS.includes(p.info.id)) return false;
    if (req.filters?.providers?.length) {
      return req.filters.providers.includes(p.info.id);
    }
    return true;
  });

  const settled = await Promise.allSettled(enabled.map((p) => p.search(params)));

  const statuses: ProviderStatus[] = [];
  const merged: SourceRecord[] = [];
  const seenUrls = new Set<string>();

  settled.forEach((outcome, i) => {
    const provider = enabled[i];
    if (outcome.status === "fulfilled") {
      statuses.push(outcome.value.status);
      for (const rec of outcome.value.records) {
        // Dedupe the same archive item reached twice. Distinct records may
        // legitimately share a URL (collection-level entries link to the
        // archive root), so the key includes the provider item id.
        const key = `${rec.url.replace(/#.*$/, "")}::${rec.providerItemId}`;
        if (seenUrls.has(key)) continue;
        seenUrls.add(key);
        merged.push(rec);
      }
    } else {
      statuses.push({
        provider: provider.info.id,
        status: "unavailable",
        count: 0,
        detail:
          outcome.reason instanceof Error
            ? outcome.reason.message
            : "Provider failed unexpectedly.",
      });
    }
  });

  const ranked = rankRecords(merged, interpretation, lens, req.filters).slice(
    0,
    MAX_RESULTS,
  );

  return {
    interpretation,
    results: ranked,
    providerStatuses: statuses,
    demoMode,
    totalBeforeRanking: merged.length,
  };
}
