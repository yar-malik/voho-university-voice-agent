/**
 * The shapes the Voho API actually returns.
 *
 * Taken from the live API rather than guessed. Every field here appears in a
 * documented Voho response; nothing has been invented. Where this project
 * needs something Voho does not expose yet, it lives in `tools.ts` behind an
 * interface that is clearly labelled as an adapter.
 */

export interface VohoAgentSummary {
  id: string
  name: string
  voice_id: string
  model: string
  language: string
  status: 'draft' | 'live'
  updated_at: string
}

/** A conversation turn, in the shape `/v1/agents/{id}/reply` accepts. */
export interface VohoTurn {
  role: 'user' | 'agent'
  text: string
}

/** Response of `POST /v1/agents/{id}/reply`. */
export interface VohoReply {
  reply: string
  greeting: string
  /** Base64 audio, or null when `audio: false` was requested. */
  audio: string | null
  content_type: string | null
  cost_cents: number
}

/** Response of `POST /v1/transcribe`. */
export interface VohoTranscript {
  text: string
  seconds: number
  confidence: number
  cost_cents: number
}

export interface VohoVoice {
  id: string
  name: string
  gender: string
  lang: string
  langLabel: string
  dialect: string
  country: string
  flag: string
}

/** Every Voho error uses this envelope. */
export interface VohoErrorBody {
  error: { code: string; message: string }
}

export class VohoError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'VohoError'
  }
}
