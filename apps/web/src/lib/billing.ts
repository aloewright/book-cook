import type { Context } from "hono";
import type { Env } from "../env";
import type { AuthVariables } from "../middleware/auth";

export type UserPlan = "free" | "pro" | "grow";
export type PaidPlan = "pro" | "grow";

export const BILLING_PLANS: {
  key: PaidPlan;
  name: string;
  price_cents: number;
  interval: "month";
  description: string;
}[] = [
  {
    key: "pro",
    name: "Book Cook Pro",
    price_cents: 499,
    interval: "month",
    description: "Unlock publisher packs, exports, narration prep, and launch handoffs.",
  },
  {
    key: "grow",
    name: "Book Cook Grow",
    price_cents: 999,
    interval: "month",
    description: "Everything in Pro, priced for heavier publishing and launch workflows.",
  },
];

type BillingEnv = Pick<
  Env,
  | "PUBLISH_LAUNCH_PAYWALL_ENABLED"
  | "POLAR_ACCESS_TOKEN"
  | "POLAR_PRO_PRODUCT_ID"
  | "POLAR_GROW_PRODUCT_ID"
>;

type AppContext = Context<{
  Bindings: Env;
  Variables: AuthVariables;
}>;

export function normalizeUserPlan(plan: string | null | undefined): UserPlan {
  return plan === "grow" || plan === "pro" ? plan : "free";
}

export function isPublishLaunchPaywallEnabled(env: BillingEnv) {
  return String(env.PUBLISH_LAUNCH_PAYWALL_ENABLED ?? "").toLowerCase() === "true";
}

export function hasPublishLaunchAccess(plan: string | null | undefined) {
  const normalized = normalizeUserPlan(plan);
  return normalized === "pro" || normalized === "grow";
}

export function productIdForPlan(env: BillingEnv, plan: PaidPlan) {
  return plan === "pro" ? env.POLAR_PRO_PRODUCT_ID : env.POLAR_GROW_PRODUCT_ID;
}

export function planForProductId(env: BillingEnv, productId: string | null | undefined) {
  if (!productId) return null;
  if (productId === env.POLAR_PRO_PRODUCT_ID) return "pro" as const;
  if (productId === env.POLAR_GROW_PRODUCT_ID) return "grow" as const;
  return null;
}

export function billingStatusFor(env: BillingEnv, userPlan: string | null | undefined) {
  const plan = normalizeUserPlan(userPlan);
  return {
    paywall_enabled: isPublishLaunchPaywallEnabled(env),
    user_plan: plan,
    publish_launch_unlocked: !isPublishLaunchPaywallEnabled(env) || hasPublishLaunchAccess(plan),
    checkout_configured: Boolean(env.POLAR_ACCESS_TOKEN),
    plans: BILLING_PLANS.map((billingPlan) => ({
      ...billingPlan,
      product_id: productIdForPlan(env, billingPlan.key) ?? null,
      checkout_enabled: Boolean(env.POLAR_ACCESS_TOKEN && productIdForPlan(env, billingPlan.key)),
    })),
  };
}

export function publishLaunchPaywallResponse(c: AppContext) {
  const user = c.get("user");
  if (!isPublishLaunchPaywallEnabled(c.env) || hasPublishLaunchAccess(user.plan)) {
    return null;
  }
  return c.json(
    {
      error: {
        code: "PAYWALL_REQUIRED",
        message: "Upgrade to Book Cook Pro or Grow to use Publish and Launch.",
      },
      billing: billingStatusFor(c.env, user.plan),
    },
    402,
  );
}
