import { createFileRoute } from "@tanstack/react-router";

import { AppFrame, HomeView } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/")({
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
  return (
    <AppFrame>
      <HomeView />
    </AppFrame>
  );
}
