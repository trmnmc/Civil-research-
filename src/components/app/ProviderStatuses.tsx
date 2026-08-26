"use client";

import type { ProviderStatus } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Clock,
  KeyRound,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PROVIDER_NAMES: Record<string, string> = {
  loc: "Library of Congress",
  chronicling: "Chronicling America",
  nara: "National Archives",
  valley: "Valley of the Shadow",
  docsouth: "DocSouth",
  demo: "Reference records",
};

function statusPresentation(s: ProviderStatus): {
  icon: React.ReactNode;
  variant: "ok" | "warn" | "err" | "default";
  text: string;
} {
  switch (s.status) {
    case "ok":
      return {
        icon: <CheckCircle2 aria-hidden />,
        variant: "ok",
        text: `${s.count} result${s.count === 1 ? "" : "s"}${s.totalAvailable ? ` of ~${s.totalAvailable.toLocaleString()}` : ""}`,
      };
    case "partial":
      return {
        icon: <AlertTriangle aria-hidden />,
        variant: "warn",
        text: `${s.count} (partial)`,
      };
    case "rate-limited":
      return { icon: <Clock aria-hidden />, variant: "warn", text: "rate limited" };
    case "needs-setup":
      return { icon: <KeyRound aria-hidden />, variant: "warn", text: "needs setup" };
    case "loading":
      return {
        icon: <Loader2 className="animate-spin" aria-hidden />,
        variant: "default",
        text: "searching…",
      };
    case "skipped":
      return { icon: <CircleSlash aria-hidden />, variant: "default", text: "off" };
    default:
      return { icon: <CircleSlash aria-hidden />, variant: "err", text: "unavailable" };
  }
}

export function ProviderStatuses({ statuses }: { statuses: ProviderStatus[] }) {
  if (statuses.length === 0) return null;
  return (
    <ul
      aria-label="Archive status"
      className="flex flex-wrap items-center gap-1.5"
    >
      {statuses.map((s) => {
        const p = statusPresentation(s);
        return (
          <li key={s.provider}>
            <Badge variant={p.variant} title={s.detail}>
              {p.icon}
              <span>
                {PROVIDER_NAMES[s.provider] ?? s.provider}: {p.text}
              </span>
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

export function ProviderDetails({ statuses }: { statuses: ProviderStatus[] }) {
  const detailed = statuses.filter(
    (s) => s.detail && s.status !== "ok",
  );
  if (detailed.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {detailed.map((s) => (
        <p
          key={s.provider}
          className="rounded border border-rule bg-paper-sunken px-3 py-2 text-xs leading-relaxed text-ink-soft"
        >
          <strong className="font-semibold">
            {PROVIDER_NAMES[s.provider] ?? s.provider}:
          </strong>{" "}
          {s.detail}
        </p>
      ))}
    </div>
  );
}
