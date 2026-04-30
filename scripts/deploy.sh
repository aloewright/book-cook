#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Build produces dist/client/bookgenerators_web/wrangler.json — deploy from there
# so the generated relative asset path ("../client") is correct.
( cd apps/web && pnpm build )
pnpm --filter web exec wrangler --config apps/web/dist/client/bookgenerators_web/wrangler.json deploy
echo "deployed."
