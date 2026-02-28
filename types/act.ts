import { z } from "zod";
import {
    ISODateTime,
    ArcMovementEnum,
    CharacterRoleEnum,
    PromiseStrengthEnum,
    PromiseStatusEnum,
    ScopeEnum,
    ContinuityCategoryEnum,
    SeverityEnum,
    CanonClaimTypeEnum,
    CanonClaimStatusEnum,
} from "./shared";
import { ReviewPassSchema } from "./review";

export const ActIntentSchema = z.object({
    authorIntentText: z.string().min(1),
    intentTags: z
        .array(
            z.enum([
                "setup",
                "escalation",
                "reveal",
                "reversal",
                "payoff",
                "character_turn",
                "worldbuild",
                "mystery_seed",
                "relationship_shift",
                "breather",
                "cliffhanger",
            ])
        )
        .default([]),
    createdAt: ISODateTime,
    updatedAt: ISODateTime.optional(),
});

export const OutlinePatchSchema = z.object({
    outlineBefore: z.string().optional(),
    outlineAfter: z.string().min(1),
    rationale: z.string().min(1),
});

export const OutlineSyncSchema = z.object({
    status: z.enum(["aligned", "diverged", "unknown"]).default("unknown"),
    notes: z.string().default(""),
    lastCheckedAt: ISODateTime.optional(),
    proposedOutlinePatch: OutlinePatchSchema.optional(),
});

export const ActMetricsSchema = z.object({
    stakesLevel: z.number().int().min(1).max(5),
    intimacyLevel: z.number().int().min(1).max(5),
    worldImpactLevel: z.number().int().min(1).max(5),
    paceLevel: z.number().int().min(1).max(5).optional(),
});

export const CanonClaimSchema = z.object({
    claimType: CanonClaimTypeEnum,
    text: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
    status: CanonClaimStatusEnum.default("proposed"),
    sourceVersionId: z.string().optional(),
});

export const CharacterInActSchema = z.object({
    characterId: z.string().min(1),
    role: CharacterRoleEnum.default("supporting"),
    arcMovement: ArcMovementEnum,
    arcNotes: z.string().default(""),
    claimsIntroduced: z.array(CanonClaimSchema).default([]),
});

export const PromisePointerSchema = z.object({
    bookId: z.string().min(1),
    chapterId: z.string().min(1),
    actId: z.string().min(1),
    versionId: z.string().optional(),
});

export const ReaderPromiseSchema = z.object({
    promiseId: z.string().min(1),
    strength: PromiseStrengthEnum.default("minor"),
    status: PromiseStatusEnum.default("introduced"),
    promiseText: z.string().min(1),
    introducedAt: PromisePointerSchema,
    latestUpdateAt: PromisePointerSchema.optional(),
    relatedEntities: z
        .object({
            characterIds: z.array(z.string()).default([]),
            factionIds: z.array(z.string()).default([]),
            locationIds: z.array(z.string()).default([]),
            relicIds: z.array(z.string()).default([]),
        })
        .default({
            characterIds: [],
            factionIds: [],
            locationIds: [],
            relicIds: [],
        }),
    riskNotes: z.string().default(""),
});

export const ContinuityWarningSchema = z.object({
    warningId: z.string().min(1),
    scope: ScopeEnum.default("act"),
    category: ContinuityCategoryEnum,
    severity: SeverityEnum.default("medium"),
    message: z.string().min(1),
    evidence: z.string().default(""),
    status: z.enum(["open", "ignored", "dismissed"]).default("open"),
    createdAt: ISODateTime,
    updatedAt: ISODateTime.optional(),
});

export const ContinuityBundleSchema = z.object({
    warnings: z.array(ContinuityWarningSchema).default([]),
});

export const ActSummarySchema = z.object({
    text: z.string().default(""),
    isUserEdited: z.boolean().default(false),
    generatedFromVersionId: z.string().optional(),
    updatedAt: ISODateTime.optional(),
});

export const ActVersionMetaSchema = z.object({
    versionId: z.string().min(1),
    basedOnVersionId: z.string().optional(),
    createdAt: ISODateTime,
    createdBy: z.enum(["user", "ai"]).default("user"),
    changeNote: z.string().default(""),
});

export const ActVersionSchema = z
    .object({
        text: z.string(),
    })
    .and(ActVersionMetaSchema.passthrough());

export const OutlineRefSchema = z.object({
    outlineId: z.string().min(1),
    chapterId: z.string().min(1),
    actId: z.string().min(1),
});

export const ActSchema = z
    .object({
        id: z.string().min(1),
        bookId: z.string().min(1),
        chapterId: z.string().min(1),
        heading: z.string().min(1),

        versions: z.array(ActVersionSchema).min(1),
        reviews: z.array(ReviewPassSchema).default([]),
    })
    .passthrough()
    .extend({
        intent: ActIntentSchema.optional(),
        outlineRef: OutlineRefSchema.optional(),
        outlineSync: OutlineSyncSchema.optional(),
        metrics: ActMetricsSchema.optional(),
        charactersInAct: z.array(CharacterInActSchema).default([]),
        promises: z.array(ReaderPromiseSchema).default([]),
        continuity: ContinuityBundleSchema.optional(),
        summary: ActSummarySchema.optional(),
    });

export type Act = z.infer<typeof ActSchema>;
export type OutlineRef = z.infer<typeof OutlineRefSchema>;
export type ActVersion = z.infer<typeof ActVersionSchema>;
export type ActMetrics = z.infer<typeof ActMetricsSchema>;
export type CharacterInAct = z.infer<typeof CharacterInActSchema>;
export type ReaderPromise = z.infer<typeof ReaderPromiseSchema>;
export type ContinuityWarning = z.infer<typeof ContinuityWarningSchema>;
export type CanonClaim = z.infer<typeof CanonClaimSchema>;
