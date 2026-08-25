'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { canRecord, startRecording, type Recorder } from '@/lib/audio/record'
import { Transcript } from './Transcript'
import { ToolLog } from './ToolLog'
import type { DemoStatus, ToolLogEntry, Turn } from './types'

/**
 * The demo.
 *
 * Speak, or type. Either way the same path runs: what the student said goes
 * to our server, our server asks Voho, Voho asks for a university system when
 * it needs one, we run it, and the answer comes back as speech.
 *
 * Typing is not a fallback nobody uses — it is how this gets demonstrated in
 * a meeting room where the microphone is a laptop and the room is loud.
 */

const EXAMPLES: { ar: string; en: string; note: string }[] = [
  { ar: 'كيف أقدم على الجامعة؟', en: 'How do I apply?', note: 'Knowledge base' },
  { ar: 'الثانوية ٩٥، القدرات ٨٧، والتحصيلي ٨٢. احسب نسبتي الموزونة', en: 'Calculate my weighted score', note: 'calculate_admission_score' },
  { ar: 'وين وصل طلبي؟ رقم الطلب IAU-2026-10877', en: 'Where is my application?', note: 'get_application_status' },
  { ar: 'عندي مشكلة في البلاك بورد، ما أقدر أفتح المحاضرة', en: 'Blackboard problem', note: 'create_support_ticket' },
  { ar: 'أبغى أكلم قسم القبول', en: 'Transfer me to Admissions', note: 'transfer_to_department' },
]

type Phase = 'idle' | 'recording' | 'transcribing' | 'thinking'

