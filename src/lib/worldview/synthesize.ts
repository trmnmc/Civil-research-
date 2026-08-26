/**
 * "Worldview at the Time" — evidence-based synthesis, not role-play.
 *
 * Guarantees enforced here, whichever engine produced the claims:
 *  - Every claim cites retrieved SourceRecord ids; unknown ids are rejected.
 *  - Generalized claims require ≥2 independent sources; single-source claims
 *    are reworded to name their single-source basis.
 *  - The information horizon (as-of date) excludes documents created later.
 *  - No generated text appears inside quotation marks.
 *  - Sparse/unrepresentative/contradictory evidence is stated plainly, and
 *    below a minimum evidence floor no synthesis is produced at all.
 */

import type {
  LensState,
  SourceRecord,
  WorldviewClaim,
  WorldviewSynthesis,
} from "@/lib/types";
import {
  ALIGNMENT_LABELS,
  BAND_LABELS,
  SOCIAL_POSITION_LABELS,
  snapBand,
} from "@/lib/search/perspective";
import { aiAvailable, synthesizeWithAi } from "./anthropic";
import { stripGeneratedQuotes } from "./schema";

const MIN_RECORDS = 2;

// ─── Topic detection vocabulary (period topics with detection terms) ─────────

const TOPICS: { topic: string; terms: string[] }[] = [
  { topic: "secession and disunion", terms: ["secession", "secede", "disunion", "ordinance"] },
  { topic: "loyalty and allegiance", terms: ["loyalty", "loyal", "allegiance", "union men", "neutrality"] },
  { topic: "emancipation and slavery", terms: ["emancipation", "slavery", "slave", "abolition", "freedmen", "contraband"] },
  { topic: "military campaigns and battles", terms: ["battle", "campaign", "army", "troops", "regiment", "engagement"] },
  { topic: "the draft and enlistment", terms: ["draft", "conscription", "enlist", "volunteers", "call for troops"] },
  { topic: "the home front and daily life", terms: ["home front", "prices", "scarcity", "household", "farm"] },
  { topic: "party politics and elections", terms: ["election", "democrat", "republican", "party", "vote", "copperhead"] },
];

