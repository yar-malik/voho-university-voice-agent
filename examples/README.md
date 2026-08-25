# Examples

## Talk to the demo over HTTP

The app exposes the same turn endpoint the browser uses. With the server
running (`npm run dev`):

```bash
curl -s localhost:3000/api/voice/turn \
  -H 'Content-Type: application/json' \
  -d '{"text":"الثانوية ٩٥، القدرات ٨٧، والتحصيلي ٨٢. احسب نسبتي","language":"ar-SA","audio":false}' \
  | jq '{reply, toolCalls}'
```

```bash
# Application lookup — uses the fictional fixtures in data/demo-applications.json
curl -s localhost:3000/api/voice/turn \
  -H 'Content-Type: application/json' \
  -d '{"text":"وين وصل طلبي؟ رقم الطلب IAU-2026-10877","audio":false}' \
  | jq '{reply, toolCalls}'
```

```bash
# What is configured
curl -s localhost:3000/api/status | jq
```

## Call Voho directly

Nothing in this repository is required for these — they are the raw API.

```bash
# List your agents
curl -s https://app.voho.ai/v1/agents \
  -H "Authorization: Bearer $VOHO_API_KEY" | jq

# One conversational turn
curl -s https://app.voho.ai/v1/agents/$VOHO_AGENT_ID/reply \
  -H "Authorization: Bearer $VOHO_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"text":"كيف أقدم على الجامعة؟","audio":false}' | jq

# Speech, straight to a file
curl -s https://app.voho.ai/v1/speech \
  -H "Authorization: Bearer $VOHO_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"text":"أهلاً بك في الجامعة","voice":"layla","format":"mp3"}' \
  --output greeting.mp3

# Transcribe a clip
curl -s https://app.voho.ai/v1/transcribe \
  -H "Authorization: Bearer $VOHO_API_KEY" \
  -F audio=@clip.wav -F language=ar-SA | jq
```

## Exercise the tools with no key at all

```bash
npm run try:tools
```
