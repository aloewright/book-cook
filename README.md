# Book Generators

Solo author SaaS — from market research to a launch-ready Kindle + Audible book. See `docs/superpowers/specs/` for the design.

## Provisioning

```bash
doppler setup     # link Doppler project once
./scripts/bootstrap.sh
```

**Run once by the project owner against the real Cloudflare account.** Idempotent. Provisions D1 + KV + R2, generates `BETTER_AUTH_SECRET`, mirrors other secrets from Doppler. The CI agent should NOT run this.
