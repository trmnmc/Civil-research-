/**
 * Provider adapter interface. Every archive implements `search`, returning
 * normalized SourceRecords plus a ProviderStatus. A provider failing must
 * never take down the result set — the orchestrator collects per-provider
 * outcomes independently.
 */

import type {
  ProviderId,
  ProviderInfo,
  ProviderStatus,
  QueryInterpretation,
  SourceRecord,
} from "@/lib/types";

export interface ProviderSearchParams {
  interpretation: QueryInterpretation;
  /** Year window after lens/query merging. */
  yearRange: [number, number];
  monthRange?: [string, string];
  /** Max records this provider should contribute. */
  limit: number;
  page?: number;
}

export interface ProviderSearchResult {
  records: SourceRecord[];
  status: ProviderStatus;
}

export interface SourceProvider {
  info: ProviderInfo;
  /** True when the provider can run right now (credentials present, etc.). */
  isConfigured(): boolean;
  /** Setup guidance when not configured. */
  setupGuidance?(): string;
  search(params: ProviderSearchParams): Promise<ProviderSearchResult>;
}

export function makeRecordId(provider: ProviderId, providerItemId: string): string {
  return `${provider}:${providerItemId}`;
}

export function okStatus(
  provider: ProviderId,
  count: number,
  totalAvailable: number | undefined,
  tookMs: number,
): ProviderStatus {
  return { provider, status: "ok", count, totalAvailable, tookMs };
}

export function errorStatus(
  provider: ProviderId,
  kind: "rate-limited" | "unavailable" | "needs-setup",
  detail: string,
): ProviderStatus {
  return { provider, status: kind, count: 0, detail };
}
