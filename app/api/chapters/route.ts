import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CHAPTERS_FOLDER = process.env.CHAPTERS_FOLDER || 'C:\\Users\\Client\\Desktop\\book chapter updates\\Book 1'
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

export async function GET() {
  const chapters = Object.entries(CHAPTER_FILES).map(([numStr, filename]) => {
    const num = parseInt(numStr)
    const filePath = path.join(CHAPTERS_FOLDER, filename)
    let wordCount = 0
    let score = null

    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, 'utf-8')
      wordCount = text.split(/\s+/).length
    }

    const possiblePaths = [
      path.join(DECISIONS_FOLDER, `chapter_${String(num).padStart(2, '0')}_decisions.json`),
      path.join(DECISIONS_FOLDER, `ch${num}_decisions.json`)
    ]
    for (const decFile of possiblePaths) {
      if (fs.existsSync(decFile)) {
        try {
          const saved = JSON.parse(fs.readFileSync(decFile, 'utf-8'))
          score = saved?.decisions?.review?.score || saved?.score || null
          break
        } catch (e) {
          console.error(`Error reading decision file for chapter ${num}:`, e)
        }
      }
    }

    return {
      chapterNum: num,
      title: CHAPTER_TITLES[num] || `Chapter ${num}`,
      wordCount,
      score,
      status: score ? 'reviewed' : 'pending'
    }
  })

  return NextResponse.json(chapters)
}
