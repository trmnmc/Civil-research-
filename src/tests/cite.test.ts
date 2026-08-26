import { describe, expect, it } from "vitest";
import {
  bibtex,
  chicagoBibliography,
  chicagoFootnote,
  chicagoShortNote,
  toCsv,
} from "@/lib/cite/cite";
import { DEMO_RECORDS } from "@/lib/demo/records";
import type { SourceRecord } from "@/lib/types";

const magoffin = DEMO_RECORDS.find((r) => r.id === "demo:magoffin-reply-1861")!;

describe("citations", () => {
  it("builds a Chicago footnote from verified metadata", () => {
    const note = chicagoFootnote(magoffin);
    expect(note).toContain("Beriah Magoffin");
    expect(note).toContain("“Reply to Secretary of War Simon Cameron”");
    expect(note).toContain("1861");
    expect(note).toMatch(/accessed/);
  });

  it("short note uses the surname for personal creators", () => {
    const lincoln: SourceRecord = {
      ...magoffin,
      citation: {
        ...magoffin.citation,
        creator: "Abraham Lincoln",
        title: "Letter to Horace Greeley",
      },
    };
    expect(chicagoShortNote(lincoln)).toBe("Lincoln, “Letter to Horace Greeley”.");
    // Middle initials: surname is still the last token.
    const mcclellan: SourceRecord = {
      ...magoffin,
      citation: {
        ...magoffin.citation,
        creator: "George B. McClellan",
        title: "Report",
      },
    };
    expect(chicagoShortNote(mcclellan)).toMatch(/^McClellan, /);
  });

  it("short note keeps corporate creators whole", () => {
    const convention: SourceRecord = {
      ...magoffin,
      citation: {
        ...magoffin.citation,
        creator: "South Carolina Secession Convention",
        title: "Declaration",
      },
    };
    expect(chicagoShortNote(convention)).toBe(
      "South Carolina Secession Convention, “Declaration”.",
    );
  });

  it("omits missing fields instead of inventing them", () => {
    const bare: SourceRecord = {
      ...magoffin,
      citation: {
        title: "Untitled letter",
        archiveName: "Library of Congress",
        url: "https://www.loc.gov/item/example/",
        accessed: "2026-08-26",
      },
      dates: {},
    };
    const note = chicagoFootnote(bare);
    expect(note).not.toMatch(/undefined|null/);
    const bib = chicagoBibliography(bare);
    expect(bib).not.toMatch(/undefined|null/);
    const bt = bibtex(bare);
    expect(bt).not.toMatch(/author =/); // no creator → no author field
    expect(bt).not.toMatch(/year =/); // no date → no year field
  });

  it("escapes BibTeX-hostile characters", () => {
    const rec: SourceRecord = {
      ...magoffin,
      citation: { ...magoffin.citation, title: "Cotton & taxes {100%}" },
    };
    const bt = bibtex(rec);
    expect(bt).toContain("Cotton \\& taxes 100\\%");
  });

  it("produces well-formed CSV with quoting", () => {
    const csv = toCsv([magoffin]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("id,archive,title");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("demo:magoffin-reply-1861");
  });
});
