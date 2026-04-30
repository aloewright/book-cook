import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { api, queryKeys } from "../lib/api";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/account")({ component: Account });

function Account() {
  const me = useQuery({ queryKey: queryKeys.me(), queryFn: api.me });

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {me.data ? (
            <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{me.data.user.email}</dd>
              <dt className="text-muted-foreground">Plan</dt>
              <dd>
                <Badge>{me.data.user.plan}</Badge>
              </dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() =>
            authClient.signOut().then(() => {
              window.location.href = "/";
            })
          }
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </section>
  );
}