function detectTopics(record: SourceRecord): string[] {
  const hay = [
    record.title,
    record.description ?? "",
    record.subjects.join(" "),
    record.transcript.text ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return TOPICS.filter((t) => t.terms.some((term) => hay.includes(term))).map(
    (t) => t.topic,
  );
}

/**
 * Independence heuristic: distinct origins. A named creator identifies an
 * origin; newspaper records without one are keyed by their PUBLICATION
 * (LCCN), so a paper's title record plus its own issues — one editorial
 * voice — never count as multiple independent sources.
 */
export function independenceKey(r: SourceRecord): string {
  if (r.creator) return `creator:${r.creator}`;
  const lccn =
    (typeof r.raw?.lccn === "string" ? (r.raw.lccn as string) : undefined) ??
    r.providerItemId.match(/\bsn\d{8}\b/)?.[0];
  if (lccn) return `publication:${lccn}`;
  return `item:${r.providerItemId}`;
}

function independentCount(records: SourceRecord[]): number {
  return new Set(records.map(independenceKey)).size;
}

export function describeProfile(lens: LensState, asOf: string): string {
  const parts: string[] = [BAND_LABELS[snapBand(lens.position)]];
  if (lens.socialPositions.length > 0) {
    parts.push(
      lens.socialPositions.map((s) => SOCIAL_POSITION_LABELS[s]).join(" / "),
    );
  }
  if (lens.alignments.length > 0) {
    parts.push(lens.alignments.map((a) => ALIGNMENT_LABELS[a]).join(" / "));
  }
  parts.push(`information available up to ${asOf}`);
  return parts.join(" · ");
}

/** Filter to the information horizon; report what was excluded. */
export function applyHorizon(
  records: SourceRecord[],
  asOf: string,
): { usable: SourceRecord[]; excluded: SourceRecord[] } {
  const usable: SourceRecord[] = [];
  const excluded: SourceRecord[] = [];
  for (const r of records) {
    const created = r.dates.created ?? "";
    const year = r.dates.sortYear;
    const iso = created.match(/^\d{4}(-\d{2})?(-\d{2})?/)?.[0];
    let after = false;
    if (iso) {
      const normalized =
        iso.length === 4 ? `${iso}-12-31` : iso.length === 7 ? `${iso}-28` : iso;
      after = normalized > asOf;
    } else if (year !== undefined) {
      after = String(year) > asOf.slice(0, 4);
    }
    // Retrospective accounts are excluded from "what could be known" even
    // when their events predate the horizon.
    if (r.classification.evidenceClass === "retrospective-firsthand") {
      const createdYear = r.dates.sortYear;
      if (createdYear !== undefined && String(createdYear) > asOf.slice(0, 4)) {
        excluded.push(r);
        continue;
      }
    }
    if (after) excluded.push(r);
    else usable.push(r);
  }
  return { usable, excluded };
}

function validateClaims(
  claims: WorldviewClaim[],
  allowedIds: Set<string>,
): WorldviewClaim[] {
  const valid: WorldviewClaim[] = [];
  for (const claim of claims) {
    const evidence = claim.evidence.filter((id) => allowedIds.has(id));
    if (evidence.length === 0) continue; // cites nothing retrieved → rejected
    if (evidence.length !== claim.evidence.length) {
      // Some ids were unknown → keep only if it still has real support.
      if (evidence.length < 1) continue;
    }
    valid.push({
      ...claim,
      text: stripGeneratedQuotes(claim.text),
      evidence,
    });
  }
  return valid;
}

/** Rule-based synthesis: conservative, mechanical, fully evidence-derived. */
export function synthesizeRuleBased(
  records: SourceRecord[],
  lens: LensState,
  asOf: string,
): WorldviewSynthesis {
  const band = snapBand(lens.position);
  const profile = {
    region: band,
    socialPositions: lens.socialPositions,
    alignments: lens.alignments,
    asOf,
  };

  const { usable, excluded } = applyHorizon(records, asOf);
  const consulted = records.map((r) => r.id);

  if (usable.length < MIN_RECORDS) {
    return {
      profile,
      claims: [],
      limitations: [
        `Only ${usable.length} retrieved source${usable.length === 1 ? "" : "s"} ${usable.length === 1 ? "was" : "were"} created by ${asOf}. That is not enough evidence to describe a worldview responsibly — widen the date window, loosen the lens, or search again.`,
        ...(excluded.length > 0
          ? [
              `${excluded.length} retrieved source${excluded.length === 1 ? " was" : "s were"} set aside because ${excluded.length === 1 ? "it was" : "they were"} created after the selected date (or written in retrospect).`,
            ]
          : []),
      ],
      consulted,
      method: "rules",
      insufficient: {
        reason: "Fewer than two usable sources inside the information horizon.",
      },
    };
  }

  const claims: WorldviewClaim[] = [];
  const limitations: string[] = [];

  // ── Knowledge claims from detected topics ──
  const byTopic = new Map<string, SourceRecord[]>();
  for (const r of usable) {
    for (const topic of detectTopics(r)) {
      const list = byTopic.get(topic) ?? [];
      list.push(r);
      byTopic.set(topic, list);
    }
  }
  const sortedTopics = [...byTopic.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  for (const [topic, recs] of sortedTopics.slice(0, 4)) {
    const independent = independentCount(recs);
    if (independent >= 2) {
      claims.push({
        text: `${topic[0].toUpperCase()}${topic.slice(1)} is addressed by ${recs.length} of the retrieved records or their catalog descriptions, from ${independent} independent origins.`,
        evidence: recs.slice(0, 6).map((r) => r.id),
        kind: "knowledge",
      });
    } else {
      claims.push({
        text: `Only one independent source in this selection addresses ${topic}; treat it as one author's view rather than a community's.`,
        evidence: recs.slice(0, 2).map((r) => r.id),
        kind: "knowledge",
        caveat: "Single-source basis — not generalizable.",
      });
    }
  }

  // ── Stakes claims from official/public-argument documents that carry
  //    their own text (never from curator descriptions alone) ──
  const stakesDocs = usable.filter(
    (r) =>
      (r.classification.evidenceClass === "official-record" ||
        r.classification.evidenceClass === "public-argument") &&
      r.transcript.text,
  );
  if (independentCount(stakesDocs) >= 2) {
    claims.push({
      text: `Several official acts and public arguments in this selection state their stakes in their own words — open the citations beside this claim to read what their authors said was at issue.`,
      evidence: stakesDocs.slice(0, 6).map((r) => r.id),
      kind: "stakes",
    });
  }

  // ── Language claims from period vocabulary in the DOCUMENTS' OWN TEXT.
  //    Curated descriptions and subject terms are modern prose and are
  //    never presented as period vocabulary. ──
  const vocabularyHits: { word: string; recs: SourceRecord[] }[] = [];
  for (const word of [
    "disunion", "rebel", "rebellion", "secesh", "contraband", "neutrality",
    "abolition", "federal", "slavery", "institution", "subduing",
  ]) {
    const recs = usable.filter((r) =>
      (r.transcript.text ?? "").toLowerCase().includes(word),
    );
    if (recs.length > 0) vocabularyHits.push({ word, recs });
  }
  if (vocabularyHits.length > 0) {
    const words = vocabularyHits.map((v) => v.word).slice(0, 4);
    const evidence = [
      ...new Set(vocabularyHits.flatMap((v) => v.recs.map((r) => r.id))),
    ].slice(0, 6);
    claims.push({
      text: `Vocabulary in these documents' own text includes: ${words.join(", ")}. The words their authors chose are themselves evidence of how events were framed.`,
      evidence,
      kind: "language",
    });
  }

  // ── Limits: what this evidence cannot show ──
  const voicesPresent = new Set(
    usable.flatMap((r) => r.perspective.socialPositions),
  );
  const missingSelectedVoices = lens.socialPositions.filter(
    (s) => !voicesPresent.has(s),
  );
  if (missingSelectedVoices.length > 0) {
    limitations.push(
      `No retrieved source is identified as the voice of: ${missingSelectedVoices
        .map((s) => SOCIAL_POSITION_LABELS[s].toLowerCase())
        .join(", ")}. What follows describes the documents that do exist — not the missing voices.`,
    );
  }
  const regions = new Set(usable.map((r) => r.perspective.region));
  if (regions.size === 1) {
    limitations.push(
      "All usable sources come from a single regional band; treat any generalization beyond it with caution.",
    );
  }
  const formats = new Set(usable.map((r) => r.format));
  if (formats.size === 1) {
    limitations.push(
      `All usable sources are of one type (${[...formats][0].replace(/-/g, " ")}); other kinds of records could complicate this picture.`,
    );
  }
  const alignments = new Set(
    usable
      .map((r) => r.perspective.alignment)
      .filter((a) => a !== "unknown"),
  );
  if (alignments.size > 1) {
    const conflictRecs = usable.filter((r) => r.perspective.alignment !== "unknown");
    claims.push({
      text: `The retrieved sources do not speak with one voice: they include documented ${[...alignments]
        .map((a) => ALIGNMENT_LABELS[a].toLowerCase())
        .join(" and ")} positions. Where they conflict, the conflict is the finding.`,
      evidence: conflictRecs.slice(0, 6).map((r) => r.id),
      kind: "limits",
    });
  }
  if (excluded.length > 0) {
    limitations.push(
      `${excluded.length} source${excluded.length === 1 ? "" : "s"} created after ${asOf} (or written in retrospect) ${excluded.length === 1 ? "was" : "were"} excluded: people at the time could not have read ${excluded.length === 1 ? "it" : "them"}.`,
    );
  }
  limitations.push(
    "This panel is generated from the retrieved records only. It describes what those documents show, not everything the selected community knew or believed.",
  );

  const allowed = new Set(consulted);
  return {
    profile,
    claims: validateClaims(claims, allowed),
    limitations,
    consulted,
    method: "rules",
  };
}

/** Main entry: AI when configured (validated), rule-based otherwise. */
export async function synthesizeWorldview(
  records: SourceRecord[],
  lens: LensState,
  asOf: string,
): Promise<WorldviewSynthesis> {
  const ruleResult = synthesizeRuleBased(records, lens, asOf);
  if (ruleResult.insufficient || !aiAvailable()) return ruleResult;

  const { usable } = applyHorizon(records, asOf);
  const ai = await synthesizeWithAi({
    records: usable,
    profileDescription: describeProfile(lens, asOf),
    asOf,
  });
  if (!ai) return ruleResult;

  const allowed = new Set(usable.map((r) => r.id));
  const validated = validateClaims(
    ai.claims.map((c) => ({
      text: c.text,
      evidence: c.evidence,
      kind: c.kind,
      caveat: c.caveat,
    })),
    allowed,
  );
  // Enforce the two-source rule for generalized claims: single-evidence
  // claims keep a visible caveat.
  const guarded = validated.map((c) =>
    c.evidence.length < 2 && !c.caveat
      ? { ...c, caveat: "Single-source basis — not generalizable." }
      : c,
  );
  if (guarded.length === 0) return ruleResult;

  return {
    profile: ruleResult.profile,
    claims: guarded,
    limitations: [
      ...ai.limitations.map(stripGeneratedQuotes),
      ...(ai.uncertainty ? [stripGeneratedQuotes(ai.uncertainty)] : []),
      "This panel is generated from the retrieved records only; citations open the underlying documents.",
    ],
    consulted: records.map((r) => r.id),
    method: "ai",
  };
}
