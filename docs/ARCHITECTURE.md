# Architecture

## The shape of a turn

1. The browser records a clip and re-encodes it as 16 kHz mono WAV
   (`lib/audio/record.ts`). Browsers otherwise record whatever they like —
   Safari's MP4/AAC is refused by transcribers outright.
2. `POST /api/voice/transcribe` sends it to `POST /v1/transcribe`.
3. `POST /api/voice/turn` sends the text to `POST /v1/agents/{id}/reply`.
4. If the reply contains a tool marker, `lib/voho/tools.ts` runs the tool from
   `lib/tools/` and asks again with the result.
5. The final reply is returned with base64 audio and a log of every tool call.

Steps 3–5 loop up to three times. A conversation that needs more than three
system lookups in one turn is one that should have been handed to a person, and
the adapter says so rather than looping.

## Why the browser holds nothing

`lib/voho/client.ts` carries `import 'server-only'`. Any client component that
imports it — directly or through a chain — fails the build. That is the whole
enforcement: not a convention, a compile error. The browser talks only to this
app's own routes.

## Where the prompt lives

In this repository (`lib/agentPrompt.ts`), not in the Voho console.

The tool list and the knowledge base change with the code, and a prompt stored
somewhere else drifts out of step the moment someone adds a tool. The console
agent supplies the voice, the language and the identity; this supplies the job.

The brief is sent on the **first** turn only. After that it is in the history
Voho already has, and re-sending it every turn pays for the same tokens over and
over.

## Why the knowledge base is files

A university's admission rules are a page of facts, not a corpus, and a page of
facts fits in the prompt. That makes it auditable: whatever the assistant said,
you can point at the line it came from. Reach for retrieval when the knowledge
outgrows the context window — not before, and there is a roadmap item for it.

Everything under `/data` is marked `"source": "demo"`. `lib/knowledge/index.ts`
notices, and appends a warning to the prompt telling the agent to treat it as
illustrative and to transfer for anything a decision depends on. Replace the
files and change the marker and that warning disappears on its own.

## The tool contract

```ts
interface ToolDefinition {
  name: string
  description: string                    // becomes the agent's instructions
  args: Record<string, string>           // argument name → what it is
  mock: boolean                          // drives the MOCK badge in the UI
  run: (args: Record<string, unknown>) => Promise<ToolResult>
}
```

A plain async function. No framework, no code generation, no Voho types. That is
deliberate: the interface a university has to satisfy when it replaces a mock
should be one they could have written themselves.

`runTool` never throws. A tool that fails returns `{ ok: false, error }`, and the
agent is told what went wrong so it can say something true — "I couldn't find
that number, shall I put you through to Admissions?" is a good answer. A stack
trace is not.

## Adding a tool

1. Write it in `lib/tools/yourTool.ts`, exporting a `ToolDefinition`.
2. Add it to the array in `lib/tools/index.ts`.

That is all. The agent's instructions are generated from the registry, so a tool
is offered to the model the moment it is registered — and cannot be offered
without being implemented.

## Replacing a mock with a real system

Only the body of `run` changes. Keep the returned shape and nothing else moves:
not the prompt, not the UI, not the adapter.

```ts
async run(args) {
  const res = await fetch(`${process.env.SIS_API_URL}/applications/${id}`, {
    headers: { Authorization: `Bearer ${process.env.SIS_API_KEY}` },
  })
  if (!res.ok) return { ok: false, mock: false, error: 'Lookup failed' }
  return { ok: true, mock: false, data: await res.json() }
}
```

Set `mock: false` on the definition and the `MOCK` badge disappears from the UI.

## Files that know about a university

One: `config/university.ts`. Plus the contents of `/data`. Nothing in `lib/` or
`components/` names an institution — that is the property that makes this a
reference implementation rather than one university's app.
