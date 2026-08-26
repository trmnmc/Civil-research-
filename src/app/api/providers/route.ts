import { NextResponse } from "next/server";
import { ALL_PROVIDERS } from "@/lib/providers/registry";
import { isDemoMode } from "@/lib/env";
import { aiAvailable } from "@/lib/worldview/anthropic";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    demoMode: isDemoMode(),
    aiAvailable: aiAvailable(),
    providers: ALL_PROVIDERS.map((p) => ({
      ...p.info,
      configured: p.isConfigured(),
      setupGuidance: p.isConfigured() ? undefined : p.setupGuidance?.(),
    })),
  });
}
