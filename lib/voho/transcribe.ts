import 'server-only'

import { vohoUpload } from './client'
import type { VohoTranscript } from './types'

/**
 * Speech to text, over the real Voho REST API.
 *
 *   POST /v1/transcribe   — multipart: `audio` file plus a `language` field
 *
 * The language matters more than it looks. Voho defaults to ar-SA, and a
 * Saudi caller who switches to English mid-sentence is transcribed correctly
 * because the engine is told to expect it — a transcriber locked to one
 * language writes nonsense at exactly those moments.
 */

export async function transcribe(opts: {
  audio: Blob | File
  filename?: string
  language?: string
}): Promise<VohoTranscript> {
  const form = new FormData()
  form.set('audio', opts.audio, opts.filename ?? 'turn.wav')
  form.set('language', opts.language ?? 'ar-SA')
  return vohoUpload<VohoTranscript>('/transcribe', form)
}
