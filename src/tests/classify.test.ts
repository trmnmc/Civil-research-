import { describe, expect, it } from "vitest";
import { classifySource } from "@/lib/classify/classify";

describe("primary-source classification", () => {
  it("classes a war-era newspaper as contemporaneous", () => {
    const c = classifySource({
      format: "newspaper",
      title: "The Daily Dispatch, April 20, 1861",
      dates: { created: "1861-04-20", sortYear: 1861 },
      scanAvailable: true,
      provider: "chronicling",
    });
    expect(c.evidenceClass).toBe("contemporaneous");
    expect(c.confidence).toBe("high");
    expect(c.explanation.length).toBeGreaterThan(20);
  });

  it("does not turn a newspaper into an official record because its description mentions a proclamation", () => {
    const c = classifySource({
      format: "newspaper",
      title: "Daily National Republican — issue of 1862-11-10",
      description:
        "Printed between the preliminary and final Emancipation Proclamations.",
      dates: { created: "1862-11-10", sortYear: 1862 },
      scanAvailable: true,
      provider: "demo",
    });
    expect(c.evidenceClass).toBe("contemporaneous");
  });

  it("classes memoirs as retrospective firsthand", () => {
    const c = classifySource({
      format: "memoir",
      title: "Personal Memoirs of U. S. Grant",
      dates: { created: "1885", sortYear: 1885, eventDate: "1861–1865" },
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.evidenceClass).toBe("retrospective-firsthand");
  });

  it("flags a later compilation of an official record", () => {
    const c = classifySource({
      format: "official-report",
      title: "Report of operations, Army of the Ohio",
      dates: {
        created: "1862-10-10",
        sortYear: 1862,
        eventDate: "1862-10-08",
        publishedLater: "1886",
      },
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.evidenceClass).toBe("official-record");
    expect(c.explanation).toMatch(/compilation/i);
  });

  it("classes finding aids as index, not primary source", () => {
    const c = classifySource({
      format: "other",
      title: "Guide to the Civil War manuscript collections",
      dates: {},
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.evidenceClass).toBe("index-or-finding-aid");
  });

  it("labels modern scholarship as secondary", () => {
    const c = classifySource({
      format: "book",
      title: "A study of border-state politics",
      description: "A centennial history of the war in Kentucky",
      dates: { created: "1961", sortYear: 1961 },
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.evidenceClass).toBe("secondary");
  });

  it("does not read wartime 'veteran' vocabulary as retrospective", () => {
    const c = classifySource({
      format: "letter",
      title: "Letter on the veteran volunteers' re-enlistment",
      dates: { created: "1864-01-05", sortYear: 1864 },
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.evidenceClass).toBe("contemporaneous");
  });

  it("treats a period anniversary address as public argument, not secondary", () => {
    const c = classifySource({
      format: "speech",
      title: "Anniversary address before the American Anti-Slavery Society",
      dates: { created: "1859", sortYear: 1859 },
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.evidenceClass).toBe("public-argument");
  });

  it("still marks undated commemorative material as secondary", () => {
    const c = classifySource({
      format: "book",
      title: "Centennial commemoration of the battle",
      dates: {},
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.evidenceClass).toBe("secondary");
  });

  it("drops confidence when a date is missing", () => {
    const c = classifySource({
      format: "letter",
      title: "Letter from a soldier",
      dates: {},
      scanAvailable: false,
      provider: "loc",
    });
    expect(c.confidence).toBe("low");
    expect(c.explanation).toMatch(/does not establish/i);
  });
});
