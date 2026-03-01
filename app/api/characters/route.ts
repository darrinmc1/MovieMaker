// app/api/characters/route.ts
// Reads character profiles from the local .txt files — no Supabase dependency

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const PROFILES_FOLDER = process.env.PROFILES_FOLDER || 'C:\\Users\\Client\\Desktop\\vbook-pipeline'

// Map character names to their profile files
const PROFILE_FILES: Record<string, string> = {
  'Caelin Thorne':          '__CAELIN_THORNE.txt',
  'Virella "Vex" Sunshadow': '___VIRELLA__VEX__SUNSHADOW_-_COMPLETE_PROFILE.txt',
  'Thornik Bramblebrew':    '___THORNIK_BRAMBLEBREW_-_COMPLETE_PROFILE.txt',
  'Serana Valeblade':       '___SERANA_VALEBLADE_-_COMPLETE_PROFILE.txt',
  'Elowen Greenbloom':      '__ELOWEN_GREENBLOOM_-_COMPLETE_PROFILE.txt',
  'Durgan Nightcloak':      '___DURGAN_NIGHTCLOAK_-_COMPLETE_PROFILE.txt',
  'Nyxara Veilthorn':       '__NYXARA_VEILTHORN_-_COMPLETE_PROFILE.txt',
}

// Book 2 characters (shorter profiles, defined inline)
const BOOK2_CHARACTERS = [
  {
    name: 'Jasper Coinblight',
    book: 2,
    role: 'Relic Hunter / Con Artist / Duelist',
    age: 32,
    race: 'Human',
    appearance: 'Devastatingly handsome sharp cheekbones, roguish smile, dark hair with silver streak, amber eyes, deep burgundy leather armor with gold clasps, rapier at hip, multiple rings',
    personality: 'Charming, self-interested, surprisingly honourable once he commits. Expert at finding legal loopholes. Tests at Depthspire: does he abandon the party for treasure?',
    arcGoal: 'Prove that skill and wit matter as much as destiny — earn a place among people who were chosen rather than hired',
    book2Role: 'Finds the legal loophole that lets the party challenge the Warden Prime. Critical to escaping Depthspire.',
  },
  {
    name: 'Puddle Thrym',
    book: 2,
    role: 'Half-Orc Ratcatcher / Underground Guide',
    age: null,
    race: 'Half-Orc',
    appearance: 'Practical scarred build, built for underground survival, always surrounded by rats, communicates via squeaks and whistles rather than speech',
    personality: 'Raised by rats in the sewers. Underground network spans kingdoms. Deeply loyal to those who treat him with dignity.',
    arcGoal: 'Find a place in the world above-ground — be needed, not just useful',
    book2Role: 'His rats map the Depthspire escape routes. Guides the party out when all paths are blocked. Critical to the climax.',
  },
]

function parseProfile(text: string, name: string) {
  // Extract sections from the profile text
  const sections: Record<string, string> = {}

  // Common section headers in the profile files
  const sectionPatterns = [
    'CORE IDENTITY', 'PHYSICAL APPEARANCE', 'PERSONALITY', 'BACKGROUND',
    'ABILITIES', 'RELATIONSHIPS', 'CHARACTER ARC', 'VOICE', 'MOTIVATION',
    'CORE WANT', 'CORE FLAW', 'CURRENT STATE', 'BOOK 1 ARC', 'BOOK 2 ARC',
  ]

  for (const section of sectionPatterns) {
    const regex = new RegExp(`${section}[:\\s]*\\n([\\s\\S]*?)(?=\\n[A-Z ]{3,}[:\\s]*\\n|$)`, 'i')
    const match = text.match(regex)
    if (match) {
      sections[section.toLowerCase().replace(/\s+/g, '_')] = match[1].trim()
    }
  }

  // Try to extract a brief summary — first non-empty paragraph
  const lines = text.split('\n').filter(l => l.trim() && !l.match(/^[=\-#]+$/))
  const summary = lines.slice(0, 3).join(' ').slice(0, 300)

  return {
    name,
    book: 1,
    rawText: text,
    summary,
    sections,
    wordCount: text.split(/\s+/).length,
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const nameParam = url.searchParams.get('name')

  const characters = []

  // Load Book 1 characters from files
  for (const [name, filename] of Object.entries(PROFILE_FILES)) {
    // Check multiple possible locations
    const possiblePaths = [
      path.join(PROFILES_FOLDER, filename),
      path.join('C:\\Users\\Client\\Desktop\\MovieMaker', filename),
      path.join(process.cwd(), filename),
    ]

    let loaded = false
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, 'utf-8')
        const parsed = parseProfile(text, name)
        if (!nameParam || nameParam === name) {
          characters.push(parsed)
        }
        loaded = true
        break
      }
    }

    if (!loaded) {
      // Return a stub so the UI shows something
      characters.push({
        name,
        book: 1,
        rawText: null,
        summary: 'Profile file not found — check PROFILES_FOLDER in .env.local',
        sections: {},
        wordCount: 0,
        missing: true,
      })
    }
  }

  // Add Book 2 characters
  for (const c of BOOK2_CHARACTERS) {
    if (!nameParam || nameParam === c.name) {
      characters.push(c)
    }
  }

  return NextResponse.json(characters)
}
