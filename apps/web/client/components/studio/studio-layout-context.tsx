import { createContext, useContext } from "react";

type StudioLayoutContextValue = {
  drawerOpen: boolean;
};

const StudioLayoutContext = createContext<StudioLayoutContextValue | null>(null);

export function StudioLayoutProvider({
  value,
  children,
}: {
  value: StudioLayoutContextValue;
  children: React.ReactNode;
}) {
  return <StudioLayoutContext.Provider value={value}>{children}</StudioLayoutContext.Provider>;
}

export function useStudioLayout(): StudioLayoutContextValue {
  const ctx = useContext(StudioLayoutContext);
  if (!ctx) {
    throw new Error("useStudioLayout must be used inside <StudioLayoutProvider>");
  }
  return ctx;
}
