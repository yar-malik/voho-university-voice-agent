'use client'

import type { ToolLogEntry } from './types'

/**
 * What the assistant actually did.
 *
 * This panel is the point of the whole demo. Anyone can make a model talk;
 * the question a university is really asking is whether it reaches their
 * systems and comes back with a real answer. So every call is shown with its
 * arguments and its result, and a MOCK badge wherever the system behind it is
 * still a stand-in — because claiming a live integration you do not have is
 * how a pilot dies in week two.
 */
export function ToolLog({ entries }: { entries: ToolLogEntry[] }) {
  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="eyebrow">Action log</span>
        <span className="mono text-[11px] text-faint">{entries.length} call{entries.length === 1 ? '' : 's'}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-faint">
            Nothing yet. When the assistant needs a university system — an application
            lookup, a ticket, a transfer — the call and its result appear here.
          </p>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="rounded-lg border border-line">
              <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.ok ? 'bg-primary' : 'bg-red-500'}`} />
                <span className="mono flex-1 truncate text-[12.5px] font-medium">{e.tool}</span>
                {e.mock && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    MOCK
                  </span>
                )}
              </div>
              <div className="space-y-2 px-3 py-2.5">
                <div>
                  <span className="eyebrow text-[10px]">Arguments</span>
                  <pre className="mono mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[11.5px] leading-relaxed text-dim">
                    {JSON.stringify(e.args, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="eyebrow text-[10px]">{e.ok ? 'Result' : 'Error'}</span>
                  <pre className="mono mt-1 max-h-44 overflow-auto whitespace-pre-wrap break-words text-[11.5px] leading-relaxed text-dim">
                    {e.ok ? JSON.stringify(e.data, null, 2) : e.error}
                  </pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
