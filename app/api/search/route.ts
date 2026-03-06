// app/api/search/route.ts
// Full-text search across all chapter files
// Returns matches with surrounding context (like grep -C 2)

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CHAPTERS_FOLDER = process.env.CHAPTERS_FOLDER || 'C:\\Users\\Client\\Desktop\\book chapter updates'

const CHAPTER_FILES: Record<number, string> = {
  1: 'Ch1_revised.txt',  2: 'Ch2_revised.txt',  3: 'Ch3_revised.txt',
  4: 'Ch4_revised.txt',  5: 'Ch5_revised.txt',  6: 'Ch6_revised.txt',
  7: 'Ch7_revised.txt',  8: 'Ch8_revised.txt',  9: 'Ch9_revised.txt',
  10: 'Ch10.txt',        11: 'Ch11.txt',         12: 'Ch12.txt',
}

const CHAPTER_TITLES: Record<number, string> = {
  1:  "The Dragon's Last Breath",   2: "Gathering Shadows",
  3:  "Nature's Messenger",         4: "The Seven",
  5:  "The Undervault",             6: "Stone That Breathes",
  7:  "The Sanctum Falls",          8: "Aftermath",
  9:  "The Road Between",          10: "The Red Sky",
  11: "Graveside Oath",            12: "Before the Boundary",
}

interface SearchMatch {
  chapterNum: number
  chapterTitle: string
  lineNumber: number
  line: string
  context: string       // surrounding 2 lines
  matchStart: number    // index in line where match starts
  matchEnd: number
}

export async function GET(req: Request) {
  const url    = new URL(req.url)
  const query  = url.searchParams.get('q')?.trim()
  const limit  = parseInt(url.searchParams.get('limit') || '50')

  if (!query || query.length < 2) {
    return NextResponse.json({ matches: [], total: 0, query })
  }

  const matches: SearchMatch[] = []
  const queryLower = query.toLowerCase()

  for (const [numStr, filename] of Object.entries(CHAPTER_FILES)) {
    const num      = parseInt(numStr)
    const filePath = path.join(CHAPTERS_FOLDER, filename)
    if (!fs.existsSync(filePath)) continue

    const text  = fs.readFileSync(filePath, 'utf-8')
    const lines = text.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase()
      const idx = lineLower.indexOf(queryLower)
      if (idx === -1) continue

      // Build context: 1 line before + match line + 1 line after
      const contextLines = [
        i > 0 ? lines[i - 1].trim() : '',
        lines[i].trim(),
        i < lines.length - 1 ? lines[i + 1].trim() : '',
      ].filter(Boolean)

      matches.push({
        chapterNum:   num,
        chapterTitle: CHAPTER_TITLES[num],
        lineNumber:   i + 1,
        line:         lines[i],
        context:      contextLines.join(' … '),
        matchStart:   idx,
        matchEnd:     idx + query.length,
      })

      if (matches.length >= limit) break
    }

    if (matches.length >= limit) break
  }

  // Group by chapter for easier rendering
  const byChapter = matches.reduce((acc, m) => {
    if (!acc[m.chapterNum]) acc[m.chapterNum] = []
    acc[m.chapterNum].push(m)
    return acc
  }, {} as Record<number, SearchMatch[]>)

  return NextResponse.json({
    matches,
    byChapter,
    total:    matches.length,
    query,
    truncated: matches.length >= limit,
  })
}
