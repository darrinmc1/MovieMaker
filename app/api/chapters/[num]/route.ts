// app/api/chapters/[num]/route.ts
// Returns full text of a chapter, split into acts

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

function splitIntoActs(text: string, chapterNum: number) {
  const positions: Array<{ index: number, actNum: number, heading: string }> = []
  let actNum = 0
  const fullRegex = /^Act ([IVX]+):(.*)/gm
  let match
  while ((match = fullRegex.exec(text)) !== null) {
    actNum++
    positions.push({
      index: match.index,
      actNum,
      heading: `Act ${match[1]}: ${match[2].trim()}`
    })
  }

  if (positions.length === 0) {
    return [{ actNum: 1, heading: `Chapter ${chapterNum}`, text: text.trim() }]
  }

  return positions.map((pos, i) => {
    const start = pos.index
    const end = i + 1 < positions.length ? positions[i + 1].index : text.length
    return {
      actNum: pos.actNum,
      heading: pos.heading,
      text: text.slice(start, end).trim(),
    }
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ num: string }> }
) {
  const { num } = await params
  const chapterNum = parseInt(num)
  const filename = CHAPTER_FILES[chapterNum]
  if (!filename) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const filePath = path.join(CHAPTERS_FOLDER, filename)
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })

  const fullText = fs.readFileSync(filePath, 'utf-8')
  const acts = splitIntoActs(fullText, chapterNum)

  return NextResponse.json({ chapterNum, fullText, acts, wordCount: fullText.split(/\s+/).length, actCount: acts.length })
}
