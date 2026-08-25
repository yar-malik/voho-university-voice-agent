import { departmentById, university } from '@/config/university'
import { str, type ToolDefinition } from './types'

/**
 * SIMULATED — replace with the telephony platform's transfer.
 *
 * On a real line this is a SIP REFER, a Twilio `<Dial>`, or whatever the
 * contact centre exposes. In the demo it returns the department it would
 * have transferred to, which is enough to show the routing decision was made
 * correctly — and that is the part a university is actually evaluating.
 *
 * The department list is `config/university.ts`. A transfer to a department
 * that is not in it fails rather than guessing, because a caller sent to the
 * wrong desk has to explain themselves twice.
 */
export const transferToDepartment: ToolDefinition = {
  name: 'transfer_to_department',
  description:
    'Hand the call to a human department. Use when the caller asks for a person, or when the question needs one.',
  args: {
    department: `One of: ${university.departments.map((d) => d.id).join(', ')}`,
    reason: 'One line on why, so the department does not have to ask again',
  },
  mock: true,

  async run(args) {
    const id = str(args.department).toLowerCase().replace(/[\s-]+/g, '_')
    const dept = departmentById(id)

    if (!dept) {
      return {
        ok: false,
        mock: true,
        error: `Unknown department "${id}". Valid: ${university.departments.map((d) => d.id).join(', ')}`,
      }
    }

    return {
      ok: true,
      mock: true,
      data: {
        transferredTo: dept.nameEn,
        transferredToAr: dept.nameAr,
        department: dept.id,
        reason: str(args.reason) || null,
        handles: dept.handlesEn,
        phone: dept.phone ?? university.contact.supportPhone,
        note: 'Simulated transfer. Wire to your telephony platform for a real one.',
      },
    }
  },
}
