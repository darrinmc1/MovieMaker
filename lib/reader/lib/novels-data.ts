// Server-side utility functions for novel data management
import { getNeonClient } from "@/lib/neon/client"
import type { NovelData } from "@/types/novel"

export async function getNovels(): Promise<NovelData[]> {
  try {
    const sql = getNeonClient()
    const data = await sql`SELECT * FROM novels ORDER BY created_at DESC`

    const novels = data.map((novel: any) => ({
      id: novel.id,
      title: novel.title || "Untitled",
      genre: novel.genre || "Epic Fantasy",
      progress: {
        current: novel.published_chapters || 0,
        total: novel.total_chapters || 0,
      },
      status: novel.status as "In Progress" | "Not Started" | "Complete",
      description: novel.description || undefined,
      coverImage: novel.cover_image || undefined,
      bookNumber: novel.book_number || undefined,
    }))

    return novels.sort((a: NovelData, b: NovelData) => {
      if (a.bookNumber === undefined && b.bookNumber === undefined) return 0
      if (a.bookNumber === undefined) return 1
      if (b.bookNumber === undefined) return -1
      return a.bookNumber - b.bookNumber
    })
  } catch (error) {
    console.error("Error fetching novels:", error)
    return []
  }
}

export async function getNovelById(id: string): Promise<NovelData | undefined> {
  try {
    const sql = getNeonClient()
    const data = await sql`SELECT * FROM novels WHERE id = ${id} LIMIT 1`

    if (!data || data.length === 0) {
      return undefined
    }

    const novel = data[0]
    return {
      id: novel.id,
      title: novel.title || "Untitled",
      genre: novel.genre || "Epic Fantasy",
      progress: {
        current: novel.published_chapters || 0,
        total: novel.total_chapters || 0,
      },
      status: novel.status as "In Progress" | "Not Started" | "Complete",
      description: novel.description || undefined,
      coverImage: novel.cover_image || undefined,
      bookNumber: novel.book_number || undefined,
      author: novel.author || undefined,
      setting: novel.setting || undefined,
      toneAndStyle: novel.tone_and_style || undefined,
      worldRules: novel.world_rules || [],
      act1: novel.act1 || undefined,
      act2: novel.act2 || undefined,
      act3: novel.act3 || undefined,
      themes: novel.themes || undefined,
      outline: novel.outline || undefined,
    }
  } catch (error) {
    console.error("Error fetching novel:", error)
    return undefined
  }
}

export async function updateNovelData(
  id: string,
  updates: {
    title?: string
    author?: string
    genre?: string
    description?: string
    setting?: string
    toneAndStyle?: string
    worldRules?: string[]
    act1?: string
    act2?: string
    act3?: string
    themes?: string
    outline?: string
    book_number?: number
    progress?: { current: number; total: number }
    coverImage?: string
  },
): Promise<boolean> {
  try {
    const sql = getNeonClient()

    await sql`
      UPDATE novels SET
        title = COALESCE(${updates.title}, title),
        author = COALESCE(${updates.author}, author),
        genre = COALESCE(${updates.genre}, genre),
        description = COALESCE(${updates.description}, description),
        setting = COALESCE(${updates.setting}, setting),
        tone_and_style = COALESCE(${updates.toneAndStyle}, tone_and_style),
        world_rules = COALESCE(${updates.worldRules}, world_rules),
        act1 = COALESCE(${updates.act1}, act1),
        act2 = COALESCE(${updates.act2}, act2),
        act3 = COALESCE(${updates.act3}, act3),
        themes = COALESCE(${updates.themes}, themes),
        outline = COALESCE(${updates.outline}, outline),
        book_number = COALESCE(${updates.book_number}, book_number),
        total_chapters = COALESCE(${updates.progress?.total}, total_chapters),
        cover_image = COALESCE(${updates.coverImage}, cover_image),
        updated_at = now()
      WHERE id = ${id}
    `

    return true
  } catch (error) {
    console.error("Error updating novel:", error)
    return false
  }
}
