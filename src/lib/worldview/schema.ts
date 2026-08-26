/**
 * Zod schemas for structured model output. Any AI response must parse
 * against these; anything that fails is rejected. Claims referencing
 * evidence ids that were not part of the request are dropped.
 */

import { z } from "zod";

export const AiClaimSchema = z.object({
  text: z.string().min(1).max(600),
  evidence: z.array(z.string().min(1)).min(1).max(8),
  kind: z.enum(["knowledge", "stakes", "fears-hopes", "language", "limits"]),
  caveat: z.string().max(400).optional(),
});

export const AiSynthesisSchema = z.object({
  claims: z.array(AiClaimSchema).max(12),
  limitations: z.array(z.string().min(1).max(400)).max(8),
  uncertainty: z.string().max(600).optional(),
});

export type AiSynthesis = z.infer<typeof AiSynthesisSchema>;

export const AiExpansionSchema = z.object({
  expansions: z
    .array(
      z.object({
        term: z.string().min(1).max(80),
        expandedTo: z.array(z.string().min(1).max(80)).min(1).max(6),
        reason: z.string().min(1).max(300),
      }),
    )
    .max(8),
});

export type AiExpansion = z.infer<typeof AiExpansionSchema>;

/**
 * Strip quotation marks from model-generated claim text. Claims are
 * paraphrase-only by policy: exact quotations may only come from stored
 * transcripts, rendered by the UI from SourceRecord data. Straight and
 * curly double quotes are removed so generated text can never masquerade
 * as a quotation.
 */
export function stripGeneratedQuotes(text: string): string {
  return text.replace(/["“”„«»]/g, "");
}
