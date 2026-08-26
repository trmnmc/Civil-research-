# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Archive Lens is a primary-source research instrument for American Civil War
history: it searches several archives at once, classifies what kind of
evidence each result is, and lets a researcher inspect, compare, cite, and
save original documents. It is deliberately **not** a chatbot or a general
web-search wrapper.

Two product rules drive most of the design and should drive most changes:

1. **The Perspective Lens re-weights, it never rewrites.** Moving the lens
   changes ranking only. Sources, dates, document text, and the factual
   timeline are identical at every lens position.
2. **Location is not loyalty.** Geography is used for weighting; political
   alignment is used only when documented. Never infer allegiance from where
   a document was produced.

## Commands

```bash
npm run dev                 # dev server (localhost:3000)
npm run build && npm start  # production build + serve
npm run typecheck           # tsc --noEmit
npm run lint                # eslint
npm test                    # vitest run (unit + integration)
npm run e2e                 # playwright (needs a production build first)
npm run validate:links      # re-check every bundled archive URL against the live sites
```

Run one test file or case:

```bash
npx vitest run src/tests/classify.test.ts
npx vitest run -t "flags a later compilation"
npx playwright test e2e/main-workflow.spec.ts
npx playwright test --project=mobile
```

`DEMO_MODE=1` makes search answer only from the bundled verified records with
no outbound requests — use it offline, in CI, and for Playwright (the e2e
config sets it automatically). In sandboxes with a preinstalled browser, point
Playwright at it with `PLAYWRIGHT_CHROMIUM=/path/to/chrome`; otherwise run
`npx playwright install chromium` once.

Everything runs with no configuration at all. `NARA_API_KEY` unlocks the
National Archives provider; `ANTHROPIC_API_KEY` enables optional AI query
expansion and synthesis. Both are documented in `.env.example`.

## Architecture

Next.js App Router. All archive traffic is server-side; the browser never
talks to an archive or sees a credential.

**Request path:** `src/app/api/search/route.ts` → `lib/search/orchestrator.ts`
→ every provider in `lib/providers/registry.ts` in parallel via
`Promise.allSettled` → merge and dedupe → `lib/search/rank.ts` → response.

The orchestrator's contract matters: **one provider failing, rate-limiting, or
lacking credentials must never discard another provider's results.** Each
provider returns its own `ProviderStatus` (`ok` / `partial` / `rate-limited` /
`needs-setup` / `unavailable`), surfaced per-archive in the UI.

**`SourceRecord` (`lib/types.ts`) is the spine.** Every archive result is
normalized into it, and the provider's original metadata is preserved verbatim
in `raw`. Each record carries a `classification` (evidence class + confidence +
explanation + signals), a `perspective` (region, social positions, alignment,
and the `basis` on which those were assigned), separate event/creation/later-
publication dates, and `citation` data. Adding a field means touching the
normalizers in every adapter, so prefer computing derived values in the
consuming layer.

**Providers** (`lib/providers/`) implement `SourceProvider` from `base.ts`.
`loc.ts` and `chronicling.ts` are live adapters over the loc.gov JSON API
(sharing `locCommon.ts` normalization); `nara.ts` is live but key-gated and
returns `needs-setup` guidance rather than an error when unconfigured;
`valley.ts`, `docsouth.ts`, and `demo.ts` serve bundled records through
`local.ts` and never touch the network. All outbound requests go through
`fetch.ts`, which supplies the TTL cache, per-provider token-bucket rate
limiting, timeouts, limited retries, and HTTPS-only enforcement — do not call
`fetch` directly from an adapter.

**Search intelligence** is three separable layers: `lib/search/aliases.ts`
holds the historical-knowledge tables (regional bands, battle-name aliases,
period vocabulary, unit-name parsing); `interpret.ts` turns a natural-language
query into a `QueryInterpretation` while always preserving the original string;
`rank.ts` scores with a decomposed, displayable breakdown. `perspective.ts`
owns band snapping and the lens boost, including the guard that stops
institutional records *about* enslaved people from being boosted as their
voice.

**Guarded generation.** `lib/worldview/synthesize.ts` and
`lib/compare/compare.ts` produce prose, and both are constrained the same way:
claims must cite retrieved record ids (`validateClaims` drops anything citing
an id that was not supplied), generalizations need two *independent* sources
(independence is keyed per publication, not per record), an information
horizon excludes documents created after the chosen date, and no generated
text may contain quotation marks. When an AI key is present, `anthropic.ts`
supplies an alternative claim source — its output is Zod-validated and passes
through the *same* guards. Document text is fenced as untrusted data in every
prompt. If you add a generated sentence, it needs evidence ids attached.

**Citations** (`lib/cite/cite.ts`) are built only from verified metadata.
Missing fields stay missing — never pad a citation to look complete, and never
build one from model output.

**Persistence** is local SQLite via Drizzle (`lib/db/`). The schema bootstraps
itself on first access, so a clean checkout needs no migration step. Saved
sources store a full `SourceRecord` snapshot so they restore when an archive is
unreachable.

## Working with the bundled records

`lib/demo/records.ts` is real archive data, not fixtures. Its header states an
honesty contract that is enforced by `src/tests/demo-records.test.ts`: every
identifier and date is verbatim from a published dataset, every quotation is
verbatim from an attested text with the edition named in
`transcript.sourceNote`, and every record carries a `provenance` field saying
where its facts came from. **Never invent an archive identifier, URL,
quotation, date, creator, or metadata field here** — if something cannot be
verified, the record says so instead. Prefer adding a record with no quotation
over one with an unverified quotation.

## Testing conventions

Integration tests replay recorded provider responses from
`src/tests/fixtures/recorded/` (copied from the archives' own published
documentation, each with a `_provenance` block), so the suite never depends on
live archive uptime. Unit-test a rule engine directly *and* through the layer
that calls it — a previous defect had correct name-variant logic that the query
interpreter could never actually reach.

## Known environment limitation

The container this was built in blocked outbound access to every archive host,
so the live LOC/ChronAm/NARA paths are verified against official documentation
and recorded responses but have not been exercised against the live services.
`npm run validate:links` exists to close that gap and should be run from a
normal network.
