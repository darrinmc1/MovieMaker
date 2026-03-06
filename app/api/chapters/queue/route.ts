// app/api/chapters/queue/route.ts
// Queues all chapters for review and runs them sequentially.
// Uses Server-Sent Events to stream progress back to the client.
// Each chapter review takes ~40s — full run is ~8 minutes.

import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const CHAPTERS_FOLDER = process.env.CHAPTERS_FOLDER || 'C:\\Users\\Client\\Desktop\\book chapter updates'
const DECISIONS_FOLDER = process.env.DECISIONS_FOLDER || 'C:\\Users\\Client\\Desktop\\vbook-pipeline\\review_decisions'

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

const REVIEW_PROMPT = `You are a senior fiction editor reviewing a chapter of an epic fantasy novel:
"The Concord of Nine — Book 1: The Dragon's Last Breath"

Return ONLY valid JSON with this structure:
{
  "chapterNum": <number>,
  "persona": "developmental_editor",
  "score": <1-10>,
  "scoreRationale": "<one sentence>",
  "overview": "<2-3 paragraph assessment>",
  "strengths": [{"title": "...", "detail": "..."}],
  "weaknesses": [{"title": "...", "detail": "..."}],
  "actBreakdown": [{"actNum": 1, "heading": "...", "score": <1-10>, "summary": "...", "strengths": [], "issues": [], "suggestions": [{"suggestionId": "ch01_s01", "original": "...", "replacement": "...", "reason": "..."}]}],
  "characterMoments": [{"character": "...", "assessment": "...", "arcMovement": "forward|static|regressed"}],
  "continuityFlags": [],
  "proseNotes": "...",
  "topRecommendations": [],
  "book2Setup": "..."
}`

async function reviewChapter(chapterNum: number, text: string): Promise<any> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent(
    `${REVIEW_PROMPT}\n\n## Chapter ${chapterNum} — ${CHAPTER_TITLES[chapterNum]}\n\n${text.slice(0, 28000)}`
  )

  const raw = result.response.text()
  const clean = raw.replace(/^```json\s*/m, '').replace(/```\s*$/m, '').trim()
  return JSON.parse(clean)
}

function saveReview(chapterNum: number, review: any) {
  if (!fs.existsSync(DECISIONS_FOLDER)) {
    fs.mkdirSync(DECISIONS_FOLDER, { recursive: true })
  }
  const file = path.join(DECISIONS_FOLDER, `chapter_${String(chapterNum).padStart(2, '0')}_decisions.json`)
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {}
  fs.writeFileSync(file, JSON.stringify({
    ...existing,
    chapterNum,
    savedAt: new Date().toISOString(),
    decisions: { review },
  }, null, 2))
}

export async function POST(req: Request) {
  const { chapters = 'all', skipExisting = true } = await req.json().catch(() => ({}))

  const chapterNums = chapters === 'all'
    ? Object.keys(CHAPTER_FILES).map(Number)
    : (chapters as number[])

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data, ts: Date.now() })}\n\n`))
      }

      const results: Array<{ chapterNum: number; status: 'done' | 'skipped' | 'error'; score?: number; error?: string }> = []

      send('start', { total: chapterNums.length, message: `Starting batch review of ${chapterNums.length} chapters…` })

      for (let i = 0; i < chapterNums.length; i++) {
        const num = chapterNums[i]
        const filename = CHAPTER_FILES[num]

        send('progress', {
          current: i + 1,
          total: chapterNums.length,
          chapterNum: num,
          chapterTitle: CHAPTER_TITLES[num],
          message: `Reviewing Chapter ${num}: ${CHAPTER_TITLES[num]}`,
        })

        // Check if review already exists
        if (skipExisting) {
          const decFile = path.join(DECISIONS_FOLDER, `chapter_${String(num).padStart(2, '0')}_decisions.json`)
          if (fs.existsSync(decFile)) {
            const saved = JSON.parse(fs.readFileSync(decFile, 'utf-8'))
            if (saved?.decisions?.review?.score) {
              send('skip', { chapterNum: num, score: saved.decisions.review.score, reason: 'Review already exists' })
              results.push({ chapterNum: num, status: 'skipped', score: saved.decisions.review.score })
              continue
            }
          }
        }

        const filePath = path.join(CHAPTERS_FOLDER, filename)
        if (!fs.existsSync(filePath)) {
          send('error', { chapterNum: num, error: 'File not found on disk' })
          results.push({ chapterNum: num, status: 'error', error: 'File not found' })
          continue
        }

        try {
          const text = fs.readFileSync(filePath, 'utf-8')
          const review = await reviewChapter(num, text)
          saveReview(num, review)

          send('chapter_done', {
            chapterNum: num,
            chapterTitle: CHAPTER_TITLES[num],
            score: review.score,
            scoreRationale: review.scoreRationale,
          })
          results.push({ chapterNum: num, status: 'done', score: review.score })

          // Small pause between chapters to avoid rate limits
          if (i < chapterNums.length - 1) {
            await new Promise(r => setTimeout(r, 2000))
          }
        } catch (err: any) {
          send('error', { chapterNum: num, error: err.message })
          results.push({ chapterNum: num, status: 'error', error: err.message })
        }
      }

      const done = results.filter(r => r.status === 'done')
      const avgScore = done.length
        ? (done.reduce((s, r) => s + (r.score || 0), 0) / done.length).toFixed(1)
        : null

      send('complete', {
        message: 'Batch review complete',
        reviewed: done.length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
        avgScore,
        results,
      })

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
