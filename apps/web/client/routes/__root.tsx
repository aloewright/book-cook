import { Outlet, createRootRoute, Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
          <Link to="/" className="font-semibold">📚 Book Generators</Link>
          <nav className="flex gap-4">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/account">Account</Link>
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  ),
});
