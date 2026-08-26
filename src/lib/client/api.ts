"use client";

/** Client-side API wrappers + the comparison basket (localStorage). */

import type {
  ComparisonResult,
  LensState,
  SearchFilters,
  SearchResponse,
  SourceRecord,
  WorldviewSynthesis,
} from "@/lib/types";
import type { CitationBundle } from "@/lib/cite/cite";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      typeof detail?.error === "string" ? detail.error : `Request failed (${res.status})`,
    );
  }
  return res.json();
}

export function search(body: {
  query: string;
  lens: LensState;
  filters?: SearchFilters;
  page?: number;
}): Promise<SearchResponse> {
  return post("/api/search", body);
}

export function fetchWorldview(body: {
  recordIds: string[];
  lens: LensState;
  asOf: string;
}): Promise<{ synthesis: WorldviewSynthesis }> {
  return post("/api/worldview", body);
}

export function fetchCompare(body: {
  leftIds: string[];
  rightIds: string[];
}): Promise<{ result: ComparisonResult }> {
  return post("/api/compare", body);
}

export async function fetchSource(id: string): Promise<{
  record: SourceRecord;
  citations: CitationBundle;
  fullText?: string;
}> {
  const res = await fetch(`/api/source?id=${encodeURIComponent(id)}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      typeof detail?.error === "string" ? detail.error : "Source unavailable",
    );
  }
  return res.json();
}

// ─── Comparison basket ───────────────────────────────────────────────────────

const BASKET_KEY = "archive-lens-compare";

export interface CompareBasket {
  left: string[];
  right: string[];
}

export function readBasket(): CompareBasket {
  if (typeof window === "undefined") return { left: [], right: [] };
  try {
    const raw = window.localStorage.getItem(BASKET_KEY);
    if (!raw) return { left: [], right: [] };
    const parsed = JSON.parse(raw);
    return {
      left: Array.isArray(parsed.left) ? parsed.left.slice(0, 10) : [],
      right: Array.isArray(parsed.right) ? parsed.right.slice(0, 10) : [],
    };
  } catch {
    return { left: [], right: [] };
  }
}

export function writeBasket(basket: CompareBasket) {
  try {
    window.localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
    window.dispatchEvent(new Event("archive-lens-basket"));
  } catch {
    // Storage unavailable (private mode etc.) — comparison still works
    // within the compare page session.
  }
}

export function addToBasket(side: "left" | "right", id: string) {
  const basket = readBasket();
  const other = side === "left" ? "right" : "left";
  basket[other] = basket[other].filter((x) => x !== id);
  if (!basket[side].includes(id)) basket[side] = [...basket[side], id].slice(-10);
  writeBasket(basket);
}

export function removeFromBasket(id: string) {
  const basket = readBasket();
  basket.left = basket.left.filter((x) => x !== id);
  basket.right = basket.right.filter((x) => x !== id);
  writeBasket(basket);
}
