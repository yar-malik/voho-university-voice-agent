import 'server-only'

import { vohoApiUrl } from './client'
import { VohoError, type VohoErrorBody, type VohoVoice } from './types'

/**
 * Speech, over the real Voho REST API.
 *
 *   POST /v1/speech    — text in, audio bytes out
 *   GET  /v1/voices    — the catalogue
 *
 * `/v1/speech` answers with audio rather than JSON, so it does not go through
 * `vohoFetch`. The format is chosen explicitly rather than left to the Accept
 * header, because a browser's default Accept would decide it for us.
 */

export type SpeechFormat = 'mp3' | 'wav' | 'opus' | 'mulaw'

export async function synthesize(opts: {
  text: string
  voice?: string
  model?: string
  format?: SpeechFormat
}): Promise<{ audio: ArrayBuffer; contentType: string; costCents: number }> {
  const key = process.env.VOHO_API_KEY
  if (!key) throw new VohoError('not_configured', 'VOHO_API_KEY is not set.', 503)

  const res = await fetch(`${vohoApiUrl()}/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: opts.text,
      voice: opts.voice,
      model: opts.model,
      format: opts.format ?? 'mp3',
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as VohoErrorBody | null
    throw new VohoError(
      body?.error?.code ?? 'synthesis_failed',
      body?.error?.message ?? 'Voho could not synthesise that text.',
      res.status,
    )
  }

  return {
    audio: await res.arrayBuffer(),
    contentType: res.headers.get('content-type') ?? 'audio/mpeg',
    costCents: Number(res.headers.get('X-Voho-Cost-Cents') ?? 0),
  }
}

export async function listVoices(): Promise<VohoVoice[]> {
  const key = process.env.VOHO_API_KEY
  if (!key) throw new VohoError('not_configured', 'VOHO_API_KEY is not set.', 503)

  const res = await fetch(`${vohoApiUrl()}/voices`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new VohoError('request_failed', 'Could not list voices.', res.status)
  const body = (await res.json()) as { voices?: VohoVoice[] }
  return body.voices ?? []
}
