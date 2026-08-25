# The Voho API, as this project uses it

Every endpoint below is one this project actually calls. Nothing here is
invented; where a capability is missing it is called out rather than papered
over.

Base URL: `https://app.voho.ai/v1` (override with `VOHO_API_URL`)
Auth: `Authorization: Bearer voho_sk_live_…` on every request
Errors: `{ "error": { "code": "...", "message": "..." } }` on every endpoint

## `GET /v1/agents`

The agents this key's account owns.

```json
{ "agents": [ { "id": "…", "name": "IAU Assistant", "voice_id": "layla",
               "model": "sada-1", "language": "ar-SA", "status": "draft",
               "updated_at": "2026-08-25T…" } ] }
```

Used by `lib/voho/agents.ts` → `listAgents()`.

## `POST /v1/agents/{id}/reply`

One conversational turn. **The main endpoint this project runs on.**

```json
{
  "text": "وين وصل طلبي؟",
  "history": [ { "role": "user", "text": "…" }, { "role": "agent", "text": "…" } ],
  "variables": { "university": "جامعة الإمام عبدالرحمن بن فيصل" },
  "audio": true
}
```

```json
{
  "reply": "أكيد أساعدك. عطني رقم الطلب من فضلك.",
  "greeting": "…",
  "audio": "<base64>",
  "content_type": "audio/mpeg",
  "cost_cents": 3
}
```

Notes worth knowing:

- `history` is capped at the last 20 turns server-side. Sending more is harmless.
- `variables` are per request and override the agent's stored defaults. That is
  the point of them: one agent, a value per call.
- `audio: false` returns text only, and costs less. This project uses it for
  tool round-trips, so you never pay to synthesise a line nobody hears.

## `POST /v1/transcribe`

Multipart. Field `audio` is the file; field `language` is a BCP-47 code.

```json
{ "text": "وين وصل طلبي", "seconds": 3, "confidence": 0.94, "cost_cents": 3 }
```

Send `ar-SA` for Saudi callers. Voho expects English mid-sentence at that
setting, which is what a bilingual campus actually produces — a transcriber
pinned to one language writes nonsense at exactly those moments.

Audio should be 16 kHz mono WAV. `lib/audio/record.ts` does that conversion in
the browser, because browsers otherwise record WebM, Ogg or MP4 depending on
which one you are in.

## `POST /v1/speech`

Text in, **audio bytes out** — not JSON. Used by `lib/voho/speech.ts` when you
want speech without a conversational turn.

```json
{ "text": "…", "voice": "layla", "model": "sada-1", "format": "mp3" }
```

Formats: `mp3`, `wav`, `opus`, `mulaw`. `mulaw` at 8 kHz is what SIP trunks
carry, if you are wiring this to real telephony. The cost comes back in the
`X-Voho-Cost-Cents` header.

## `GET /v1/voices`

The voice catalogue — id, name, language, dialect, country.

## Not used here, but available

- `wss /v1/speech/ws` — streaming synthesis, for lower latency than
  request/response. On the roadmap.
- `POST /v1/documents/extract`, `POST /v1/documents/ask` — document
  understanding, if you want the assistant to answer from uploaded PDFs.
- `POST /v1/privacy/redact` — strip personal data from a transcript before it
  leaves your estate. Worth a look before you log call transcripts.

## The gap this project works around

`POST /v1/agents/{id}/reply` returns **text**, not structured function calls.

`lib/voho/tools.ts` is a clearly-marked adapter that gets tool calling anyway: the
agent is instructed to answer with a single `⟦TOOL⟧{…}` line when it needs a
system, and the adapter parses it, runs the tool, and feeds the result back.

This is a workaround, and it is labelled as one in the source. When Voho exposes
native tool calls, delete the marker handling and read the calls off the
response — nothing outside that file changes.
