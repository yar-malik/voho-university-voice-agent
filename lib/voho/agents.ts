import 'server-only'

import { vohoFetch } from './client'
import type { VohoAgentSummary, VohoReply, VohoTurn } from './types'

/**
 * Agents, over the real Voho REST API.
 *
 *   GET  /v1/agents               — the agents this key's account owns
 *   POST /v1/agents/{id}/reply    — what the agent says next
 *
 * The reply endpoint is the whole conversational surface: text in, text and
 * audio out, with the history supplied per request. Voho holds the agent's
 * prompt, voice and language; this application holds the conversation.
 */

export async function listAgents(): Promise<VohoAgentSummary[]> {
  const body = await vohoFetch<{ agents: VohoAgentSummary[] }>('/agents')
  return body.agents ?? []
}

export function agentId(): string {
  const id = process.env.VOHO_AGENT_ID
  if (!id) {
    throw new Error('VOHO_AGENT_ID is not set. Create an agent in the Voho console and copy its id.')
  }
  return id
}

export interface ReplyOptions {
  /** What the caller just said. */
  text: string
  /** Prior turns. Voho keeps the last 20. */
  history?: VohoTurn[]
  /** Per-call values for `{{variables}}` in the agent's prompt. */
  variables?: Record<string, string>
  /** Ask for spoken audio back. Off for tool round-trips, which are silent. */
  audio?: boolean
}

export async function reply(opts: ReplyOptions): Promise<VohoReply> {
  return vohoFetch<VohoReply>(`/agents/${agentId()}/reply`, {
    method: 'POST',
    body: {
      text: opts.text,
      history: opts.history ?? [],
      variables: opts.variables ?? {},
      audio: opts.audio ?? true,
    },
  })
}

/**
 * The configured agent's own row, so its voice can be reused for synthesis.
 *
 * Cached for the life of the process: an agent's voice changes when somebody
 * edits it in the console, which is not something worth a round trip on every
 * turn of every call.
 */
let cached: VohoAgentSummary | null = null

export async function currentAgent(): Promise<VohoAgentSummary | null> {
  if (cached) return cached
  const id = agentId()
  cached = (await listAgents()).find((a) => a.id === id) ?? null
  return cached
}
