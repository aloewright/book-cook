import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";
import { resolve } from "node:path";

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(resolve(__dirname, "drizzle"));
  return {
    test: {
      include: ["../../tests/integration/**/*.test.ts"],
      setupFiles: ["../../tests/integration/setup.ts"],
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.jsonc" },
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
