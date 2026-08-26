/**
 * Historical-knowledge layer: regional bands, place-name conventions,
 * term aliases, and military-unit patterns used to interpret Civil War era
 * research queries.
 *
 * Geographic band assignments reflect wartime political geography, and are
 * used ONLY for geographic weighting — never as a claim about the loyalty of
 * any person or document. Location is not loyalty.
 */

import type { RegionBand, SourceFormat } from "@/lib/types";

// ─── States and regional bands ───────────────────────────────────────────────

export interface StateInfo {
  code: string;
  name: string;
  band: RegionBand;
  note?: string;
}

export const STATES: StateInfo[] = [
  // Free states that remained in the Union
  { code: "ME", name: "Maine", band: "north" },
  { code: "NH", name: "New Hampshire", band: "north" },
  { code: "VT", name: "Vermont", band: "north" },
  { code: "MA", name: "Massachusetts", band: "north" },
  { code: "RI", name: "Rhode Island", band: "north" },
  { code: "CT", name: "Connecticut", band: "north" },
  { code: "NY", name: "New York", band: "north" },
  { code: "NJ", name: "New Jersey", band: "north" },
  { code: "PA", name: "Pennsylvania", band: "north" },
  { code: "OH", name: "Ohio", band: "north" },
  { code: "IN", name: "Indiana", band: "north" },
  { code: "IL", name: "Illinois", band: "north" },
  { code: "MI", name: "Michigan", band: "north" },
  { code: "WI", name: "Wisconsin", band: "north" },
  { code: "MN", name: "Minnesota", band: "north" },
  { code: "IA", name: "Iowa", band: "north" },
  { code: "KS", name: "Kansas", band: "north", note: "Free state 1861; site of prewar border conflict" },
  { code: "CA", name: "California", band: "north" },
  { code: "OR", name: "Oregon", band: "north" },
  { code: "NV", name: "Nevada", band: "north", note: "Statehood 1864" },
  // Border: slave states that did not secede, plus divided/contested areas
  { code: "DE", name: "Delaware", band: "border" },
  { code: "MD", name: "Maryland", band: "border" },
  { code: "KY", name: "Kentucky", band: "border", note: "Declared neutrality May–Sept 1861; deeply divided" },
  { code: "MO", name: "Missouri", band: "border", note: "Rival governments; widespread guerrilla war" },
  { code: "WV", name: "West Virginia", band: "border", note: "Separated from Virginia; statehood 1863" },
  // Seceded states
  { code: "VA", name: "Virginia", band: "south" },
  { code: "NC", name: "North Carolina", band: "south" },
  { code: "SC", name: "South Carolina", band: "south" },
  { code: "GA", name: "Georgia", band: "south" },
  { code: "FL", name: "Florida", band: "south" },
  { code: "AL", name: "Alabama", band: "south" },
  { code: "MS", name: "Mississippi", band: "south" },
  { code: "LA", name: "Louisiana", band: "south" },
  { code: "TX", name: "Texas", band: "south" },
  { code: "AR", name: "Arkansas", band: "south" },
  { code: "TN", name: "Tennessee", band: "south", note: "East Tennessee heavily Unionist — a contested community" },
  // Federal district
  { code: "DC", name: "District of Columbia", band: "national" },
];

const STATE_BY_CODE = new Map(STATES.map((s) => [s.code, s]));
const STATE_BY_NAME = new Map(STATES.map((s) => [s.name.toLowerCase(), s]));

export function stateByCode(code?: string): StateInfo | undefined {
  return code ? STATE_BY_CODE.get(code.toUpperCase()) : undefined;
}

export function bandForState(code?: string): RegionBand {
  return stateByCode(code)?.band ?? "unknown";
}

/** Find state mentions (full names and postal codes) in free text. */
export function findStates(text: string): StateInfo[] {
  const found = new Map<string, StateInfo>();
  const lower = text.toLowerCase();
  for (const s of STATES) {
    if (lower.includes(s.name.toLowerCase())) found.set(s.code, s);
  }
  // Postal codes only when standing alone and uppercase in the original.
  for (const m of text.matchAll(/\b([A-Z]{2})\b/g)) {
    const s = STATE_BY_CODE.get(m[1]);
    if (s) found.set(s.code, s);
  }
  return [...found.values()];
}

export function stateByName(name: string): StateInfo | undefined {
  return STATE_BY_NAME.get(name.toLowerCase());
}

// ─── Places: battle/place naming conventions & historical names ──────────────

