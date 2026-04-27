import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "../lib/api";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/account")({ component: Account });

function Account() {
  const me = useQuery({ queryKey: queryKeys.me(), queryFn: api.me });

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">Account</h1>
      {me.data ? (
        <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
          <dt className="text-slate-500">Email</dt><dd>{me.data.user.email}</dd>
          <dt className="text-slate-500">Plan</dt><dd>{me.data.user.plan}</dd>
        </dl>
      ) : null}
      <Button className="mt-6" onClick={() => authClient.signOut().then(() => { window.location.href = "/"; })}>
        Sign out
      </Button>
    </section>
  );
}
