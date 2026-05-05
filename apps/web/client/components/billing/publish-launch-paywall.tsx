import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { type BillingStatus, api, queryKeys } from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function PublishLaunchPaywall({
  status,
  returnPath,
}: {
  status: BillingStatus;
  returnPath: string;
}) {
  const queryClient = useQueryClient();
  const syncedCheckoutId = useRef<string | null>(null);
  const checkout = useMutation({
    mutationFn: (plan: "pro" | "grow") =>
      api.createBillingCheckout({ plan, return_path: returnPath }),
    onSuccess: ({ checkout_url }) => {
      window.location.assign(checkout_url);
    },
  });
  const syncCheckout = useMutation({
    mutationFn: (checkoutId: string) => api.syncBillingCheckout(checkoutId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.billing() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me() }),
      ]);
    },
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

  return (
    <Card className="border-primary/25 bg-background p-5 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-primary" />
            <Badge variant="secondary">Pro feature</Badge>
          </div>
          <h2 className="mt-3 text-xl font-semibold">
            Publish and Launch are behind Book Cook Pro
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade to generate publisher metadata, export files, prep narration, and create the
            launch handoff package.
          </p>
        </div>
        <Sparkles className="hidden h-5 w-5 text-primary md:block" aria-hidden />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {status.plans.map((plan) => (
          <div key={plan.key} className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <p className="whitespace-nowrap text-sm font-semibold">
                ${(plan.price_cents / 100).toFixed(2)}/mo
              </p>
            </div>
            <Button
              type="button"
              className="mt-4 w-full"
              variant={plan.key === "pro" ? "default" : "secondary"}
              disabled={!plan.checkout_enabled || checkout.isPending}
              onClick={() => checkout.mutate(plan.key)}
            >
              {checkout.isPending && checkout.variables === plan.key
                ? "Opening..."
                : `Choose ${plan.name}`}
            </Button>
            {!plan.checkout_enabled ? (
              <p className="mt-2 text-xs text-muted-foreground">Checkout is not configured yet.</p>
            ) : null}
          </div>
        ))}
      </div>

      {syncCheckout.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Confirming checkout...</p>
      ) : null}
      {checkout.error || syncCheckout.error ? (
        <p className="mt-4 text-sm text-destructive">
          {(checkout.error ?? syncCheckout.error)?.message}
        </p>
      ) : null}
    </Card>
  );
}
