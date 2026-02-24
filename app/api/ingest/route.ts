import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const docType = formData.get('type') as string // 'act' or 'character'

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = file.name
        let rawText = ""

        if (filename.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer })
            rawText = result.value
        } else if (filename.endsWith('.txt')) {
            rawText = buffer.toString('utf-8')
        } else {
            return NextResponse.json({ error: "Unsupported file type. Please upload .txt or .docx" }, { status: 400 })
        }

        const dataPath = path.join(process.cwd(), 'data')

        if (docType === 'character') {
            const charsPath = path.join(dataPath, 'characters.json')
            const existingChars = JSON.parse(fs.readFileSync(charsPath, 'utf8') || "[]")

            // Generate a simple ID from filename
            const id = filename.replace(/\.(docx|txt)$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-')

            existingChars.push({
                id,
                name: filename.replace(/\.(docx|txt)$/i, ''),
                core_want: "Not specified",
                core_flaw: "Not specified",
                current_state: rawText.substring(0, 1000) + (rawText.length > 1000 ? "..." : "") // Save as current state or backstory
            })

            fs.writeFileSync(charsPath, JSON.stringify(existingChars, null, 4))
            return NextResponse.json({ success: true, type: 'character', id })

        } else {
            // Document type: Act
            const actsPath = path.join(dataPath, 'acts.json')
            const existingActs = JSON.parse(fs.readFileSync(actsPath, 'utf8') || "[]")

            // Extremely basic act chunking based on header occurrences
            // Finding lines that start with "Act " or "Chapter "
            const lines = rawText.split('\n')
            let currentActText: string[] = []
            let currentHeading = filename.replace(/\.(docx|txt)$/i, '')
            if (/^Ch\d+$/i.test(currentHeading)) currentHeading += ' - Act 1'

            let actCount = existingActs.length + 1
            const parsedActs = []

            for (const line of lines) {
                if (/^(?:Act|Chapter)\s/i.test(line.trim())) {
                    // Flush existing if we have text
                    if (currentActText.join('\n').trim().length > 50) {
                        parsedActs.push({
                            id: `doc-act-${actCount}`,
                            chapterId: `ch-${actCount}`,
                            heading: currentHeading + (parsedActs.length > 0 ? ` - Act ${parsedActs.length + 1}` : ""),
                            versions: [{
                                versionId: `v1-${Date.now()}`,
                                text: currentActText.join('\n').trim(),
                                createdAt: new Date().toISOString()
                            }]
                        })
                        actCount++
                    }
                    currentHeading = line.trim()
                    currentActText = [line]
                } else {
                    currentActText.push(line)
                }
            }

            // Flush the last act
            if (currentActText.join('\n').trim().length > 0) {
                parsedActs.push({
                    id: `doc-act-${actCount}`,
                    chapterId: `ch-${actCount}`,
                    heading: currentHeading + (parsedActs.length > 0 ? ` - Act ${parsedActs.length + 1}` : ""),
                    versions: [{
                        versionId: `v1-${Date.now()}`,
                        text: currentActText.join('\n').trim(),
                        createdAt: new Date().toISOString()
                    }]
                })
            }

            // If no chapters were found, just ingest the whole thing as one act
            if (parsedActs.length === 0 && rawText.trim().length > 0) {
                parsedActs.push({
                    id: `doc-act-${Date.now()}`,
                    chapterId: `ch-1`,
                    heading: currentHeading,
                    versions: [{
                        versionId: `v1-${Date.now()}`,
                        text: rawText.trim(),
                        createdAt: new Date().toISOString()
                    }]
                })
            }

            const newActsArray = [...existingActs, ...parsedActs]
            fs.writeFileSync(actsPath, JSON.stringify(newActsArray, null, 4))

            return NextResponse.json({ success: true, type: 'act', importedCount: parsedActs.length })
        }

    } catch (error: any) {
        console.error("Ingest Error:", error)
        return NextResponse.json({ error: error.message || "Failed to parse document" }, { status: 500 })
    }
}
