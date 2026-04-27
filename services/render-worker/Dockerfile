FROM node:22-bookworm-slim

# Tools landed by later plans (Publisher phase). Kept here so the image
# stays canonical and incremental rebuilds are cheap.
RUN apt-get update \
 && apt-get install -y --no-install-recommends pandoc libreoffice-core ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --prod --no-frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm exec tsc

ENV PORT=8787
EXPOSE 8787
CMD ["node", "dist/index.js"]
