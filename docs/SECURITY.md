# Security

## What is in this repository

Nothing real. Every application record in `data/demo-applications.json` is
fictional, the applicant names say so, and the national ids (`0000000001`…) are
deliberately not valid Saudi ids so they cannot collide with a real person.

Do not add real records to this repository, even briefly, even in a branch. Git
remembers.

## The Voho credential

`VOHO_API_KEY` is a bearer token with spending power. It is read only in
`lib/voho/client.ts`, which carries `import 'server-only'` — a client component
that imports it, directly or through a chain, fails the build.

The browser never sees it and never needs to: it talks to `/api/voice/*` on this
app's own origin.

Rotate the token if it is ever pasted into a chat, a ticket, a screenshot or a
log. Voho tokens are revocable from the console.

## What the demo does that production must not

### Application lookups are unauthenticated

`get_application_status` will read out an application to anyone who says the
number. In the demo that is the point — it is fictional data. In production an
application record is personal data under PDPL, and a phone channel needs the
caller verified before it is read.

The usual answer is an OTP to the number already on the student's record:

```ts
async run(args) {
  const session = await requireVerifiedCaller(args.callSessionId)   // you write this
  if (!session) return { ok: false, mock: false, error: 'Caller not verified' }
  // …then look the application up, scoped to session.nationalId
}
```

Scope the lookup to the verified identity. A verified caller must not be able to
read *someone else's* application by giving a different number.

### `send_information` sends to any number

Send to the number on the student's record, or verify the one given, before this
is real. Otherwise it is a way to make the university's own systems send
messages to strangers.

### Every lookup should be logged

Who asked, for which record, when, and whether it succeeded. That is what makes
a data-access question answerable six months later.

## Rate limiting

There is none in the demo. A public voice endpoint that calls a paid API needs
it — per caller and per IP — or the first person who notices can spend your
Voho balance.

## Prompt injection

A caller can say anything, and what they say reaches the model. The agent brief
tells it never to state a requirement it cannot support and never to reveal
application data without identification, but a prompt is a guardrail, not a
boundary.

The boundary is in the tools: `get_application_status` must enforce
authorisation in code, not by asking the model nicely. Treat everything the
model produces as untrusted input to your systems — validate arguments in `run`,
which is why every tool here does.

## Reporting a vulnerability

Open a security advisory on the repository rather than a public issue.
