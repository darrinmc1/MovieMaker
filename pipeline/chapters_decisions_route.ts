// app/api/chapters/decisions/route.ts
// Saves review decisions (accepted/rejected suggestions + user notes) to a local JSON file

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DECISIONS_FOLDER = process.env.DECISIONS_FOLDER || 'C:\\Users\\Client\\Desktop\\vbook-pipeline\\review_decisions'

export async function POST(req: Request) {
  const { chapterNum, decisions } = await req.json()

  try {
    if (!fs.existsSync(DECISIONS_FOLDER)) {
      fs.mkdirSync(DECISIONS_FOLDER, { recursive: true })
    }

    const filename = path.join(DECISIONS_FOLDER, `chapter_${String(chapterNum).padStart(2, '0')}_decisions.json`)
    const data = {
      chapterNum,
      savedAt: new Date().toISOString(),
      decisions,
    }
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, savedTo: filename })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const chapterNum = url.searchParams.get('chapter')
  if (!chapterNum) return NextResponse.json({ error: 'Missing chapter param' }, { status: 400 })

  const filename = path.join(DECISIONS_FOLDER, `chapter_${String(chapterNum).padStart(2, '0')}_decisions.json`)
  if (!fs.existsSync(filename)) return NextResponse.json(null)

  const data = JSON.parse(fs.readFileSync(filename, 'utf-8'))
  return NextResponse.json(data)
}
