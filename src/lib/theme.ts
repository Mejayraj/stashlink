import { create } from "zustand";

import { THEME_KEY } from "./constants";

export type Theme = "light" | "dark";

// The class is applied pre-paint by an inline script in the root shell; this
// store just mirrors it so toggles stay reactive.
function initialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export const useThemeStore = create<{ theme: Theme; toggle: () => void }>((set, get) => ({
  theme: initialTheme(),
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Storage blocked; the choice just doesn't persist.
      }
    }
    set({ theme: next });
  },
}));
