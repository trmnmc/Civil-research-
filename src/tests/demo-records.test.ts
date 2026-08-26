/**
 * Integrity tests for the bundled verified reference records: no invented
 * identifiers, provenance on everything, honest transcripts, and working
 * coverage for the acceptance research questions.
 */

import { describe, expect, it } from "vitest";
import { DEMO_RECORDS } from "@/lib/demo/records";
import { localSearch } from "@/lib/providers/local";
import { interpretQuery } from "@/lib/search/interpret";

describe("demo record integrity", () => {
  it("every record has id, https URL, provenance, and classification", () => {
    expect(DEMO_RECORDS.length).toBeGreaterThanOrEqual(30);
    const ids = new Set<string>();
    for (const r of DEMO_RECORDS) {
      expect(r.id).toMatch(/^(demo|valley|docsouth):/);
      expect(ids.has(r.id)).toBe(false);
      ids.add(r.id);
      expect(r.url).toMatch(/^https:\/\//);
      expect(r.provenance).toBeTruthy();
      expect(r.provenance!.length).toBeGreaterThan(40);
      expect(r.classification.explanation.length).toBeGreaterThan(20);
      expect(r.citation.url).toBe(r.url);
      expect(r.perspective.basis).toBe("curated");
    }
  });

  it("every bundled transcript is marked as excerpt with a named text source", () => {
    for (const r of DEMO_RECORDS) {
      if (r.transcript.available) {
        expect(r.transcript.text).toBeTruthy();
        expect(r.transcript.isExcerpt).toBe(true);
        expect(r.transcript.sourceNote).toMatch(/verbatim/i);
      }
    }
  });

  it("newspaper records use verified loc.gov URL patterns", () => {
    for (const r of DEMO_RECORDS.filter((x) => x.format === "newspaper")) {
      expect(
        /^https:\/\/www\.loc\.gov\/(item\/sn\d+\/|resource\/sn\d+\/\d{4}-\d{2}-\d{2}\/ed-\d+\/)/.test(
          r.url,
        ),
      ).toBe(true);
    }
  });

  it("no record asserts an alignment without a documenting note", () => {
    for (const r of DEMO_RECORDS) {
      if (r.perspective.alignment !== "unknown") {
        expect((r.perspective.note ?? "") + r.description).toBeTruthy();
      }
    }
  });

  it("covers the Kentucky 1861 acceptance query", () => {
    const found = localSearch(DEMO_RECORDS, {
      interpretation: interpretQuery("Kentucky loyalty and secession 1861"),
      yearRange: [1861, 1861],
      limit: 30,
    });
    expect(found.length).toBeGreaterThanOrEqual(3);
    expect(found.some((r) => r.state === "KY")).toBe(true);
  });

  it("covers the emancipation Sept 1862 – Jan 1863 acceptance query", () => {
    const found = localSearch(DEMO_RECORDS, {
      interpretation: interpretQuery(
        "newspaper reactions to emancipation September 1862 to January 1863",
      ),
      yearRange: [1862, 1863],
      limit: 30,
    });
    expect(found.length).toBeGreaterThanOrEqual(3);
    const regions = new Set(found.map((r) => r.perspective.region));
    expect(regions.size).toBeGreaterThanOrEqual(2);
  });

  it("covers the Gettysburg July 1863 acceptance query with honest limits", () => {
    const found = localSearch(DEMO_RECORDS, {
      interpretation: interpretQuery(
        "civilian accounts written near Gettysburg during July 1863",
      ),
      yearRange: [1863, 1863],
      limit: 30,
    });
    // Franklin County (adjacent to the campaign) index entries plus PA papers.
    expect(found.some((r) => r.state === "PA")).toBe(true);
  });
});
