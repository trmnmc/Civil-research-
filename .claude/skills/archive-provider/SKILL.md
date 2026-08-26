---
name: archive-provider
description: Add a new archive source provider to Archive Lens, or change how an existing adapter (Library of Congress, Chronicling America, National Archives, Valley of the Shadow, DocSouth) queries an API and normalizes its results into SourceRecord. Use when wiring up a new archive, debugging why a provider returns nothing or reports the wrong status, or adjusting request building, rate limiting, or metadata mapping.
---

# Adding or changing an archive provider

Providers live in `src/lib/providers/`. Each implements `SourceProvider` from
`base.ts` and is registered in `registry.ts`. Read an existing adapter first:
`chronicling.ts` is the fullest live example, `docsouth.ts` the simplest
local one.

## Before writing code: verify the API

Never guess an endpoint, parameter, or response shape. Confirm each against
the provider's current official documentation, and record where each fact came
from in a comment at the top of the adapter — the existing adapters cite the
Library of Congress and NARA repositories they were verified against. Confirm
specifically:

- base URL, required parameters, and how JSON is requested
- pagination (cursor vs. page number) and the field holding the total
- authentication, if any, and the exact header name
- documented rate limits and quotas
- rights/attribution requirements (NARA, for example, requires an attribution
  line that this app renders in the footer)

If no API exists, do not scrape. Build a local index of verified records with
deep links instead, following `valley.ts` / `docsouth.ts`.

## The adapter contract

**Never call `fetch` directly.** Use `providerFetch` from `fetch.ts`, which
supplies the TTL cache, per-provider token-bucket rate limiting, request
timeout, limited retries with backoff, and HTTPS-only enforcement. Set
`ratePerSec` conservatively — the Library's own examples sleep between
requests, so live loc.gov adapters use ~1/sec, and NARA uses 0.5/sec with a
long cache because its key carries a monthly quota.

**Return a status, never throw.** The orchestrator isolates failures, but the
adapter is what decides which state the researcher sees:

- `ok` / `partial` — results returned, `partial` when some sub-query failed
- `rate-limited` — a 429 or an exhausted local bucket
- `needs-setup` — missing or rejected credentials, with actionable guidance
  naming the exact env var and how to obtain a key (see `NARA_SETUP_GUIDANCE`)
- `unavailable` — anything else, with a short human-readable detail

A missing credential is a setup state, not an error state. The app must stay
useful when a provider is unconfigured.

**Normalize into `SourceRecord` completely.** Required care:

- run every provider string through `toPlainText` and every URL through
  `safeUrl` from `lib/sanitize.ts` — archive text is untrusted input
- preserve the provider's original metadata verbatim in `raw`
- set `provenance` to the request URL, with any credential stripped
- call `classifySource` rather than hand-assigning an evidence class
- set `perspective.basis` to `"inferred"` when region comes from place
  metadata, and leave `alignment: "unknown"` unless the alignment is actually
  documented — geography must never imply loyalty
- keep event date, creation date, and later-publication date in separate
  fields; do not collapse them
- build `citation` only from fields the provider actually supplied

## Finish the job

- register the provider in `registry.ts`, and add it to `LOCAL_PROVIDER_IDS`
  if it makes no network requests
- add it to the archive filter list in `src/components/app/FiltersPanel.tsx`
  and the display names in `ProviderStatuses.tsx`
- record a real response under `src/tests/fixtures/recorded/` with a
  `_provenance` block, and test normalization against it — the suite must not
  depend on live archive uptime
- test URL building (parameters present and correctly named) and the
  unconfigured-credential path
- update the archive table in `README.md`

## Common mistakes

Returning raw HTML into a record field; letting one failed sub-query discard
the successful one; inferring alignment from state; forgetting that the same
item can arrive from two adapters (the orchestrator dedupes on URL plus
provider item id, so distinct records that legitimately share a URL must have
distinct `providerItemId`s).
