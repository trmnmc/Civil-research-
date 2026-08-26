/**
 * Rule-based natural-language query interpretation for Civil War research.
 * Works with no AI key. When an Anthropic key is configured the AI adapter
 * may ADD expansions, but the rule layer always runs and the original query
 * is always preserved and shown.
 */

import type { QueryInterpretation, SourceFormat } from "@/lib/types";
import {
  expandPlace,
  expandTerm,
  findEvents,
  findFormats,
  findStates,
  nameVariants,
  parseUnits,
  PLACE_ALIASES,
} from "./aliases";

const DEFAULT_RANGE: [number, number] = [1850, 1877];

const STOPWORDS = new Set(
  `a an and are as at be between but by did do does find for from how in into it of on or show search me the to was were what when where which who whose with during about near written discuss discussing describe describing reaction reactions late early`.split(
    " ",
  ),
);

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9,
  oct: 10, nov: 11, dec: 12,
};

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Extract explicit years / year ranges / month-year phrases from a query. */
export function extractDates(query: string): {
  yearRange?: [number, number];
  monthRange?: [string, string];
} {
  const lower = query.toLowerCase();
  const years = [...lower.matchAll(/\b(1[78]\d{2})\b/g)].map((m) =>
    parseInt(m[1], 10),
  );
  // Month-year pairs, e.g. "september 1862", "july 1863"
  const monthYear: { y: number; m: number }[] = [];
  for (const m of lower.matchAll(
    /\b(january|february|march|april|may|june|july|august|september|sept|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?,?\s+(1[78]\d{2})\b/g,
  )) {
    monthYear.push({ y: parseInt(m[2], 10), m: MONTHS[m[1]] });
  }
  let yearRange: [number, number] | undefined;
  let monthRange: [string, string] | undefined;
  if (years.length > 0) {
    yearRange = [Math.min(...years), Math.max(...years)];
  }
  if (monthYear.length > 0) {
    monthYear.sort((a, b) => a.y * 100 + a.m - (b.y * 100 + b.m));
    const first = monthYear[0];
    const last = monthYear[monthYear.length - 1];
    monthRange = [`${first.y}-${pad2(first.m)}`, `${last.y}-${pad2(last.m)}`];
  } else if (yearRange) {
    // "late 1862" / "early 1863" qualifiers narrow the month window.
    if (/\blate\s+1[78]\d{2}/.test(lower)) {
      monthRange = [`${yearRange[0]}-09`, `${yearRange[1]}-12`];
    } else if (/\bearly\s+1[78]\d{2}/.test(lower)) {
      monthRange = [`${yearRange[0]}-01`, `${yearRange[1]}-04`];
    }
  }
  return { yearRange, monthRange };
}

/** Capitalized-word runs that are not state names → probable person names. */
function findProbableNames(query: string, excluded: Set<string>): string[] {
  const names: string[] = [];
  for (const m of query.matchAll(
    /\b([A-Z][a-z']+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z']+)?)\b/g,
  )) {
    const candidate = m[1].trim();
    if (candidate.length < 3) continue;
    if (excluded.has(candidate.toLowerCase())) continue;
    // Single common words at sentence start aren't names.
    if (!candidate.includes(" ") && m.index === 0) continue;
    if (/^(Mc|M')[A-Z]/.test(candidate) || candidate.includes(" ")) {
      names.push(candidate);
    }
  }
  return [...new Set(names)];
}

export function interpretQuery(query: string): QueryInterpretation {
  const expansions: QueryInterpretation["expansions"] = [];
  const effectiveTerms = new Set<string>();
  const topics: string[] = [];

  const states = findStates(query);
  const events = findEvents(query);
  const formats = findFormats(query);
  const units = parseUnits(query);
  const { yearRange, monthRange } = extractDates(query);

  const excludedFromNames = new Set<string>([
    ...states.map((s) => s.name.toLowerCase()),
    "kentucky letters", "find", "how", "northern", "southern", "civil war",
    "union", "confederate", "emancipation", "gettysburg", "border",
  ]);
  for (const p of PLACE_ALIASES) {
    excludedFromNames.add(p.canonical.toLowerCase());
    for (const a of p.aliases) excludedFromNames.add(a.toLowerCase());
  }
  const people = findProbableNames(query, excludedFromNames);

  // Tokenize into content words.
  const tokens = query
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && !/^\d+$/.test(t));

  const places: string[] = [];
  for (const token of tokens) {
    effectiveTerms.add(token);
  }

  // Multi-word place aliases.
  for (const alias of PLACE_ALIASES) {
    const allForms = [alias.canonical, ...alias.aliases];
    const hit = allForms.find((f) =>
      query.toLowerCase().includes(f.toLowerCase()),
    );
    if (hit) {
      places.push(alias.canonical);
      const others = allForms.filter(
        (f) => f.toLowerCase() !== hit.toLowerCase(),
      );
      if (others.length) {
        expansions.push({ term: hit, expandedTo: others, reason: alias.reason });
        others.forEach((o) => effectiveTerms.add(o.toLowerCase()));
      }
    }
  }

  // Topical expansions.
  for (const token of new Set(tokens)) {
    const exp = expandTerm(token);
    if (exp) {
      expansions.push({
        term: token,
        expandedTo: exp.expandedTo,
        reason: exp.reason,
      });
      exp.expandedTo.forEach((e) => effectiveTerms.add(e));
      topics.push(token);
    }
  }
  // Multi-word expansions present in the query as phrases.
  for (const phrase of ["union army"]) {
    if (query.toLowerCase().includes(phrase)) {
      const exp = expandTerm(phrase);
      if (exp) {
        expansions.push({ term: phrase, expandedTo: exp.expandedTo, reason: exp.reason });
        exp.expandedTo.forEach((e) => effectiveTerms.add(e));
      }
    }
  }

  // Name variants (Mc/M').
  for (const person of people) {
    const variants = nameVariants(person).filter((v) => v !== person);
    if (variants.length) {
      expansions.push({
        term: person,
        expandedTo: variants,
        reason:
          "1860s printers set “Mc” as “M'”, and OCR renders the apostrophe inconsistently.",
      });
      variants.forEach((v) => effectiveTerms.add(v));
    }
    effectiveTerms.add(person);
  }

  // Unit variants.
  for (const unit of units) {
    if (unit.variants.length) {
      expansions.push({
        term: unit.raw,
        expandedTo: unit.variants,
        reason:
          "Regiments appear under several naming formats (ordinal words, “Volunteer”, “Regiment, State”).",
      });
      unit.variants.forEach((v) => effectiveTerms.add(v));
    }
  }

  // Events contribute their names and windows.
  for (const e of events) {
    effectiveTerms.add(e.name.toLowerCase());
    topics.push(e.name);
  }

  const interpretation: QueryInterpretation = {
    originalQuery: query,
    effectiveTerms: [...effectiveTerms],
    expansions,
    people,
    places,
    states: states.map((s) => s.code),
    units: units.map((u) => u.raw),
    events: events.map((e) => e.name),
    formats: formats as SourceFormat[],
    yearRange,
    monthRange,
    topics: [...new Set(topics)],
    method: "rules",
  };

  // Event windows refine missing date ranges.
  if (!interpretation.yearRange && events.length > 0) {
    const yrs = events.flatMap((e) => [
      parseInt(e.window[0].slice(0, 4), 10),
      parseInt(e.window[1].slice(0, 4), 10),
    ]);
    interpretation.yearRange = [Math.min(...yrs), Math.max(...yrs)];
    if (events.length === 1) {
      interpretation.monthRange = [
        events[0].window[0].slice(0, 7),
        events[0].window[1].slice(0, 7),
      ];
    }
  }

  return interpretation;
}

export function defaultYearRange(): [number, number] {
  return [...DEFAULT_RANGE] as [number, number];
}
