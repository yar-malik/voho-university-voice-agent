import { university } from '@/config/university'
import { hasDemoData, FAQS, PROGRAMS, SERVICES } from '@/lib/knowledge'
import { toolCatalogue } from '@/lib/tools'
import { isConfigured, vohoApiUrl } from '@/lib/voho/client'
import { VoiceDemo } from '@/components/VoiceDemo'
import type { DemoStatus } from '@/components/types'

export const dynamic = 'force-dynamic'

/**
 * The demo page.
 *
 * Server component: the status is read here, so the page can say plainly that
 * a key is missing instead of failing at the first click, and so nothing about
 * the Voho credential reaches the browser.
 */
export default function Page() {
  const status: DemoStatus = {
    configured: isConfigured(),
    agentConfigured: Boolean(process.env.VOHO_AGENT_ID),
    apiUrl: vohoApiUrl(),
    demoData: hasDemoData(),
    university: {
      nameAr: university.nameAr,
      nameEn: university.nameEn,
      shortName: university.shortName,
      languages: university.supportedLanguages,
      departments: university.departments.map((d) => ({ id: d.id, nameEn: d.nameEn, nameAr: d.nameAr })),
      weights: university.admissionScore.weights,
    },
    tools: toolCatalogue().map((t) => ({
      name: t.name,
      description: t.description,
      args: Object.keys(t.args),
      mock: t.mock,
    })),
  }

  const w = university.admissionScore.weights

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
      {/* ------------------------------------------------------------ header */}
      <header className="mb-7">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[15px] font-bold text-white"
            style={{ background: university.branding.primary }}
          >
            {university.shortName}
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">
              {university.shortName} AI Voice Assistant
            </h1>
            <p className="text-[14px] text-dim">
              AI-powered student support, admissions and university services
            </p>
          </div>
          <span className="flex-1" />
          <a
            href="https://voho.ai"
            className="rounded-full border border-line px-3 py-1.5 text-[12.5px] text-dim transition-colors hover:bg-surface"
          >
            Powered by Voho
          </a>
        </div>

        <p dir="rtl" lang="ar" className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-[15px] leading-relaxed">
          {university.greetingAr}
        </p>
      </header>

      {/* --------------------------------------------------------- warnings */}
      {!status.configured && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13.5px] leading-relaxed text-amber-900">
          <strong className="font-semibold">Not connected to Voho.</strong> Copy{' '}
          <code className="mono">.env.example</code> to <code className="mono">.env.local</code>, add your{' '}
          <code className="mono">VOHO_API_KEY</code> and <code className="mono">VOHO_AGENT_ID</code>, and
          restart. Until then the page renders but the assistant cannot answer.
        </div>
      )}
      {status.configured && !status.agentConfigured && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
          <strong className="font-semibold">No agent selected.</strong> Set{' '}
          <code className="mono">VOHO_AGENT_ID</code> to an agent from your Voho console.
        </div>
      )}

      <VoiceDemo status={status} />

      {/* ------------------------------------------------------- how it works */}
      <section className="mt-10">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">How a call actually runs</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { n: '1', t: 'Voice in', d: 'The student speaks. Voho transcribes Saudi Arabic or English.' },
            { n: '2', t: 'Understanding', d: 'The agent works out what they want, from the prompt and the knowledge base.' },
            { n: '3', t: 'Tool call', d: 'It asks for a university system — a lookup, a ticket, a transfer.' },
            { n: '4', t: 'Enterprise system', d: 'Your SIS, LMS or ticketing system answers. Mocked here.' },
            { n: '5', t: 'Spoken result', d: 'The answer is said back in the caller’s own language.' },
          ].map((s) => (
            <div key={s.n} className="card p-4">
              <span className="mono text-[11px] text-accent">STEP {s.n}</span>
              <p className="mt-1 text-[14px] font-medium">{s.t}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- tools */}
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <span className="eyebrow">Connected systems</span>
          <div className="mt-3 space-y-2.5">
            {status.tools.map((t) => (
              <div key={t.name} className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.mock ? 'bg-amber-400' : 'bg-primary'}`}
                />
                <div className="min-w-0">
                  <p className="mono text-[12.5px] font-medium">
                    {t.name}
                    {t.mock && <span className="ml-2 text-[10px] font-semibold text-amber-700">MOCK</span>}
                  </p>
                  <p className="text-[12.5px] leading-relaxed text-dim">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-faint">
            Mocked tools return realistic fixtures. Each is one function to replace with the
            university&rsquo;s own API — see <code className="mono">lib/tools/</code>.
          </p>
        </div>

        <div className="card p-5">
          <span className="eyebrow">Knowledge base</span>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            {[
              { n: FAQS.length, l: 'FAQs' },
              { n: PROGRAMS.length, l: 'Programmes' },
              { n: SERVICES.length, l: 'Services' },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-line py-3">
                <p className="text-[20px] font-semibold">{x.n}</p>
                <p className="text-[11.5px] text-faint">{x.l}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[12.5px] leading-relaxed text-dim">
            Weighted score: {Math.round(w.highSchool * 100)}% high school +{' '}
            {Math.round(w.aptitude * 100)}% aptitude + {Math.round(w.achievement * 100)}% achievement.
          </p>

          {status.demoData && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
              This knowledge base is <strong>demo data</strong>, not official university policy. Replace
              the files in <code className="mono">/data</code> before using it anywhere real.
            </p>
          )}
        </div>
      </section>

      <footer className="mt-10 border-t border-line pt-5 text-[12.5px] leading-relaxed text-faint">
        <p>
          Open-source reference implementation. {university.nameEn} is the demo institution — fork the
          repository and replace <code className="mono">config/university.ts</code> with your own.
        </p>
        <p className="mt-1">
          All student records here are fictional. No real student data, national ids or private
          university information are included.
        </p>
      </footer>
    </main>
  )
}
