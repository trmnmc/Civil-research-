/** Zod validation for every API request body. */

import { z } from "zod";

export const LensSchema = z.object({
  position: z.number().min(0).max(100),
  band: z.enum(["north", "border", "south", "national", "unknown"]),
  socialPositions: z.array(
    z.enum([
      "civilian",
      "enlisted-soldier",
      "officer",
      "political-actor",
      "newspaper-editor",
      "enslaved-person",
      "free-black-resident",
      "woman-home-front",
      "clergy",
      "unknown",
    ]),
  ),
  alignments: z.array(
    z.enum([
      "unionist",
      "abolitionist",
      "antiwar-northern-democrat",
      "divided-uncertain",
      "southern-unionist",
      "confederate-aligned",
      "unknown",
    ]),
  ),
  yearRange: z.tuple([z.number().min(1700).max(2000), z.number().min(1700).max(2000)]),
  monthRange: z.tuple([z.string().regex(/^\d{4}-\d{2}$/), z.string().regex(/^\d{4}-\d{2}$/)]).optional(),
  strict: z.boolean(),
});

export const FiltersSchema = z
  .object({
    providers: z.array(z.enum(["loc", "chronicling", "nara", "valley", "docsouth", "demo"])).optional(),
    formats: z.array(z.string()).optional(),
    states: z.array(z.string().length(2)).optional(),
    evidenceClasses: z.array(z.string()).optional(),
    requireTranscript: z.boolean().optional(),
    requireScan: z.boolean().optional(),
    creator: z.string().max(200).optional(),
    unit: z.string().max(200).optional(),
    alignment: z.array(z.string()).optional(),
  })
  .optional();

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  lens: LensSchema,
  filters: FiltersSchema,
  page: z.number().int().min(1).max(50).optional(),
});

export const WorldviewRequestSchema = z.object({
  recordIds: z.array(z.string().min(1)).min(1).max(60),
  lens: LensSchema,
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const CompareRequestSchema = z.object({
  leftIds: z.array(z.string().min(1)).min(1).max(10),
  rightIds: z.array(z.string().min(1)).min(1).max(10),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const SaveSourceSchema = z.object({
  recordId: z.string().min(1).max(500),
});

export const CreateNoteSchema = z.object({
  savedSourceId: z.number().int().optional(),
  body: z.string().min(1).max(20000),
  quotation: z.string().max(5000).optional(),
});

export const TagSchema = z.object({
  savedSourceId: z.number().int(),
  name: z.string().min(1).max(80),
});

export const CollectionSchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(["collection", "comparison"]).default("collection"),
});

export const CollectionMemberSchema = z.object({
  savedSourceId: z.number().int(),
  side: z.enum(["left", "right"]).optional(),
});
