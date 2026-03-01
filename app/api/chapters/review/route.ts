import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CHAPTERS_FOLDER  = process.env.CHAPTERS_FOLDER  || 'C:\\Users\\Client\\Desktop\\book chapter updates\\Book 1'
const DECISIONS_FOLDER = process.env.DECISIONS_FOLDER || 'C:\\Users\\Client\\Desktop\\MovieMaker\\pipeline\\review_decisions'
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY   || ''

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

async function callGemini(prompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} — ${err}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function POST(req: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (log: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log })}\n\n`))
      }
      const sendDone = () => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      }

      try {
        const { chapterNum } = await req.json()
        const num = parseInt(chapterNum)

        send(`Loading Chapter ${num}…`)

        const filename = CHAPTER_FILES[num]
        if (!filename) throw new Error(`No file mapping for chapter ${num}`)

        const filePath = path.join(CHAPTERS_FOLDER, filename)
        if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filename}`)

        const content = fs.readFileSync(filePath, 'utf-8')
        const wordCount = content.split(/\s+/).filter(Boolean).length

        send(`Loaded ${filename} — ${wordCount.toLocaleString()} words`)
        send(`Sending to Gemini Flash for editorial review…`)

        // Truncate very long chapters to stay within token limits
        const maxChars = 60000
        const truncated = content.length > maxChars
          ? content.slice(0, maxChars) + '\n\n[Chapter truncated for review — first 60k chars]'
          : content

        const prompt = `You are an expert fiction editor reviewing a chapter of a fantasy novel called "The Concord of Nine: The Dragon's Last Breath".

Chapter ${num}: ${CHAPTER_TITLES[num]}

Your task: Perform a careful editorial review and return ONLY valid JSON — no markdown, no explanation, no code fences.

Return this exact structure:
{
  "score": "7.5",
  "status": "reviewed",
  "summary": "One paragraph editorial summary of the chapter's strengths and weaknesses",
  "suggestions": [
    {
      "id": "s1",
      "actNumber": 1,
      "type": "rephrase",
      "original": "exact text from the chapter (keep under 200 chars)",
      "suggested": "your improved version",
      "reason": "why this change improves the chapter"
    }
  ]
}

Rules:
- score is a string between "1.0" and "10.0"
- type is one of: rewrite, insert, delete, rephrase
- Provide 5-10 specific, actionable suggestions
- Focus on: pacing, character voice consistency, show-don't-tell, dialogue naturalism, scene transitions
- Keep original and suggested under 300 characters each
- Make surgical edits only — preserve plot events and character decisions

CHAPTER TEXT:
${truncated}`

        const raw = await callGemini(prompt)
        send(`Received Gemini response — parsing…`)

        // Strip markdown fences if present
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()

        let parsed: {
          score: string
          status: string
          summary: string
          suggestions: Array<{
            id: string
            actNumber: number
            type: string
            original: string
            suggested: string
            reason: string
            accepted: null
          }>
        }

        try {
          parsed = JSON.parse(cleaned)
        } catch {
          throw new Error(`Gemini returned invalid JSON. Raw: ${raw.slice(0, 200)}`)
        }

        // Add accepted: null to all suggestions
        const suggestions = (parsed.suggestions || []).map((s, i) => ({
          ...s,
          id: s.id || `s${i + 1}`,
          accepted: null,
        }))

        send(`Score: ${parsed.score}/10 — ${suggestions.length} suggestions generated`)

        // Save decisions file
        if (!fs.existsSync(DECISIONS_FOLDER)) {
          fs.mkdirSync(DECISIONS_FOLDER, { recursive: true })
        }

        const decisionFile = path.join(DECISIONS_FOLDER, `ch${num}_decisions.json`)
        const decisionData = {
          chapterNum: num,
          title: CHAPTER_TITLES[num],
          score: parsed.score,
          status: 'reviewed',
          summary: parsed.summary,
          lastReviewed: new Date().toISOString(),
          suggestions,
        }
        fs.writeFileSync(decisionFile, JSON.stringify(decisionData, null, 2), 'utf-8')

        send(`✓ Saved review to ${path.basename(decisionFile)}`)
        sendDone()

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ log: `❌ Error: ${msg}` })}\n\n`)
        )
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        )
      } finally {
        controller.close()
      }
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
