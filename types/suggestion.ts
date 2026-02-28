import { z } from "zod";

export const SuggestionTypeEnum = z.enum([
    "replace",
    "insert",
    "delete",
    "rewrite_paragraph",
    "note_only",
]);
export const SuggestionStatusEnum = z.enum(["proposed", "approved", "rejected"]);

export const TextRangeSchema = z
    .object({
        start: z.number().int().min(0),
        end: z.number().int().min(0),
    })
    .refine((r) => r.end >= r.start, { message: "range.end must be >= range.start" });

export const SuggestionSchema = z.object({
    id: z.string().min(1),
    versionId: z.string().min(1),
    type: SuggestionTypeEnum.default("note_only"),
    reason: z.string().min(1),

    beforeText: z.string().optional().default(""),
    afterText: z.string().optional().default(""),

    range: TextRangeSchema.optional(),

    status: SuggestionStatusEnum.default("proposed"),
    userComment: z.string().optional().default(""),
    appliedInVersionId: z.string().optional(),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

export const CutSuggestionSchema = z.object({
    id: z.string().min(1),
    scope: z.enum(["scene", "act"]),
    targetId: z.string().min(1),
    reason: z.string().min(1),
    impact: z.enum(["low", "medium", "high"]),
    status: z.enum(["pending", "approved", "rejected"]),
});

export type CutSuggestion = z.infer<typeof CutSuggestionSchema>;
