export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "book-cook-theme";
const THEME_NAME = "book-cook-tweakcn";

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export function setThemePreference(preference: ThemePreference) {
  window.localStorage.setItem(STORAGE_KEY, preference);
  applyThemePreference(preference);
}

export function applyThemePreference(preference = getThemePreference()) {
  if (typeof window === "undefined") return;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = preference === "dark" || (preference === "system" && prefersDark);
  document.documentElement.dataset.theme = THEME_NAME;
  document.documentElement.classList.toggle("dark", dark);
}

export function watchSystemTheme() {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    if (getThemePreference() === "system") applyThemePreference("system");
  };
  media.addEventListener("change", sync);
  return () => media.removeEventListener("change", sync);
}
