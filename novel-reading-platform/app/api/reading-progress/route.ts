import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Fetch user's reading progress for all novels or a specific novel
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const novelId = searchParams.get("novelId")

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from("reading_progress")
      .select(
        `
        *,
        novels:novel_id (
          id,
          title,
          cover_image,
          genre
        ),
        chapters:chapter_id (
          id,
          chapter_number,
          title
        )
      `,
      )
      .eq("user_id", user.id)
      .order("last_read_at", { ascending: false })

    // Filter by novel if specified
    if (novelId) {
      query = query.eq("novel_id", novelId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching reading progress:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Update or create reading progress
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { novelId, chapterId, chapterNumber, scrollPosition, progressPercentage } = body

    // Validate required fields
    if (!novelId || !chapterId || chapterNumber === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upsert reading progress (update if exists, insert if not)
    const { data, error } = await supabase
      .from("reading_progress")
      .upsert(
        {
          user_id: user.id,
          novel_id: novelId,
          chapter_id: chapterId,
          chapter_number: chapterNumber,
          scroll_position: scrollPosition || 0,
          progress_percentage: progressPercentage || 0,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,novel_id",
        },
      )
      .select()

    if (error) {
      console.error("[v0] Error updating reading progress:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
