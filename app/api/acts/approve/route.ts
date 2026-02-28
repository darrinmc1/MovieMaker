import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import acts from "@/data/acts.json"
import { migrateActToLatest } from "@/lib/migrate"
import { validateActJson } from "@/lib/validate"

const ACTS_PATH = path.join(process.cwd(), "data", "acts.json")

export async function POST(req: Request) {
    try {
        const { actId, suggestionId, userId = "user" } = await req.json()

        // Load fresh data if possible (simulate db or fs read)
        const currentActs = JSON.parse(fs.readFileSync(ACTS_PATH, 'utf-8'))
        const actIndex = currentActs.findIndex((a: any) => a.id === actId)

        if (actIndex === -1) {
            return NextResponse.json({ error: "Act not found" }, { status: 404 })
        }

        const act = currentActs[actIndex]
        const accountedAct = migrateActToLatest(act)

        // Find the review pass containing this suggestion
        let targetSuggestion: any = null
        let targetVersion: any = null

        accountedAct.reviews.forEach((review: any) => {
            const suggestion = review.suggestions.find((s: any) => s.suggestionId === suggestionId)
            if (suggestion) {
                targetSuggestion = suggestion
                targetVersion = accountedAct.versions.find((v: any) => v.versionId === review.versionId)
            }
        })

        if (!targetSuggestion || !targetVersion) {
            return NextResponse.json({ error: "Suggestion or Version not found" }, { status: 404 })
        }

        // 1. Mark suggestion as approved
        targetSuggestion.status = "approved"

        // 2. Apply patch (simplified for this demo: replace before with after)
        const originalText = targetVersion.text
        const newText = originalText.replace(targetSuggestion.beforeText, targetSuggestion.afterText)

        // 3. Create new version
        const newVersionId = `v${accountedAct.versions.length + 1}`
        const newVersion = {
            versionId: newVersionId,
            basedOnVersionId: targetVersion.versionId,
            text: newText,
            createdAt: new Date().toISOString(),
            createdBy: 'ai',
            changeNote: `Applied suggestion: ${targetSuggestion.reason}`
        }

        accountedAct.versions.push(newVersion)
        accountedAct.currentVersionId = newVersionId
        targetSuggestion.appliedInVersionId = newVersionId

        // 4. Persist to FS
        currentActs[actIndex] = accountedAct
        fs.writeFileSync(ACTS_PATH, JSON.stringify(currentActs, null, 2))

        return NextResponse.json({ ok: true, newVersionId })
    } catch (error: any) {
        console.error("Approval error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
