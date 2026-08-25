# Contributing

Thanks for looking. The most useful contribution to this project is an adapter
for a real system — a student information system, an LMS, a ticketing platform,
an SMS provider — because that is the work every institution otherwise repeats.

## Getting set up

```bash
npm install
cp .env.example .env.local     # add VOHO_API_KEY and VOHO_AGENT_ID
npm run dev
```

You can work on the tool layer with no key at all:

```bash
npm run try:tools
```

## Before opening a pull request

```bash
npm run typecheck
npm run build
npm run try:tools
```

All three must pass. There is no test framework yet; `try:tools` is the safety
net for the tool layer, and adding cases to `scripts/try-tools.ts` alongside a
new tool is expected.

## Adding a tool

1. `lib/tools/yourTool.ts`, exporting a `ToolDefinition`.
2. Register it in `lib/tools/index.ts`.
3. Add a case to `scripts/try-tools.ts`, including one that fails.

Validate arguments inside `run`. The model produces them, and the model is
untrusted input. Return `{ ok: false, error }` rather than throwing — the agent
turns a clear error into a sentence a caller can act on.

## Adding a real integration

Keep the mock. Put the real call behind an environment variable and fall back:

```ts
if (!process.env.SIS_API_URL) return mockResult()
```

That way the repository still runs for someone who just cloned it, which is the
whole point of a reference implementation.

## Adding a university

Do not fork the config into a second file. If `config/university.ts` cannot
express your institution, that is a bug in the config shape and worth an issue —
the abstraction holding for a second university is what proves it works.

## Style

Match what is there. Comments explain *why*, not what — the code says what.
Prose in the UI and docs is British English; Arabic strings should read as a
Saudi student would actually say them, not as translated formal Arabic.

## What will not be merged

- Real student data, real national ids, or anything from a live university system
- Invented Voho endpoints — if a capability is missing, add an adapter and say so
- A demo that claims a live integration it does not have
