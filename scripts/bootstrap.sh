#!/usr/bin/env bash
# scripts/bootstrap.sh
# Idempotently provisions Cloudflare resources for bookgenerators-web
# and mirrors Doppler secrets to Wrangler.
#
# Run once from the repo root after installing wrangler + doppler:
#   doppler setup        # link to your Doppler project
#   ./scripts/bootstrap.sh
#
# Safe to re-run; existing resources are detected and reused.

set -euo pipefail

cd "$(dirname "$0")/.."

WORKER_DIR="apps/web"
WRANGLER="wrangler --config $WORKER_DIR/wrangler.jsonc"
NAME="bookgenerators"

echo "==> Authenticating wrangler..."
$WRANGLER whoami

echo "==> D1 database..."
D1_ID=$($WRANGLER d1 list --json | jq -r ".[] | select(.name==\"$NAME\") | .uuid")
if [[ -z "$D1_ID" || "$D1_ID" == "null" ]]; then
  D1_ID=$($WRANGLER d1 create "$NAME" --json | jq -r ".uuid")
  echo "    created D1 $D1_ID"
else
  echo "    reused D1 $D1_ID"
fi

echo "==> KV namespace..."
KV_ID=$($WRANGLER kv namespace list | jq -r ".[] | select(.title==\"$NAME-kv\") | .id")
if [[ -z "$KV_ID" || "$KV_ID" == "null" ]]; then
  KV_ID=$($WRANGLER kv namespace create "$NAME-kv" | grep -oE 'id = "[^"]+' | sed 's/id = "//')
  echo "    created KV $KV_ID"
else
  echo "    reused KV $KV_ID"
fi

echo "==> R2 bucket..."
if ! $WRANGLER r2 bucket list | grep -q "$NAME"; then
  $WRANGLER r2 bucket create "$NAME"
  echo "    created R2 $NAME"
else
  echo "    reused R2 $NAME"
fi

echo "==> Patching wrangler.jsonc..."
node scripts/patch-wrangler.mjs "$WORKER_DIR/wrangler.jsonc" \
  "D1_ID=$D1_ID" \
  "KV_ID=$KV_ID"

echo "==> Generating BETTER_AUTH_SECRET..."
if ! $WRANGLER secret list --config "$WORKER_DIR/wrangler.jsonc" 2>/dev/null | grep -q BETTER_AUTH_SECRET; then
  SECRET=$(openssl rand -hex 32)
  echo "$SECRET" | $WRANGLER secret put BETTER_AUTH_SECRET --config "$WORKER_DIR/wrangler.jsonc"
fi

echo "==> Mirroring Doppler secrets to Wrangler..."
for KEY in AI_GATEWAY_BASE_URL AI_GATEWAY_TOKEN S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY RENDER_WORKER_INTERNAL_TOKEN KEYRING_MASTER_KEY; do
  VAL=$(doppler secrets get "$KEY" --plain 2>/dev/null || echo "")
  if [[ -n "$VAL" ]]; then
    if ! $WRANGLER secret list --config "$WORKER_DIR/wrangler.jsonc" 2>/dev/null | grep -q "$KEY"; then
      echo "$VAL" | $WRANGLER secret put "$KEY" --config "$WORKER_DIR/wrangler.jsonc"
    fi
  else
    echo "    Doppler missing $KEY — skipping"
  fi
done

echo "==> Applying D1 migrations..."
( cd "$WORKER_DIR" && pnpm db:migrate:remote )

echo "==> Done. Run \`pnpm cf-typegen\` then \`pnpm dev\` (in $WORKER_DIR)."
