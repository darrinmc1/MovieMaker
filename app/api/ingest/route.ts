import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

        if (docType === 'character') {
            // Generate a simple ID from filename
            const id = filename.replace(/\.(docx|txt)$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-')
            const name = filename.replace(/\.(docx|txt)$/i, '')

            const { error } = await supabase.from('characters').upsert({
                id,
                name,
                core_want: "Not specified",
                core_flaw: "Not specified",
                current_state: rawText.substring(0, 1000) + (rawText.length > 1000 ? "..." : "")
            })

            if (error) throw error

            return NextResponse.json({ success: true, type: 'character', id })

        } else {
            // Document type: Act
            // Robust chunking for "Act I: Title" or "Act 1: Title" patterns
            const lines = rawText.split('\n')
            let currentActText: string[] = []
            
            // Extract chapter number from filename (e.g. Ch1_revised -> 1)
            const chapterMatch = filename.match(/Ch(\d+)/i)
            const chapterNum = chapterMatch ? chapterMatch[1] : '1'
            const chapterId = `ch-${chapterNum}`
            
            let currentHeading = filename.replace(/\.(docx|txt)$/i, '')
            if (/^Ch\d+/i.test(currentHeading)) currentHeading += ' - Preamble'

            // Get existing count for ID generation
            const { count } = await supabase.from('acts').select('*', { count: 'exact', head: true })
            let actCount = (count || 0) + 1
            
            const parsedActs = []

            // Regex to match "Act I", "Act 1", "Act I:", "ACT 1"
            // It allows optional colons and titles after the number
            const actHeaderRegex = /^(?:Act|ACT)\s+([IVXLCDM\d]+)(?:[:\s]\s*(.+))?$/i

            for (const line of lines) {
                const match = line.trim().match(actHeaderRegex)
                
                if (match) {
                    // Flush existing text if we have content
                    if (currentActText.join('\n').trim().length > 0) {
                        parsedActs.push({
                            id: `doc-act-${actCount}-${Date.now()}`,
                            chapterId,
                            heading: currentHeading,
                            text: currentActText.join('\n').trim()
                        })
                        actCount++
                    }
                    
                    // Start new act
                    // match[1] = Number/Roman (e.g. "I")
                    // match[2] = Title (e.g. "Dawn's Reckoning") - optional
                    const num = match[1]
                    const title = match[2] || ""
                    currentHeading = `Act ${num}${title ? ': ' + title : ''}`
                    currentActText = [] // Don't include the header in the body text
                } else {
                    currentActText.push(line)
                }
            }

            // Flush the last act
            if (currentActText.join('\n').trim().length > 0) {
                parsedActs.push({
                    id: `doc-act-${actCount}-${Date.now()}`,
                    chapterId,
                    heading: currentHeading,
                    text: currentActText.join('\n').trim()
                })
            }

            // If no chapters were found, ingest the whole thing as one act
            if (parsedActs.length === 0 && rawText.trim().length > 0) {
                parsedActs.push({
                    id: `doc-act-${Date.now()}`,
                    chapterId: `ch-1`,
                    heading: currentHeading,
                    text: rawText.trim()
                })
            }

            // Insert into Supabase
            for (const act of parsedActs) {
                // Insert Act
                const { error: actError } = await supabase.from('acts').upsert({
                    id: act.id,
                    chapter_id: act.chapterId,
                    heading: act.heading
                })

                if (actError) {
                    console.error("Act insert error:", actError)
                    continue
                }

                // Insert Initial Version
                const { error: verError } = await supabase.from('act_versions').insert({
                    act_id: act.id,
                    version_id: `v1-${Date.now()}`,
                    text: act.text,
                    is_current: true
                })

                if (verError) console.error("Version insert error:", verError)
            }

            return NextResponse.json({ success: true, type: 'act', importedCount: parsedActs.length })
        }

    } catch (error: any) {
        console.error("Ingest Error:", error)
        return NextResponse.json({ error: error.message || "Failed to parse document" }, { status: 500 })
    }
}
