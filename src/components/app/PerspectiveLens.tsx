"use client";

/**
 * The Perspective Lens: a horizontal bar from North (left) through Border &
 * Contested (center) to South (right), fluid to move but snapping internally
 * to evidence-backed regional bands. Beside it: social-position and
 * political-alignment controls and the date/event window. The lens
 * re-weights which communities' documents are emphasized — it never alters
 * sources, facts, or the timeline, and location is never read as loyalty.
 */

import { useId } from "react";
import { Info } from "lucide-react";
import type {
  LensState,
  PoliticalAlignment,
  SocialPosition,
} from "@/lib/types";
import {
  ALIGNMENT_LABELS,
  BAND_LABELS,
  SOCIAL_POSITION_LABELS,
  snapBand,
} from "@/lib/search/perspective";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SOCIAL_OPTIONS: SocialPosition[] = [
  "civilian",
  "enlisted-soldier",
  "officer",
  "political-actor",
  "newspaper-editor",
  "enslaved-person",
  "free-black-resident",
  "woman-home-front",
];

const ALIGNMENT_OPTIONS: PoliticalAlignment[] = [
  "unionist",
  "abolitionist",
  "antiwar-northern-democrat",
  "divided-uncertain",
  "southern-unionist",
  "confederate-aligned",
];

function ChipGroup<T extends string>({
  legend,
  options,
  selected,
  labels,
  onToggle,
}: {
  legend: string;
  options: T[];
  selected: T[];
  labels: Record<string, string>;
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(opt)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer",
                active
                  ? "border-ink-soft bg-ink text-paper-raised"
                  : "border-rule-strong bg-paper-raised text-ink-soft hover:bg-paper-sunken",
              )}
            >
              {active ? "✓ " : ""}
              {labels[opt]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PerspectiveLens({
  lens,
  onChange,
}: {
  lens: LensState;
  onChange: (next: LensState) => void;
}) {
  const sliderId = useId();
  const band = snapBand(lens.position);

  const toggleSocial = (s: SocialPosition) =>
    onChange({
      ...lens,
      socialPositions: lens.socialPositions.includes(s)
        ? lens.socialPositions.filter((x) => x !== s)
        : [...lens.socialPositions, s],
    });

  const toggleAlignment = (a: PoliticalAlignment) =>
    onChange({
      ...lens,
      alignments: lens.alignments.includes(a)
        ? lens.alignments.filter((x) => x !== a)
        : [...lens.alignments, a],
    });

  return (
    <section
      aria-label="Perspective Lens"
      className="rounded-lg border border-rule bg-paper-raised p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Perspective Lens</h2>
        <p className="flex items-center gap-1 text-xs text-ink-faint">
          <Info className="size-3.5 shrink-0" aria-hidden />
          Re-weights which communities&apos; documents lead the results. It
          never changes a source or a fact — and{" "}
          <strong className="font-semibold text-ink-soft">
            location is not loyalty
          </strong>
          .
        </p>
      </div>

      {/* The bar */}
      <div className="px-1">
        <div
          className="mb-1 grid grid-cols-3 text-center text-[11px] font-medium uppercase tracking-wider"
          aria-hidden
        >
          <span
            className={cn(
              "rounded-l py-0.5",
              band === "north"
                ? "bg-band-north-soft text-band-north"
                : "text-ink-faint",
            )}
          >
            North
          </span>
          <span
            className={cn(
              "py-0.5",
              band === "border"
                ? "bg-band-border-soft text-band-border"
                : "text-ink-faint",
            )}
          >
            Border &amp; Contested
          </span>
          <span
            className={cn(
              "rounded-r py-0.5",
              band === "south"
                ? "bg-band-south-soft text-band-south"
                : "text-ink-faint",
            )}
          >
            South
          </span>
        </div>
        <label htmlFor={sliderId} className="sr-only">
          Geographic perspective, from North through Border and Contested to
          South
        </label>
        <Slider
          id={sliderId}
          value={[lens.position]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) =>
            onChange({ ...lens, position: v, band: snapBand(v) })
          }
          aria-label="Geographic perspective band"
          aria-valuetext={`${BAND_LABELS[band]} (position ${lens.position} of 100)`}
        />
        <p className="mt-1.5 text-xs text-ink-soft" aria-live="polite">
          Emphasizing sources from communities in the{" "}
          <strong className="font-semibold">{BAND_LABELS[band]}</strong> band.
          Border &amp; Contested covers Kentucky, Missouri, Maryland, Delaware,
          West Virginia, and divided communities such as East Tennessee.
        </p>
      </div>

      {/* Role, alignment, time */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_minmax(220px,0.8fr)]">
        <ChipGroup
          legend="Social position"
          options={SOCIAL_OPTIONS}
          selected={lens.socialPositions}
          labels={SOCIAL_POSITION_LABELS}
          onToggle={toggleSocial}
        />
        <ChipGroup
          legend="Political alignment"
          options={ALIGNMENT_OPTIONS}
          selected={lens.alignments}
          labels={ALIGNMENT_LABELS}
          onToggle={toggleAlignment}
        />
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Date window
          </div>
          <Slider
            value={[lens.yearRange[0], lens.yearRange[1]]}
            min={1840}
            max={1900}
            step={1}
            minStepsBetweenThumbs={0}
            onValueChange={([a, b]) =>
              onChange({ ...lens, yearRange: [Math.min(a, b), Math.max(a, b)], monthRange: undefined })
            }
            aria-label="Research year range"
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            <span className="font-semibold">
              {lens.yearRange[0]}–{lens.yearRange[1]}
            </span>{" "}
            · default 1850–1877; drag outward to widen. Worldview synthesis
            respects this window as its information horizon.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Switch
              id={`${sliderId}-strict`}
              checked={lens.strict}
              onCheckedChange={(strict) => onChange({ ...lens, strict })}
              aria-label="Strict filter: only the selected region, roles, and alignments"
            />
            <label
              htmlFor={`${sliderId}-strict`}
              className="cursor-pointer text-xs text-ink-soft"
            >
              Strict filter{" "}
              <span className="text-ink-faint">
                (only the selected band/roles — otherwise the lens boosts
                rather than hides)
              </span>
            </label>
          </div>
        </div>
      </div>

      <p className="mt-3 border-t border-rule pt-2 text-[11px] leading-relaxed text-ink-faint">
        Alignment weighting uses documented metadata only. A Southern location
        does not imply Confederate loyalty, and a Northern location does not
        imply support for abolition — Kentucky Unionists, Southern Unionists,
        antiwar Northerners, and enslaved people opposing the regime that held
        them are all part of the record. When the voices of enslaved people or
        free Black residents are selected, institutional records{" "}
        <em>about</em> them are shown as evidence but are not presented as
        their voice.
      </p>
    </section>
  );
}
