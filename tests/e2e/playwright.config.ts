import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  use: { baseURL: process.env.E2E_BASE_URL ?? "https://bookgenerators-web.lazee.workers.dev" },
  // When E2E_BASE_URL points at a remote URL, no webServer is needed.
  ...(process.env.E2E_BASE_URL?.startsWith("http://localhost")
    ? {
        webServer: {
          command: "pnpm --filter web dev",
          url: process.env.E2E_BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }
    : {}),
});
