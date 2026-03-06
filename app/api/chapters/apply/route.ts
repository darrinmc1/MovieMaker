// app/api/chapters/apply/route.ts
// Takes accepted suggestions from a review and applies them to the chapter .txt file
// Creates a new versioned file (Ch1_v2.txt) rather than overwriting the original

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

interface Suggestion {
  suggestionId: string
  original: string
  replacement: string
  status?: string
}

interface ApplyRequest {
  chapterNum: number
  suggestions: Suggestion[]   // all suggestions — we filter for accepted ones here
  dryRun?: boolean            // if true, return diff without writing
}

function applyChanges(text: string, suggestions: Suggestion[]): {
  newText: string
  applied: number
  skipped: number
  notFound: string[]
} {
  let newText = text
  let applied = 0
  let skipped = 0
  const notFound: string[] = []

  const accepted = suggestions.filter(s => s.status === 'accepted')

  for (const s of accepted) {
    if (!s.original || !s.replacement) { skipped++; continue }

    // Try exact match first
    if (newText.includes(s.original)) {
      newText = newText.replace(s.original, s.replacement)
      applied++
    } else {
      // Try a fuzzy match — strip extra whitespace and try again
      const normalized = s.original.replace(/\s+/g, ' ').trim()
      const normalizedText = newText.replace(/\s+/g, ' ')
      if (normalizedText.includes(normalized)) {
        // Find the original whitespace-variant and replace it
        const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const fuzzyRegex = new RegExp(escaped.replace(/ /g, '\\s+'))
        if (fuzzyRegex.test(newText)) {
          newText = newText.replace(fuzzyRegex, s.replacement)
          applied++
        } else {
          notFound.push(s.suggestionId)
          skipped++
        }
      } else {
        notFound.push(s.suggestionId)
        skipped++
      }
    }
  }

  return { newText, applied, skipped, notFound }
}

function getNextVersionPath(chapterNum: number): { path: string; version: number; filename: string } {
  const baseName = CHAPTER_FILES[chapterNum].replace(/\.txt$/, '')
  
  // Find existing versions
  let version = 2
  let filename = `${baseName}_v${version}.txt`
  while (fs.existsSync(path.join(CHAPTERS_FOLDER, filename))) {
    version++
    filename = `${baseName}_v${version}.txt`
  }
  
  return {
    path: path.join(CHAPTERS_FOLDER, filename),
    version,
    filename,
  }
}

export async function POST(req: Request) {
  const { chapterNum, suggestions, dryRun = false }: ApplyRequest = await req.json()

  const filename = CHAPTER_FILES[chapterNum]
  if (!filename) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const filePath = path.join(CHAPTERS_FOLDER, filename)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Chapter file not found on disk' }, { status: 404 })
  }

  const originalText = fs.readFileSync(filePath, 'utf-8')
  const { newText, applied, skipped, notFound } = applyChanges(originalText, suggestions)

  if (applied === 0) {
    return NextResponse.json({
      ok: false,
      message: 'No accepted suggestions could be matched in the chapter text.',
      applied: 0,
      skipped,
      notFound,
    })
  }

  if (dryRun) {
    // Return the diff without writing — client shows preview
    return NextResponse.json({
      ok: true,
      dryRun: true,
      applied,
      skipped,
      notFound,
      originalText,
      newText,
      charDiff: newText.length - originalText.length,
    })
  }

  // Write to a new versioned file
  const { path: newPath, version, filename: newFilename } = getNextVersionPath(chapterNum)
  fs.writeFileSync(newPath, newText, 'utf-8')

  return NextResponse.json({
    ok: true,
    applied,
    skipped,
    notFound,
    newFile: newFilename,
    version,
    savedTo: newPath,
    originalWordCount: originalText.split(/\s+/).length,
    newWordCount: newText.split(/\s+/).length,
  })
}
