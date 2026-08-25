# Deployment

## Environment

Two variables, both server-side:

| Variable | Required | Notes |
| --- | --- | --- |
| `VOHO_API_KEY` | yes | `voho_sk_live_…` from Console → API Tokens |
| `VOHO_AGENT_ID` | yes | The agent's id from Console → Agents |
| `VOHO_API_URL` | no | Defaults to `https://app.voho.ai/v1` |

Never commit these. `.env.local` is gitignored; use your platform's secret store
in production.

## Vercel

1. Import the repository.
2. Add `VOHO_API_KEY` and `VOHO_AGENT_ID` under Settings → Environment Variables.
3. Deploy. No build configuration needed.

The API routes run on the Node runtime (`export const runtime = 'nodejs'`) because
transcription posts multipart form data.

## Docker

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
```

```bash
docker build -t university-voice-agent .
docker run -p 3000:3000 \
  -e VOHO_API_KEY=voho_sk_live_… \
  -e VOHO_AGENT_ID=… \
  university-voice-agent
```

## A plain Node host

```bash
npm ci && npm run build
NODE_ENV=production PORT=3000 npm run start
```

Behind nginx, the only thing that matters is a generous `proxy_read_timeout`: a
turn that needs a tool round-trip can take several seconds, and a 60-second
default will cut off a slow lookup.

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_read_timeout 120s;
}
```

## Before you show it to a customer

- [ ] Real knowledge in `/data`, with `"source"` changed from `demo`
- [ ] `config/university.ts` filled in for the institution
- [ ] Rate limiting on `/api/voice/*`
- [ ] Caller verification before `get_application_status` (see SECURITY.md)
- [ ] A Voho balance that will survive the demo
- [ ] One real call made end to end, by a person, out loud
