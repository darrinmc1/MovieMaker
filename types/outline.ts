import { z } from "zod";
import { ISODateTime, ArcMovementEnum, ContinuityCategoryEnum, PromiseStrengthEnum, PromiseStatusEnum } from "./shared";

export const BeatSchema = z.object({
    text: z.string().min(1),
    importance: z.enum(["minor", "major", "critical"]).default("major"),
});

export const CharacterWorkBeatSchema = z.object({
    characterId: z.string().min(1),
    text: z.string().min(1),
    arcIntent: z.enum(["forward", "regressed", "static", "masked", "setup"]).default("setup"),
});

export const ContinuityHookSchema = z.object({
    category: ContinuityCategoryEnum,
    text: z.string().min(1),
});

export const OutlinePromiseStubSchema = z.object({
    promiseId: z.string().min(1),
    strength: PromiseStrengthEnum.default("minor"),
    expectedStatus: PromiseStatusEnum.default("introduced"),
    text: z.string().min(1),
});

export const ActOutlineSchema = z.object({
    actId: z.string().min(1),
    actNumber: z.number().int().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    keyBeats: z.array(BeatSchema).default([]),
    characterWork: z.array(CharacterWorkBeatSchema).default([]),
    continuityHooks: z.array(ContinuityHookSchema).default([]),
    promiseHooks: z.array(OutlinePromiseStubSchema).default([]),
    notes: z.string().default(""),
    tags: z.array(z.string()).default([]),
});

export const ChapterOutlineSchema = z.object({
    chapterId: z.string().min(1),
    chapterNumber: z.number().int().min(1),
    title: z.string().min(1),
    wordCountActual: z.number().int().min(0).default(0),
    wordCountTarget: z.number().int().min(0).default(0),
    logline: z.string().default(""),
    acts: z.array(ActOutlineSchema).min(1),
    chapterPromises: z.array(OutlinePromiseStubSchema).default([]),
    chapterNotes: z.string().default(""),
    tags: z.array(z.string()).default([]),
});

export const EpilogueSectionSchema = z.object({
    sectionId: z.string().min(1),
    label: z.string().min(1),
    summary: z.string().min(1),
    keyBeat: BeatSchema.optional(),
});

export const BookOutlineSchema = z.object({
    outlineId: z.string().min(1),
    seriesId: z.string().min(1),
    bookId: z.string().min(1),
    bookTitle: z.string().min(1),
    version: z.number().int().min(1).default(1),
    updatedAt: ISODateTime.optional(),
    chapters: z.array(ChapterOutlineSchema).min(1),
    epilogue: z.array(EpilogueSectionSchema).default([]),
    globalNotes: z.string().default(""),
});

export type BookOutline = z.infer<typeof BookOutlineSchema>;
export type ChapterOutline = z.infer<typeof ChapterOutlineSchema>;
export type ActOutline = z.infer<typeof ActOutlineSchema>;
export type Beat = z.infer<typeof BeatSchema>;
export type CharacterWorkBeat = z.infer<typeof CharacterWorkBeatSchema>;
export type ContinuityHook = z.infer<typeof ContinuityHookSchema>;
export type OutlinePromiseStub = z.infer<typeof OutlinePromiseStubSchema>;
export type EpilogueSection = z.infer<typeof EpilogueSectionSchema>;
