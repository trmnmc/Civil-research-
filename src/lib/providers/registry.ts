import type { ProviderId } from "@/lib/types";
import type { SourceProvider } from "./base";
import { locProvider } from "./loc";
import { chroniclingProvider } from "./chronicling";
import { naraProvider } from "./nara";
import { valleyProvider } from "./valley";
import { docsouthProvider } from "./docsouth";
import { demoProvider } from "./demo";

export const ALL_PROVIDERS: SourceProvider[] = [
  locProvider,
  chroniclingProvider,
  naraProvider,
  valleyProvider,
  docsouthProvider,
  demoProvider,
];

export function providerById(id: ProviderId): SourceProvider | undefined {
  return ALL_PROVIDERS.find((p) => p.info.id === id);
}

/** Providers that never touch the network (safe in demo mode / offline). */
export const LOCAL_PROVIDER_IDS: ProviderId[] = ["demo", "valley", "docsouth"];
