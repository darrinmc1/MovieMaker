// app/api/pipeline/run/route.ts
// Runs a named pipeline script and streams stdout back as Server-Sent Events
// This is what powers the "Run" buttons on the pipeline dashboard

import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

const PIPELINE_FOLDER = process.env.PIPELINE_FOLDER || 'C:\\Users\\Client\\Desktop\\vbook-pipeline'
const PYTHON_CMD      = process.env.PYTHON_CMD || 'python'

// Registry of allowed scripts — prevents arbitrary code execution
const SCRIPTS: Record<string, {
  label: string
  file: string
  args?: string[]
  description: string
}> = {
  populate_sheets: {
    label: 'Populate Google Sheets',
    file: 'populate_sheets.py',
    description: 'Writes character profiles and world info to Google Sheets',
  },
  book1_review: {
    label: 'Book 1 Full Review',
    file: 'book1_review.py',
    description: 'Runs Gemini editorial review across all 12 chapters. Takes 15-20 min.',
  },
  add_book2_data: {
    label: 'Add Book 2 Data',
    file: 'add_book2_data.py',
    description: 'Adds Jasper, Puddle, and Depthspire world info to Google Sheets',
  },
  image_extract: {
    label: 'Extract Image Scenes',
    file: 'book_image_pipeline.py',
    args: ['--step', 'extract'],
    description: 'Extracts 6-10 key scenes per chapter for image generation',
  },
  image_prompts: {
    label: 'Generate Image Prompts',
    file: 'book_image_pipeline.py',
    args: ['--step', 'prompts'],
    description: 'Writes Gemini image prompts for each extracted scene',
  },
  image_generate: {
    label: 'Generate Images (fal.ai)',
    file: 'book_image_pipeline.py',
    args: ['--step', 'generate'],
    description: 'Sends prompts to fal.ai and saves images to Google Drive',
  },
  image_status: {
    label: 'Image Pipeline Status',
    file: 'book_image_pipeline.py',
    args: ['--step', 'status'],
    description: 'Shows how many scenes have been extracted, prompted, and generated',
  },
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const scriptKey = url.searchParams.get('script')

  if (!scriptKey) return NextResponse.json({ scripts: SCRIPTS })

  const script = SCRIPTS[scriptKey]
  if (!script) return NextResponse.json({ error: 'Unknown script' }, { status: 400 })

  // Check last run log
  const logFile = path.join(PIPELINE_FOLDER, `logs/${scriptKey}.log`)
  let lastRun = null
  let lastStatus = 'never_run'
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n')
    const lastLine = lines[lines.length - 1]
    if (lastLine.startsWith('STATUS:')) {
      lastStatus = lastLine.includes('SUCCESS') ? 'success' : 'error'
    }
    const stat = fs.statSync(logFile)
    lastRun = stat.mtime.toISOString()
  }

  return NextResponse.json({ script, lastRun, lastStatus })
}

export async function POST(req: Request) {
  const { scriptKey, extraArgs = [] } = await req.json()

  const script = SCRIPTS[scriptKey]
  if (!script) return NextResponse.json({ error: 'Unknown script' }, { status: 400 })

  const scriptPath = path.join(PIPELINE_FOLDER, script.file)
  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json({ error: `Script not found: ${script.file}` }, { status: 404 })
  }

  // Ensure logs folder exists
  const logsFolder = path.join(PIPELINE_FOLDER, 'logs')
  if (!fs.existsSync(logsFolder)) fs.mkdirSync(logsFolder, { recursive: true })
  const logFile = path.join(logsFolder, `${scriptKey}.log`)

  // Stream output as Server-Sent Events
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, data: string) => {
        const line = `data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`
        controller.enqueue(encoder.encode(line))
      }

      send('start', `▶ Starting: ${script.label}`)
      send('info', `Script: ${script.file}`)

      const args = [...(script.args || []), ...extraArgs]
      const proc = spawn(PYTHON_CMD, [scriptPath, ...args], {
        cwd: PIPELINE_FOLDER,
        env: { ...process.env },
      })

      const log: string[] = [`START: ${new Date().toISOString()}`, `SCRIPT: ${script.file}`]

      proc.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString()
        text.split('\n').filter(Boolean).forEach(line => {
          send('stdout', line)
          log.push(line)
        })
      })

      proc.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString()
        text.split('\n').filter(Boolean).forEach(line => {
          send('stderr', line)
          log.push(`ERR: ${line}`)
        })
      })

      proc.on('close', (code) => {
        const status = code === 0 ? 'SUCCESS' : `ERROR (exit ${code})`
        log.push(`STATUS: ${status}`)
        log.push(`END: ${new Date().toISOString()}`)
        fs.writeFileSync(logFile, log.join('\n'), 'utf-8')

        send('done', `${code === 0 ? '✅' : '❌'} Finished: ${status}`)
        controller.close()
      })

      proc.on('error', (err) => {
        send('error', `Failed to start process: ${err.message}`)
        log.push(`STATUS: ERROR - ${err.message}`)
        fs.writeFileSync(logFile, log.join('\n'), 'utf-8')
        controller.close()
      })
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
