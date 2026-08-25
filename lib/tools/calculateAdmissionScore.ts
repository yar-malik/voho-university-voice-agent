import { university } from '@/config/university'
import { num, type ToolDefinition } from './types'

/**
 * The weighted admission score.
 *
 * This is the one tool in the project that is not a mock: it is arithmetic,
 * and the weights come from `config/university.ts` so an institution changes
 * them in one place. Everything else here is a stand-in for a real system.
 *
 * It deliberately refuses to say whether a score is good enough. Cut-offs
 * move every cycle and depend on the applicant pool; an assistant that tells
 * a student they will get in is making a promise the university then has to
 * break.
 */
export const calculateAdmissionScore: ToolDefinition = {
  name: 'calculate_admission_score',
  description:
    'Work out the weighted admission score from a high-school percentage, an aptitude (Qudurat) score and an achievement (Tahsili) score. Never say whether it is enough to be admitted.',
  args: {
    highSchoolScore: 'High school percentage, 0-100',
    aptitudeScore: 'Qudurat / aptitude score, 0-100',
    achievementScore: 'Tahsili / achievement score, 0-100',
  },
  mock: false,

  async run(args) {
    const highSchool = num(args.highSchoolScore)
    const aptitude = num(args.aptitudeScore)
    const achievement = num(args.achievementScore)

    const missing = [
      highSchool === null && 'highSchoolScore',
      aptitude === null && 'aptitudeScore',
      achievement === null && 'achievementScore',
    ].filter(Boolean)

    if (missing.length) {
      return { ok: false, error: `Missing or unreadable: ${missing.join(', ')}`, mock: false }
    }

    const values = { highSchool: highSchool!, aptitude: aptitude!, achievement: achievement! }
    for (const [k, v] of Object.entries(values)) {
      if (v < 0 || v > 100) {
        return { ok: false, error: `${k} must be between 0 and 100, got ${v}`, mock: false }
      }
    }

    const w = university.admissionScore.weights
    const weighted =
      values.highSchool * w.highSchool + values.aptitude * w.aptitude + values.achievement * w.achievement

    return {
      ok: true,
      mock: false,
      data: {
        weightedScore: Number(weighted.toFixed(2)),
        breakdown: {
          highSchool: { score: values.highSchool, weight: w.highSchool, contributes: Number((values.highSchool * w.highSchool).toFixed(2)) },
          aptitude: { score: values.aptitude, weight: w.aptitude, contributes: Number((values.aptitude * w.aptitude).toFixed(2)) },
          achievement: { score: values.achievement, weight: w.achievement, contributes: Number((values.achievement * w.achievement).toFixed(2)) },
        },
        note:
          'Indicative only. Admission cut-offs change each cycle and depend on the applicant pool. Do not tell the caller they are admitted.',
      },
    }
  },
}
