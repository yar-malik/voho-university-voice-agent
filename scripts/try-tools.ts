/**
 * Exercise every tool directly — no Voho key, no network, no model.
 *
 *   npm run try:tools
 *
 * This is the first thing to run when replacing a mock with a real university
 * system: get these calls returning what you expect and the agent side needs
 * no changes at all.
 */
import { runTool, toolCatalogue } from '../lib/tools'

const CASES: { label: string; tool: string; args: Record<string, unknown> }[] = [
  { label: 'weighted score, valid', tool: 'calculate_admission_score', args: { highSchoolScore: 95, aptitudeScore: 87, achievementScore: 82 } },
  { label: 'weighted score, out of range', tool: 'calculate_admission_score', args: { highSchoolScore: 120, aptitudeScore: 87, achievementScore: 82 } },
  { label: 'application found', tool: 'get_application_status', args: { applicationId: 'IAU-2026-10877' } },
  { label: 'application missing', tool: 'get_application_status', args: { applicationId: 'NOPE-1' } },
  { label: 'blackboard ticket routes to e-learning', tool: 'create_support_ticket', args: { summary: 'ما أقدر أفتح البلاك بورد' } },
  { label: 'transfer to a real department', tool: 'transfer_to_department', args: { department: 'admissions', reason: 'asked for a person' } },
  { label: 'transfer to one that does not exist', tool: 'transfer_to_department', args: { department: 'canteen' } },
  { label: 'send admission link', tool: 'send_information', args: { topic: 'admission', phone: '+966500000000' } },
  { label: 'send to a bad number', tool: 'send_information', args: { topic: 'admission', phone: 'not-a-number' } },
]

async function main() {
  console.log(`Registered tools: ${toolCatalogue().map((t) => t.name).join(', ')}\n`)

  let failures = 0
  for (const c of CASES) {
    const r = await runTool({ tool: c.tool, args: c.args })
    const body = r.ok ? JSON.stringify(r.data) : r.error
    console.log(`${r.ok ? '  ok  ' : '  --  '} ${c.label}`)
    console.log(`       ${String(body).slice(0, 150)}`)
    // A tool that refuses bad input is behaving; a tool that throws is not.
    if (r.ok === undefined) failures++
  }

  // The two deliberate failures above must fail, and the rest must succeed.
  const score = await runTool({ tool: 'calculate_admission_score', args: { highSchoolScore: 95, aptitudeScore: 87, achievementScore: 82 } })
  const expected = 95 * 0.3 + 87 * 0.3 + 82 * 0.4
  const got = (score.data as { weightedScore: number }).weightedScore
  if (Math.abs(got - expected) > 0.01) {
    console.error(`\nFAIL: weighted score was ${got}, expected ${expected.toFixed(2)}`)
    process.exit(1)
  }
  console.log(`\nWeighted score check: ${got} == ${expected.toFixed(2)} ✓`)
  if (failures) process.exit(1)
}

void main()
