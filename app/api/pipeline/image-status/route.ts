import { NextResponse } from 'next/server'
import { existsSync, readFileSync, readdirSync } from 'fs'
import path from 'path'

// GET /api/pipeline/image-status
// Returns per-chapter, per-act status: scenes extracted, prompts built, images generated
export async function GET() {
  try {
    const pipelineDir = process.env.PIPELINE_FOLDER || path.join(process.cwd(), 'pipeline')
    const actsDir = path.join(pipelineDir, 'acts')
    const scenesFile = path.join(pipelineDir, 'data', 'book1_scenes.json')

    // Find all chapters + acts from act files
    const actFiles = existsSync(actsDir) ? readdirSync(actsDir) : []

    // Build map: chapterKey -> act numbers
    const chapterActs: Record<string, { label: string; acts: number[]; isEpilogue: boolean }> = {}

    for (const f of actFiles) {
      const mCh = f.match(/^Ch(\d+)_Act(\d+)\.txt$/i)
      if (mCh) {
        const ch = parseInt(mCh[1])
        const act = parseInt(mCh[2])
        const key = `ch${ch}`
        if (!chapterActs[key]) chapterActs[key] = { label: `Chapter ${ch}`, acts: [], isEpilogue: false }
        if (!chapterActs[key].acts.includes(act)) chapterActs[key].acts.push(act)
      }
      const mEp = f.match(/^Epilogue_Act(\d+)\.txt$/i)
      if (mEp) {
        const act = parseInt(mEp[1])
        const key = 'epilogue'
        if (!chapterActs[key]) chapterActs[key] = { label: 'Epilogue', acts: [], isEpilogue: true }
        if (!chapterActs[key].acts.includes(act)) chapterActs[key].acts.push(act)
      }
    }

    // Sort acts within each chapter
    for (const key of Object.keys(chapterActs)) {
      chapterActs[key].acts.sort((a, b) => a - b)
    }

    // Load scenes JSON
    let scenes: any[] = []
    if (existsSync(scenesFile)) {
      scenes = JSON.parse(readFileSync(scenesFile, 'utf-8'))
    }

    // Build status for each chapter/act
    const result: {
      key: string
      label: string
      chapterNum: number | null
      isEpilogue: boolean
      acts: {
        act: number
        scenesExtracted: number
        promptsBuilt: number
        imagesGenerated: number
        sceneIds: string[]
      }[]
    }[] = []

    // Sort chapters: ch1, ch2... then epilogue
    const sortedKeys = Object.keys(chapterActs).sort((a, b) => {
      if (a === 'epilogue') return 1
      if (b === 'epilogue') return -1
      return parseInt(a.replace('ch', '')) - parseInt(b.replace('ch', ''))
    })

    for (const key of sortedKeys) {
      const { label, acts, isEpilogue } = chapterActs[key]
      const chapterNum = isEpilogue ? 0 : parseInt(key.replace('ch', ''))

      const actStatuses = acts.map(act => {
        const actScenes = scenes.filter(s =>
          parseInt(s.chapter) === chapterNum && parseInt(s.act) === act
        )
        return {
          act,
          scenesExtracted: actScenes.length,
          promptsBuilt: actScenes.filter(s => s.prompt && s.prompt.length > 0).length,
          imagesGenerated: actScenes.filter(s => s.image_path && existsSync(s.image_path)).length,
          sceneIds: actScenes.map(s => s.id),
        }
      })

      result.push({ key, label, chapterNum, isEpilogue, acts: actStatuses })
    }

    return NextResponse.json({ chapters: result })
  } catch (err: any) {
    console.error('image-status error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
