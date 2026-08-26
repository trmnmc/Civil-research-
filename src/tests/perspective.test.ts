import { describe, expect, it } from "vitest";
import {
  bandWeights,
  defaultLens,
  perspectiveBoost,
  passesStrict,
  snapBand,
} from "@/lib/search/perspective";
import type { SourceRecord } from "@/lib/types";
import { DEMO_RECORDS } from "@/lib/demo/records";

const kyRecord = DEMO_RECORDS.find((r) => r.id === "demo:magoffin-reply-1861")!;
const richmondRecord = DEMO_RECORDS.find(
  (r) => r.id === "demo:lccn-sn84024738",
)!;

describe("band snapping", () => {
  it("snaps to three evidence-backed bands", () => {
    expect(snapBand(0)).toBe("north");
    expect(snapBand(33)).toBe("north");
    expect(snapBand(50)).toBe("border");
    expect(snapBand(66)).toBe("south");
    expect(snapBand(100)).toBe("south");
  });

  it("holds constant weights inside band cores (no invented intermediate positions)", () => {
    expect(bandWeights(5).north).toBe(1);
    expect(bandWeights(20).north).toBe(1);
    expect(bandWeights(50).border).toBe(1);
    expect(bandWeights(80).south).toBe(1);
    expect(bandWeights(90).south).toBe(1);
  });
});

describe("perspective boost", () => {
  it("boosts border sources when the lens is centered", () => {
    const lens = { ...defaultLens(), position: 50 };
    const border = perspectiveBoost(kyRecord, lens).boost;
    const south = perspectiveBoost(richmondRecord, lens).boost;
    expect(border).toBeGreaterThan(south);
  });

  it("never zeroes out opposing sources (boost, don't hide)", () => {
    const lens = { ...defaultLens(), position: 0 }; // hard North
    expect(perspectiveBoost(richmondRecord, lens).boost).toBeGreaterThan(0);
  });

  it("does not treat institutional records about enslaved people as their voice", () => {
    const lens = {
      ...defaultLens(),
      position: 90,
      socialPositions: ["enslaved-person" as const],
    };
    const institutional: SourceRecord = {
      ...richmondRecord,
      classification: {
        ...richmondRecord.classification,
        evidenceClass: "official-record",
      },
      perspective: {
        ...richmondRecord.perspective,
        region: "south",
        socialPositions: [],
      },
    };
    const { boost, reasons } = perspectiveBoost(institutional, lens);
    const voice = DEMO_RECORDS.find(
      (r) => r.id === "docsouth:jacobs-incidents-1861",
    )!;
    expect(perspectiveBoost(voice, lens).boost).toBeGreaterThan(boost);
    expect(reasons.join(" ")).toMatch(/about, not by/);
  });
});

describe("strict mode", () => {
  it("filters to the selected band only when strict is on", () => {
    const strictNorth = { ...defaultLens(), position: 10, strict: true };
    expect(passesStrict(richmondRecord, strictNorth)).toBe(false);
    expect(passesStrict(richmondRecord, { ...strictNorth, strict: false })).toBe(
      true,
    );
  });
});
