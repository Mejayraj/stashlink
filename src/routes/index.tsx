import { createFileRoute, useHydrated } from "@tanstack/react-router";

import { AppShell, AppSkeleton } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stash — save links fast" },
      {
        name: "description",
        content:
          "A minimal, private place to save links, sorted into topics with a one-line note on why each one matters.",
      },
      { property: "og:title", content: "Stash — save links fast" },
      {
        property: "og:description",
        content: "Paste a link, add an optional note, and Stash files it into the right topic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Stash — save links fast" },
      {
        name: "twitter:description",
        content: "Paste a link, add an optional note, and Stash files it into the right topic.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // App state lives in localStorage, so only render it on the client.
  const hydrated = useHydrated();
  return hydrated ? <AppShell /> : <AppSkeleton />;
}
