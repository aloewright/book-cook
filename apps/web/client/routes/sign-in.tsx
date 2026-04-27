import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/sign-in")({ component: SignIn });

function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await authClient.signIn.email({ email, password });
    if (error) setError(error.message ?? "sign-in failed");
    else nav({ to: "/dashboard" });
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-24">
      <h2 className="mb-6 text-2xl font-semibold">Sign in</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input type="email" required placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Sign in</Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </section>
  );
}
