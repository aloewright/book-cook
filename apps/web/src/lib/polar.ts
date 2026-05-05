import type { Env } from "../env";

type PolarEnv = Pick<Env, "POLAR_ACCESS_TOKEN" | "POLAR_API_BASE_URL">;

export type PolarCheckout = {
  id: string;
  status: "open" | "expired" | "confirmed" | "succeeded" | "failed";
  url: string;
  product_id: string | null;
  customer_id: string | null;
  external_customer_id: string | null;
  subscription_id: string | null;
};

export class PolarConfigurationError extends Error {
  constructor(message = "Polar billing is not configured") {
    super(message);
    this.name = "PolarConfigurationError";
  }
}

export async function createPolarCheckout(
  env: PolarEnv,
  input: {
    productId: string;
    userId: string;
    email: string;
    plan: string;
    successUrl: string;
    returnUrl: string;
  },
) {
  return polarRequest<PolarCheckout>(env, "/v1/checkouts", {
    method: "POST",
    body: JSON.stringify({
      products: [input.productId],
      customer_email: input.email,
      external_customer_id: input.userId,
      success_url: input.successUrl,
      return_url: input.returnUrl,
      metadata: { user_id: input.userId, plan: input.plan, app: "book-cook" },
      customer_metadata: { user_id: input.userId, app: "book-cook" },
    }),
  });
}

export async function getPolarCheckout(env: PolarEnv, checkoutId: string) {
  return polarRequest<PolarCheckout>(env, `/v1/checkouts/${checkoutId}`);
}

async function polarRequest<T>(env: PolarEnv, path: string, init?: RequestInit) {
  if (!env.POLAR_ACCESS_TOKEN) throw new PolarConfigurationError();
  const apiBase = env.POLAR_API_BASE_URL ?? "https://api.polar.sh";
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail?: unknown }).detail)
        : `Polar request failed with ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}
