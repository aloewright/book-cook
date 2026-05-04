# Book Generators

Solo-author SaaS that takes a writer from market research to a launch-ready Kindle and Audible book — without leaving the app. The product is structured around five skills (Market Scout, Book Architect, Chapter Writer, Publisher Pack, Launch Handoff), coordinated by an opinionated chat agent named **Aloysius**.

v1 ships nonfiction-first; the chassis is genre-agnostic and fiction (multi-voice TTS, fiction frameworks) is additive in v1.5.

Full design: [`docs/superpowers/specs/2026-04-26-bookgenerators-design.md`](docs/superpowers/specs/2026-04-26-bookgenerators-design.md).

## Stack

- **Runtime** — A single Cloudflare Worker at `bookgenerators.com`
- **Backend** — Hono on the server (`/api/*`), Agents SDK WebSocket (`/agents/*`)
- **Frontend** — React 19 + Vite SPA, served as static assets from the Worker (SPA fallback via `single-page-application` asset binding)
- **Routing** — TanStack Router
- **Editor** — BlockNote
- **Data** — Drizzle ORM targeting D1; KV for sessions; R2 for samples and renders
- **Auth** — Better Auth (with KV `secondaryStorage`)
- **Agent** — One Durable Object per book project (Agents SDK), `BookProjectAgent`
- **Heavy compute** — Cloudflare Workflows + Queues feeding a single `render-worker` Container (`pandoc`, `libreoffice`, `ffmpeg`, `kindlegen`) — see `services/render-worker/`
- **Models** — All LLM, embedding, TTS, and image calls route through Cloudflare AI Gateway dynamic routes. No direct provider calls.
- **Observability** — Sentry on the Cloudflare Worker

## Quickstart

```bash
pnpm install
cd apps/web && pnpm dev
```

Visit http://localhost:5173. Sign up, create a project, and chat with Aloysius — the Editorial Assistant.

## Tests

```bash
pnpm test         # unit + integration (vitest / cloudflare:test)
pnpm test:e2e     # browser smoke (playwright; targets the deployed URL by default)
pnpm typecheck    # tsc across workspace
```

## Deploy

```bash
./scripts/deploy.sh
```

Runs `pnpm build`, then `wrangler deploy` against the generated `dist/client/bookgenerators_web/wrangler.json`.

## Provisioning

Run once by the project owner against the real Cloudflare account. The script is idempotent. The CI agent should NOT run this.

It provisions D1 + KV + R2, generates `BETTER_AUTH_SECRET`, and mirrors other secrets from Doppler.

```bash
CLOUDFLARE_API_KEY=xxx CLOUDFLARE_EMAIL=xxx \
DOPPLER_PROJECT=quickapp DOPPLER_CONFIG=dev \
./scripts/bootstrap.sh
```

## Repository layout

```
apps/
  web/                  Cloudflare Worker — Hono server + React 19 SPA
    src/                server: routes, middleware, agents, skills, db
    client/             React SPA (TanStack Router + BlockNote)
    drizzle/            generated migrations
    wrangler.jsonc      Worker config
services/
  render-worker/        Cloudflare Container — pandoc / libreoffice / ffmpeg / kindlegen
docs/
  superpowers/specs/    design specs, including the canonical design doc
scripts/
  bootstrap.sh          one-time provisioning via Doppler + wrangler
  deploy.sh             build + wrangler deploy
tests/
  e2e/                  playwright smoke against the deployed URL
```

## Architecture

See [`docs/superpowers/specs/2026-04-26-bookgenerators-design.md`](docs/superpowers/specs/2026-04-26-bookgenerators-design.md) for the canonical design.

Highlights:

- **One DO per project, not per user.** Each book has its own conversation, its own currently-open chapter, and its own WebSocket fanout. Per-user would force serialization of cross-book chats.
- **Skill modules are pure functions of `(ctx, params)`.** Both REST endpoints and Aloysius's tool calls invoke the same modules — no logic duplication.
- **D1 + R2 own all persistent state.** The DO handles conversation state and WebSocket fanout only.
- **Heavy work runs out-of-band.** Workflows fan out to Queues consumed by the `render-worker` Container.
- **All model traffic flows through AI Gateway.** Helper at `apps/web/src/lib/gateway.ts` is the only place that knows the gateway URL.
