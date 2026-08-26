/**
 * Resilient server-side fetch for archive providers:
 * per-provider rate limiting, request timeouts, limited retries with backoff,
 * an in-memory TTL cache, and safe URL handling. All archive traffic goes
 * through here; nothing archive-facing runs in the browser.
 */

import { providerTimeoutMs, userAgent } from "@/lib/env";

// ─── TTL cache ───────────────────────────────────────────────────────────────

interface CacheEntry {
  at: number;
  ttlMs: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();
const CACHE_MAX = 500;

function cacheGet(key: string): unknown | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.at > e.ttlMs) {
    cache.delete(key);
    return undefined;
  }
  return e.value;
}

function cacheSet(key: string, value: unknown, ttlMs: number) {
  if (cache.size >= CACHE_MAX) {
    // Drop the oldest entries.
    const keys = [...cache.keys()].slice(0, 50);
    keys.forEach((k) => cache.delete(k));
  }
  cache.set(key, { at: Date.now(), ttlMs, value });
}

// ─── Per-provider rate limiting (simple token bucket) ────────────────────────

interface Bucket {
  tokens: number;
  capacity: number;
  refillPerSec: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

function takeToken(provider: string, capacity: number, refillPerSec: number): boolean {
  let b = buckets.get(provider);
  const now = Date.now();
  if (!b) {
    b = { tokens: capacity, capacity, refillPerSec, lastRefill: now };
    buckets.set(provider, b);
  }
  const elapsed = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(b.capacity, b.tokens + elapsed * b.refillPerSec);
  b.lastRefill = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return true;
  }
  return false;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class ProviderHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} from ${url}`);
    this.name = "ProviderHttpError";
  }
}

export class ProviderRateLimitError extends Error {
  constructor(public readonly provider: string, message?: string) {
    super(message ?? `Rate limit reached for ${provider}`);
    this.name = "ProviderRateLimitError";
  }
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export interface ProviderFetchOptions {
  provider: string;
  /** Requests per second sustained (token refill). */
  ratePerSec?: number;
  /** Burst capacity. */
  burst?: number;
  cacheTtlMs?: number;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  as?: "json" | "text";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a provider URL with caching, rate limiting, timeout, and limited
 * retries. Throws ProviderRateLimitError / ProviderHttpError on failure.
 */
export async function providerFetch<T = unknown>(
  url: string,
  opts: ProviderFetchOptions,
): Promise<T> {
  const {
    provider,
    ratePerSec = 2,
    burst = 4,
    cacheTtlMs = 10 * 60 * 1000,
    timeoutMs = providerTimeoutMs(),
    retries = 2,
    headers = {},
    as = "json",
  } = opts;

  const parsed = new URL(url); // throws on malformed URLs
  if (parsed.protocol !== "https:") {
    throw new Error(`Refusing non-HTTPS provider URL: ${url}`);
  }

  const cacheKey = `${provider}:${as}:${url}`;
  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return cached as T;

  if (!takeToken(provider, burst, ratePerSec)) {
    // One polite wait, then give up with a rate-limit signal.
    await sleep(1000 / ratePerSec + 250);
    if (!takeToken(provider, burst, ratePerSec)) {
      throw new ProviderRateLimitError(provider);
    }
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent(),
          Accept: as === "json" ? "application/json" : "text/html,text/plain",
          ...headers,
        },
        signal: controller.signal,
        redirect: "follow",
      });
      if (res.status === 429) {
        throw new ProviderRateLimitError(
          provider,
          `${provider} responded 429 (rate limited)`,
        );
      }
      if (!res.ok) {
        throw new ProviderHttpError(res.status, url);
      }
      const value = as === "json" ? await res.json() : await res.text();
      cacheSet(cacheKey, value, cacheTtlMs);
      return value as T;
    } catch (err) {
      lastError = err;
      // Rate limits and 4xx don't retry; network/5xx/timeouts do.
      if (err instanceof ProviderRateLimitError) throw err;
      if (err instanceof ProviderHttpError && err.status < 500) throw err;
      if (attempt < retries) {
        await sleep(400 * Math.pow(2, attempt));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Request to ${provider} failed`);
}

/** Test hook: clear cache and buckets. */
export function resetFetchState() {
  cache.clear();
  buckets.clear();
}
