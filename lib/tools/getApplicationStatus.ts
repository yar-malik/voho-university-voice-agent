import demo from '@/data/demo-applications.json'
import { str, type ToolDefinition } from './types'

/**
 * MOCK — replace with the university's Student Information System.
 *
 * Reads a fixture file. Every record in it is fictional: the names are
 * invented, and the national ids are deliberately not valid Saudi ids so
 * that nothing here can collide with a real person.
 *
 * To make this real, replace the body of `run` with a call to the SIS —
 * Banner, PeopleSoft, Ellucian, or an in-house API — and keep the returned
 * shape. Nothing else in the project changes.
 *
 * PRODUCTION NOTE: an application record is personal data. Before this talks
 * to a real system it needs the caller authenticated — an OTP to the number
 * on file is the usual answer for a phone channel — and every lookup logged.
 * See docs/SECURITY.md.
 */
interface DemoApplication {
  applicationId: string
  nationalId: string
  applicantName: string
  program: string
  status: string
  stage: string
  missingDocuments: string[]
  updatedAt: string
}

const RECORDS = demo as DemoApplication[]

export const getApplicationStatus: ToolDefinition = {
  name: 'get_application_status',
  description:
    'Look up an admission application by application id or national id. Ask for whichever the caller has.',
  args: {
    applicationId: 'Application reference, e.g. IAU-2026-10432 (optional if nationalId given)',
    nationalId: 'National / iqama id (optional if applicationId given)',
  },
  mock: true,

  async run(args) {
    const applicationId = str(args.applicationId).toUpperCase()
    const nationalId = str(args.nationalId)

    if (!applicationId && !nationalId) {
      return { ok: false, error: 'Need either an applicationId or a nationalId.', mock: true }
    }

    const found = RECORDS.find(
      (r) =>
        (applicationId && r.applicationId.toUpperCase() === applicationId) ||
        (nationalId && r.nationalId === nationalId),
    )

    if (!found) {
      return {
        ok: false,
        mock: true,
        error:
          'No application found with those details. Offer to double-check the number or transfer to Admissions.',
      }
    }

    return { ok: true, mock: true, data: found }
  },
}
