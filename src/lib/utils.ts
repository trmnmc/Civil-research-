import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Encode a SourceRecord id for use in a URL path segment. */
export function encodeRecordId(id: string): string {
  return encodeURIComponent(id);
}

export function decodeRecordId(encoded: string): string {
  return decodeURIComponent(encoded);
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Best-effort year extraction from a free-form archive date string. */
export function extractYear(date?: string): number | undefined {
  if (!date) return undefined;
  const m = date.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  return m ? parseInt(m[1], 10) : undefined;
}

/** Format an ISO-ish date for display without inventing precision. */
export function formatArchiveDate(date?: string): string {
  if (!date) return "Date not recorded";
  const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(
      Date.UTC(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3])),
    );
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  const ym = date.match(/^(\d{4})-(\d{2})$/);
  if (ym) {
    const d = new Date(Date.UTC(parseInt(ym[1]), parseInt(ym[2]) - 1, 1));
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  }
  return date;
}
