# Book Generators

Solo author SaaS — from market research to a launch-ready Kindle + Audible book. See `docs/superpowers/specs/` for the design.

## Quickstart

```bash
pnpm install
cd apps/web && pnpm dev
```

Visit http://localhost:5173. Sign up, create a project, chat with Aloysius (echo stub until Phase 2).

## Tests

```bash
pnpm test         # unit + integration (vitest / cloudflare:test)
pnpm test:e2e     # browser smoke (playwright, targets deployed URL by default)
pnpm typecheck    # tsc across workspace
```

## Deploy

```bash
./scripts/deploy.sh
```

Runs `pnpm build` then `wrangler deploy` from the generated `dist/client/bookgenerators_web/wrangler.json`.

## Provisioning

```bash
CLOUDFLARE_API_KEY=xxx CLOUDFLARE_EMAIL=xxx \
DOPPLER_PROJECT=quickapp DOPPLER_CONFIG=dev \
./scripts/bootstrap.sh
```

**Run once by the project owner against the real Cloudflare account.** Idempotent. Provisions D1 + KV + R2, generates `BETTER_AUTH_SECRET`, mirrors other secrets from Doppler. The CI agent should NOT run this.

## Architecture

See `docs/superpowers/specs/2026-04-26-bookgenerators-design.md`.