/**
 * Union reports often named battles for waterways; Confederate reports for
 * towns. A researcher entering either should find both. Each entry also
 * carries the state and (when helpful) the battle date window.
 */
export interface PlaceAlias {
  canonical: string;
  aliases: string[];
  state?: string;
  reason: string;
  eventWindow?: [string, string]; // ISO dates
}

export const PLACE_ALIASES: PlaceAlias[] = [
  {
    canonical: "Manassas",
    aliases: ["Bull Run", "Manassas Junction"],
    state: "VA",
    reason: "Union reports said “Bull Run” (the creek); Confederate reports said “Manassas” (the junction).",
  },
  {
    canonical: "Antietam",
    aliases: ["Sharpsburg", "Antietam Creek"],
    state: "MD",
    reason: "Union usage “Antietam” (the creek); Confederate usage “Sharpsburg” (the town).",
    eventWindow: ["1862-09-15", "1862-09-20"],
  },
  {
    canonical: "Shiloh",
    aliases: ["Pittsburg Landing"],
    state: "TN",
    reason: "Union reports often said “Pittsburg Landing”; “Shiloh” from the church nearby.",
    eventWindow: ["1862-04-06", "1862-04-08"],
  },
  {
    canonical: "Stones River",
    aliases: ["Murfreesboro", "Stone's River"],
    state: "TN",
    reason: "Union “Stones River”; Confederate “Murfreesboro”. Period spelling includes “Stone's River”.",
    eventWindow: ["1862-12-31", "1863-01-03"],
  },
  {
    canonical: "Gettysburg",
    aliases: ["Gettysburgh", "Adams County"],
    state: "PA",
    reason: "Period papers sometimes spelled it “Gettysburgh”; the town seat of Adams County.",
    eventWindow: ["1863-07-01", "1863-07-04"],
  },
  {
    canonical: "Vicksburg",
    aliases: ["Vicksburgh"],
    state: "MS",
    reason: "Period spelling variant with terminal “h”.",
    eventWindow: ["1863-05-18", "1863-07-04"],
  },
  {
    canonical: "Fort Sumter",
    aliases: ["Fort Sumpter", "Charleston Harbor"],
    state: "SC",
    reason: "“Sumpter” was an extremely common period misspelling.",
    eventWindow: ["1861-04-12", "1861-04-14"],
  },
  {
    canonical: "Ball's Bluff",
    aliases: ["Leesburg", "Balls Bluff"],
    state: "VA",
    reason: "Confederate reports said “Leesburg”.",
    eventWindow: ["1861-10-21", "1861-10-22"],
  },
  {
    canonical: "Chancellorsville",
    aliases: ["Chancellorville"],
    state: "VA",
    reason: "Frequent period/OCR spelling without the “s”.",
    eventWindow: ["1863-04-30", "1863-05-06"],
  },
  {
    canonical: "Fredericksburg",
    aliases: ["Fredericksburgh"],
    state: "VA",
    reason: "Period spelling variant.",
    eventWindow: ["1862-12-11", "1862-12-15"],
  },
  {
    canonical: "Appomattox Court House",
    aliases: ["Appomattox C.H.", "Appomattox"],
    state: "VA",
    reason: "“C.H.” was the standard abbreviation for Court House villages.",
    eventWindow: ["1865-04-09", "1865-04-12"],
  },
  {
    canonical: "Harpers Ferry",
    aliases: ["Harper's Ferry"],
    state: "WV",
    reason:
      "Both possessive and plain forms appear throughout the period. In Virginia until West Virginia statehood (June 1863); tagged WV per modern geography.",
  },
  {
    canonical: "Perryville",
    aliases: ["Chaplin Hills"],
    state: "KY",
    reason: "Confederate reports called it Chaplin Hills.",
    eventWindow: ["1862-10-08", "1862-10-09"],
  },
];

/** Expand a place term with its historical aliases (bidirectional). */
export function expandPlace(term: string): PlaceAlias | undefined {
  const t = term.toLowerCase().trim();
  return PLACE_ALIASES.find(
    (p) =>
      p.canonical.toLowerCase() === t ||
      p.aliases.some((a) => a.toLowerCase() === t),
  );
}

// ─── Events with date windows ────────────────────────────────────────────────

export interface HistoricalEvent {
  name: string;
  aliases: string[];
  window: [string, string];
  note?: string;
}

