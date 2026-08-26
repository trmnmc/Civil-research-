"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { QueryInterpretation } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

/**
 * Shows the exact query preserved, plus the historical terms and aliases
 * used to expand it — with the reason for each expansion.
 */
export function InterpretationBar({
  interpretation,
}: {
  interpretation: QueryInterpretation;
}) {
  const [open, setOpen] = useState(false);
  const hasDetail =
    interpretation.expansions.length > 0 ||
    interpretation.events.length > 0 ||
    interpretation.units.length > 0;

  return (
    <div className="rounded-md border border-rule bg-paper-sunken px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-ink-soft">
          Searched exactly:{" "}
          <span className="doc-serif font-medium text-ink">
            “{interpretation.originalQuery}”
          </span>
        </span>
        {interpretation.yearRange && (
          <Badge>
            {interpretation.monthRange
              ? `${interpretation.monthRange[0]} – ${interpretation.monthRange[1]}`
              : `${interpretation.yearRange[0]}–${interpretation.yearRange[1]}`}
          </Badge>
        )}
        {interpretation.states.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
        {interpretation.method === "rules+ai" && (
          <Badge variant="accent">
            <Sparkles aria-hidden /> AI-assisted expansion
          </Badge>
        )}
        {hasDetail && (
          <Collapsible open={open} onOpenChange={setOpen} className="contents">
            <CollapsibleTrigger className="ml-auto inline-flex cursor-pointer items-center gap-1 text-xs text-accent hover:underline">
              {open ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
              {interpretation.expansions.length} historical expansion
              {interpretation.expansions.length === 1 ? "" : "s"}
            </CollapsibleTrigger>
            <CollapsibleContent className="w-full">
              <ul className="mt-2 space-y-1 border-t border-rule pt-2 text-xs text-ink-soft">
                {interpretation.expansions.map((e) => (
                  <li key={e.term + e.expandedTo.join("")}>
                    <strong className="font-semibold text-ink">{e.term}</strong>{" "}
                    → {e.expandedTo.join(", ")}{" "}
                    <span className="text-ink-faint">— {e.reason}</span>
                  </li>
                ))}
                {interpretation.events.length > 0 && (
                  <li>
                    <strong className="font-semibold text-ink">
                      Events recognized:
                    </strong>{" "}
                    {interpretation.events.join("; ")}
                  </li>
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
