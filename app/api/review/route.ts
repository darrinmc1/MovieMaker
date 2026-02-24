import { NextResponse } from "next/server"
import { reviewAct } from "@/lib/reviewPipeline"
import acts from "@/data/acts.json"

export async function POST(req: Request) {
    const { actId, intentText, persona } = await req.json()
    const foundAct = (acts as any[]).find((a: any) => a.id === actId)

    if (!foundAct) {
        return NextResponse.json({ error: "Act not found" }, { status: 404 })
    }

    const actWithIntent: any = {
        ...foundAct,
        intent: {
            authorIntentText: intentText || foundAct.intent?.authorIntentText || "Check for general narrative flow, pacing, and continuity.",
            intentTags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }

    const reviews = await reviewAct(actWithIntent, persona)
    return NextResponse.json(reviews)
}
