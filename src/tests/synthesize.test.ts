import { describe, expect, it } from "vitest";
import {
  applyHorizon,
  synthesizeRuleBased,
} from "@/lib/worldview/synthesize";
import { stripGeneratedQuotes } from "@/lib/worldview/schema";
import { defaultLens } from "@/lib/search/perspective";
import { DEMO_RECORDS } from "@/lib/demo/records";

const kyRecords = DEMO_RECORDS.filter(
  (r) => r.state === "KY" || r.id.includes("declaration") || r.id.includes("emancipation"),
);

describe("worldview synthesis (rule-based)", () => {
  it("refuses to synthesize from insufficient evidence", () => {
    const one = [DEMO_RECORDS[0]];
    const result = synthesizeRuleBased(one, defaultLens(), "1861-06-30");
    expect(result.insufficient).toBeDefined();
    expect(result.claims).toHaveLength(0);
    expect(result.limitations.join(" ")).toMatch(/not enough evidence/i);
  });

  it("enforces the information horizon: later documents are excluded", () => {
    const { usable, excluded } = applyHorizon(DEMO_RECORDS, "1861-06-30");
    expect(excluded.some((r) => r.id === "demo:emancipation-proclamation-1863")).toBe(true);
    expect(usable.some((r) => r.id === "demo:magoffin-reply-1861")).toBe(true);
    // Retrospective accounts created after the horizon are excluded even
    // when their subject matter predates it.
    const { excluded: ex2 } = applyHorizon(
      DEMO_RECORDS.filter((r) => r.id === "docsouth:jacobs-incidents-1861"),
      "1855-01-01",
    );
    expect(ex2).toHaveLength(1);
  });

  it("cites only consulted record ids in every claim", () => {
    const result = synthesizeRuleBased(kyRecords, defaultLens(), "1861-12-31");
    const allowed = new Set(result.consulted);
    expect(result.claims.length).toBeGreaterThan(0);
    for (const claim of result.claims) {
      expect(claim.evidence.length).toBeGreaterThan(0);
      for (const id of claim.evidence) {
        expect(allowed.has(id)).toBe(true);
      }
    }
  });

  it("marks single-source claims as non-generalizable", () => {
    const result = synthesizeRuleBased(kyRecords, defaultLens(), "1861-12-31");
    for (const claim of result.claims) {
      if (claim.evidence.length < 2 && claim.kind === "knowledge") {
        expect(`${claim.text} ${claim.caveat ?? ""}`).toMatch(
          /single|one author/i,
        );
      }
    }
  });

  it("always states limitations rather than filling gaps", () => {
    const result = synthesizeRuleBased(kyRecords, defaultLens(), "1861-12-31");
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("reports missing selected voices instead of inventing them", () => {
    const lens = {
      ...defaultLens(),
      socialPositions: ["enslaved-person" as const],
    };
    const onlyPapers = DEMO_RECORDS.filter((r) =>
      r.id.startsWith("demo:lccn-sn8402"),
    );
    const result = synthesizeRuleBased(onlyPapers, lens, "1862-12-31");
    expect(result.limitations.join(" ")).toMatch(/enslaved person/i);
  });
});

describe("generated-quote stripping", () => {
  it("removes quotation marks from model text so paraphrase cannot pose as quotation", () => {
    expect(stripGeneratedQuotes('They feared "ruin" and “invasion”')).toBe(
      "They feared ruin and invasion",
    );
  });
});
