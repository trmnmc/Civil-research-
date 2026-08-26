import { describe, expect, it } from "vitest";
import { extractDates, interpretQuery } from "@/lib/search/interpret";
import { nameVariants, parseUnits, expandPlace } from "@/lib/search/aliases";

describe("date extraction", () => {
  it("finds a single year", () => {
    expect(extractDates("kentucky loyalty 1861").yearRange).toEqual([1861, 1861]);
  });
  it("finds a year range from two years", () => {
    expect(extractDates("between 1862 and 1863").yearRange).toEqual([1862, 1863]);
  });
  it("finds month-year windows", () => {
    const { monthRange } = extractDates(
      "reactions between September 1862 and January 1863",
    );
    expect(monthRange).toEqual(["1862-09", "1863-01"]);
  });
  it("interprets 'late 1862' as the closing months", () => {
    const { monthRange } = extractDates("emancipation in late 1862");
    expect(monthRange).toEqual(["1862-09", "1862-12"]);
  });
});

describe("query interpretation", () => {
  it("interprets the Kentucky acceptance query", () => {
    const interp = interpretQuery("Kentucky loyalty and secession 1861");
    expect(interp.states).toContain("KY");
    expect(interp.yearRange).toEqual([1861, 1861]);
    expect(interp.originalQuery).toBe("Kentucky loyalty and secession 1861");
    const terms = interp.expansions.map((e) => e.term);
    expect(terms).toContain("loyalty");
    expect(terms).toContain("secession");
    // Expanded period vocabulary reaches the effective terms.
    expect(interp.effectiveTerms).toContain("disunion");
  });

  it("detects formats and events", () => {
    const interp = interpretQuery(
      "How did Northern and Southern newspapers describe emancipation in late 1862?",
    );
    expect(interp.formats).toContain("newspaper");
    expect(interp.monthRange).toEqual(["1862-09", "1862-12"]);
  });

  it("finds Gettysburg with its date window via the event list", () => {
    const interp = interpretQuery(
      "civilian accounts written near Gettysburg during July 1863",
    );
    expect(interp.places).toContain("Gettysburg");
    expect(interp.monthRange?.[0]).toBe("1863-07");
  });
});

describe("historical aliases", () => {
  it("pairs Union and Confederate battle names", () => {
    expect(expandPlace("Antietam")?.aliases).toContain("Sharpsburg");
    expect(expandPlace("Sharpsburg")?.canonical).toBe("Antietam");
    expect(expandPlace("Bull Run")?.canonical).toBe("Manassas");
  });

  it("produces M'-variants for Mc names (period printing)", () => {
    expect(nameVariants("McClellan")).toContain("M'Clellan");
    expect(nameVariants("M'Pherson")).toContain("McPherson");
  });

  it("parses regiment references with naming variants", () => {
    const units = parseUnits("letters from the 15th Kentucky Infantry");
    expect(units).toHaveLength(1);
    expect(units[0].state).toBe("KY");
    expect(units[0].branch).toBe("infantry");
    expect(units[0].variants).toContain("15th Kentucky Infantry");
    expect(
      units[0].variants.some((v) => v.includes("Fifteenth Kentucky")),
    ).toBe(true);
  });

  it("expands Mc names end-to-end through query interpretation", () => {
    const interp = interpretQuery("McClellan dispatches from the Peninsula");
    expect(interp.effectiveTerms).toContain("M'Clellan");
    const interp2 = interpretQuery("letters of George B. McClellan");
    expect(interp2.effectiveTerms).toContain("M'Clellan");
    const interp3 = interpretQuery("M'Clellan at Antietam");
    expect(interp3.effectiveTerms).toContain("McClellan");
  });

  it("never conflates a state regiment with the same-numbered USCT regiment", () => {
    const units = parseUnits(
      "54th Massachusetts colored regiment and the 20th Maine Infantry",
    );
    const ma = units.find((u) => u.state === "MA");
    const me = units.find((u) => u.state === "ME");
    expect(ma).toBeDefined();
    expect(ma!.variants).toContain("54th Massachusetts (Colored)");
    expect(
      ma!.variants.some((v) => v.includes("United States Colored Troops")),
    ).toBe(false);
    expect(me).toBeDefined();
    expect(me!.usct).toBe(false);
    // Stateless explicit USCT references still expand to the full name.
    const usct = parseUnits("muster rolls of the 3rd USCT");
    expect(
      usct.some((u) =>
        u.variants.some((v) => v.includes("United States Colored Troops")),
      ),
    ).toBe(true);
  });

  it("parses written-out ordinals", () => {
    const units = parseUnits("the Fifth Ohio at Winchester");
    expect(units.some((u) => u.state === "OH" && u.ordinal === 5)).toBe(true);
  });
});
