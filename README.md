# Archive Lens

A research instrument for serious American Civil War history. Archive Lens
moves a researcher from a historical question to credible primary sources:
it searches major archives with period-aware interpretation, classifies each
result as evidence, lets you examine scan and transcription side by side,
compares how differently placed people understood the same events, and keeps
a local research notebook with Chicago/Turabian citations.

It is a primary-source finder, not a web-search wrapper and not a chatbot.
Its defining feature — the **Perspective Lens** — re-weights which
communities' documents lead the results (North ⟷ Border & Contested ⟷
South, crossed with social position, documented political alignment, and a
date window) **without ever altering a source, a fact, or the timeline**.

---

## Installation

Requires Node.js 20+ (tested on 22).

```bash
npm install
cp .env.example .env.local   # optional — the app runs with no configuration
npm run dev                  # development server on http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

No account, no external database: the research notebook persists to a local
SQLite file (`data/archive-lens.db` by default).

## Tests

```bash
npm run typecheck   # TypeScript
npm test            # Vitest unit + integration (uses recorded provider responses)
npm run build       # production build
npm run e2e         # Playwright browser workflow (runs against a demo-mode build; build first)
```

The integration tests replay **recorded provider responses** taken from the
Library of Congress's own published API documentation, so the suite never
depends on live archive uptime. In a sandbox with a preinstalled Chromium,
point Playwright at it: `PLAYWRIGHT_CHROMIUM=/path/to/chrome npm run e2e`.

## Demo mode (no credentials, no network)

```bash
DEMO_MODE=1 npm run dev
```

Demo mode searches a bundled index of **real, verified archive records
only** — newspaper runs whose LCCNs, titles, places, and digitized-issue
dates are copied verbatim from the Library of Congress's published
Chronicling America dataset, plus canonical documents (Emancipation
Proclamation, secession declarations, Lincoln's Greeley letter, Governor
Magoffin's April 1861 telegram, Douglass's and Jacobs's narratives) whose
excerpts are verbatim from their standard published texts. Every record
carries a `provenance` field naming where each fact came from. Nothing in
the fixture set is fictional.

`npm run validate:links` re-checks every bundled URL against the live
archives (run it from a normal network; see *Known limitations*).

## Supported archives

| Archive | Access | Status |
|---|---|---|
| Library of Congress | official loc.gov JSON API (`fo=json`), no key | live adapter |
| Chronicling America | official loc.gov collection API, no key | live adapter (full-text newspaper search, page OCR on demand) |
| National Archives Catalog | official Catalog API v2, **free key required** | live adapter; without a key the UI shows setup guidance |
| Valley of the Shadow (UVA) | no public API | verified local index + deep links (never scraped) |
| Documenting the American South (UNC) | no public API | verified local index + deep links (never scraped) |

Provider requests run **on the server only**, with caching, timeouts,
limited retries, per-provider rate limiting (the Library's own examples
throttle to ~1 req/sec; NARA keys carry a 10,000-request/month quota), and
safe-URL handling. Archive-provided text is sanitized before rendering and
treated as untrusted content everywhere, including inside AI prompts. A
provider failing, rate-limiting, or lacking credentials never discards
another provider's results — each reports its own status in the UI.

### National Archives setup

Email `Catalog_API@nara.gov` for a free read-only key (see
<https://www.archives.gov/research/catalog/help/api>), then set
`NARA_API_KEY` in `.env.local`.

### Optional AI assistance

Search and the whole document workflow work **without any AI key**. If
`ANTHROPIC_API_KEY` is set, Claude adds query expansion and the AI variant
of the Worldview synthesis — with structured output validated by Zod,
claims restricted to retrieved evidence ids, no generated quotations, and
document text fenced as untrusted data. The model is chosen by
`ANTHROPIC_MODEL` (never hardcoded). See `.env.example` for all variables.

## How the Perspective Lens works

The horizontal bar runs from **North** through **Border & Contested**
(Kentucky, Missouri, Maryland, Delaware, West Virginia, divided communities
such as East Tennessee) to **South**. It feels fluid but snaps internally to
those three evidence-backed bands — it does not invent ideological positions
between them. Beside it sit **social position** controls (civilian, enlisted
soldier, officer, political actor, newspaper editor, enslaved person, free
Black resident, woman on the home front) and **political alignment**
controls (Unionist, abolitionist, antiwar Northern Democrat,
divided/uncertain, Southern Unionist, Confederate-aligned), plus the date
window (default 1850–1877, widenable).

The lens changes **ranking weights only**: it boosts matching communities'
records and never silently hides opposing evidence (a strict filter exists
for when you deliberately want only one slice). Alignment weighting uses
documented metadata only — **location is not loyalty**. When the voices of
enslaved people or free Black residents are selected, institutional records
*about* them are shown as evidence but never boosted as if they were those
voices. The "Worldview at the Time" panel obeys an information horizon: it
only synthesizes from documents its subject could have read by the chosen
date, cites every claim to retrieved records, and states its limitations
instead of filling gaps. Full rules: [docs/METHODOLOGY.md](docs/METHODOLOGY.md)
and the in-app `/methodology` page.

## Known source limitations

- **Chronicling America coverage is uneven.** Digitization is by state
  program; some crucial wartime places have little or nothing (for example,
  the Library's title dataset contains no Gettysburg/Adams County paper).
  The app says so rather than substituting something else.
- **Valley of the Shadow and DocSouth have no search APIs.** Their entries
  are collection-level pointers with verified scope; the documents are read
  on their sites.
- **OCR is imperfect.** Newspaper text is machine-read, flagged as such,
  and never silently corrected; verify wording against the scan before
  quoting.
- **Archive metadata is thin for many items.** Missing creators, dates, or
  places stay missing — in cards, classifications (confidence drops), and
  citations alike.
- **Link validation:** the environment in which this repository was built
  blocked outbound network access to the archive hosts, so
  `npm run validate:links` could not be executed here. URL *patterns* were
  verified against official provider documentation; run the script once
  from a normal network to confirm each bundled URL resolves.

## Project layout

```
src/lib/providers/    archive adapters (loc, chronicling, nara, valley, docsouth, demo)
src/lib/search/       query interpretation, aliases, ranking, Perspective Lens logic
src/lib/classify/     primary-source classification
src/lib/worldview/    evidence-grounded synthesis (rule-based + optional AI)
src/lib/compare/      comparison engine
src/lib/cite/         Chicago/Turabian, BibTeX, CSV citation builders
src/lib/demo/         verified reference records (with provenance)
src/lib/db/           SQLite notebook (Drizzle)
src/app/              Next.js App Router pages + API routes
src/tests/            Vitest suites + recorded provider fixtures
e2e/                  Playwright workflows
docs/METHODOLOGY.md   historical methodology and safeguards
```
