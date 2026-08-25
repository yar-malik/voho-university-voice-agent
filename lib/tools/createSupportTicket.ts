import { departmentById, university } from '@/config/university'
import { str, type ToolDefinition } from './types'

/**
 * MOCK — replace with the university's ticketing system.
 *
 * Returns a plausible ticket rather than creating one. Swap the body of `run`
 * for a call to Jira Service Management, Freshservice, ServiceNow, Zendesk or
 * whatever the institution runs, and keep the shape.
 *
 * The routing table is `config/university.ts`, so a fork with different
 * departments gets different routing without touching this file.
 */

/** Words that place a problem with a department, before any model is asked. */
const ROUTES: { department: string; hints: string[] }[] = [
  {
    department: 'elearning',
    hints: ['بلاك بورد', 'بلاكبورد', 'blackboard', 'lms', 'محاضرة', 'اختبار الكتروني', 'virtual class'],
  },
  {
    department: 'it_support',
    hints: ['كلمة المرور', 'باسورد', 'password', 'حساب', 'account', 'ايميل', 'email', 'شبكة', 'wifi', 'vpn'],
  },
  { department: 'registration', hints: ['جدول', 'schedule', 'حذف', 'إضافة', 'سجل', 'transcript'] },
]

export function departmentForIssue(text: string): string {
  const t = text.toLowerCase()
  for (const r of ROUTES) if (r.hints.some((h) => t.includes(h.toLowerCase()))) return r.department
  return 'general'
}

export const createSupportTicket: ToolDefinition = {
  name: 'create_support_ticket',
  description:
    'Raise a support ticket for a technical or e-learning problem. Summarise the problem in the caller’s own words.',
  args: {
    summary: 'What is wrong, in one line',
    category: 'Optional: elearning, it_support, registration, student_services',
    contact: 'Optional: a phone number or university id to reach the caller on',
  },
  mock: true,

  async run(args) {
    const summary = str(args.summary)
    if (!summary) return { ok: false, error: 'Need a one-line summary of the problem.', mock: true }

    const id = str(args.category) || departmentForIssue(summary)
    const dept = departmentById(id) ?? departmentById('general')!

    return {
      ok: true,
      mock: true,
      data: {
        ticketId: `SR-${Date.now().toString().slice(-8)}`,
        department: dept.nameEn,
        departmentAr: dept.nameAr,
        status: 'Open',
        priority: 'Normal',
        expectedResponse: 'Within one business day',
        summary,
        contact: str(args.contact) || null,
        supportPhone: university.contact.supportPhone,
      },
    }
  },
}
