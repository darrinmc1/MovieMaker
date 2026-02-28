import charactersData from "@/data/characters.json"
import {
    Act,
    Character,
    ReviewPass,
    ContinuityWarning,
    ActMetrics,
    CharacterInAct,
    InlineSuggestion,
    ChapterSynthesis
} from "@/types"

import {
    DEVELOPMENTAL_EDITOR_PROMPT,
    LINE_EDITOR_PROMPT,
    BETA_READER_PROMPT
} from "./prompts"
import { OutlineService } from "./outlineService"
import { migrateActToLatest } from "./migrate"
import { validateActJson } from "./validate"
import { checkContinuity } from "./continuity"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"

// Initialize Gemini inside the function so it reads env late


export async function reviewAct(
    rawAct: any,
    persona: 'developmental_editor' | 'line_editor' | 'beta_reader' | 'genre_expert' | 'continuity_auditor' = 'developmental_editor'
): Promise<ReviewPass[]> {
    const accountedAct = migrateActToLatest(rawAct)
    const validation = validateActJson(accountedAct)

    if (!validation.ok) {
        console.error("Act validation failed during review:", validation.errors)
    }

    const act = (validation.ok ? validation.act : accountedAct) as Act
    const version = act.versions[act.versions.length - 1]
    const text = version?.text || ""

    const warnings = checkContinuity(act, charactersData as Character[])

    // Phase 4: Outline Synchronization
    let outlineStatus: 'aligned' | 'diverged' | 'unknown' = 'unknown'
    let proposedOutlinePatch: any = null
    let outlineFindings: string[] = []

    if (act.outlineRef) {
        const plannedAct = OutlineService.resolveActOutline(act.outlineRef)
        if (plannedAct) {
            const textIncludesBeat = (beat: string) => text.toLowerCase().includes(beat.toLowerCase().split(' ').slice(0, 3).join(' '))
            const missingBeats = plannedAct.keyBeats?.filter((b: { text: string; importance?: string }) => !textIncludesBeat(b.text)) || []

            if (missingBeats.length > 0) {
                outlineStatus = 'diverged'
                outlineFindings.push(`Missing key beats from outline: ${missingBeats.map((b: { text: string }) => b.text).join('; ')}`)
                proposedOutlinePatch = {
                    outlineBefore: plannedAct.summary,
                    outlineAfter: `[REVISED] ${plannedAct.summary} (In-situ: Includes unexpected divergence)`,
                    rationale: "Draft covers the core intent but misses specific structural beats from original plan."
                }
            } else {
                outlineStatus = 'aligned'
            }
        }
    }

    const actContext = `
Act Text to Evaluate:
"""
${text}
"""

Continuity Warnings identified by system: ${warnings.map((w: ContinuityWarning) => w.message).join(' | ')}
Outline Findings identified by system: ${outlineFindings.join(' | ')}
    `

    // Generate strict JSON using Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing from environment variables.");
        // We throw here so the UI receives the error instead of a silent failure with dummy data
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro", // High-capability model for editorial reasoning
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    notes: { type: SchemaType.STRING, description: "General narrative logic pass notes" },
                    findings: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "Editorial findings and structural notes"
                    },
                    metrics: {
                        type: SchemaType.OBJECT,
                        properties: {
                            stakesLevel: { type: SchemaType.INTEGER },
                            intimacyLevel: { type: SchemaType.INTEGER },
                            worldImpactLevel: { type: SchemaType.INTEGER },
                            paceLevel: { type: SchemaType.INTEGER }
                        },
                        required: ["stakesLevel", "intimacyLevel", "worldImpactLevel", "paceLevel"]
                    },
                    suggestions: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                reason: { type: SchemaType.STRING },
                                original: { type: SchemaType.STRING },
                                replacement: { type: SchemaType.STRING }
                            },
                        }
                    },
                    intentAlignment: {
                        type: SchemaType.OBJECT,
                        properties: {
                            achieved: { type: SchemaType.BOOLEAN },
                            feedback: { type: SchemaType.STRING }
                        }
                    },
                    characterArcMovements: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                characterId: { type: SchemaType.STRING },
                                role: { type: SchemaType.STRING },
                                arcMovement: { type: SchemaType.STRING },
                                arcNotes: { type: SchemaType.STRING }
                            }
                        }
                    },
                    newCharactersFound: {
                        type: SchemaType.ARRAY,
                        description: "Characters that are introduced or mentioned in the text that are NOT in the provided Continuity Warnings or existing character list.",
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: { type: SchemaType.STRING, description: "Full name of the character" },
                                role: { type: SchemaType.STRING, description: "Their role or physical description in this scene" },
                                state: { type: SchemaType.STRING, description: "Their current physical/emotional state or action" }
                            },
                        }
                    },
                    outlineStatus: { type: SchemaType.STRING, description: "aligned or diverged" }
                },
                required: ["notes", "findings", "metrics", "suggestions", "intentAlignment", "characterArcMovements", "newCharactersFound", "outlineStatus"]
            }
        }
    })

    const prompt = `
You are a master fiction editor (${persona}). Evaluate the following book chapter snippet.
Identify 1 or 2 specific prose/structural improvements.
You must also identify any NEW characters introduced in the text that are not explicitly mentioned in the Continuity Warnings list.
Return the exact JSON structure requested.

${actContext}
    `

    let aiReviewData: any = {}
    try {
        const result = await model.generateContent(prompt)
        aiReviewData = JSON.parse(result.response.text())
    } catch (e: any) {
        console.error("Gemini Generation Error:", e)
        // Fallback for UI resilience
        const errorMessage = e?.message || "Ensure GEMINI_API_KEY is correctly set in .env.local"
        aiReviewData = {
            notes: "Gemini API error or missing configuration.",
            findings: [errorMessage],
            metrics: { stakesLevel: 1, intimacyLevel: 1, worldImpactLevel: 1, paceLevel: 1 },
            suggestions: [],
            intentAlignment: { achieved: false, feedback: "Error calling AI." },
            characterArcMovements: [],
            newCharactersFound: [],
            outlineStatus: "unknown"
        }
    }

    // Map AI output to our ReviewPass schema
    const formattedSuggestions = (aiReviewData.suggestions || []).map((s: any, idx: number) => ({
        id: `sug-${Date.now()}-${idx}`,
        suggestionId: `sug-${Date.now()}-${idx}`,
        versionId: version.versionId,
        type: 'replace',
        reason: s.reason || "Editor recommendation",
        beforeText: s.original || "",
        afterText: s.replacement || "",
        original: s.original || "",
        replacement: s.replacement || "",
        status: 'proposed',
        userComment: ""
    }))

    // Map new characters to characterTraitClaims so the UI can prompt the user to add them
    const newCharacterClaims = (aiReviewData.newCharactersFound || []).map((nc: any) => ({
        characterId: nc.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        trait: `New Character Detected: ${nc.name} - ${nc.role}`,
        evidence: nc.state,
    }))

    const review: any = {
        reviewId: `rev-${Date.now()}`,
        versionId: version.versionId,
        dimension: persona === 'line_editor' ? 'style_prose' : 'structure',
        persona: persona,
        tone: "editor",
        notes: aiReviewData.notes,
        findings: [...outlineFindings, ...(aiReviewData.findings || [])],
        suggestions: formattedSuggestions,
        intentAlignment: aiReviewData.intentAlignment,
        continuityErrors: warnings.map(w => ({ id: w.warningId, message: w.message })),
        continuityWarnings: warnings,
        createdAt: new Date().toISOString(),
        characterArcMovements: aiReviewData.characterArcMovements,
        characterTraitClaims: newCharacterClaims,
        metrics: aiReviewData.metrics,
        outlineStatus: aiReviewData.outlineStatus === 'diverged' ? 'diverged' : outlineStatus,
        proposedOutlinePatch
    }

    return [review]

}

export function generateActSummary(act: Act) {
    return "An upgraded summary following the high-fidelity schema."
}

export function generateChapterSynthesis(chapterNumber: number, acts: Act[]): ChapterSynthesis {
    const chapterActs = acts.filter(a => a.chapterId.includes(`${chapterNumber}`) && !a.excludedFromSynthesis)

    return {
        chapter: chapterNumber,
        actSummaries: chapterActs.map(a => a.summary?.text || ""),
        unresolvedPromises: ["The origin of the Thornwick crater"],
        continuityWarnings: chapterActs.flatMap(a => (a.continuity?.warnings || []).filter((w: ContinuityWarning) => w.status === 'open').map((w: ContinuityWarning) => w.message)),
        escalationStatus: 'rising'
    }
}