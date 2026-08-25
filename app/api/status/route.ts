import { NextResponse } from 'next/server'

import { university } from '@/config/university'
import { hasDemoData } from '@/lib/knowledge'
import { toolCatalogue } from '@/lib/tools'
import { isConfigured, vohoApiUrl } from '@/lib/voho/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * What the demo can and cannot do right now.
 *
 * The page reads this on load so it can say plainly that the key is missing
 * rather than failing at the first click, and so the tool list on screen is
 * generated from the registry instead of being typed twice.
 */
export async function GET() {
  return NextResponse.json({
    configured: isConfigured(),
    agentConfigured: Boolean(process.env.VOHO_AGENT_ID),
    apiUrl: vohoApiUrl(),
    university: {
      nameAr: university.nameAr,
      nameEn: university.nameEn,
      shortName: university.shortName,
      languages: university.supportedLanguages,
      departments: university.departments.map((d) => ({ id: d.id, nameEn: d.nameEn, nameAr: d.nameAr })),
      weights: university.admissionScore.weights,
    },
    demoData: hasDemoData(),
    tools: toolCatalogue().map((t) => ({
      name: t.name,
      description: t.description,
      args: Object.keys(t.args),
      mock: t.mock,
    })),
  })
}
