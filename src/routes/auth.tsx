import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { passwordError } from "@/lib/password";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Stash — log in or sign up" },
      {
        name: "description",
        content: "Log in to Stash to save links, sorted into topics with a one-line note on why each one matters.",
      },
      { property: "og:title", content: "Stash — log in or sign up" },
      {
        property: "og:description",
        content: "Log in to Stash to save links, sorted into topics with a one-line note on why each one matters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Stash — log in or sign up" },
      {
        name: "twitter:description",
        content: "Log in to Stash to save links, sorted into topics with a one-line note on why each one matters.",
      },
    ],
  }),
  component: AuthPage,
});

function describeAuthError(error: string): string {
  const message = error.toLowerCase();
  if (message.includes("invalid login credentials")) return "That email or password isn't right.";
  if (message.includes("already registered")) return "That email already has an account. Try logging in.";
  if (message.includes("weak") || message.includes("easy to guess")) {
    return "That password is too common. Pick a harder one.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many attempts. Try again in a moment.";
  }
  return "Something went wrong. Try again.";
}

function AuthPage() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Signed-in visitors belong in the app, not here. Blank screen (no flash)
  // while the session is checked.
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) void navigate({ to: "/", replace: true });
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError("Enter your email.");
      return;
    }
    setEmailError(null);
    const pwError = passwordError(password);
    if (pwError) {
      setFormError(pwError);
      return;
    }
    setBusy(true);
    setFormError(null);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: emailTrimmed,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({ email: emailTrimmed, password });
    setBusy(false);
    if (error) {
      setFormError(describeAuthError(error.message));
      return;
    }
    void navigate({ to: "/", replace: true });
  };

  if (checking) return <div className="min-h-dvh bg-surface-soft" />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-soft px-4 py-8">
      <div className="w-full max-w-[420px] rounded-[32px] border border-hairline bg-canvas p-8">
        <h1 className="text-display text-[28px] font-bold text-ink">{APP_NAME}</h1>

        <div className="mt-6 flex rounded-full bg-surface-card p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setFormError(null);
              }}
              className={cn(
                "h-9 flex-1 rounded-full text-sm font-semibold",
                mode === m ? "bg-canvas text-ink" : "text-mute hover:text-ink",
              )}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="auth-email" className="text-xs font-semibold text-mute">
            Email
          </label>
          <div className="field mt-1 flex h-12 items-center px-4">
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              autoComplete="email"
              className="field-input h-full w-full text-[15px] text-ink"
            />
          </div>
          {emailError && <p className="mt-2 text-xs text-error">{emailError}</p>}

          <label htmlFor="auth-password" className="mt-4 block text-xs font-semibold text-mute">
            Password
          </label>
          <div className="field mt-1 flex h-12 items-center pl-4 pr-1">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="field-input h-full min-w-0 flex-1 text-[15px] text-ink"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-ash hover:text-ink"
            >
              {showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
            </button>
          </div>
          {formError && <p className="mt-2 text-xs text-error">{formError}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 h-12 w-full rounded-2xl bg-accent text-sm font-bold text-on-accent hover:bg-accent-pressed disabled:opacity-50"
          >
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
