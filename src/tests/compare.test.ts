import { describe, expect, it } from "vitest";
import { comparePerspectives } from "@/lib/compare/compare";
import { DEMO_RECORDS } from "@/lib/demo/records";

const northPaper = DEMO_RECORDS.find((r) => r.id === "demo:lccn-sn83035487")!; // Anti-Slavery Bugle
const southDecl = DEMO_RECORDS.find((r) => r.id === "demo:sc-declaration-1860")!;
const kyTelegram = DEMO_RECORDS.find((r) => r.id === "demo:magoffin-reply-1861")!;

describe("compare perspectives", () => {
  it("declares insufficiency when a side is empty", () => {
    const res = comparePerspectives([northPaper], []);
    expect(res.insufficient).toBeDefined();
    expect(res.statements).toHaveLength(0);
  });

  it("produces cited statements for opposed sources", () => {
    const res = comparePerspectives([northPaper], [southDecl]);
    expect(res.insufficient).toBeUndefined();
    expect(res.statements.length).toBeGreaterThan(0);
    for (const s of res.statements) {
      expect(s.leftEvidence.length + s.rightEvidence.length).toBeGreaterThan(0);
      for (const id of s.leftEvidence) {
        expect([northPaper.id]).toContain(id);
      }
      for (const id of s.rightEvidence) {
        expect([southDecl.id]).toContain(id);
      }
    }
  });

  it("detects documented alignment conflict without equating accounts", () => {
    const res = comparePerspectives([northPaper], [southDecl]);
    const conflict = res.statements.find((s) => s.kind === "conflict");
    expect(conflict).toBeDefined();
    expect(conflict!.text).toMatch(/not equally valid/i);
  });

  it("notes differing information horizons between sides", () => {
    const res = comparePerspectives([southDecl], [kyTelegram]);
    const info = res.statements.find((s) => s.kind === "information-differs");
    expect(info).toBeDefined();
    expect(info!.text).toContain("1860");
    expect(info!.text).toContain("1861");
  });
});