export const EVENTS: HistoricalEvent[] = [
  {
    name: "Secession winter",
    aliases: ["secession crisis", "secession"],
    window: ["1860-11-06", "1861-06-08"],
    note: "From Lincoln's election through Tennessee's June 1861 referendum.",
  },
  {
    name: "Fort Sumter",
    aliases: ["sumter", "sumpter", "bombardment of fort sumter"],
    window: ["1861-04-12", "1861-04-14"],
  },
  {
    name: "Lincoln's call for troops",
    aliases: ["call for 75,000", "call for troops", "proclamation of april 15"],
    window: ["1861-04-15", "1861-05-15"],
  },
  {
    name: "Kentucky neutrality",
    aliases: ["kentucky neutrality", "neutrality proclamation"],
    window: ["1861-05-16", "1861-09-18"],
  },
  {
    name: "First Manassas / Bull Run",
    aliases: ["first bull run", "first manassas", "battle of bull run"],
    window: ["1861-07-21", "1861-07-25"],
  },
  {
    name: "Preliminary Emancipation Proclamation",
    aliases: ["preliminary emancipation", "september proclamation"],
    window: ["1862-09-22", "1862-09-30"],
  },
  {
    name: "Emancipation Proclamation",
    aliases: ["emancipation proclamation", "emancipation", "final proclamation"],
    window: ["1862-09-22", "1863-01-31"],
    note: "Spans the preliminary proclamation through reaction to the final proclamation.",
  },
  {
    name: "Battle of Antietam",
    aliases: ["antietam", "sharpsburg"],
    window: ["1862-09-15", "1862-09-25"],
  },
  {
    name: "Battle of Gettysburg",
    aliases: ["gettysburg", "gettysburgh"],
    window: ["1863-06-25", "1863-07-15"],
  },
  {
    name: "New York draft riots",
    aliases: ["draft riots", "conscription riots"],
    window: ["1863-07-13", "1863-07-17"],
  },
  {
    name: "Gettysburg Address",
    aliases: ["gettysburg address", "dedication of the cemetery"],
    window: ["1863-11-19", "1863-11-25"],
  },
  {
    name: "Appomattox surrender",
    aliases: ["appomattox", "lee's surrender", "surrender of lee"],
    window: ["1865-04-09", "1865-04-20"],
  },
  {
    name: "Lincoln assassination",
    aliases: ["assassination", "death of lincoln", "murder of the president"],
    window: ["1865-04-14", "1865-05-01"],
  },
];

export function findEvents(text: string): HistoricalEvent[] {
  const lower = text.toLowerCase();
  return EVENTS.filter(
    (e) =>
      lower.includes(e.name.toLowerCase()) ||
      e.aliases.some((a) => lower.includes(a)),
  );
}

// ─── Topical term expansions (period vocabulary) ─────────────────────────────

export interface TermExpansion {
  term: string;
  expandedTo: string[];
  reason: string;
}

export const TERM_EXPANSIONS: TermExpansion[] = [
  {
    term: "secession",
    expandedTo: ["disunion", "seceding states", "ordinance of secession"],
    reason: "Period writing frequently said “disunion”; official acts were “ordinances of secession”.",
  },
  {
    term: "loyalty",
    expandedTo: ["union men", "loyal citizens", "allegiance", "loyalty oath"],
    reason: "Loyalty was discussed through “Union men”, “loyal citizens”, oaths of allegiance.",
  },
  {
    term: "emancipation",
    expandedTo: ["emancipation proclamation", "freedom", "abolition", "slavery"],
    reason:
      "Reactions to emancipation used varied vocabulary across regions — and argued about slavery in those words.",
  },
  {
    term: "enslaved",
    expandedTo: ["slave", "slaves", "slavery", "contraband", "freedmen"],
    reason:
      "Period documents use the language of their era, including “contraband” for people escaping to Union lines and “freedmen” after emancipation. Searching only modern terms misses the sources.",
  },
  {
    term: "draft",
    expandedTo: ["conscription", "enrollment act", "draft riot"],
    reason: "The 1863 federal draft was legally the Enrollment Act; papers said “conscription”.",
  },
  {
    term: "copperhead",
    expandedTo: ["peace democrat", "peace party", "vallandigham"],
    reason: "“Copperhead” was the epithet for antiwar Northern Democrats (Peace Democrats).",
  },
  {
    term: "confederate",
    expandedTo: ["rebel", "secesh", "southern confederacy"],
    reason: "Union sources wrote “rebel” or slang “secesh”; “Southern Confederacy” was common period usage (the formal name was the Confederate States of America).",
  },
  {
    term: "union army",
    expandedTo: ["federal army", "federals", "national forces"],
    reason: "Southern papers wrote “Federals” or “the Federal army”.",
  },
  {
    term: "battle",
    expandedTo: ["engagement", "action", "fight"],
    reason: "Official reports called smaller battles “engagements” or “actions”.",
  },
  {
    term: "hospital",
    expandedTo: ["sick and wounded", "sanitary commission"],
    reason: "Medical care appears via the Sanitary Commission and “sick and wounded” returns.",
  },
];

