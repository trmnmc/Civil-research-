import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runSearch } from "@/lib/search/orchestrator";
import { defaultLens } from "@/lib/search/perspective";
import { demoProvider } from "@/lib/providers/demo";
import type { SourceProvider } from "@/lib/providers/base";

const failingProvider: SourceProvider = {
  info: {
    id: "loc",
    name: "Failing test provider",
    shortName: "Fail",
    homepage: "https://example.invalid",
    access: "api",
    description: "always throws",
  },
  isConfigured: () => true,
  async search() {
    throw new Error("simulated outage");
  },
};

beforeEach(() => {
  process.env.DEMO_MODE = "";
});
afterEach(() => {
  process.env.DEMO_MODE = "";
});

describe("search orchestration", () => {
  it("answers entirely from local providers in demo mode", async () => {
    process.env.DEMO_MODE = "1";
    const res = await runSearch({
      query: "Kentucky loyalty and secession 1861",
      lens: defaultLens(),
    });
    expect(res.demoMode).toBe(true);
    expect(res.results.length).toBeGreaterThan(0);
    const providers = res.providerStatuses.map((s) => s.provider);
    expect(providers).toContain("demo");
    expect(providers).not.toContain("loc");
  });

  it("keeps successful providers when another fails", async () => {
    const res = await runSearch(
      { query: "Kentucky secession 1861", lens: defaultLens() },
      [failingProvider, demoProvider],
    );
    const fail = res.providerStatuses.find((s) => s.provider === "loc");
    const ok = res.providerStatuses.find((s) => s.provider === "demo");
    expect(fail?.status).toBe("unavailable");
    expect(fail?.detail).toMatch(/simulated outage/);
    expect(ok?.status).toBe("ok");
    expect(res.results.length).toBeGreaterThan(0);
  });

  it("preserves the researcher's query verbatim", async () => {
    process.env.DEMO_MODE = "1";
    const q = "  Find Kentucky letters discussing loyalty and secession in 1861 ";
    const res = await runSearch({ query: q, lens: defaultLens() });
    expect(res.interpretation.originalQuery).toBe(q);
  });
});
