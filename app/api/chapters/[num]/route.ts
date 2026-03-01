import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CHAPTERS_FOLDER = process.env.CHAPTERS_FOLDER || 'C:\\Users\\Client\\Desktop\\book chapter updates'
const DECISIONS_FOLDER = process.env.DECISIONS_FOLDER || 'C:\\Users\\Client\\Desktop\\vbook-pipeline\\review_decisions'

const CHAPTER_FILES: Record<number, string> = {
  1: 'Ch1_revised.txt', 2: 'Ch2_revised.txt', 3: 'Ch3_revised.txt',
  4: 'Ch4_revised.txt', 5: 'Ch5_revised.txt', 6: 'Ch6_revised.txt',
  7: 'Ch7_revised.txt', 8: 'Ch8_revised.txt', 9: 'Ch9_revised.txt',
  10: 'Ch10.txt', 11: 'Ch11.txt', 12: 'Ch12.txt',
}

const CHAPTER_TITLES: Record<number, string> = {
  1: "The Dragon's Last Breath", 2: "Gathering Shadows",
  3: "Nature's Messenger", 4: "The Seven",
  5: "The Undervault", 6: "Stone That Breathes",
  7: "The Sanctum Falls", 8: "Aftermath",
  9: "The Road Between", 10: "The Red Sky",
  11: "Graveside Oath", 12: "Before the Boundary",
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ num: string }> }
) {
  const { num: numStr } = await params
  const num = parseInt(numStr)
  if (isNaN(num) || num < 1 || num > 12) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 })
  }

  const filename = CHAPTER_FILES[num]
  const filePath = path.join(CHAPTERS_FOLDER, filename)
  const exists = fs.existsSync(filePath)

  if (!exists) {
    return NextResponse.json({
      chapterNum: num,
      title: CHAPTER_TITLES[num] || `Chapter ${num}`,
      filename,
      exists: false,
      content: '',
      acts: [],
      wordCount: 0,
      actCount: 0,
      reviewStatus: 'not_reviewed',
      score: null,
      lastReviewed: null,
      suggestions: [],
    })
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const wordCount = content.split(/\s+/).filter(Boolean).length

  // Parse acts — split on Act I:, Act II:, Act III:, Act IV:, Act V: headers
  const actRegex = /^(Act [IVX]+:?.*)$/gm
  const actHeaders: { name: string; index: number }[] = []
  let match
  while ((match = actRegex.exec(content)) !== null) {
    actHeaders.push({ name: match[1].trim(), index: match.index })
  }

  const acts = actHeaders.map((header, i) => {
    const start = header.index + header.name.length
    const end = i + 1 < actHeaders.length ? actHeaders[i + 1].index : content.length
    const body = content.slice(start, end).trim()
    return {
      number: i + 1,
      name: header.name,
      content: body,
      wordCount: body.split(/\s+/).filter(Boolean).length,
    }
  })

  // If no act headers found, treat whole chapter as one block
  if (acts.length === 0) {
    acts.push({ number: 1, name: 'Chapter Content', content, wordCount })
  }

  // Load review decisions if they exist
  let reviewStatus = 'not_reviewed'
  let score: string | null = null
  let lastReviewed: string | null = null
  let suggestions: unknown[] = []

  const decisionFile = path.join(DECISIONS_FOLDER, `ch${num}_decisions.json`)
  if (fs.existsSync(decisionFile)) {
    try {
      const dec = JSON.parse(fs.readFileSync(decisionFile, 'utf-8'))
      reviewStatus = dec.status || 'reviewed'
      score = dec.score || null
      lastReviewed = dec.lastReviewed || null
      suggestions = dec.suggestions || []
    } catch {
      // malformed JSON — treat as not reviewed
    }
  }

  return NextResponse.json({
    chapterNum: num,
    title: CHAPTER_TITLES[num] || `Chapter ${num}`,
    filename,
    exists: true,
    content,
    acts,
    wordCount,
    actCount: acts.length,
    reviewStatus,
    score,
    lastReviewed,
    suggestions,
  })
}
