import { z } from "zod";
import { ISODateTime } from "./shared";
import { SuggestionSchema } from "./suggestion";

export const ReviewDimensionEnum = z.enum([
    "structure",
    "character_arc",
    "continuity",
    "reader_promises",
    "pacing",
    "style_prose",
    "future_payoff_risk",
    "cut_compress",
    "beta_reaction",
]);

export const ReviewPersonaEnum = z.enum([
    "developmental_editor",
    "line_editor",
    "beta_reader",
    "genre_expert",
    "continuity_auditor",
]);

export const ReviewToneEnum = z.enum(["coach", "editor", "critic", "neutral"]);

export const ReviewPassSchema = z.object({
    reviewId: z.string().min(1),
    actId: z.string().optional(),
    versionId: z.string().min(1),

    dimension: ReviewDimensionEnum,
    persona: ReviewPersonaEnum.default("developmental_editor"),
    tone: ReviewToneEnum.default("editor"),

    notes: z.string().default(""),
    findings: z.array(z.string()).default([]),
    suggestions: z.array(SuggestionSchema).default([]),

    createdAt: ISODateTime,
    characterArcMovements: z.array(z.any()).default([]),
    metrics: z.any().optional(),
    continuityWarnings: z.array(z.any()).default([]),
    outlineStatus: z.enum(["aligned", "diverged", "unknown"]).default("unknown"),
    proposedOutlinePatch: z.any().optional(),
});

export type ReviewPass = z.infer<typeof ReviewPassSchema>;
