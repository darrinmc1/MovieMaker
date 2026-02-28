// Server actions that can be called from client components
import { getNeonClient } from "@/lib/neon/client"

/**
 * Syncs the chapter counts for a novel
 * This is a server action that can be called from client components
 */
export async function syncNovelChapterCounts(novelId: string): Promise<boolean> {
  try {
    const sql = getNeonClient()

    // Count total chapters
    const totalResult = await sql`SELECT COUNT(*) as count FROM chapters WHERE novel_id = ${novelId}`
    const totalCount = parseInt(totalResult[0]?.count || "0", 10)

    // Count published chapters
    const publishedResult = await sql`SELECT COUNT(*) as count FROM chapters WHERE novel_id = ${novelId} AND status = 'published'`
    const publishedCount = parseInt(publishedResult[0]?.count || "0", 10)

    // Update the novel
    await sql`
      UPDATE novels SET
        total_chapters = ${totalCount},
        published_chapters = ${publishedCount},
        updated_at = now()
      WHERE id = ${novelId}
    `

    return true
  } catch (error) {
    console.error("Error syncing chapter counts:", error)
    return false
  }
}
