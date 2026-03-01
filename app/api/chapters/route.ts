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
  1: "The Dragon's Last Breath", 2: "Gathering Shadows",
  3: "Nature's Messenger",       4: "The Seven",
  5: "The Undervault",           6: "Stone That Breathes",
  7: "The Sanctum Falls",        8: "Aftermath",
  9: "The Road Between",        10: "The Red Sky",
  11: "Graveside Oath",         12: "Before the Boundary",
}

export async function GET() {
  const chapters = Object.keys(CHAPTER_FILES).map(numStr => {
    const num = parseInt(numStr)
    const filename = CHAPTER_FILES[num]
    const filePath = path.join(CHAPTERS_FOLDER, filename)
    const exists = fs.existsSync(filePath)
    
    let wordCount = 0
    let actCount = 0
    if (exists) {
      const text = fs.readFileSync(filePath, 'utf-8')
      wordCount = text.split(/\s+/).length
      const actMatches = text.match(/^Act [IVX]+:/gm)
      actCount = actMatches ? actMatches.length : 1
    }

    // Mocking review status and score for now as they come from decisions.json usually
    // In a real scenario, this would read from DECISIONS_FOLDER
    return {
      chapterNum: num,
      title: CHAPTER_TITLES[num] || `Chapter ${num}`,
      filename,
      exists,
      actCount,
      wordCount,
      reviewStatus: 'not_reviewed', // Default
      lastReviewed: null,
      score: null
    }
  })

  return NextResponse.json(chapters)
}
