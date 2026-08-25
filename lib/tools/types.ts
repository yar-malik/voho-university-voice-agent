/**
 * The tool contract.
 *
 * Every tool is a plain async function with a declared argument shape. That
 * is the whole interface a university has to satisfy when it replaces a mock
 * with its own system — no framework, no code generation, no Voho-specific
 * types. `lib/voho/tools.ts` turns these into something the agent can call
 * and knows nothing about what any of them do.
 */

export interface ToolCall {
  tool: string
  args: Record<string, unknown>
}

export interface ToolResult {
  ok: boolean
  data?: unknown
  error?: string
  /** True while this tool is a stand-in for a real university system. */
  mock: boolean
}

export interface ToolDefinition {
  name: string
  description: string
  /** Argument name → what it is, used to build the agent's instructions. */
  args: Record<string, string>
  /** Whether this implementation talks to a real system yet. */
  mock: boolean
  run: (args: Record<string, unknown>) => Promise<ToolResult>
}

export const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
export const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : null
}
