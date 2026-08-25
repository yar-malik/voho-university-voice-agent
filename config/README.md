# Configuring an institution

`university.ts` is the only file you have to change. Nothing in `lib/` or
`components/` names a university.

## What each field does

| Field | Used by |
| --- | --- |
| `nameAr` / `nameEn` / `shortName` | The agent brief, the page header, the logo mark |
| `primaryLanguage` | Which language the assistant opens in, and the transcription default |
| `greetingAr` / `greetingEn` | The first thing a caller hears |
| `departments` | The routing table for `transfer_to_department`, and the agent's brief |
| `admissionScore.weights` | `calculate_admission_score`. Must sum to 1 |
| `contact` | What the assistant can read out or send |
| `branding` | The demo shell's colours |
| `knowledgeSources` | Which files in `/data` make up the knowledge base |

## Departments

The `id` is what the agent uses, so keep it stable and machine-ish. `handlesEn`
and `handlesAr` go straight into the brief, so write them as a description of
what the desk actually deals with — that text is what decides whether a call is
routed correctly.

```ts
{
  id: 'admissions',
  nameAr: 'القبول والتسجيل',
  nameEn: 'Admissions',
  handlesAr: 'شروط القبول، التقديم، النسب الموزونة، حالة الطلب',
  handlesEn: 'Admission requirements, applying, weighted scores, application status',
}
```

## Scoring weights

```ts
admissionScore: { weights: { highSchool: 0.3, aptitude: 0.3, achievement: 0.4 } }
```

The shipped figures are the demo's, not published policy. Confirm them against
your admission regulations for the current cycle before anyone relies on them.

`indicativeCutoffs` are displayed nowhere and never spoken. They exist so a
future feature can show a range without the assistant ever telling a student
they will be admitted — cut-offs move every year and depend on who applied.

## Then replace the knowledge

`/data/*.json`. Every record carries `"source": "demo"`. While any of them do,
`lib/knowledge/index.ts` appends a warning to the agent's brief telling it to
treat the content as illustrative and to transfer for anything a decision
depends on. Change the marker when the content is real, and that warning
disappears by itself.
