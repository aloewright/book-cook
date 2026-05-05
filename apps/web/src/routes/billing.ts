import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { users } from "../db/schema";
import type { Env } from "../env";
import {
  type PaidPlan,
  billingStatusFor,
  planForProductId,
  productIdForPlan,
} from "../lib/billing";
import { PolarConfigurationError, createPolarCheckout, getPolarCheckout } from "../lib/polar";
import { type AuthVariables, requireUser } from "../middleware/auth";

export const billingRoute = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

const checkoutSchema = z.object({
  plan: z.enum(["pro", "grow"]),
  return_path: z.string().min(1).max(500).startsWith("/").default("/projects"),
});

const syncSchema = z.object({
  checkout_id: z.string().uuid(),
});

billingRoute.use("*", requireUser);

billingRoute.get("/status", (c) => {
  const user = c.get("user");
  return c.json(billingStatusFor(c.env, user.plan));
});

billingRoute.post("/checkout", async (c) => {
  const user = c.get("user");
  const body = checkoutSchema.parse(await c.req.json());
  const productId = productIdForPlan(c.env, body.plan);
  if (!productId) {
    return c.json(
      {
        error: {
          code: "BILLING_NOT_CONFIGURED",
          message: `${planLabel(body.plan)} is missing a Polar product ID.`,
        },
      },
      503,
    );
  }

  const origin = new URL(c.req.url).origin;
  const returnUrl = new URL(body.return_path, origin);
  const successUrl = new URL(body.return_path, origin);
  successUrl.searchParams.set("billing", "success");
  successUrl.searchParams.set("checkout_id", "{CHECKOUT_ID}");

  try {
    const checkout = await createPolarCheckout(c.env, {
      productId,
      userId: user.id,
      email: user.email,
      plan: body.plan,
      returnUrl: returnUrl.toString(),
      successUrl: successUrl.toString(),
    });
    await drizzle(c.env.DB)
      .update(users)
      .set({ polar_checkout_id: checkout.id, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    return c.json({ checkout_url: checkout.url, checkout_id: checkout.id });
  } catch (error) {
    return billingError(error);
  }
});

billingRoute.post("/checkout/sync", async (c) => {
  const user = c.get("user");
  const body = syncSchema.parse(await c.req.json());
  try {
    const checkout = await getPolarCheckout(c.env, body.checkout_id);
    if (checkout.external_customer_id && checkout.external_customer_id !== user.id) {
      return c.json(
        {
          error: {
            code: "CHECKOUT_OWNER_MISMATCH",
            message: "Checkout does not belong to this user.",
          },
        },
        403,
      );
    }
    if (checkout.status !== "succeeded") {
      return c.json({ status: checkout.status, user_plan: user.plan });
    }

    const plan = planForProductId(c.env, checkout.product_id);
    if (!plan) {
      return c.json(
        {
          error: {
            code: "UNKNOWN_POLAR_PRODUCT",
            message: "Checkout product is not configured for Book Cook.",
          },
        },
        409,
      );
    }

    await drizzle(c.env.DB)
      .update(users)
      .set({
        plan,
        polar_customer_id: checkout.customer_id,
        polar_subscription_id: checkout.subscription_id,
        polar_product_id: checkout.product_id,
        polar_checkout_id: checkout.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    return c.json({ status: checkout.status, user_plan: plan });
  } catch (error) {
    return billingError(error);
  }
});

function billingError(error: unknown) {
  if (error instanceof PolarConfigurationError) {
    return new Response(
      JSON.stringify({
        error: { code: "BILLING_NOT_CONFIGURED", message: error.message },
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
  const message = error instanceof Error ? error.message : "Billing request failed";
  return new Response(JSON.stringify({ error: { code: "BILLING_ERROR", message } }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}

function planLabel(plan: PaidPlan) {
  return plan === "pro" ? "Book Cook Pro" : "Book Cook Grow";
}
