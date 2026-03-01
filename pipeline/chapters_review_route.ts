// app/api/chapters/review/route.ts
// Runs Gemini review on a full chapter and returns structured feedback

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'

const CHAPTERS_FOLDER = process.env.CHAPTERS_FOLDER || 'C:\\Users\\Client\\Desktop\\book chapter updates'

const CHAPTER_FILES: Record<number, string> = {
  1: 'Ch1_revised.txt',  2: 'Ch2_revised.txt',  3: 'Ch3_revised.txt',
  4: 'Ch4_revised.txt',  5: 'Ch5_revised.txt',  6: 'Ch6_revised.txt',
  7: 'Ch7_revised.txt',  8: 'Ch8_revised.txt',  9: 'Ch9_revised.txt',
  10: 'Ch10.txt',        11: 'Ch11.txt',         12: 'Ch12.txt',
}

const REVIEW_SYSTEM_PROMPT = `You are a senior fiction editor reviewing a chapter of an epic fantasy novel:
"The Concord of Nine — Book 1: The Dragon's Last Breath"

The story follows Caelin Thorne, an exiled fire sorcerer bonded to a dragon's scale who must gather
eight other relic bearers to prevent the Seal waking beneath Depthspire.
Companions: Vex (half-elf rogue), Thornik (dwarf artificer), Serana (paladin),
Elowen (druid), Durgan (shadow-walker), Nyxara (warlock), Aldric (veteran soldier).

You must return ONLY valid JSON — no preamble, no markdown, no explanation outside the JSON.`

const REVIEW_PERSONAS: Record<string, string> = {
  developmental_editor: `Review as a developmental editor. Focus on: story structure, character arc movement, 
pacing, scene utility, whether every act earns its place, and the chapter's contribution to the overall book arc.`,
  
  line_editor: `Review as a line editor. Focus on: sentence-level prose quality, dialogue authenticity, 
word choice, rhythm, showing vs telling, and specific lines that could be stronger.`,
  
  beta_reader: `Review as an engaged beta reader. Focus on: emotional engagement, confusion points,
what excited you, what slowed you down, and honest reader reactions to each character.`,
}

export async function POST(req: Request) {
  const { chapterNum, persona = 'developmental_editor' } = await req.json()

  const filename = CHAPTER_FILES[chapterNum]
  if (!filename) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const filePath = path.join(CHAPTERS_FOLDER, filename)
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })

  const chapterText = fs.readFileSync(filePath, 'utf-8')

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const personaInstructions = REVIEW_PERSONAS[persona] || REVIEW_PERSONAS.developmental_editor

  const prompt = `${REVIEW_SYSTEM_PROMPT}

${personaInstructions}

## Chapter ${chapterNum} Text
${chapterText.slice(0, 28000)}

Return this exact JSON structure:
{
  "chapterNum": ${chapterNum},
  "persona": "${persona}",
  "score": <number 1-10>,
  "scoreRationale": "<one sentence explaining the score>",
  "overview": "<2-3 paragraph overall assessment>",
  "strengths": [
    { "title": "<short title>", "detail": "<specific observation with line reference if possible>" }
  ],
  "weaknesses": [
    { "title": "<short title>", "detail": "<specific observation with suggested fix>" }
  ],
  "actBreakdown": [
    {
      "actNum": <number>,
      "heading": "<act heading>",
      "score": <number 1-10>,
      "summary": "<what this act does>",
      "strengths": ["<specific strength>"],
      "issues": ["<specific issue>"],
      "suggestions": [
        {
          "suggestionId": "<unique id e.g. ch01_s01>",
          "original": "<exact text from the chapter to change — keep under 100 words>",
          "replacement": "<suggested replacement text>",
          "reason": "<why this change improves the chapter>"
        }
      ]
    }
  ],
  "characterMoments": [
    { "character": "<name>", "assessment": "<how they performed in this chapter>", "arcMovement": "forward|static|regressed" }
  ],
  "continuityFlags": ["<any inconsistencies or contradictions>"],
  "proseNotes": "<observations on sentence-level writing style>",
  "topRecommendations": ["<the 3-5 most impactful changes to make, ranked>"],
  "book2Setup": "<what threads this chapter plants or needs to plant for Book 2>"
}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    
    // Strip markdown fences if present
    const clean = raw.replace(/^```json\s*/m, '').replace(/```\s*$/m, '').trim()
    const review = JSON.parse(clean)
    
    return NextResponse.json(review)
  } catch (err: any) {
    console.error('Review failed:', err)
    return NextResponse.json({ error: 'Review generation failed', details: err.message }, { status: 500 })
  }
}
