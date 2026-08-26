---
name: source-integrity
description: Enforce Archive Lens's historical honesty rules when adding or editing bundled reference records, quotations, provenance, classifications, or any generated prose (worldview synthesis, comparison statements, citations). Use when touching src/lib/demo/records.ts, writing claim templates, or reviewing anything that presents historical facts to a researcher.
---

# Historical integrity rules

This application is used for serious historical research. Its credibility
rests on never fabricating evidence and never overstating what the evidence
supports. `docs/METHODOLOGY.md` is the full statement; these are the rules
that most often get broken in code.

## Bundled records (`src/lib/demo/records.ts`)

This file contains real archive data, not fixtures. Its header states an
honesty contract, and `src/tests/demo-records.test.ts` enforces parts of it.

**Never invent** an archive identifier, LCCN, URL, quotation, date, creator,
place, or metadata field. If a fact cannot be verified, the record says so
instead of filling the gap — a record with no quotation is strictly better
than one with an unverified quotation.

Every record needs:

- `provenance` naming where each fact came from, specifically enough that a
  reader could re-check it
- `perspective.basis: "curated"` and a note justifying any assigned
  `alignment`; leave `alignment: "unknown"` when it is not documented
- a `transcript.sourceNote` naming the exact edition for any quoted text, with
  `isExcerpt: true`

**Quotations must be verbatim from an attested text.** Popular variants of
famous quotations circulate widely and are often wrong — an earlier version of
this file quoted Governor Magoffin's April 1861 reply in a form that does not
appear in the Official Records. Prefer the text as printed in a named edition,
mark omissions with ellipses, and note when punctuation varies between
transcriptions. When a quoted sentence functions differently in its document
than it appears to in isolation (a proclamation reciting an earlier order, for
example), say so in the source note.

Date precision is a claim. Use month precision when the day is not established;
never assign a related document's date to a different document.

## Classification

`classifySource` distinguishes contemporaneous, retrospective-firsthand,
official-record, public-argument, visual, index-or-finding-aid, and secondary.
Two failure modes to watch when editing its hint lists:

- **Period vocabulary misread as retrospective.** "Veteran" was heavy
  contemporaneous usage from 1863 ("Veteran Volunteers"); anniversary
  addresses were a major period genre. Hints that could plausibly appear in a
  wartime document need a date guard.
- **Catalog descriptions treated as primary sources.** A modern description
  of a document, or a title-level entry pointing at a run of issues, is an
  index — not the document.

Confidence must drop when the metadata does not establish the date or genre,
and the explanation must say what is uncertain.

## Generated prose

Applies to `lib/worldview/synthesize.ts`, `lib/compare/compare.ts`, and
anything added to them:

- every claim carries evidence ids that were actually retrieved;
  `validateClaims` drops claims citing unknown ids, and new claim paths must
  route through it
- generalizations need two *independent* sources — independence is keyed per
  publication, so a paper's title record plus its own issue is one voice
- claims about period vocabulary must be sourced from the documents' own
  transcript text, never from modern curated descriptions or subject terms
- respect the information horizon: no claim may rest on a document created
  after the as-of date
- no generated text inside quotation marks; paraphrase only
- when evidence is thin, unrepresentative, or contradictory, say so in
  `limitations` rather than writing around it

## No false balance

Disagreement between sources is evidence about the period's conflicts, not
equal support for opposing accounts of contested facts. Do not describe two
positions as "opposed" merely because they differ — abolitionists and
Unionists were usually allies. Comparison statements use an explicit
opposition table; extend it deliberately rather than falling back on set
difference.

On secession, slavery, emancipation, and Confederate political aims, surface
the era's own declarations and speeches rather than sanitizing them. Preserve
offensive historical language exactly when quoting a source, behind the
content notice in `lib/content-notice.ts`, and never repeat it in the
application's own narration. That detector is calibrated deliberately: slurs
gate, period classification terms (census categories such as "mulatto") only
note, and the bare adjective "savage" is not flagged because it saturates
period battle reporting.

## Citations

Built only from verified `SourceRecord` metadata. Missing fields stay missing.
Never construct a citation from model output, and never pad one to look
complete.
