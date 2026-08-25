import faqs from '@/data/iau-faqs.json'
import programs from '@/data/iau-programs.json'
import services from '@/data/iau-services.json'
import { university } from '@/config/university'

/**
 * The knowledge base.
 *
 * Deliberately files rather than a vector store. A university's admission
 * rules are a page of facts, not a corpus, and a page of facts fits in the
 * prompt — which makes it auditable: whatever the assistant said, you can
 * point at the line it came from. Reach for retrieval when the knowledge
 * outgrows the context window, not before.
 *
 * Everything here is marked `"source": "demo"`. Replace these files with the
 * institution's published information and change the marker; the assistant is
 * told to treat anything marked demo as illustrative.
 */

export interface Faq {
  id: string
  topic: string
  questionAr: string
  questionEn: string
  answerAr: string
  answerEn: string
  source: string
}

export const FAQS = faqs as Faq[]
export const SERVICES = services as Array<Record<string, string>>
export const PROGRAMS = programs as Array<Record<string, string | number>>

/** Is any of this knowledge still placeholder data? */
export function hasDemoData(): boolean {
  return [...FAQS, ...SERVICES, ...PROGRAMS].some((r) => (r as { source?: string }).source === 'demo')
}

/**
 * The knowledge block handed to the agent.
 *
 * Kept compact on purpose: this rides along on every turn, and a prompt that
 * doubles in size doubles what a call costs while making the model no better
 * at the four things students actually ring about.
 */
export function knowledgeBlock(): string {
  const lines: string[] = [
    `INSTITUTION: ${university.nameEn} (${university.nameAr}), referred to as ${university.shortName}.`,
    `WEBSITE: ${university.website}`,
    '',
    'FREQUENTLY ASKED:',
    ...FAQS.map((f) => `- ${f.questionEn} → ${f.answerEn}`),
    '',
    `PROGRAMMES: ${PROGRAMS.map((p) => p.nameEn).join(', ')}`,
    `SERVICES: ${SERVICES.map((s) => s.nameEn).join(', ')}`,
    '',
    'DEPARTMENTS AND WHAT THEY HANDLE:',
    ...university.departments.map((d) => `- ${d.id} (${d.nameEn} / ${d.nameAr}) — ${d.handlesEn}`),
    '',
    `CONTACT: admissions ${university.contact.admissionsPhone}, support ${university.contact.supportPhone}, ${university.contact.admissionsEmail}`,
  ]

  if (hasDemoData()) {
    lines.push(
      '',
      'IMPORTANT: some of the above is illustrative demo data rather than published university policy. Never state a requirement, a fee, a date or a cut-off as certain. Offer to transfer to Admissions for anything a decision depends on.',
    )
  }
  return lines.join('\n')
}
