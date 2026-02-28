import { NextResponse } from "next/server"
import { reviewAct } from "@/lib/reviewPipeline"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: Request) {
    const { actId, intentText, persona } = await req.json()

    // Fetch Act from Supabase
    const { data: actData, error: actError } = await supabase
        .from('acts')
        .select('*, versions:act_versions(*)')
        .eq('id', actId)
        .single()

    if (actError || !actData) {
        console.error("Error fetching act:", actError)
        return NextResponse.json({ error: "Act not found in database" }, { status: 404 })
    }

    // Sort versions to get the latest one
    const sortedVersions = (actData.versions || []).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Construct the Act object expected by reviewPipeline
    // Note: reviewPipeline expects 'versions' with 'versionId', 'text' etc.
    // Our DB has snake_case 'version_id', 'created_at'. We need to map it.
    const actForReview = {
        id: actData.id,
        chapterId: actData.chapter_id,
        heading: actData.heading,
        versions: sortedVersions.map((v: any) => ({
            versionId: v.version_id,
            text: v.text,
            createdAt: v.created_at
        })),
        intent: {
            authorIntentText: intentText || "Check for general narrative flow, pacing, and continuity.",
            intentTags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }

    try {
        const reviews = await reviewAct(actForReview, persona)
        return NextResponse.json(reviews)
    } catch (error: any) {
        console.error("Review generation failed:", error)
        return NextResponse.json({ 
            error: "Failed to generate review", 
            details: error.message 
        }, { status: 500 })
    }
}
