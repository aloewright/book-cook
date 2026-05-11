import { useEffect, useState } from "react";

const KEY = "book-cook-drawer-layout";
type DrawerLayout = { open: boolean; collapsed: boolean };
const DEFAULT: DrawerLayout = { open: true, collapsed: false };

let state: DrawerLayout = DEFAULT;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    // ignore — fallback to default
  }
}

export function setDrawerLayout(patch: Partial<DrawerLayout>) {
  state = { ...state, ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
  for (const fn of listeners) fn();
}

export function useDrawerLayout(): DrawerLayout & {
  setOpen: (open: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleOpen: () => void;
  toggleCollapsed: () => void;
} {
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((n) => n + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return {
    ...state,
    setOpen: (open) => setDrawerLayout({ open }),
    setCollapsed: (collapsed) => setDrawerLayout({ collapsed }),
    toggleOpen: () => setDrawerLayout({ open: !state.open }),
    toggleCollapsed: () => setDrawerLayout({ collapsed: !state.collapsed }),
  };
}
