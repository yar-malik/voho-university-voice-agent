export interface Turn {
  role: 'user' | 'agent'
  text: string
}

export interface ToolLogEntry {
  tool: string
  args: Record<string, unknown>
  ok: boolean
  mock: boolean
  data: unknown
  error: string | null
  at: number
}

export interface DemoStatus {
  configured: boolean
  agentConfigured: boolean
  apiUrl: string
  demoData: boolean
  university: {
    nameAr: string
    nameEn: string
    shortName: string
    languages: string[]
    departments: { id: string; nameEn: string; nameAr: string }[]
    weights: { highSchool: number; aptitude: number; achievement: number }
  }
  tools: { name: string; description: string; args: string[]; mock: boolean }[]
}
