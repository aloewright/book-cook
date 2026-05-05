import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Rocket } from "lucide-react";
import { useEffect, useRef } from "react";
import { PublicFooter } from "../components/public-footer";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const PLAN_ACCENTS = {
  pro: ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"],
  grow: ["var(--chart-2)", "var(--chart-5)", "var(--chart-1)"],
} as const;

const PLAN_FEATURES = {
  pro: ["Publisher metadata", "EPUB and PDF export", "Narration audition", "Launch handoff"],
  grow: [
    "Everything in Pro",
    "Growth launch workspace",
    "Higher-volume publishing prep",
    "Priority plan for teams",
  ],
} as const;

function PricingPage() {
  const navigate = useNavigate();
  const syncedCheckoutId = useRef<string | null>(null);
  const session = useQuery({
    queryKey: queryKeys.me(),
    queryFn: api.maybeMe,
    retry: false,
  });
  const billing = useQuery({
    queryKey: queryKeys.billing(),
    queryFn: api.getBillingStatus,
    enabled: Boolean(session.data?.user),
    retry: false,
  });
  const checkout = useMutation({
    mutationFn: (plan: "pro" | "grow") =>
      api.createBillingCheckout({ plan, return_path: "/pricing" }),
    onSuccess: ({ checkout_url }) => {
      window.location.assign(checkout_url);
    },
  });
  const syncCheckout = useMutation({
    mutationFn: (checkoutId: string) => api.syncBillingCheckout(checkoutId),
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkoutId = url.searchParams.get("checkout_id");
    if (
      url.searchParams.get("billing") !== "success" ||
      !checkoutId ||
      syncedCheckoutId.current === checkoutId
    ) {
      return;
    }
    syncedCheckoutId.current = checkoutId;
    syncCheckout.mutate(checkoutId);
  }, [syncCheckout.mutate]);

  const plans = billing.data?.plans ?? FALLBACK_PLANS;
  const userPlan = billing.data?.user_plan ?? session.data?.user?.plan ?? "free";
  const isSignedIn = Boolean(session.data?.user);

  return (
    <div className="bg-background text-foreground">
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <Button asChild variant="ghost" className="-ml-3 mb-5">
              <Link to={isSignedIn ? "/dashboard" : "/"}>
                <BookOpen className="h-4 w-4" />
                Book Cook
              </Link>
            </Button>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
              Pricing for finishing and launching the book.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Start free, then upgrade when you are ready to package the manuscript, export files,
              audition narration, and generate a launch handoff.
            </p>
          </div>
          <PricingSignalChart />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.key}
            className="grid min-h-[420px] grid-rows-[auto_1fr_auto] gap-6 overflow-hidden p-5 shadow-none"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant={plan.key === "pro" ? "default" : "secondary"}>
                    {plan.key === userPlan ? "Current plan" : plan.name}
                  </Badge>
                  <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                </div>
                <div className="flex gap-1.5" aria-hidden>
                  {PLAN_ACCENTS[plan.key].map((color) => (
                    <span
                      key={color}
                      className="h-8 w-3 rounded-full border"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-6 text-4xl font-semibold">
                ${(plan.price_cents / 100).toFixed(2)}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
            </div>

            <div className="space-y-3">
              {PLAN_FEATURES[plan.key].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <PlanButton
              plan={plan.key}
              isCurrent={plan.key === userPlan}
              isSignedIn={isSignedIn}
              checkoutEnabled={plan.checkout_enabled}
              pending={checkout.isPending && checkout.variables === plan.key}
              onCheckout={() => checkout.mutate(plan.key)}
              onSignUp={() => void navigate({ to: "/sign-up" })}
            />
          </Card>
        ))}
      </section>

      {(checkout.error || syncCheckout.error) && (
        <section className="mx-auto max-w-6xl px-6 pb-8">
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {(checkout.error ?? syncCheckout.error)?.message}
          </p>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}

function PricingSignalChart() {
  const rows = [
    { label: "Draft", value: "62%", color: "var(--chart-3)" },
    { label: "Export", value: "78%", color: "var(--chart-1)" },
    { label: "Narration", value: "46%", color: "var(--chart-4)" },
    { label: "Launch", value: "88%", color: "var(--chart-2)" },
  ];

  return (
    <Card className="p-5 shadow-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Publish readiness</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan color maps use the app chart palette.
          </p>
        </div>
        <Rocket className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: row.value, background: row.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PlanButton({
  plan,
  isCurrent,
  isSignedIn,
  checkoutEnabled,
  pending,
  onCheckout,
  onSignUp,
}: {
  plan: "pro" | "grow";
  isCurrent: boolean;
  isSignedIn: boolean;
  checkoutEnabled: boolean;
  pending: boolean;
  onCheckout: () => void;
  onSignUp: () => void;
}) {
  if (isCurrent) {
    return (
      <Button type="button" disabled>
        Current plan
      </Button>
    );
  }
  if (!isSignedIn) {
    return (
      <Button type="button" onClick={onSignUp}>
        Sign up for {plan === "pro" ? "Pro" : "Grow"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    );
  }
  return (
    <Button type="button" disabled={!checkoutEnabled || pending} onClick={onCheckout}>
      {pending ? "Opening..." : `Sign up for ${plan === "pro" ? "Pro" : "Grow"}`}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

const FALLBACK_PLANS = [
  {
    key: "pro",
    name: "Book Cook Pro",
    price_cents: 499,
    interval: "month",
    description: "Unlock publisher packs, exports, narration prep, and launch handoffs.",
    product_id: null,
    checkout_enabled: false,
  },
  {
    key: "grow",
    name: "Book Cook Grow",
    price_cents: 999,
    interval: "month",
    description: "Everything in Pro, priced for heavier publishing and launch workflows.",
    product_id: null,
    checkout_enabled: false,
  },
] as const;
