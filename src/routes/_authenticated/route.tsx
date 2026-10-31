import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { repo } from "@/lib/repo";

// Gate for the whole app: every child route requires a session. The blank
// screen while this runs is handled by ssr: false — nothing renders until the
// check completes, so there is no protected-content flash.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    useAuthStore.getState().setEmail(user.email ?? null);
    await repo.loadAll();
  },
  component: () => <Outlet />,
});