export function VoiceDemo({ status }: { status: DemoStatus }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [tools, setTools] = useState<ToolLogEntry[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [language, setLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA')
  const [error, setError] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [supported, setSupported] = useState(true)
  const [cost, setCost] = useState(0)

  const recorder = useRef<Recorder | null>(null)
  const audioEl = useRef<HTMLAudioElement | null>(null)
  const historyRef = useRef<Turn[]>([])

  useEffect(() => setSupported(canRecord()), [])
  useEffect(() => () => { audioEl.current?.pause(); recorder.current?.cancel() }, [])

  const play = useCallback((base64: string, contentType: string) => {
    try {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: contentType || 'audio/mpeg' }))
      audioEl.current?.pause()
      const el = new Audio(url)
      audioEl.current = el
      void el.play().catch(() => {})
    } catch {
      /* autoplay refused; the transcript still shows the answer */
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      setError(null)
      setPhase('thinking')
      setTurns((t) => [...t, { role: 'user', text }])

      try {
        const res = await fetch('/api/voice/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, history: historyRef.current, language }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message ?? 'That did not go through.')

        historyRef.current = json.history ?? historyRef.current
        setTurns((t) => [...t, { role: 'agent', text: json.reply }])
        setCost((c) => c + (json.costCents ?? 0))

        if (Array.isArray(json.toolCalls) && json.toolCalls.length) {
          setTools((prev) => [
            ...prev,
            ...json.toolCalls.map((c: Omit<ToolLogEntry, 'at'>) => ({ ...c, at: Date.now() })),
          ])
        }
        if (json.audio) play(json.audio, json.contentType)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setPhase('idle')
      }
    },
    [language, play],
  )

  async function talk() {
    setError(null)
    try {
      recorder.current = await startRecording()
      setPhase('recording')
    } catch (e) {
      setError(
        (e as Error).name === 'NotAllowedError'
          ? 'The microphone is blocked for this site. Allow it in the address bar and try again.'
          : 'No microphone available. You can type instead.',
      )
    }
  }

  async function stopAndSend() {
    const active = recorder.current
    if (!active) return
    recorder.current = null
    setPhase('transcribing')
    try {
      const wav = await active.stop()
      const form = new FormData()
      form.set('audio', new File([wav], 'turn.wav', { type: 'audio/wav' }))
      form.set('language', language)

      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? 'Could not hear that.')
      if (!json.text?.trim()) throw new Error('No speech was recognised. Try again, a little closer to the microphone.')

      await send(json.text)
    } catch (e) {
      setError((e as Error).message)
      setPhase('idle')
    }
  }

  function reset() {
    audioEl.current?.pause()
    recorder.current?.cancel()
    recorder.current = null
    historyRef.current = []
    setTurns([])
    setTools([])
    setCost(0)
    setError(null)
    setPhase('idle')
  }

  const busy = phase !== 'idle'

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ------------------------------------------------------ conversation */}
      <div className="card flex min-h-[540px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <span className="eyebrow">Live call</span>

          <span className="flex items-center gap-1.5 text-[12.5px] text-dim">
            <span className={`h-1.5 w-1.5 rounded-full ${busy ? 'bg-primary pulse' : 'bg-faint/40'}`} />
            {phase === 'recording' ? 'Listening' : phase === 'transcribing' ? 'Transcribing' : phase === 'thinking' ? 'Thinking' : 'Ready'}
          </span>

          <span className="flex-1" />

          <div className="flex overflow-hidden rounded-lg border border-line text-[12px]">
            {(['ar-SA', 'en-US'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 transition-colors ${
                  language === l ? 'bg-primary text-white' : 'text-dim hover:bg-canvas'
                }`}
              >
                {l === 'ar-SA' ? 'العربية' : 'English'}
              </button>
            ))}
          </div>

          {cost > 0 && <span className="mono text-[11px] text-faint">${(cost / 100).toFixed(3)}</span>}
        </div>

        <Transcript turns={turns} thinking={phase === 'thinking' || phase === 'transcribing'} />

        {error && <p className="border-t border-line px-4 py-2.5 text-[13px] text-red-600">{error}</p>}

        <div className="space-y-3 border-t border-line p-4">
          <div className="flex flex-wrap gap-2">
            {phase === 'recording' ? (
              <button
                onClick={stopAndSend}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-medium text-white"
              >
                <span className="h-2 w-2 rounded-full bg-white pulse" /> Send
              </button>
            ) : (
              <button
                onClick={talk}
                disabled={busy || !supported || !status.configured}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Start voice demo
              </button>
            )}
            <button
              onClick={reset}
              disabled={busy}
              className="h-11 rounded-lg border border-line px-4 text-[13.5px] text-dim transition-colors hover:bg-canvas disabled:opacity-40"
            >
              Reset
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const t = typed
              setTyped('')
              void send(t)
            }}
            className="flex gap-2"
          >
            <input
              dir="auto"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={busy || !status.configured}
              placeholder={language === 'ar-SA' ? 'أو اكتب سؤالك هنا…' : 'Or type your question…'}
              className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-[14px] outline-none focus:border-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !typed.trim() || !status.configured}
              className="h-10 rounded-lg border border-line px-4 text-[13.5px] text-dim transition-colors hover:bg-canvas disabled:opacity-40"
            >
              Send
            </button>
          </form>

          {!supported && (
            <p className="text-[12.5px] text-amber-700">
              This browser cannot record audio. Typing works — Chrome or Firefox for voice.
            </p>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------- side panel */}
      <div className="flex min-h-[540px] flex-col gap-4">
        <div className="card p-4">
          <span className="eyebrow">Try asking</span>
          <div className="mt-3 space-y-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.ar}
                onClick={() => void send(language === 'ar-SA' ? ex.ar : ex.en)}
                disabled={busy || !status.configured}
                className="w-full rounded-lg border border-line px-3 py-2 text-left transition-colors hover:bg-canvas disabled:opacity-40"
              >
                <span dir="auto" className="block text-[13px] leading-relaxed">
                  {language === 'ar-SA' ? ex.ar : ex.en}
                </span>
                <span className="mono mt-1 block text-[10.5px] text-faint">{ex.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <ToolLog entries={tools} />
        </div>
      </div>
    </div>
  )
}
