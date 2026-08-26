/**
 * Compare Perspectives: mechanical, citation-first comparison of two sets of
 * sources. Every statement cites the exact records it rests on. Where the
 * two sides cannot be responsibly compared, we say so instead of forcing
 * equivalence — "both sides" framing is never manufactured.
 */

import type {
  ComparisonResult,
  ComparisonStatement,
  SourceRecord,
} from "@/lib/types";
import { ALIGNMENT_LABELS } from "@/lib/search/perspective";

const TOPIC_TERMS: { topic: string; terms: string[] }[] = [
  { topic: "secession", terms: ["secession", "secede", "disunion"] },
  { topic: "slavery and emancipation", terms: ["slavery", "slave", "emancipation", "abolition", "freedmen"] },
  { topic: "loyalty and neutrality", terms: ["loyalty", "loyal", "allegiance", "neutrality", "union men"] },
  { topic: "military events", terms: ["battle", "army", "troops", "regiment", "campaign", "war"] },
  { topic: "government authority", terms: ["proclamation", "constitution", "federal", "congress", "legislature"] },
];

function recordText(r: SourceRecord): string {
  return [
    r.title,
    r.description ?? "",
    r.subjects.join(" "),
    r.transcript.text ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function topicsOf(records: SourceRecord[]): Map<string, SourceRecord[]> {
  const map = new Map<string, SourceRecord[]>();
  for (const r of records) {
    const text = recordText(r);
    for (const { topic, terms } of TOPIC_TERMS) {
      if (terms.some((t) => text.includes(t))) {
        map.set(topic, [...(map.get(topic) ?? []), r]);
      }
    }
  }
  return map;
}

function vocabOf(records: SourceRecord[]): Map<string, SourceRecord[]> {
  // Word-choice evidence comes ONLY from the documents' own text; curated
  // descriptions are modern prose and never count as period vocabulary.
  const words = [
    "rebel", "rebellion", "secesh", "federal", "yankee", "confederate",
    "disunion", "contraband", "abolition", "neutrality", "invasion",
    "liberty", "property", "institution", "slavery", "subduing",
  ];
  const map = new Map<string, SourceRecord[]>();
  for (const r of records) {
    const text = (r.transcript.text ?? "").toLowerCase();
    if (!text) continue;
    for (const w of words) {
      if (text.includes(w)) map.set(w, [...(map.get(w) ?? []), r]);
    }
  }
  return map;
}

function dateSpan(records: SourceRecord[]): [string, string] | undefined {
  const dates = records
    .map((r) => r.dates.created)
    .filter((d): d is string => Boolean(d && /^\d{4}/.test(d)))
    .sort();
  if (dates.length === 0) return undefined;
  return [dates[0], dates[dates.length - 1]];
}

export function comparePerspectives(
  left: SourceRecord[],
  right: SourceRecord[],
): ComparisonResult {
  if (left.length === 0 || right.length === 0) {
    return {
      left,
      right,
      statements: [],
      insufficient: {
        reason:
          left.length === 0 && right.length === 0
            ? "Neither side has sources selected."
            : `The ${left.length === 0 ? "left" : "right"} side has no sources. Add at least one source to each side to compare.`,
      },
    };
  }

  const statements: ComparisonStatement[] = [];
  const leftTopics = topicsOf(left);
  const rightTopics = topicsOf(right);

  // ── Shared factual ground: topics both sides address ──
  for (const [topic, lRecs] of leftTopics) {
    const rRecs = rightTopics.get(topic);
    if (rRecs) {
      statements.push({
        kind: "shared-fact",
        text: `Both sets address ${topic}. Compare what each asserts, defends, or testifies to — their differences are evidence about the period\u2019s conflict, not equally supported accounts of it.`,
        leftEvidence: lRecs.slice(0, 4).map((r) => r.id),
        rightEvidence: rRecs.slice(0, 4).map((r) => r.id),
      });
    }
  }

  // ── Information available: creation-date spans. Claimed only when one
  //    side's earliest date clearly postdates the other's latest (≈3+
  //    months), so trivially different spans don't generate a claim. ──
  const lSpan = dateSpan(left);
  const rSpan = dateSpan(right);
  const monthsOf = (d: string) => {
    const m = d.match(/^(\d{4})(?:-(\d{2}))?/);
    return m ? parseInt(m[1], 10) * 12 + (m[2] ? parseInt(m[2], 10) - 1 : 6) : undefined;
  };
  if (lSpan && rSpan) {
    const lStart = monthsOf(lSpan[0]);
    const lEnd = monthsOf(lSpan[1]);
    const rStart = monthsOf(rSpan[0]);
    const rEnd = monthsOf(rSpan[1]);
    const gapMonths =
      lStart !== undefined && lEnd !== undefined && rStart !== undefined && rEnd !== undefined
        ? Math.max(lStart - rEnd, rStart - lEnd)
        : 0;
    if (gapMonths >= 3) {
      statements.push({
        kind: "information-differs",
        text: `The two sides were written at clearly different moments (left: ${lSpan[0]}${lSpan[1] !== lSpan[0] ? ` to ${lSpan[1]}` : ""}; right: ${rSpan[0]}${rSpan[1] !== rSpan[0] ? ` to ${rSpan[1]}` : ""}). Authors writing later could have known of events the earlier authors could not.`,
        leftEvidence: left.slice(0, 4).map((r) => r.id),
        rightEvidence: right.slice(0, 4).map((r) => r.id),
      });
    }
  }

  // ── Evidence-class differences: how each side's documents were made ──
  const lClasses = new Set(left.map((r) => r.classification.evidenceClass));
  const rClasses = new Set(right.map((r) => r.classification.evidenceClass));
  const lOnly = [...lClasses].filter((c) => !rClasses.has(c));
  const rOnly = [...rClasses].filter((c) => !lClasses.has(c));
  if (lOnly.length > 0 || rOnly.length > 0) {
    statements.push({
      kind: "motive-differs",
      text: `The sides rest on different kinds of evidence${lOnly.length ? ` — left includes ${lOnly.map((c) => c.replace(/-/g, " ")).join(", ")}` : ""}${rOnly.length ? `${lOnly.length ? ";" : " —"} right includes ${rOnly.map((c) => c.replace(/-/g, " ")).join(", ")}` : ""}. A document made to persuade, a private record, and an official report were created for different reasons; weigh them accordingly.`,
      leftEvidence: left.slice(0, 4).map((r) => r.id),
      rightEvidence: right.slice(0, 4).map((r) => r.id),
    });
  }

  // ── Language differences ──
  const lVocab = vocabOf(left);
  const rVocab = vocabOf(right);
  const lWords = [...lVocab.keys()].filter((w) => !rVocab.has(w));
  const rWords = [...rVocab.keys()].filter((w) => !lVocab.has(w));
  if (lWords.length > 0 || rWords.length > 0) {
    statements.push({
      kind: "language-differs",
      text: `Vocabulary in the documents\u2019 own text diverges${lWords.length ? `: the left documents use ${lWords.slice(0, 3).join(", ")}` : ""}${rWords.length ? `${lWords.length ? "; " : ": "}the right documents use ${rWords.slice(0, 3).join(", ")}` : ""}. Word choice marks political framing in this period.`,
      leftEvidence: [
        ...new Set(lWords.flatMap((w) => (lVocab.get(w) ?? []).map((r) => r.id))),
      ].slice(0, 4),
      rightEvidence: [
        ...new Set(rWords.flatMap((w) => (rVocab.get(w) ?? []).map((r) => r.id))),
      ].slice(0, 4),
    });
  }

  // ── Documented alignment conflicts. Merely DIFFERENT positions are not
  //    opposition (abolitionists were mostly Unionists); only documented
  //    opposed pairs produce a conflict statement. ──
  const OPPOSED: [string, string][] = [
    ["confederate-aligned", "unionist"],
    ["confederate-aligned", "abolitionist"],
    ["confederate-aligned", "southern-unionist"],
    ["antiwar-northern-democrat", "abolitionist"],
  ];
  const lAligns = new Set(
    left.map((r) => r.perspective.alignment).filter((a) => a !== "unknown"),
  );
  const rAligns = new Set(
    right.map((r) => r.perspective.alignment).filter((a) => a !== "unknown"),
  );
  const conflicting = OPPOSED.some(
    ([a, b]) =>
      (lAligns.has(a as never) && rAligns.has(b as never)) ||
      (lAligns.has(b as never) && rAligns.has(a as never)),
  );
  if (conflicting) {
    statements.push({
      kind: "conflict",
      text: `The sides carry documented, opposed political positions (left: ${[...lAligns]
        .map((a) => ALIGNMENT_LABELS[a].toLowerCase())
        .join(", ")}; right: ${[...rAligns]
        .map((a) => ALIGNMENT_LABELS[a].toLowerCase())
        .join(", ")}). Their disagreements are evidence about the period's conflicts — not equally valid accounts of contested facts.`,
      leftEvidence: left
        .filter((r) => r.perspective.alignment !== "unknown")
        .slice(0, 4)
        .map((r) => r.id),
      rightEvidence: right
        .filter((r) => r.perspective.alignment !== "unknown")
        .slice(0, 4)
        .map((r) => r.id),
    });
  }

  if (statements.length === 0) {
    return {
      left,
      right,
      statements,
      insufficient: {
        reason:
          "These sources share too little (topic, time, or documented position) for a grounded comparison. They can still be read side by side above.",
      },
    };
  }

  return { left, right, statements };
}
