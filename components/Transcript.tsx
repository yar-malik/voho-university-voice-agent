'use client'

import { useEffect, useRef } from 'react'
import type { Turn } from './types'

/** The conversation, as it happens. `dir="auto"` so Arabic sets itself RTL. */
export function Transcript({ turns, thinking }: { turns: Turn[]; thinking: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [turns, thinking])

  return (
    <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4">
      {turns.length === 0 && !thinking && (
        <p className="text-[13px] leading-relaxed text-faint">
          Press <span className="font-medium text-dim">Start voice demo</span> and speak, or try one of
          the example questions.
        </p>
      )}

      {turns.map((t, i) => (
        <div
          key={i}
          dir="auto"
          className={`rounded-xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
            t.role === 'agent' ? 'bg-primary/5 border border-primary/10' : 'border border-line'
          }`}
        >
          <span className="eyebrow mb-1 block text-[10px]">{t.role === 'agent' ? 'Assistant' : 'Student'}</span>
          {t.text}
        </div>
      ))}

      {thinking && (
        <p className="flex items-center gap-2 px-1 text-[13px] text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-primary pulse" />
          Understanding, checking systems, answering…
        </p>
      )}
    </div>
  )
}
