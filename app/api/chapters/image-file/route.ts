import { readFileSync, existsSync } from 'fs'
import { NextResponse } from 'next/server'

// GET /api/chapters/image-file?path=<absolute_path>
// Serves a pipeline image file as a response
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return new NextResponse('Missing path', { status: 400 })
  }

  // Security: only allow paths inside the pipeline/data/images folder
  const pipelineDir = (process.env.PIPELINE_FOLDER || '').replace(/\\/g, '/')
  const normalised = filePath.replace(/\\/g, '/')

  if (!normalised.includes('pipeline') || !normalised.includes('images')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const bytes = readFileSync(filePath)
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 })
  }
}
