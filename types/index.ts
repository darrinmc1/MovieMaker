export * from "./shared";
export * from "./suggestion";
export * from "./review";
export * from "./act";
export * from "./storyBible";
export * from "./outline";

import { Suggestion } from "./suggestion";
export type InlineSuggestion = Suggestion;

export type SeriesState = {
    books: {
        bookNumber: number
        openPromises: number
        unresolvedWarnings: number
        escalationTrend: 'up' | 'flat' | 'down'
        driftAlerts?: string[]
    }[]
}
export type BetaReaction = {
    personaId: string
    personaName: string
    reaction: string
}
export type ChapterSynthesis = {
    chapter: number
    actSummaries: string[]
    unresolvedPromises: string[]
    continuityWarnings: string[]
    escalationStatus: 'flat' | 'rising' | 'peaked'
}

// Backward compatibility stubs if needed, but the modular files should cover everything.
// export type Character = { ... } // If still in data but not in Zod yet
export type Character = {
    id: string
    name: string
    core_want?: string
    core_flaw?: string
    current_state?: string
    traits?: string[]
}