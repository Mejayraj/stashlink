import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { AppFrame } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/lib/auth-store";
import { passwordError } from "@/lib/password";
import { useDataStore } from "@/lib/store";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — Stash" },
      {
        name: "description",
        content: "Manage your Stash account: change your password, switch theme, or log out.",
      },
      { property: "og:title", content: "Account — Stash" },
      {
        property: "og:description",
        content: "Manage your Stash account: change your password, switch theme, or log out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Account — Stash" },
      {
        name: "twitter:description",
        content: "Manage your Stash account: change your password, switch theme, or log out.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const email = useAuthStore((s) => s.email);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const validation = passwordError(password);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("Couldn't update the password. Try again.");
      return;
    }
    setPassword("");
    toast("Password updated");
  };

  const logOut = async () => {
    // Clear the cache first so the next user never sees this account's data.
    useDataStore.getState().clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <AppFrame>
      <div className="mx-auto w-full max-w-[560px] px-3 pb-16 pt-4 md:px-5 md:pt-10">
        <Link
          to="/"
          className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-mute hover:bg-surface-card hover:text-ink"
        >
          Back
        </Link>

        <h1 className="text-display mt-2 text-[28px] font-bold text-ink">Account</h1>
        <p className="mt-1 truncate text-sm text-mute">{email ?? ""}</p>

        <div className="field mt-6 flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold text-ink">Dark mode</span>
          <ThemeToggle />
        </div>

        <form onSubmit={changePassword} className="mt-4">
          <div className="field flex h-12 items-center px-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="New password"
              aria-label="New password"
              autoComplete="new-password"
              className="field-input h-full w-full text-[15px] text-ink placeholder:text-ash"
            />
          </div>
          {error && <p className="mt-2 text-xs text-error">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-3 h-10 rounded-2xl bg-accent px-4 text-sm font-bold text-on-accent hover:bg-accent-pressed disabled:opacity-50"
          >
            Change password
          </button>
        </form>

        <button
          type="button"
          onClick={() => void logOut()}
          className="mt-8 h-10 rounded-2xl border border-hairline bg-canvas px-4 text-sm font-semibold text-ink hover:bg-surface-card"
        >
          Log out
        </button>
      </div>
    </AppFrame>
  );
}
