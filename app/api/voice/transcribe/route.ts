import { NextResponse } from 'next/server'

import { isConfigured } from '@/lib/voho/client'
import { transcribe } from '@/lib/voho/transcribe'
import { VohoError } from '@/lib/voho/types'
import { university } from '@/config/university'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** What the caller said, from a clip the browser recorded. */
export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: { code: 'not_configured', message: 'VOHO_API_KEY is not set.' } },
      { status: 503 },
    )
  }

  const form = await req.formData().catch(() => null)
  const audio = form?.get('audio')
  if (!(audio instanceof File)) {
    return NextResponse.json(
      { error: { code: 'no_audio', message: 'Send an "audio" file.' } },
      { status: 400 },
    )
  }

  const language = String(form?.get('language') ?? university.primaryLanguage)

  try {
    const result = await transcribe({ audio, filename: audio.name || 'turn.wav', language })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof VohoError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status })
    }
    console.error('[api/voice/transcribe] unexpected', err)
    return NextResponse.json(
      { error: { code: 'internal_error', message: 'Could not transcribe that clip.' } },
      { status: 500 },
    )
  }
}
