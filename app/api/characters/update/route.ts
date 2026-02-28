import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const CHARACTERS_PATH = path.join(process.cwd(), "data", "characters.json")

export async function POST(req: Request) {
    try {
        const { characterId, trait, evidence, name, role, state } = await req.json()

        const currentCharacters = JSON.parse(fs.readFileSync(CHARACTERS_PATH, 'utf-8'))

        if (characterId && trait) {
            // Update existing character trait
            const charIndex = currentCharacters.findIndex((c: any) => c.id === characterId)
            if (charIndex !== -1) {
                const char = currentCharacters[charIndex]
                char.current_state = `${char.current_state}\n\n[DETECTED TRAIT]: ${trait}\nEvidence: ${evidence}`
                fs.writeFileSync(CHARACTERS_PATH, JSON.stringify(currentCharacters, null, 2))
                return NextResponse.json({ ok: true })
            }
        } else if (name && role) {
            // Add new character
            const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
            const newChar = {
                id: newId,
                name: name,
                core_want: "Not specified",
                core_flaw: "Not specified",
                current_state: `[NEW CHARACTER]: ${role}\nInitial State: ${state}`
            }
            currentCharacters.push(newChar)
            fs.writeFileSync(CHARACTERS_PATH, JSON.stringify(currentCharacters, null, 2))
            return NextResponse.json({ ok: true, characterId: newId })
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    } catch (error: any) {
        console.error("Character update error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
