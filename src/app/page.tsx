"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import type {
  LensState,
  SearchFilters,
  SearchResponse,
  SourceRecord,
  WorldviewSynthesis,
} from "@/lib/types";
import { defaultLens } from "@/lib/search/perspective";
import { fetchWorldview, search } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerspectiveLens } from "@/components/app/PerspectiveLens";
import { InterpretationBar } from "@/components/app/InterpretationBar";
import {
  ProviderDetails,
  ProviderStatuses,
} from "@/components/app/ProviderStatuses";
import { ResultCard } from "@/components/app/ResultCard";
import { FiltersPanel } from "@/components/app/FiltersPanel";
import { WorldviewPanel } from "@/components/app/WorldviewPanel";
import { SourceWorkspace } from "@/components/app/SourceWorkspace";
import { SaveToProjectDialog } from "@/components/app/SaveToProject";

const EXAMPLES = [
  "Kentucky loyalty and secession 1861",
  "How did Northern and Southern newspapers describe emancipation in late 1862?",
  "Civilian accounts written near Gettysburg during July 1863",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [lens, setLens] = useState<LensState>(defaultLens);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [saveRecordId, setSaveRecordId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rightTab, setRightTab] = useState("preview");
  const [worldview, setWorldview] = useState<WorldviewSynthesis | null>(null);
  const [worldviewLoading, setWorldviewLoading] = useState(false);
  const [asOf, setAsOf] = useState<string>("");
  const lastQueryRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recordsById = useMemo(() => {
    const map = new Map<string, SourceRecord>();
    for (const r of response?.results ?? []) map.set(r.record.id, r.record);
    return map;
  }, [response]);

  const runSearch = useCallback(
    async (q: string, l: LensState, f: SearchFilters) => {
      if (!q.trim()) return;
      lastQueryRef.current = q;
      setLoading(true);
      setError(undefined);
      try {
        const res = await search({ query: q, lens: l, filters: f });
        setResponse(res);
        setWorldview(null);
        // Default information horizon: end of the interpreted window.
        const interp = res.interpretation;
        const horizon = interp.monthRange
          ? `${interp.monthRange[1]}-28`
          : interp.yearRange
            ? `${interp.yearRange[1]}-12-31`
            : `${l.yearRange[1]}-12-31`;
        setAsOf((prev) => prev || horizon);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Lens/filter changes re-run the last search (debounced).
  useEffect(() => {
    if (!lastQueryRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(lastQueryRef.current, lens, filters);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [lens, filters, runSearch]);

  const loadWorldview = useCallback(async () => {
    if (!response || response.results.length === 0) return;
    setWorldviewLoading(true);
    try {
      const interp = response.interpretation;
      const horizon =
        asOf ||
        (interp.monthRange
          ? `${interp.monthRange[1]}-28`
          : `${(interp.yearRange ?? lens.yearRange)[1]}-12-31`);
      const { synthesis } = await fetchWorldview({
        recordIds: response.results.slice(0, 40).map((r) => r.record.id),
        lens,
        asOf: horizon,
      });
      setWorldview(synthesis);
    } catch {
      setWorldview(null);
    } finally {
      setWorldviewLoading(false);
    }
  }, [response, lens, asOf]);

  useEffect(() => {
    if (rightTab === "worldview" && response && !worldview && !worldviewLoading) {
      const t = setTimeout(() => loadWorldview(), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightTab, response]);

  const openRecord = (id: string) => {
    setOpenRecordId(id);
    setRightTab("preview");
  };

  return (
    <div className="space-y-4">
      {/* Search field */}
      <form
        role="search"
        aria-label="Primary-source search"
        className="mx-auto max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          setAsOf("");
          runSearch(query, lens, filters);
        }}
      >
        <label htmlFor="main-search" className="sr-only">
          Ask a research question
        </label>
        <div className="flex gap-2">
          <Input
            id="main-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a research question — people, places, units, dates, source types…"
            className="h-12 text-base"
            autoComplete="off"
          />
          <Button type="submit" size="lg" disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <SearchIcon aria-hidden />
            )}
            Search
          </Button>
        </div>
        {!response && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
            <span>Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="cursor-pointer rounded-full border border-rule bg-paper-raised px-2.5 py-1 hover:bg-paper-sunken"
                onClick={() => {
                  setQuery(ex);
                  setAsOf("");
                  runSearch(ex, lens, filters);
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Perspective Lens directly below the search field */}
      <PerspectiveLens lens={lens} onChange={setLens} />

      {error && (
        <p role="alert" className="rounded border border-err/30 bg-err-soft px-3 py-2 text-sm text-err">
          {error}
        </p>
      )}

      {response && (
        <>
          <InterpretationBar interpretation={response.interpretation} />
          <div className="flex flex-wrap items-center gap-2">
            <ProviderStatuses statuses={response.providerStatuses} />
            {response.demoMode && (
              <span className="text-[11px] text-ink-faint">
                Demo mode: searching the bundled verified reference set only.
              </span>
            )}
          </div>
          <ProviderDetails statuses={response.providerStatuses} />
        </>
      )}

      {/* Three-pane research layout */}
      {(response || loading) && (
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(320px,420px)]">
          {/* Filters */}
          <aside className="lg:block">
            <Button
              variant="secondary"
              size="sm"
              className="mb-2 w-full lg:hidden"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal aria-hidden /> Filters
            </Button>
            <div className={`${filtersOpen ? "block" : "hidden"} rounded-lg border border-rule bg-paper-raised p-3 lg:block`}>
              <FiltersPanel filters={filters} onChange={setFilters} />
            </div>
          </aside>

          {/* Results */}
          <section aria-label="Search results" className="min-w-0 space-y-3">
            {loading && (
              <div className="space-y-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse-soft rounded-lg border border-rule bg-paper-sunken"
                  />
                ))}
                <p className="text-center text-xs text-ink-faint">
                  Querying archives…
                </p>
              </div>
            )}
            {!loading && response && response.results.length === 0 && (
              <div className="rounded-lg border border-rule bg-paper-raised p-6 text-center">
                <p className="doc-serif text-lg">No sources matched.</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
                  Try widening the date window, turning off the strict filter,
                  or using period vocabulary (for example,{" "}
                  <em>disunion</em> for secession, <em>contraband</em> for
                  people escaping enslavement). Provider trouble, if any, is
                  reported above — results from healthy archives are never
                  discarded.
                </p>
              </div>
            )}
            {!loading &&
              response?.results.map((ranked) => (
                <ResultCard
                  key={ranked.record.id}
                  ranked={ranked}
                  selected={openRecordId === ranked.record.id}
                  onOpen={openRecord}
                  onSave={(id) => setSaveRecordId(id)}
                />
              ))}
            {!loading && response && response.results.length > 0 && (
              <p className="text-center text-xs text-ink-faint">
                {response.results.length} ranked results ·{" "}
                {response.totalBeforeRanking} collected from archives before
                ranking
              </p>
            )}
          </section>

          {/* Right rail: preview / worldview */}
          <aside className="min-w-0">
            <Tabs value={rightTab} onValueChange={setRightTab}>
              <TabsList className="w-full">
                <TabsTrigger value="preview" className="flex-1">
                  Source preview
                </TabsTrigger>
                <TabsTrigger value="worldview" className="flex-1">
                  Worldview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                {openRecordId ? (
                  <div className="rounded-lg border border-rule bg-paper-raised p-4">
                    <SourceWorkspace recordId={openRecordId} />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-rule-strong bg-paper-raised p-6 text-center text-sm text-ink-faint">
                    Select a result to preview the document, its analysis, and
                    citations here.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="worldview">
                <div className="mb-2 flex items-center gap-2">
                  <label htmlFor="asof" className="text-xs text-ink-soft">
                    Information horizon
                  </label>
                  <Input
                    id="asof"
                    type="date"
                    value={asOf}
                    min="1840-01-01"
                    max="1900-12-31"
                    onChange={(e) => setAsOf(e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                  <Button size="sm" variant="secondary" onClick={loadWorldview} disabled={worldviewLoading || !response}>
                    {worldviewLoading ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : null}
                    Update
                  </Button>
                </div>
                {worldviewLoading && (
                  <div className="h-40 animate-pulse-soft rounded-lg border border-rule bg-paper-sunken" aria-busy="true" />
                )}
                {!worldviewLoading && worldview && (
                  <WorldviewPanel
                    synthesis={worldview}
                    recordsById={recordsById}
                    onOpenRecord={openRecord}
                  />
                )}
                {!worldviewLoading && !worldview && (
                  <div className="rounded-lg border border-dashed border-rule-strong bg-paper-raised p-6 text-center text-sm text-ink-faint">
                    {response
                      ? "Press Update to synthesize what a person in the selected position could know by the chosen date — every claim cited to retrieved sources."
                      : "Run a search first; the worldview panel synthesizes from retrieved sources only."}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      )}

      {/* First-visit explainer */}
      {!response && !loading && (
        <section className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            {
              h: "Primary sources first",
              p: "Results are original records — letters, diaries, newspapers, official reports — each classified as contemporaneous, retrospective, official, argument, or index, with the reasoning shown.",
            },
            {
              h: "The Perspective Lens",
              p: "Slide from North through Border & Contested to South, pick social positions and documented alignments, and set the date window. Ranking shifts; facts never do.",
            },
            {
              h: "Cite and keep",
              p: "Every source carries Chicago/Turabian citations built from verified metadata, and saves into local research projects with notes, tags, and exports.",
            },
          ].map((c) => (
            <div key={c.h} className="rounded-lg border border-rule bg-paper-raised p-4">
              <h2 className="doc-serif text-sm font-semibold">{c.h}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{c.p}</p>
            </div>
          ))}
        </section>
      )}

      <SaveToProjectDialog
        recordId={saveRecordId}
        open={saveRecordId !== null}
        onOpenChange={(open) => !open && setSaveRecordId(null)}
      />
    </div>
  );
}
