/**
 * Centralized environment access. Server-only — never import from client code.
 */

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true";
}

export function naraApiKey(): string | undefined {
  const k = process.env.NARA_API_KEY?.trim();
  return k ? k : undefined;
}

export function anthropicApiKey(): string | undefined {
  const k = process.env.ANTHROPIC_API_KEY?.trim();
  return k ? k : undefined;
}

/** Runtime model is configurable; no model version is hardcoded in app logic. */
export function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";
}

export function userAgent(): string {
  return (
    process.env.ARCHIVE_LENS_USER_AGENT ||
    "ArchiveLens/0.1 (Civil War research tool; local use)"
  );
}

export function providerTimeoutMs(): number {
  const n = parseInt(process.env.PROVIDER_TIMEOUT_MS || "", 10);
  return Number.isFinite(n) && n > 0 ? n : 12_000;
}

export function databasePath(): string {
  return process.env.DATABASE_PATH || "data/archive-lens.db";
}
