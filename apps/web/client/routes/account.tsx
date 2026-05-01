import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { api, queryKeys } from "../lib/api";
import { authClient } from "../lib/auth-client";
import { type ThemePreference, getThemePreference, setThemePreference } from "../lib/theme";

export const Route = createFileRoute("/account")({ component: SettingsPage });

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function SettingsPage() {
  const me = useQuery({ queryKey: queryKeys.me(), queryFn: api.me });
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    setTheme(getThemePreference());
  }, []);

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Display</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={theme === option.value ? "default" : "outline"}
                  className="h-20 flex-col"
                  onClick={() => {
                    setTheme(option.value);
                    setThemePreference(option.value);
                  }}
                >
                  <option.icon className="h-5 w-5" />
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

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
      </div>

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
