/**
 * Validate every stable URL in the bundled reference records against the
 * live archives. Run from a machine with normal network access:
 *
 *   npm run validate:links
 *
 * The build environment for this repository blocked outbound traffic to the
 * archive hosts, so this script exists precisely to re-check the fixture
 * set. It is polite: sequential requests, one per second, HEAD first with a
 * GET fallback, and a descriptive User-Agent.
 */

import { DEMO_RECORDS } from "../src/lib/demo/records";

const UA = "ArchiveLens-link-validator/0.1 (research tool; local use)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Result {
  id: string;
  url: string;
  status: number | string;
  ok: boolean;
}

async function check(url: string): Promise<{ status: number | string; ok: boolean }> {
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);
      const res = await fetch(url, {
        method,
        redirect: "follow",
        headers: { "User-Agent": UA },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (method === "HEAD" && (res.status === 405 || res.status === 403)) {
        continue; // some hosts reject HEAD; try GET
      }
      return { status: res.status, ok: res.ok };
    } catch (err) {
      if (method === "GET") {
        return {
          status: err instanceof Error ? err.message : "network error",
          ok: false,
        };
      }
    }
  }
  return { status: "unreachable", ok: false };
}

async function main() {
  const results: Result[] = [];
  const urls = new Map<string, string>();
  for (const r of DEMO_RECORDS) {
    if (!urls.has(r.url)) urls.set(r.url, r.id);
  }
  console.log(`Validating ${urls.size} unique URLs from ${DEMO_RECORDS.length} records…\n`);
  for (const [url, id] of urls) {
    const { status, ok } = await check(url);
    results.push({ id, url, status, ok });
    console.log(`${ok ? "✓" : "✗"} [${status}] ${url}`);
    await sleep(1000);
  }
  const failures = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failures.length}/${results.length} URLs resolved.`,
  );
  if (failures.length > 0) {
    console.log("\nFailures (fix or annotate these records):");
    for (const f of failures) {
      console.log(`  ${f.id}: ${f.url} → ${f.status}`);
    }
    process.exitCode = 1;
  }
}

main();
