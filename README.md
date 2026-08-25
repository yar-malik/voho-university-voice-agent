# University AI Voice Agent

**An open-source university voice assistant powered by [Voho](https://voho.ai).**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org)
[![Powered by Voho](https://img.shields.io/badge/voice-Voho-0b5d3b)](https://voho.ai)

A student rings the university. The assistant answers in Saudi Arabic, understands
what they want, looks it up in a real system, and either answers or puts them
through to a person. No menus, no "press 1".

The reference deployment is **Imam Abdulrahman Bin Faisal University (IAU)**. It is
a demo, not a product built for one institution — replace one config file and it is
your university.

```
Student speaks  →  Voho hears it  →  agent decides  →  university system  →  spoken answer
```

---

## What it does

| Capability | How | Status |
| --- | --- | --- |
| Answers admission questions | Knowledge base in `/data` | Demo content |
| Calculates a weighted admission score | `calculate_admission_score` | **Real** — it is arithmetic |
| Checks an application | `get_application_status` | Mock — swap for your SIS |
| Raises IT / Blackboard tickets | `create_support_ticket` | Mock — swap for your ticketing system |
| Routes to a human department | `transfer_to_department` | Simulated — wire to telephony |
| Sends a link by SMS / WhatsApp | `send_information` | Mock — swap for your provider |
| Switches Arabic ⇄ English mid-call | Prompt + Voho language handling | **Real** |

Every mock is one function with a documented return shape. Replacing one is a
single file change, and nothing on the agent side moves.

---

## Quick start

```bash
git clone https://github.com/yar-malik/voho-university-voice-agent.git
cd voho-university-voice-agent
npm install

cp .env.example .env.local     # add VOHO_API_KEY and VOHO_AGENT_ID
npm run dev                    # http://localhost:3000
```

You need two things from [app.voho.ai](https://app.voho.ai):

1. **An API token** — Console → API Tokens → create. Starts `voho_sk_live_`.
2. **An agent** — Console → Agents → create one, pick an Arabic voice such as
   Layla, set the language to Arabic (Saudi Arabia), and copy its ID from the URL.

The page renders without them and tells you what is missing, so you can look
around before signing up.

### Check the tools without a key

```bash
npm run try:tools
```

Runs every tool directly — no network, no model, no key. This is the first thing
to get passing when you replace a mock with a real system.

---

## How the Voho integration works

All Voho code is in **`lib/voho/`** and nowhere else.

| File | Endpoint | What it does |
| --- | --- | --- |
| `client.ts` | — | Bearer auth, error translation, `server-only` guard |
| `agents.ts` | `GET /v1/agents`, `POST /v1/agents/{id}/reply` | List agents; take a conversational turn |
| `speech.ts` | `POST /v1/speech`, `GET /v1/voices` | Text to speech; the voice catalogue |
| `transcribe.ts` | `POST /v1/transcribe` | Speech to text |
| `tools.ts` | — | **Adapter.** See below |
| `types.ts` | — | The response shapes, taken from the live API |

Authentication is a bearer token on every request:

```
Authorization: Bearer voho_sk_live_...
```

Errors always arrive as `{ "error": { "code", "message" } }`, so they are
translated once, in `client.ts`, into a typed `VohoError`.

### The one honest caveat

`POST /v1/agents/{id}/reply` is **text in, text and audio out**. It does not
return structured function calls the way a chat-completions API does.

Rather than invent an endpoint that does not exist, `lib/voho/tools.ts` is a
clearly-marked adapter. The agent is told — in the text it receives, so no
undocumented Voho feature is assumed — to answer with a single line when it
needs a university system:

```
⟦TOOL⟧{"tool":"get_application_status","args":{"applicationId":"IAU-2026-10877"}}
```

The adapter recognises that line, runs the tool locally, feeds the result back,
and asks the agent to say the answer out loud. Tool round-trips are requested
with `audio: false`, so the marker is never spoken and you are never billed for
speech nobody hears.

**When Voho ships native tool calls, delete the marker handling and read the
calls off the response.** Nothing outside that one file needs to change.

---

## Architecture

```
┌─────────────┐   audio    ┌──────────────┐   POST /v1/transcribe   ┌──────────┐
│   Browser   │ ─────────► │  Next.js API │ ──────────────────────► │   Voho   │
│  (no keys)  │            │   (server)   │   POST /v1/agents/…     │          │
└─────────────┘ ◄───────── └──────────────┘ ◄────────────────────── └──────────┘
                 reply +          │  ▲            reply + audio
                 audio +          │  │
                 tool log         ▼  │ result
                            ┌──────────────┐
                            │  lib/tools/  │  SIS · LMS · ticketing · SMS
                            │   (mocked)   │
                            └──────────────┘
```

```text
/app
  /api/voice/turn         one conversational turn, including tool calls
  /api/voice/transcribe   audio → text
  /api/status             what is configured, for the UI
  page.tsx                the demo
/components               UI: transcript, action log, controls
/config
  university.ts           ← the only file you must edit to change institution
/lib
  /voho                   the Voho integration, isolated
  /tools                  the five university tools
  /knowledge              knowledge base loading + prompt assembly
  agentPrompt.ts          the brief the assistant is given
  /audio                  browser mic capture → 16 kHz mono WAV
/data                     iau-faqs.json, iau-services.json, iau-programs.json,
                          demo-applications.json  (all fictional)
/docs                     architecture, deployment, security, Voho API notes
/scripts                  try-tools.ts
```

Full detail in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## Make it your university

Edit **`config/university.ts`**. That is the whole job:

```ts
export const university: UniversityConfig = {
  nameAr: 'جامعة الإمام عبدالرحمن بن فيصل',
  nameEn: 'Imam Abdulrahman Bin Faisal University',
  shortName: 'IAU',
  primaryLanguage: 'ar-SA',
  greetingAr: 'السلام عليكم، أهلاً بك في …',
  departments: [ /* routing table */ ],
  admissionScore: { weights: { highSchool: 0.3, aptitude: 0.3, achievement: 0.4 } },
  branding: { primary: '#0B5D3B', accent: '#C9A227', surface: '#F7F8F7' },
}
```

Then replace the files in `/data` with your own information. Nothing in `lib/` or
`components/` names a university.

---

## What can you build?

The five tools here are examples of one pattern: **the assistant decides, your
system answers.** The same pattern connects to anything with an API.

- **Admissions** — application status, requirements, deadlines, document chasing
- **Student information systems** — Banner, PeopleSoft, Ellucian, in-house
- **LMS** — Blackboard, Moodle, Canvas: enrolment, deadlines, access problems
- **Ticketing** — ServiceNow, Jira Service Management, Freshservice, Zendesk
- **CRM** — recruitment pipelines, applicant follow-up, open-day booking
- **ERP** — fees, invoices, stipends, procurement
- **Scheduling** — advisor appointments, exam slots, lab bookings
- **Messaging** — SMS, WhatsApp, email confirmations
- **Call centres** — overflow, out-of-hours, first-line triage before a human

Peak periods are the case that pays for itself: results day, registration week,
and the fortnight before a deadline, when a call centre gets a year's volume in
ten days.

---

## Example conversation

```
Assistant  السلام عليكم، أهلاً بك في جامعة الإمام عبدالرحمن بن فيصل.
           أنا المساعد الصوتي الذكي للجامعة. كيف أقدر أخدمك اليوم؟

Student    وين وصل طلبي؟

Assistant  أكيد أساعدك. عطني رقم الطلب من فضلك.

Student    IAU-2026-10877

           ⟦TOOL⟧ get_application_status { applicationId: "IAU-2026-10877" }
           →  status: "Action required"
              stage:  "Documents incomplete"
              missing: ["High school certificate (attested copy)", "Recent photograph"]

Assistant  طلبك وصل لمرحلة مراجعة المستندات، وناقصك شهادة الثانوية مصدّقة
           وصورة شخصية حديثة. تبيني أرسل لك رابط رفع المستندات برسالة؟
```

The action log in the demo shows exactly this — the call, the arguments and the
result — because the thing an institution is evaluating is not whether a model
can talk. It is whether it reaches their systems and comes back with the truth.

---

## Screenshots

> Add your own after running the demo — the page is at `/`.

| The demo | What it shows |
| --- | --- |
| Live call panel | Transcript, language toggle, call status, cost |
| Action log | Every tool call with arguments, result, and a `MOCK` badge |
| Connected systems | What is real and what is a stand-in |
| Knowledge base | FAQ / programme / service counts and the scoring weights |

---

## Security

Read [docs/SECURITY.md](./docs/SECURITY.md) before going anywhere near real data.

- **No real data is in this repository.** Every application record is fictional
  and the national ids are deliberately invalid so they cannot collide with a
  real person.
- **The Voho key never reaches the browser.** `lib/voho/client.ts` carries
  `import 'server-only'`, which makes it a build error for a client component to
  import it. The browser talks only to this app's own `/api/voice/*` routes.
- **Application lookups are unauthenticated in the demo.** They must not be in
  production: an application record is personal data. On a phone channel the
  usual answer is an OTP to the number on file. `docs/SECURITY.md` says where.
- **`send_information` will send to any number in the demo.** Send to the number
  on the student's record, or verify it, before this is real.

---

## Deployment

```bash
npm run build && npm run start
```

Or one click on Vercel. Set `VOHO_API_KEY` and `VOHO_AGENT_ID` as environment
variables — never in the repository. Full notes, including Docker and a
self-hosted Node deployment, in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## Roadmap

- [ ] Native Voho tool calls, replacing the marker adapter in `lib/voho/tools.ts`
- [ ] Streaming audio over `wss /v1/speech/ws` for lower latency than request/response
- [ ] Live telephony transfer (SIP REFER / Twilio) behind `transfer_to_department`
- [ ] Reference SIS adapters — Banner and PeopleSoft
- [ ] Caller verification (OTP) before any personal record is read out
- [ ] Retrieval over a document set, for institutions whose knowledge outgrows a prompt
- [ ] Post-call summary webhook into a CRM
- [ ] Second reference institution, to prove the config abstraction holds

---

## Contributing

Issues and pull requests welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Adding an adapter for a real SIS,
LMS or SMS provider is the most useful thing anyone could contribute.

## Licence

MIT. See [LICENSE](./LICENSE).

Voho is a product of Voho AI. This repository is a reference integration and is
not affiliated with, or endorsed by, Imam Abdulrahman Bin Faisal University.
IAU is used as an illustrative example.
