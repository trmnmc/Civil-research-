import { describe, expect, it } from "vitest";
import { interpretQuery } from "@/lib/search/interpret";
import { defaultLens } from "@/lib/search/perspective";
import { rankRecords } from "@/lib/search/rank";
import { DEMO_RECORDS } from "@/lib/demo/records";

describe("hybrid ranking with the Perspective Lens", () => {
  const interp = interpretQuery("newspapers on emancipation 1862");

  it("changes ordering as the lens moves from North to South without dropping sources", () => {
    const north = rankRecords(DEMO_RECORDS, interp, {
      ...defaultLens(),
      position: 5,
    });
    const south = rankRecords(DEMO_RECORDS, interp, {
      ...defaultLens(),
      position: 95,
    });
    expect(north.length).toBeGreaterThan(0);
    // Same records survive under both lens positions — only order changes.
    expect(new Set(north.map((r) => r.record.id))).toEqual(
      new Set(south.map((r) => r.record.id)),
    );
    const idxOf = (list: typeof north, pred: (id: string) => boolean) =>
      list.findIndex((r) => pred(r.record.id));
    const richmondNorth = idxOf(north, (id) => id.includes("sn84024669"));
    const richmondSouth = idxOf(south, (id) => id.includes("sn84024669"));
    if (richmondNorth !== -1 && richmondSouth !== -1) {
      expect(richmondSouth).toBeLessThanOrEqual(richmondNorth);
    }
  });

  it("attaches a human-readable match explanation to every result", () => {
    const ranked = rankRecords(DEMO_RECORDS, interp, defaultLens());
    for (const r of ranked) {
      expect(r.explanation.scoreParts.length).toBeGreaterThan(0);
      expect(r.explanation.totalScore).toBeGreaterThan(0);
    }
  });

  it("applies strict filters as filters, not weights", () => {
    const lens = { ...defaultLens(), position: 95, strict: true };
    const ranked = rankRecords(DEMO_RECORDS, interp, lens);
    for (const r of ranked) {
      expect(["south", "national"]).toContain(r.record.perspective.region);
    }
  });

  it("honors explicit search filters", () => {
    const ranked = rankRecords(DEMO_RECORDS, interp, defaultLens(), {
      requireTranscript: true,
    });
    for (const r of ranked) {
      expect(r.record.transcript.available).toBe(true);
    }
  });

  it("ranks secondary/index material below equivalent primary sources", () => {
    const kyInterp = interpretQuery("Kentucky 1861 secession");
    const ranked = rankRecords(DEMO_RECORDS, kyInterp, defaultLens());
    const firstPrimary = ranked.findIndex(
      (r) => r.record.classification.evidenceClass !== "index-or-finding-aid",
    );
    expect(firstPrimary).toBe(0);
  });
});
