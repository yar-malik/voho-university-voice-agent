import { NextResponse } from 'next/server'

import { agentBrief } from '@/lib/agentPrompt'
import { greetingFor, university, type LanguageCode } from '@/config/university'
import { converse } from '@/lib/voho/tools'
import { VohoError, type VohoTurn } from '@/lib/voho/types'
import { isConfigured } from '@/lib/voho/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * One turn of the conversation.
 *
 * This route exists so the browser never holds a Voho key. The page posts
 * what the student said; the server talks to Voho, runs any university tool
 * the agent asks for, and returns the spoken answer plus a log of exactly
 * what happened — which is the part an enterprise buyer is actually here to
 * see.
 */
export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: 'not_configured',
          message: 'VOHO_API_KEY is not set. Copy .env.example to .env.local and add your key.',
        },
      },
      { status: 503 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    text?: string
    history?: VohoTurn[]
    language?: LanguageCode
    audio?: boolean
  }

  const text = (body.text ?? '').trim()
  if (!text) {
    return NextResponse.json(
      { error: { code: 'empty', message: 'Send what the caller said in "text".' } },
      { status: 400 },
    )
  }

  const language: LanguageCode = body.language === 'en-US' ? 'en-US' : university.primaryLanguage
  const history = Array.isArray(body.history) ? body.history.slice(-20) : []

  try {
    // The brief rides on the first turn only: after that it is in the history
    // Voho already has, and repeating it on every turn would pay for the same
    // tokens over and over.
    const withBrief =
      history.length === 0
        ? `${agentBrief()}\n\nThe caller has just been greeted with: "${greetingFor(language)}"\n\nThe caller says: ${text}`
        : text

    const result = await converse({
      text: withBrief,
      history,
      variables: { university: university.nameAr, university_en: university.nameEn },
      audio: body.audio ?? true,
    })

    return NextResponse.json({
      reply: result.reply,
      audio: result.audio,
      contentType: result.contentType,
      costCents: result.costCents,
      toolCalls: result.toolCalls.map(({ call, result: r }) => ({
        tool: call.tool,
        args: call.args,
        ok: r.ok,
        mock: r.mock,
        data: r.data ?? null,
        error: r.error ?? null,
      })),
      history: result.history,
    })
  } catch (err) {
    if (err instanceof VohoError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status })
    }
    console.error('[api/voice/turn] unexpected', err)
    return NextResponse.json(
      { error: { code: 'internal_error', message: 'Something went wrong handling that turn.' } },
      { status: 500 },
    )
  }
}
