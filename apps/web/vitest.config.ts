import { defineConfig } from "vitest/config";

// Placeholder. Task 7.4 replaces this with the @cloudflare/vitest-pool-workers
// config once Better Auth + integration tests come online.
export default defineConfig({
  test: {
    include: [],
    passWithNoTests: true,
  },
});
