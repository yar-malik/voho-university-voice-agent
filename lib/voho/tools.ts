import 'server-only'

import { currentAgent, reply } from './agents'
import { synthesize } from './speech'
import type { VohoTurn } from './types'
import { runTool, toolCatalogue, type ToolCall, type ToolResult } from '@/lib/tools'

/**
 * ADAPTER — read this before changing it.
 *
 * Voho's `POST /v1/agents/{id}/reply` is text in, text and audio out. It does
 * not, today, return structured function calls the way a chat-completions API
 * does. That is a real limitation and this file is where it is handled, in the
 * open, rather than by pretending an undocumented endpoint exists.
 *
 * The protocol: the agent is told — in the text it receives, so no Voho
 * feature is assumed — that when it needs a university system it must answer
 * with one line and nothing else:
 *
 *     ⟦TOOL⟧{"tool":"get_application_status","args":{"applicationId":"IAU-…"}}
 *
 * This module recognises that line, runs the tool locally, feeds the result
 * back as another turn, and asks the agent to say the answer out loud. The
 * caller hears one continuous reply; the marker never reaches audio, because
 * a turn containing one is requested with `audio: false`.
 *
 * WHEN VOHO SHIPS NATIVE TOOL CALLS, delete the marker handling and read the
 * calls off the response instead. Nothing outside this file needs to change:
 * `converse()` is the whole surface, and `lib/tools/` knows nothing about it.
 */

const MARKER = '⟦TOOL⟧'

/** How many tool round-trips before we stop and let the agent talk. */
const MAX_HOPS = 3

export interface ConverseResult {
  reply: string
  audio: string | null
  contentType: string | null
  costCents: number
  /** Every tool the agent invoked on this turn, in order, with its result. */
  toolCalls: { call: ToolCall; result: ToolResult }[]
  history: VohoTurn[]
}

/** The contract the agent is given, rebuilt from `lib/tools` so it cannot drift. */
export function toolInstructions(): string {
  const lines = toolCatalogue().map(
    (t) => `- ${t.name}(${Object.keys(t.args).join(', ')}) — ${t.description}`,
  )
  return [
    'You can call the university systems below. To call one, reply with exactly one line and nothing else:',
    `${MARKER}{"tool":"<name>","args":{...}}`,
    'Never explain that you are calling a system, never show the line to the caller, and never invent a result.',
    'Ask for any argument you do not have yet, one question at a time. When you have the result, say it naturally in the caller’s language.',
    '',
    'Available systems:',
    ...lines,
  ].join('\n')
}

function extractCall(text: string): ToolCall | null {
  const at = text.indexOf(MARKER)
  if (at === -1) return null
  const rest = text.slice(at + MARKER.length).trim()
  const start = rest.indexOf('{')
  if (start === -1) return null

  // Walk to the matching brace rather than regexing: an argument value may
  // legitimately contain one.
  let depth = 0
  for (let i = start; i < rest.length; i++) {
    if (rest[i] === '{') depth++
    else if (rest[i] === '}') {
      depth--
      if (depth === 0) {
        try {
          const parsed = JSON.parse(rest.slice(start, i + 1))
          if (typeof parsed?.tool !== 'string') return null
          return { tool: parsed.tool, args: parsed.args ?? {} }
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** Text with any tool marker removed, for the rare reply that mixes both. */
function spoken(text: string): string {
  const at = text.indexOf(MARKER)
  return (at === -1 ? text : text.slice(0, at)).trim()
}

/**
 * One turn of the conversation, including any tool calls it needs.
 *
 * The tool round-trips are silent — `audio: false` — so the university only
 * pays for speech the caller actually hears, and so a marker can never be
 * read out by mistake.
 */
export async function converse(opts: {
  text: string
  history?: VohoTurn[]
  variables?: Record<string, string>
  audio?: boolean
}): Promise<ConverseResult> {
  const history: VohoTurn[] = [...(opts.history ?? [])]
  const toolCalls: ConverseResult['toolCalls'] = []
  let costCents = 0
  let userText = opts.text
  let finalText = ''

  // ---- think, calling tools until it has an answer ----------------------
  //
  // Every hop is `audio: false`. Asking for speech here would pay to
  // synthesise a tool marker nobody must ever hear, and would do it again on
  // each hop. The one line the caller actually hears is spoken once, below.
  for (let hop = 0; ; hop++) {
    const result = await reply({
      text: userText,
      history,
      variables: opts.variables,
      audio: false,
    })
    costCents += result.cost_cents

    const call = hop < MAX_HOPS ? extractCall(result.reply) : null
    if (!call) {
      finalText = spoken(result.reply) || result.reply
      history.push({ role: 'user', text: userText }, { role: 'agent', text: finalText })
      break
    }

    const ran = await runTool(call)
    toolCalls.push({ call, result: ran })

    history.push({ role: 'user', text: userText }, { role: 'agent', text: spoken(result.reply) || '…' })
    userText = `SYSTEM RESULT for ${call.tool}: ${JSON.stringify(ran.data ?? { error: ran.error })}. Tell the caller what this means, naturally, in their language. Do not mention systems or JSON.`
  }

  // ---- say it -----------------------------------------------------------
  //
  // Straight to synthesis rather than another turn through the model. A
  // second turn would cost a whole reply to obtain audio we already know the
  // text of, and would let the model quietly reword the answer on the way.
  if (!(opts.audio ?? true) || !finalText.trim()) {
    return { reply: finalText, audio: null, contentType: null, costCents, toolCalls, history }
  }

  try {
    const agent = await currentAgent()
    const spokenAudio = await synthesize({
      text: finalText,
      voice: agent?.voice_id,
      model: agent?.model,
      format: 'mp3',
    })
    costCents += spokenAudio.costCents
    return {
      reply: finalText,
      audio: Buffer.from(spokenAudio.audio).toString('base64'),
      contentType: spokenAudio.contentType,
      costCents,
      toolCalls,
      history,
    }
  } catch (err) {
    // The answer is right even when synthesis is not available. Returning it
    // as text beats failing the whole turn — the transcript still shows it.
    console.error('[voho] synthesis failed, returning text only', (err as Error).message)
    return { reply: finalText, audio: null, contentType: null, costCents, toolCalls, history }
  }
}
