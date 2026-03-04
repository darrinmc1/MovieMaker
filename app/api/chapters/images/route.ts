import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

// GET /api/chapters/images?chapter=1
// Returns the first scene image per act for a given chapter
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const chapter = parseInt(searchParams.get('chapter') || '1')

  try {
    const pipelineDir = process.env.PIPELINE_FOLDER || path.join(process.cwd(), 'pipeline')
    const scenesFile = path.join(pipelineDir, 'data', 'book1_scenes.json')

    if (!existsSync(scenesFile)) {
      return NextResponse.json({ acts: {} })
    }

    const scenes: any[] = JSON.parse(readFileSync(scenesFile, 'utf-8'))

    // Filter to this chapter, only scenes that have a generated image
    const chapterScenes = scenes.filter(
      (s) => s.chapter === chapter && s.image_path && existsSync(s.image_path)
    )

    // Group by act — take only the FIRST image per act
    const acts: Record<number, { scene_title: string; image_path: string }> = {}
    for (const scene of chapterScenes) {
      const act = scene.act as number
      if (!acts[act]) {
        acts[act] = {
          scene_title: scene.title,
          image_path: scene.image_path,
        }
      }
    }

    return NextResponse.json({ chapter, acts })
  } catch (err: any) {
    console.error('chapters/images error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
