/**
 * Provider adapter tests against RECORDED responses from the archives'
 * own published documentation (LibraryOfCongress/data-exploration), so the
 * suite never depends on live archive uptime. Each fixture file carries a
 * `_provenance` block naming the exact notebook cell it was copied from.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { interpretQuery } from "@/lib/search/interpret";
import { normalizeChroniclingItem, buildChroniclingUrl } from "@/lib/providers/chronicling";
import { buildLocUrls } from "@/lib/providers/loc";
import { normalizeLocItem, type LocItem } from "@/lib/providers/locCommon";
import { buildNaraUrl, naraProvider, normalizeNaraRecord } from "@/lib/providers/nara";
import { resetFetchState } from "@/lib/providers/fetch";
import type { ProviderSearchParams } from "@/lib/providers/base";

function fixture<T>(name: string): T {
  const p = path.join(__dirname, "fixtures", "recorded", name);
  return JSON.parse(readFileSync(p, "utf8")) as T;
}

function params(query: string): ProviderSearchParams {
  return {
    interpretation: interpretQuery(query),
    yearRange: [1861, 1865],
    limit: 25,
  };
}

beforeEach(() => resetFetchState());

describe("Chronicling America adapter", () => {
  const recorded = fixture<LocItem & { _provenance: unknown }>(
    "chronam_search_first_result.json",
  );

  it("normalizes a recorded page-level search result", () => {
    const rec = normalizeChroniclingItem(recorded, "test://recorded");
    expect(rec).toBeDefined();
    expect(rec!.provider).toBe("chronicling");
    // Identity parsed from the recorded id URL: lccn/date/edition/sequence.
    expect(rec!.providerItemId).toBe("sn92070146/1924-11-20/ed-1/seq-6");
    expect(rec!.url).toMatch(/^https:\/\/www\.loc\.gov\/resource\/sn92070146/);
    expect(rec!.format).toBe("newspaper");
    expect(rec!.state).toBe("CA");
    expect(rec!.transcript.isOcr).toBe(true);
    expect(rec!.transcript.available).toBe(true);
    expect(rec!.raw).toBeDefined();
    expect(rec!.citation.archiveName).toBe("Library of Congress");
  });

  it("builds search URLs with the documented parameters", () => {
    const url = new URL(buildChroniclingUrl(params("emancipation Kentucky newspapers")));
    expect(url.origin + url.pathname).toBe(
      "https://www.loc.gov/collections/chronicling-america/",
    );
    expect(url.searchParams.get("fo")).toBe("json");
    expect(url.searchParams.get("dl")).toBe("page");
    expect(url.searchParams.get("qs")).toBeTruthy();
    expect(url.searchParams.get("start_date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(url.searchParams.get("end_date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(url.searchParams.get("location_state")).toBe("kentucky");
    expect(url.searchParams.get("at")).toBe("results,pagination");
  });
});

describe("Library of Congress adapter", () => {
  it("normalizes a recorded /item/ response (newspaper title record)", () => {
    const data = fixture<{ item: LocItem }>("item_sn85059812.json");
    const rec = normalizeLocItem(
      { ...data.item, id: data.item.id ?? "https://www.loc.gov/item/sn85059812/" },
      "loc",
      "test://recorded",
    );
    expect(rec).toBeDefined();
    expect(rec!.provider).toBe("loc");
    expect(rec!.title.length).toBeGreaterThan(3);
    expect(rec!.url).toMatch(/loc\.gov/);
    expect(rec!.raw).toBeTruthy();
  });

  it("builds documented search URLs including the state facet", () => {
    const urls = buildLocUrls(params("Kentucky loyalty and secession 1861"));
    expect(urls.length).toBe(2);
    const base = new URL(urls[0]);
    expect(base.searchParams.get("fo")).toBe("json");
    expect(base.searchParams.get("dates")).toBe("1861/1865");
    const faceted = new URL(urls[1]);
    expect(faceted.searchParams.get("fa")).toBe("location:kentucky");
  });
});

describe("National Archives adapter", () => {
  it("reports needs-setup with guidance when no API key is configured", async () => {
    delete process.env.NARA_API_KEY;
    const result = await naraProvider.search(params("emancipation"));
    expect(result.records).toHaveLength(0);
    expect(result.status.status).toBe("needs-setup");
    expect(result.status.detail).toMatch(/Catalog_API@nara\.gov/);
  });

  it("builds the documented v2 search URL", () => {
    const url = new URL(buildNaraUrl(params("emancipation proclamation")));
    expect(url.origin + url.pathname).toBe(
      "https://catalog.archives.gov/api/v2/records/search",
    );
    expect(url.searchParams.get("availableOnline")).toBe("true");
    expect(url.searchParams.get("limit")).toBe("25");
  });

  it("normalizes a record following the documented envelope shape", () => {
    // Shape follows NARA's official parsing code (Catalog-API repo scripts);
    // values here are synthetic test inputs, not presented as archive data.
    const rec = normalizeNaraRecord(
      {
        naId: 12345,
        title: "Test record title",
        productionDates: [{ logicalDate: "1863-01-01T00:00:00" }],
        digitalObjects: [{ objectUrl: "https://catalog.archives.gov/x.jpg" }],
        generalRecordsTypes: ["Textual Records"],
      },
      "test://synthetic",
    );
    expect(rec).toBeDefined();
    expect(rec!.url).toBe("https://catalog.archives.gov/id/12345");
    expect(rec!.dates.sortYear).toBe(1863);
    expect(rec!.scanAvailable).toBe(true);
  });
});
