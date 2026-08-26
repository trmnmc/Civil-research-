/**
 * Record resolution: find the full SourceRecord for an id, wherever it
 * lives — the bundled local indexes, the recent-search cache, a saved
 * notebook snapshot, or (for Library of Congress items) a live item fetch.
 */

import { eq } from "drizzle-orm";
import type { SourceRecord } from "@/lib/types";
import { DEMO_RECORDS } from "@/lib/demo/records";
import { getDb } from "@/lib/db/client";
import { savedSources } from "@/lib/db/schema";
import { isDemoMode } from "@/lib/env";
import { providerFetch } from "@/lib/providers/fetch";
import { normalizeLocItem, type LocItem } from "@/lib/providers/locCommon";

// Recent search results, so opening a result never needs a live round-trip.
const recent = new Map<string, { at: number; record: SourceRecord }>();
const RECENT_MAX = 800;
const RECENT_TTL = 60 * 60 * 1000;

export function rememberRecords(records: SourceRecord[]) {
  const now = Date.now();
  for (const r of records) {
    recent.set(r.id, { at: now, record: r });
  }
  if (recent.size > RECENT_MAX) {
    const entries = [...recent.entries()].sort((a, b) => a[1].at - b[1].at);
    for (const [k] of entries.slice(0, recent.size - RECENT_MAX)) {
      recent.delete(k);
    }
  }
}

function fromRecent(id: string): SourceRecord | undefined {
  const hit = recent.get(id);
  if (!hit) return undefined;
  if (Date.now() - hit.at > RECENT_TTL) {
    recent.delete(id);
    return undefined;
  }
  return hit.record;
}

function fromLocal(id: string): SourceRecord | undefined {
  return DEMO_RECORDS.find((r) => r.id === id);
}

function fromNotebook(id: string): SourceRecord | undefined {
  try {
    const db = getDb();
    const row = db
      .select()
      .from(savedSources)
      .where(eq(savedSources.recordId, id))
      .get();
    if (!row) return undefined;
    return JSON.parse(row.snapshot) as SourceRecord;
  } catch {
    return undefined;
  }
}

async function fromLiveLoc(id: string): Promise<SourceRecord | undefined> {
  if (isDemoMode()) return undefined;
  const m = id.match(/^(loc|chronicling):(.+)$/);
  if (!m) return undefined;
  const provider = m[1] as "loc" | "chronicling";
  const itemPath = m[2];
  // Only item-style ids can be refetched directly.
  const itemId = itemPath.match(/^item\/(.+)$/)?.[1] ?? itemPath;
  const url = `https://www.loc.gov/item/${encodeURIComponent(itemId).replace(/%2F/g, "/")}/?fo=json`;
  try {
    const data = await providerFetch<{ item?: LocItem }>(url, {
      provider,
      ratePerSec: 1,
      burst: 2,
    });
    if (!data.item) return undefined;
    return normalizeLocItem(
      { ...data.item, id: data.item.id ?? `https://www.loc.gov/item/${itemId}/` },
      provider,
      url,
    );
  } catch {
    return undefined;
  }
}

export async function resolveRecord(
  id: string,
): Promise<SourceRecord | undefined> {
  return (
    fromLocal(id) ??
    fromRecent(id) ??
    fromNotebook(id) ??
    (await fromLiveLoc(id))
  );
}

export async function resolveRecords(ids: string[]): Promise<SourceRecord[]> {
  const out: SourceRecord[] = [];
  for (const id of ids) {
    const r = await resolveRecord(id);
    if (r) out.push(r);
  }
  return out;
}
