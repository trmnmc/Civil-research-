/**
 * Perspective Lens logic.
 *
 * The lens position (0..100) snaps to evidence-backed regional bands:
 * North, Border & Contested, South — with soft transition zones where two
 * bands are co-weighted. The lens NEVER alters a source, the factual
 * timeline, or established evidence; it only re-weights which communities'
 * documents are emphasized in ranking, together with the social-position and
 * political-alignment controls. Location is not loyalty: alignment weighting
 * is driven by alignment metadata, never inferred from geography.
 */

import type {
  LensState,
  PerspectiveProfile,
  PoliticalAlignment,
  RegionBand,
  SocialPosition,
  SourceRecord,
} from "@/lib/types";
import { clamp } from "@/lib/utils";

/** Band snapping: [0,33] north · (33,66) border · [66,100] south. */
export function snapBand(position: number): RegionBand {
  const p = clamp(position, 0, 100);
  if (p <= 33) return "north";
  if (p < 66) return "border";
  return "south";
}

export const BAND_LABELS: Record<RegionBand, string> = {
  north: "North",
  border: "Border & Contested",
  south: "South",
  national: "National / D.C.",
  unknown: "Unknown region",
};

/**
 * Weight of each region band for a lens position. Smooth between bands so the
 * bar feels fluid, but anchored to the three snapped bands rather than
 * inventing intermediate ideological positions: within a band's core the
 * weights are constant; in the boundary zones adjacent bands share weight.
 */
export function bandWeights(position: number): Record<RegionBand, number> {
  const p = clamp(position, 0, 100);
  // Piecewise: cores at [0,25], [40,60] (border core), [75,100].
  let north = 0;
  let border = 0;
  let south = 0;
  if (p <= 25) {
    north = 1;
  } else if (p < 40) {
    const t = (p - 25) / 15;
    north = 1 - t;
    border = t;
  } else if (p <= 60) {
    border = 1;
  } else if (p < 75) {
    const t = (p - 60) / 15;
    border = 1 - t;
    south = t;
  } else {
    south = 1;
  }
  // National/D.C. sources stay modestly relevant at every position.
  return {
    north,
    border,
    south,
    national: 0.35,
    unknown: 0.15,
  };
}

/**
 * How strongly a record matches the lens. Returns a multiplier ≥ 0 used as a
 * BOOST in ranking — never as a hard filter unless `strict` is set.
 */
export function perspectiveBoost(
  record: SourceRecord,
  lens: LensState,
): { boost: number; reasons: string[] } {
  const reasons: string[] = [];
  const weights = bandWeights(lens.position);
  const region = record.perspective.region;
  const regionWeight = weights[region] ?? 0.15;
  if (regionWeight >= 0.9) {
    reasons.push(`origin in the ${BAND_LABELS[region]} band (lens focus)`);
  } else if (regionWeight > 0.3) {
    reasons.push(`origin in the ${BAND_LABELS[region]} band (near lens focus)`);
  }

  // Social-position match. Records with curated/metadata-backed positions
  // matching a selected role get boosted; unknown roles are never punished
  // to zero (we boost, we don't hide).
  let socialFactor = 1;
  if (lens.socialPositions.length > 0) {
    const overlap = record.perspective.socialPositions.filter((s) =>
      lens.socialPositions.includes(s),
    );
    if (overlap.length > 0) {
      socialFactor = 1.6;
      reasons.push(
        `voice matches selected social position (${overlap.join(", ").replace(/-/g, " ")})`,
      );
    } else if (
      record.perspective.socialPositions.length > 0 &&
      !record.perspective.socialPositions.includes("unknown")
    ) {
      socialFactor = 0.6;
    }
  }

  // Alignment match — from metadata only, never inferred from region.
  let alignmentFactor = 1;
  if (lens.alignments.length > 0) {
    const a = record.perspective.alignment;
    if (a !== "unknown" && lens.alignments.includes(a)) {
      alignmentFactor = 1.6;
      reasons.push(`documented alignment: ${a.replace(/-/g, " ")}`);
    } else if (a !== "unknown") {
      alignmentFactor = 0.65;
    }
    // Unknown alignment keeps factor 1 — geography must not stand in for loyalty.
  }

  /**
   * Guard: when the researcher selects the voices of enslaved people or free
   * Black residents, institutional records ABOUT them from slaveholding
   * institutions must not be boosted as though they were those voices.
   * First-person and community sources carry the boost instead.
   */
  const wantsBlackVoices =
    lens.socialPositions.includes("enslaved-person") ||
    lens.socialPositions.includes("free-black-resident");
  if (wantsBlackVoices) {
    const isThatVoice = record.perspective.socialPositions.some(
      (s) => s === "enslaved-person" || s === "free-black-resident",
    );
    if (isThatVoice) {
      reasons.push("first-person or community source for the selected voice");
    } else if (
      record.classification.evidenceClass === "official-record" &&
      record.perspective.region === "south"
    ) {
      // e.g. slaveholder or Confederate administrative records about enslaved
      // people: kept in results (they are evidence) but not boosted as the voice.
      socialFactor = Math.min(socialFactor, 0.5);
      reasons.push(
        "institutional record about, not by, the selected voice — shown but not treated as that voice",
      );
    }
  }

  const base = 0.35 + regionWeight; // 0.35 floor: nothing vanishes by lens alone
  return { boost: base * socialFactor * alignmentFactor, reasons };
}

/** Strict filtering, only when the researcher asks for it. */
export function passesStrict(record: SourceRecord, lens: LensState): boolean {
  if (!lens.strict) return true;
  const band = snapBand(lens.position);
  if (record.perspective.region !== band && record.perspective.region !== "national")
    return false;
  if (
    lens.socialPositions.length > 0 &&
    !record.perspective.socialPositions.some((s) =>
      lens.socialPositions.includes(s),
    )
  )
    return false;
  if (
    lens.alignments.length > 0 &&
    record.perspective.alignment !== "unknown" &&
    !lens.alignments.includes(record.perspective.alignment)
  )
    return false;
  return true;
}

/** Default lens: centered on Border & Contested, full research period. */
export function defaultLens(): LensState {
  return {
    position: 50,
    band: "border",
    socialPositions: [],
    alignments: [],
    yearRange: [1850, 1877],
    strict: false,
  };
}

export const SOCIAL_POSITION_LABELS: Record<SocialPosition, string> = {
  civilian: "Civilian",
  "enlisted-soldier": "Enlisted soldier",
  officer: "Officer",
  "political-actor": "Political actor",
  "newspaper-editor": "Newspaper editor",
  "enslaved-person": "Enslaved person",
  "free-black-resident": "Free Black resident",
  "woman-home-front": "Woman on the home front",
  clergy: "Clergy",
  unknown: "Unknown",
};

export const ALIGNMENT_LABELS: Record<PoliticalAlignment, string> = {
  unionist: "Unionist",
  abolitionist: "Abolitionist",
  "antiwar-northern-democrat": "Antiwar Northern Democrat",
  "divided-uncertain": "Divided / uncertain",
  "southern-unionist": "Southern Unionist",
  "confederate-aligned": "Confederate-aligned",
  unknown: "Not documented",
};

/** Describe a perspective profile for display, honestly about its basis. */
export function describePerspective(p: PerspectiveProfile): string {
  const parts: string[] = [];
  parts.push(BAND_LABELS[p.region]);
  if (p.state) parts.push(p.state);
  if (p.alignment !== "unknown") parts.push(ALIGNMENT_LABELS[p.alignment]);
  return parts.join(" · ");
}
