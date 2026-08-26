"use client";

import type {
  EvidenceClass,
  ProviderId,
  SearchFilters,
  SourceFormat,
} from "@/lib/types";
import { STATES } from "@/lib/search/aliases";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "loc", label: "Library of Congress" },
  { id: "chronicling", label: "Chronicling America" },
  { id: "nara", label: "National Archives" },
  { id: "valley", label: "Valley of the Shadow" },
  { id: "docsouth", label: "DocSouth" },
  { id: "demo", label: "Reference records" },
];

const FORMATS: { id: SourceFormat; label: string }[] = [
  { id: "letter", label: "Letters" },
  { id: "diary", label: "Diaries" },
  { id: "newspaper", label: "Newspapers" },
  { id: "speech", label: "Speeches" },
  { id: "military-order", label: "Military orders" },
  { id: "official-report", label: "Official reports" },
  { id: "government-document", label: "Government documents" },
  { id: "map", label: "Maps" },
  { id: "photograph", label: "Photographs" },
  { id: "census", label: "Census" },
  { id: "church-record", label: "Church records" },
  { id: "roster", label: "Rosters" },
  { id: "pamphlet", label: "Pamphlets" },
  { id: "broadside", label: "Broadsides" },
  { id: "memoir", label: "Memoirs" },
  { id: "narrative", label: "Narratives" },
];

const EVIDENCE: { id: EvidenceClass; label: string }[] = [
  { id: "contemporaneous", label: "Contemporaneous" },
  { id: "retrospective-firsthand", label: "Retrospective firsthand" },
  { id: "official-record", label: "Official records" },
  { id: "public-argument", label: "Public arguments" },
  { id: "visual", label: "Visual sources" },
  { id: "index-or-finding-aid", label: "Indexes / finding aids" },
  { id: "secondary", label: "Secondary context" },
];

function CheckList<T extends string>({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string }[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {legend}
      </legend>
      <div className="space-y-1">
        {options.map((o) => {
          const checked = selected.includes(o.id);
          const inputId = `filter-${legend}-${o.id}`.replace(/\s+/g, "-");
          return (
            <div key={o.id} className="flex items-center gap-2">
              <Checkbox
                id={inputId}
                checked={checked}
                onCheckedChange={(v) =>
                  onChange(
                    v === true
                      ? [...selected, o.id]
                      : selected.filter((x) => x !== o.id),
                  )
                }
              />
              <label htmlFor={inputId} className="cursor-pointer text-xs text-ink-soft">
                {o.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FiltersPanel({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <Button size="sm" variant="ghost" onClick={() => onChange({})}>
          Clear all
        </Button>
      </div>

      <div>
        <label
          htmlFor="filter-state"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint"
        >
          State
        </label>
        <Select
          value={filters.states?.[0] ?? "any"}
          onValueChange={(v) =>
            onChange({ ...filters, states: v === "any" ? undefined : [v] })
          }
        >
          <SelectTrigger id="filter-state" aria-label="Filter by state">
            <SelectValue placeholder="Any state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any state</SelectItem>
            {STATES.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label
          htmlFor="filter-creator"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint"
        >
          Creator
        </label>
        <Input
          id="filter-creator"
          placeholder="e.g. Lincoln"
          value={filters.creator ?? ""}
          onChange={(e) =>
            onChange({ ...filters, creator: e.target.value || undefined })
          }
        />
      </div>

      <CheckList
        legend="Archive"
        options={PROVIDERS}
        selected={filters.providers ?? []}
        onChange={(providers) =>
          onChange({
            ...filters,
            providers: providers.length ? providers : undefined,
          })
        }
      />

      <CheckList
        legend="Source type"
        options={FORMATS}
        selected={(filters.formats ?? []) as SourceFormat[]}
        onChange={(formats) =>
          onChange({ ...filters, formats: formats.length ? formats : undefined })
        }
      />

      <CheckList
        legend="Evidence class"
        options={EVIDENCE}
        selected={(filters.evidenceClasses ?? []) as EvidenceClass[]}
        onChange={(evidenceClasses) =>
          onChange({
            ...filters,
            evidenceClasses: evidenceClasses.length
              ? evidenceClasses
              : undefined,
          })
        }
      />

      <fieldset>
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Availability
        </legend>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-transcript"
              checked={filters.requireTranscript ?? false}
              onCheckedChange={(v) =>
                onChange({ ...filters, requireTranscript: v === true || undefined })
              }
            />
            <label htmlFor="filter-transcript" className="cursor-pointer text-xs text-ink-soft">
              Has transcript / OCR text
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-scan"
              checked={filters.requireScan ?? false}
              onCheckedChange={(v) =>
                onChange({ ...filters, requireScan: v === true || undefined })
              }
            />
            <label htmlFor="filter-scan" className="cursor-pointer text-xs text-ink-soft">
              Has digitized scan
            </label>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
