// CloudflareBindings is declared globally by `wrangler types` in
// worker-configuration.d.ts. It includes vars + bindings, but NOT secrets
// (secrets are injected at runtime by Wrangler). We extend it here so the
// rest of the codebase has a single Env type.

type Secrets = {
  BETTER_AUTH_SECRET: string;
  AI_GATEWAY_BASE_URL: string;
  AI_GATEWAY_TOKEN: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  RENDER_WORKER_INTERNAL_TOKEN: string;
  KEYRING_MASTER_KEY: string;
};

export type Env = Omit<CloudflareBindings, "ENV"> &
  Secrets & {
    // Widen literal "dev" to the real set of environments.
    ENV: "dev" | "staging" | "prod";
    // Container binding — refreshed on next `wrangler types` run.
    RENDER_WORKER?: Fetcher;
    // Auth base URL — set per environment in wrangler.jsonc vars or .dev.vars.
    BETTER_AUTH_URL?: string;
  };
