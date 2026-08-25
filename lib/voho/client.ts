import 'server-only'

import { VohoError, type VohoErrorBody } from './types'

/**
 * The Voho HTTP client.
 *
 * Server-only, and deliberately so: a Voho key is a bearer credential with
 * spending power, and `import 'server-only'` makes it a build error for any
 * client component to pull this file into the browser bundle. Everything the
 * browser needs goes through this project's own `/api/voice/*` routes.
 *
 * Authentication is a bearer token, exactly as the Voho REST API documents:
 *
 *   Authorization: Bearer voho_sk_live_...
 *
 * Errors come back as `{ error: { code, message } }` on every endpoint, so
 * they are translated once, here, into a typed `VohoError`.
 */

const DEFAULT_API_URL = 'https://app.voho.ai/v1'

export function vohoApiUrl(): string {
  return (process.env.VOHO_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '')
}

export function isConfigured(): boolean {
  return Boolean(process.env.VOHO_API_KEY)
}

function apiKey(): string {
  const key = process.env.VOHO_API_KEY
  if (!key) {
    throw new VohoError(
      'not_configured',
      'VOHO_API_KEY is not set. Copy .env.example to .env.local and add your key.',
      503,
    )
  }
  return key
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    throw new VohoError('bad_response', 'Voho returned a response that was not JSON.', res.status)
  }

  if (!res.ok) {
    const err = (body as VohoErrorBody)?.error
    throw new VohoError(
      err?.code ?? 'request_failed',
      err?.message ?? `Voho request failed with ${res.status}.`,
      res.status,
    )
  }
  return body as T
}

/** A JSON request against the Voho API. */
export async function vohoFetch<T>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await fetch(`${vohoApiUrl()}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init.signal,
    cache: 'no-store',
  })
  return parse<T>(res)
}

/** A multipart request, for the endpoints that take a file. */
export async function vohoUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${vohoApiUrl()}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
    cache: 'no-store',
  })
  return parse<T>(res)
}
