import { calculateAdmissionScore } from './calculateAdmissionScore'
import { createSupportTicket } from './createSupportTicket'
import { getApplicationStatus } from './getApplicationStatus'
import { sendInformation } from './sendInformation'
import { transferToDepartment } from './transferToDepartment'
import type { ToolCall, ToolDefinition, ToolResult } from './types'

export type { ToolCall, ToolDefinition, ToolResult } from './types'

/**
 * The registry.
 *
 * Adding a tool is one import and one line here — the agent's instructions are
 * generated from this list, so a new tool is offered to the model the moment
 * it is registered, and cannot be offered without being implemented.
 */
export const TOOLS: ToolDefinition[] = [
  calculateAdmissionScore,
  getApplicationStatus,
  createSupportTicket,
  transferToDepartment,
  sendInformation,
]

export function toolCatalogue(): ToolDefinition[] {
  return TOOLS
}

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name)
}

/** Run a call the agent asked for. Never throws — a failed tool is an answer. */
export async function runTool(call: ToolCall): Promise<ToolResult> {
  const tool = findTool(call.tool)
  if (!tool) {
    return { ok: false, mock: false, error: `No such tool: ${call.tool}` }
  }
  try {
    return await tool.run(call.args ?? {})
  } catch (err) {
    console.error(`[tools] ${call.tool} threw`, err)
    return { ok: false, mock: tool.mock, error: (err as Error).message }
  }
}
