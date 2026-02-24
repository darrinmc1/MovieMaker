import { z } from "zod";

export const ISODateTime = z.string().datetime();

export const ScopeEnum = z.enum(["act", "chapter", "book", "series"]);
export const SeverityEnum = z.enum(["low", "medium", "high", "critical"]);

export const ArcMovementEnum = z.enum(["forward", "regressed", "static", "masked"]);
export const CharacterRoleEnum = z.enum(["protagonist", "supporting", "antagonist", "minor", "cameo"]);

export const PromiseStrengthEnum = z.enum(["minor", "structural", "series"]);
export const PromiseStatusEnum = z.enum([
    "introduced",
    "escalated",
    "at_risk",
    "paid_off",
    "broken",
    "dormant",
]);

export const ContinuityCategoryEnum = z.enum([
    "character",
    "timeline",
    "magic",
    "worldbuilding",
    "promise",
    "logic",
    "power_scale",
]);

export const CanonClaimTypeEnum = z.enum([
    "trait",
    "skill",
    "relationship",
    "backstory",
    "capability",
    "weakness",
    "magic_rule",
    "timeline_fact",
]);
export const CanonClaimStatusEnum = z.enum(["proposed", "approved", "rejected"]);