export function expandTerm(term: string): TermExpansion | undefined {
  const t = term.toLowerCase().trim();
  return TERM_EXPANSIONS.find((e) => e.term === t);
}

// ─── Names: initials, Mc/M', common spelling variants ────────────────────────

/**
 * 1860s printing regularly set “Mc” as “M'” (M-apostrophe): McClellan →
 * M'Clellan. OCR then often reads the apostrophe as a backtick or drops it.
 */
export function nameVariants(name: string): string[] {
  const variants = new Set<string>();
  const trimmed = name.trim();
  if (!trimmed) return [];
  variants.add(trimmed);
  if (/\bMc([A-Z])/i.test(trimmed)) {
    variants.add(trimmed.replace(/\bMc([A-Z])/gi, "M'$1"));
    variants.add(trimmed.replace(/\bMc([A-Z])/gi, "M‘$1"));
  }
  if (/\bM'([A-Z])/i.test(trimmed)) {
    variants.add(trimmed.replace(/\bM'([A-Z])/gi, "Mc$1"));
  }
  return [...variants];
}

// ─── Military units ──────────────────────────────────────────────────────────

export interface UnitReference {
  raw: string;
  ordinal: number;
  state?: string;
  branch?: "infantry" | "cavalry" | "artillery";
  usct?: boolean;
  /** Query strings that period sources and catalogs actually use. */
  variants: string[];
}

const BRANCH_WORDS: Record<string, "infantry" | "cavalry" | "artillery"> = {
  infantry: "infantry",
  inf: "infantry",
  cavalry: "cavalry",
  cav: "cavalry",
  artillery: "artillery",
  arty: "artillery",
  "light artillery": "artillery",
};

const ORDINAL_WORDS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
  eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13,
  fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
  eighteenth: 18, nineteenth: 19, twentieth: 20,
};

function ordinalSuffix(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return "st";
  if (rem10 === 2 && rem100 !== 12) return "nd";
  if (rem10 === 3 && rem100 !== 13) return "rd";
  return "th";
}

const ORDINAL_NAMES = Object.fromEntries(
  Object.entries(ORDINAL_WORDS).map(([w, n]) => [n, w]),
);

/**
 * Parse unit references like "15th Kentucky Infantry", "1st Va Cav",
 * "Fifth Ohio", "54th Massachusetts", "3rd USCT".
 */
export function parseUnits(text: string): UnitReference[] {
  const units: UnitReference[] = [];
  const pattern =
    /\b(\d{1,3})(?:st|nd|rd|th)?\s+([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)?)((?:\s+\(?[cC]olored\)?)?)\s*(infantry|cavalry|artillery|inf\.?|cav\.?|arty\.?|volunteers|vols\.?|regiment|USCT)?/g;
  for (const m of text.matchAll(pattern)) {
    const ordinal = parseInt(m[1], 10);
    let stateWord = m[2].replace(/\.$/, "");
    let branchWord = (m[4] || "").toLowerCase().replace(/\.$/, "");
    // The state capture can swallow a capitalized branch word
    // ("Kentucky Infantry") — split it back out.
    const stateTokens = stateWord.split(/\s+/);
    const lastToken = stateTokens[stateTokens.length - 1]?.toLowerCase() ?? "";
    if (stateTokens.length > 1 && BRANCH_WORDS[lastToken]) {
      if (!branchWord) branchWord = lastToken;
      stateWord = stateTokens.slice(0, -1).join(" ");
    }
    const state =
      stateByName(stateWord)?.code ??
      stateByCode(stateWord.length === 2 ? stateWord : undefined)?.code ??
      // Common state abbreviations in unit names
      ({ va: "VA", ky: "KY", pa: "PA", mass: "MA", tenn: "TN", miss: "MS", ala: "AL" } as Record<string, string>)[
        stateWord.toLowerCase()
      ];
    // "Colored"/USCT flags apply only to THIS match, never the whole query
    // (the 54th Massachusetts and the 54th USCT are different regiments).
    const usctExplicit = /usct/i.test(m[0]);
    const coloredDesignation = /colored/i.test(m[0]);
    if (!state && !usctExplicit) continue;
    const branch = BRANCH_WORDS[branchWord] ?? undefined;
    units.push(buildUnit(m[0], ordinal, state, branch, usctExplicit, coloredDesignation));
  }
  // Written-out ordinals: "Fifth Ohio"
  const wordPattern = new RegExp(
    `\\b(${Object.keys(ORDINAL_WORDS).join("|")})\\s+([A-Z][a-zA-Z]+)\\b`,
    "gi",
  );
  for (const m of text.matchAll(wordPattern)) {
    const ordinal = ORDINAL_WORDS[m[1].toLowerCase()];
    const state = stateByName(m[2])?.code;
    if (!state || !ordinal) continue;
    units.push(buildUnit(m[0], ordinal, state, undefined, false, false));
  }
  return units;
}

function buildUnit(
  raw: string,
  ordinal: number,
  state: string | undefined,
  branch: "infantry" | "cavalry" | "artillery" | undefined,
  usctExplicit: boolean,
  coloredDesignation: boolean,
): UnitReference {
  const stateName = state ? stateByCode(state)?.name : undefined;
  const ord = `${ordinal}${ordinalSuffix(ordinal)}`;
  const ordWord = ORDINAL_NAMES[ordinal];
  const variants = new Set<string>();
  const branchNames = branch ? [branch] : ["infantry", "cavalry"];
  // A state name always keeps state-based variants; "…United States Colored
  // Troops" variants are generated ONLY for explicit stateless USCT
  // references — a state regiment with a "(Colored)" designation is a
  // different unit from the same-numbered USCT regiment.
  const base = stateName ?? (usctExplicit ? "United States Colored Troops" : undefined);
  if (base) {
    for (const b of branchNames) {
      variants.add(`${ord} ${base} ${b[0].toUpperCase()}${b.slice(1)}`);
      variants.add(`${ord} ${base} Volunteer ${b[0].toUpperCase()}${b.slice(1)}`);
    }
    variants.add(`${ord} ${base}`);
    if (ordWord)
      variants.add(
        `${ordWord[0].toUpperCase()}${ordWord.slice(1)} ${base}`,
      );
    variants.add(`${ord} Regiment, ${base}${branch ? ` ${branch[0].toUpperCase()}${branch.slice(1)}` : ""}`);
    if (stateName && coloredDesignation) {
      variants.add(`${ord} ${stateName} (Colored)`);
      variants.add(
        `${ord} ${stateName} Volunteer Infantry (Colored)`,
      );
    }
  }
  return {
    raw,
    ordinal,
    state,
    branch,
    usct: usctExplicit || coloredDesignation,
    variants: [...variants],
  };
}

// ─── Source format vocabulary ────────────────────────────────────────────────

export const FORMAT_KEYWORDS: { format: SourceFormat; keywords: string[] }[] = [
  { format: "letter", keywords: ["letter", "letters", "correspondence"] },
  { format: "diary", keywords: ["diary", "diaries", "journal"] },
  { format: "newspaper", keywords: ["newspaper", "newspapers", "press", "editorial", "editorials"] },
  { format: "speech", keywords: ["speech", "speeches", "address", "oration"] },
  { format: "military-order", keywords: ["order", "orders", "general order", "special order"] },
  { format: "official-report", keywords: ["report", "reports", "official report", "battle report", "after-action"] },
  { format: "map", keywords: ["map", "maps"] },
  { format: "photograph", keywords: ["photograph", "photographs", "photo", "photos"] },
  { format: "census", keywords: ["census"] },
  { format: "church-record", keywords: ["church record", "church records", "parish register"] },
  { format: "roster", keywords: ["roster", "rosters", "muster roll", "muster rolls"] },
  { format: "pamphlet", keywords: ["pamphlet", "pamphlets", "tract"] },
  { format: "broadside", keywords: ["broadside", "broadsides", "handbill"] },
  { format: "memoir", keywords: ["memoir", "memoirs", "reminiscence", "reminiscences", "recollections"] },
  { format: "narrative", keywords: ["narrative", "slave narrative", "accounts", "account"] },
];

export function findFormats(text: string): SourceFormat[] {
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set<SourceFormat>();
  for (const { format, keywords } of FORMAT_KEYWORDS) {
    if (keywords.some((k) => lower.includes(` ${k} `) || lower.includes(` ${k},`) || lower.includes(` ${k}.`)))
      found.add(format);
  }
  return [...found];
}
