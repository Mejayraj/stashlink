import { Moon, Sun } from "lucide-react";

import { useThemeStore } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-mute hover:bg-surface-card hover:text-ink"
    >
      {dark ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
    </button>
  );
}
