# Archive Lens — Historical Methodology

This document states the rules the application follows when it classifies,
ranks, synthesizes, and cites historical sources, and the safeguards that
keep it from inventing history. It is written for the researcher using the
tool; the same rules are enforced in code (`src/lib/classify`,
`src/lib/search/perspective.ts`, `src/lib/worldview`, `src/lib/cite`) and in
the test suite.

## 1. Primary-source classification

Every result is classified by **how the document stands to the events it
records**, with a confidence level and the metadata signals that produced
the classification shown beside it:

- **Contemporaneous** — created during or immediately around the events: a
  diary entry written that week, a newspaper printed that day, a letter
  mailed from the camp. The strongest evidence for what people knew and
  said at the time. Newspapers are contemporaneous *and* partisan; the
  classification explanation says so.
- **Retrospective firsthand** — an eyewitness writing later: memoirs,
  reminiscences, postwar narratives. Real testimony, but memory, hindsight,
  and postwar politics shape it. A memoir of 1885 about 1862 is never
  presented as equivalent to a document of 1862.
- **Official record** — created in the course of government or military
  business: reports, orders, muster rolls, proclamations, census schedules.
  Authoritative about what officials recorded — and shaped by why they
  recorded it.
- **Public argument** — made to persuade: speeches, editorials, pamphlets,
  broadsides, published letters. Primary evidence of what arguments were
  made, not of the facts asserted.
- **Visual source** — photographs, maps, prints. Composition and captioning
  carry a point of view.
- **Index / finding aid** — points to originals but is not one. A modern
  catalog description of a primary source is **not** itself a primary
  source, and Archive Lens never labels it as one.
- **Secondary context** — later scholarship or commemorative material.
  Permitted only under an explicit label, never mixed silently into
  primary results.

### The three dates

The date of the **event**, the date the **document was created**, and the
date a **later edition or transcription was published** are recorded and
displayed separately. A battle report written in 1862 and printed in the
*Official Records* in 1886 is a contemporaneous official record in a later
printing — the classification explanation names both dates. When a creation
date is missing, confidence drops and the researcher is told to establish
the date before using the item as time-bound evidence.

## 2. Geographic perspective versus allegiance

The Perspective Lens weights sources by the **place and community that
produced them** — never by an assumed loyalty. Its bands are wartime
political geography: free states that stayed in the Union; slave states
that did not secede (Kentucky, Missouri, Maryland, Delaware) plus West
Virginia; seceded states; and a national/D.C. layer. East Tennessee's
heavily Unionist communities are flagged in per-record notes, but
Tennessee remains in the seceded band — sub-state divisions are documented
per record, not modeled as separate bands.

Rules the code enforces:

- **Location is not loyalty.** Political alignment affects ranking only
  when documented (an abolitionist paper's masthead, a convention's own
  declaration). A record without documented alignment is never assigned one
  from geography — Kentucky in 1861 is the proof case, and the app's
  Kentucky records carry `divided/uncertain` or `unknown` with notes.
- **Boost, don't hide.** The lens multiplies ranking scores; it never
  zeroes them. Opposing and complicating evidence stays in the results. A
  separate, clearly labeled strict filter exists for deliberate narrowing.
- **No manufactured middle.** The bar snaps to evidence-backed bands; it
  does not interpolate imaginary ideological positions between North and
  South.
- **Voice, not custody.** When the researcher selects the voices of
  enslaved people or free Black residents, records *about* them produced by
  slaveholding institutions remain available as evidence but are marked
  "about, not by" and are not boosted as the selected voice.

## 3. Contemporaneous knowledge: the information horizon

The "Worldview at the Time" panel answers: *what could a person in this
position plausibly know, believe at stake, fear, and hope by this date?*
It enforces an **information horizon**: documents created after the chosen
date — and retrospective accounts written later, whatever period they
describe — are excluded from the synthesis and listed as excluded. Later
outcomes are never treated as known. (The horizon is an honest
approximation from creation dates; news also *traveled* slowly, which no
date filter fully captures — the panel's limitations say when evidence is
thin.)

## 4. Safeguards against invented historical interpretation

- **Citation-locked claims.** Every claim in a worldview synthesis or
  comparison must cite retrieved SourceRecord ids. Claims citing nothing,
  or citing ids that were not in the request, are rejected in code
  (`validateClaims`), whether the claim came from the rule engine or a
  model.
- **Two-source rule.** Generalized claims require at least two independent
  sources; single-source claims are visibly marked as one author's view.
- **No fabricated voice.** Nothing is written in the first person of a
  historical figure. Model output has quotation marks stripped so
  paraphrase can never masquerade as quotation.
- **Exact quotation only from documents.** Quotations shown by the app are
  copied verbatim from stored transcripts or clearly visible document text,
  linked to their source, with OCR uncertainty flagged and never silently
  repaired. Bundled excerpts name the edition they were taken from.
- **Facts do not move with the lens.** The factual layer (the sources, their
  dates, their text) is identical at every lens position. The perspective
  layer may explain beliefs, rumors, propaganda, and rationalizations — as
  such — and must not present a historically false claim as an equally
  valid alternative fact.
- **No false balance.** Comparison output presents disagreement between
  accounts as evidence of the period's conflicts, "not as equally valid
  accounts of contested facts" (that sentence ships in the UI). Where the
  evidence does not support equivalence, none is implied. On secession,
  slavery, emancipation, and Confederate political aims, the app surfaces
  the era's own declarations, speeches, laws, and papers rather than
  sanitizing them: the fixture set leads with the seceding conventions'
  official statements of their own reasons.
- **Offensive historical language** is preserved exactly when quoting a
  source, shown behind a content notice with a reveal control, and never
  repeated in the application's own narration.
- **Insufficient evidence is a result.** Below two usable sources, the
  worldview panel refuses to synthesize and says why. Sparse, narrow,
  unrepresentative, or contradictory evidence is stated plainly in a
  limitations list on every synthesis.
- **Untrusted text stays untrusted.** Source transcripts and metadata may
  contain text resembling instructions to an AI system; they are fenced and
  declared as data in any model prompt and can never override application
  instructions.

## 5. Citation rules

Citations (Chicago/Turabian full footnote, shortened footnote, bibliography
entry, BibTeX, CSV) are constructed **only** from verified SourceRecord
metadata. Missing creators, dates, or locators are omitted — never invented
to make a citation look complete. Model output is never used to build a
citation. Every record carries a copyable stable link to its holding
archive; exports contain citations, notes, links, and permitted excerpts,
never redistributed scans.

## 6. Provenance of bundled records

The demo/reference set contains no fictional data. Newspaper titles,
LCCNs, places, and digitized-issue dates are verbatim from the Library of
Congress's published Chronicling America dataset; famous-document excerpts
are verbatim from their standard published texts, with the edition named;
collection entries for Valley of the Shadow and DocSouth describe those
projects' documented scope. Each record's `provenance` field states its
sources, and `npm run validate:links` re-verifies every URL against the
live archives.
