import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import type { Env } from "./env";

export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema });
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secondaryStorage: {
      get: async (key) => env.KV.get(key),
      set: async (key, value, ttl) =>
        env.KV.put(key, value, ttl ? { expirationTtl: ttl } : undefined),
      delete: async (key) => env.KV.delete(key),
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: (env as { BETTER_AUTH_URL?: string }).BETTER_AUTH_URL ?? (
      env.ENV === "prod" ? "https://bookgenerators.com" : "http://localhost:5173"
    ),
    emailAndPassword: { enabled: true, autoSignIn: true },
    user: {
      additionalFields: {
        plan: { type: "string", required: false, defaultValue: "pro" },
        phase: {
          type: "string",
          required: false,
          defaultValue: "chassis",
        },
        daily_budget_cents: {
          type: "number",
          required: false,
          defaultValue: 5000,
        },
      },
    },
  });
}
