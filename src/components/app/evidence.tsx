import type { Confidence, EvidenceClass } from "@/lib/types";
import {
  BookOpenText,
  Camera,
  FileClock,
  Landmark,
  ListTree,
  Megaphone,
  ScrollText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const EVIDENCE_DISPLAY: Record<
  EvidenceClass,
  { label: string; icon: React.ReactNode; short: string }
> = {
  contemporaneous: {
    label: "Contemporaneous",
    short: "Written at the time",
    icon: <ScrollText aria-hidden />,
  },
  "retrospective-firsthand": {
    label: "Retrospective firsthand",
    short: "Eyewitness, written later",
    icon: <FileClock aria-hidden />,
  },
  "official-record": {
    label: "Official record",
    short: "Government / military record",
    icon: <Landmark aria-hidden />,
  },
  "public-argument": {
    label: "Public argument",
    short: "Made to persuade",
    icon: <Megaphone aria-hidden />,
  },
  visual: {
    label: "Visual source",
    short: "Photograph, map, print",
    icon: <Camera aria-hidden />,
  },
  "index-or-finding-aid": {
    label: "Index / finding aid",
    short: "Points to originals",
    icon: <ListTree aria-hidden />,
  },
  secondary: {
    label: "Secondary context",
    short: "Later scholarship — not primary",
    icon: <BookOpenText aria-hidden />,
  },
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "high confidence",
  medium: "medium confidence",
  low: "low confidence",
};

export function ClassificationBadge({
  evidenceClass,
  confidence,
}: {
  evidenceClass: EvidenceClass;
  confidence: Confidence;
}) {
  const d = EVIDENCE_DISPLAY[evidenceClass];
  return (
    <Badge
      variant={evidenceClass === "secondary" ? "warn" : "default"}
      title={`${d.label} — ${CONFIDENCE_LABEL[confidence]}`}
    >
      {d.icon}
      <span>{d.label}</span>
      <span className="text-ink-faint">· {confidence}</span>
    </Badge>
  );
}
