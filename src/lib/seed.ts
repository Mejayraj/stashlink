import type { Link, Topic } from "./types";

const BASE = 1769000000000;

let cached: { topics: Topic[]; links: Link[] } | null = null;

// Deterministic Phase 1 seed data. IDs are fixed so tests and autofile
// expectations stay stable. Links are ordered newest first.
export function getSeed(): { topics: Topic[]; links: Link[] } {
  if (cached) return cached;

  const topics: Topic[] = [
    { id: "t-design", name: "Design", parentId: null, createdAt: BASE - 5000 },
    { id: "t-inspiration", name: "Inspiration", parentId: "t-design", createdAt: BASE - 4000 },
    { id: "t-tools", name: "Tools", parentId: "t-design", createdAt: BASE - 3000 },
    { id: "t-running", name: "Running", parentId: null, createdAt: BASE - 2000 },
    { id: "t-study", name: "Study abroad", parentId: null, createdAt: BASE - 1000 },
  ];

  const mk = (
    i: number,
    url: string,
    title: string,
    domain: string,
    topicId: string | null,
    note: string,
    keywords: string[],
    height: number,
  ): Link => ({
    id: `l${i}`,
    url,
    title,
    domain,
    imageUrl: `https://picsum.photos/seed/l${i}/400/${height}`,
    note,
    topicId,
    keywords,
    createdAt: BASE - i * 100,
  });

  const links: Link[] = [
    mk(1, "https://dribbble.com/shots/minimal-dashboard-concept", "dribbble.com — Minimal Dashboard Concept", "dribbble.com", "t-inspiration", "Clean dashboard patterns for the sidebar redesign", ["ui", "dashboard"], 280),
    mk(2, "https://fonts.google.com/specimen/Inter", "fonts.google.com — Inter", "fonts.google.com", "t-tools", "Body font — stick to weights 400 to 700", ["font", "typography"], 220),
    mk(3, "https://www.refactoringui.com/", "refactoringui.com", "refactoringui.com", "t-design", "", ["design", "book"], 260),
    mk(4, "https://runrepeat.com/ranking/road-running-shoes", "runrepeat.com — Road Running Shoes", "runrepeat.com", "t-running", "Shortlist before replacing the current pair", ["shoes", "gear"], 300),
    mk(5, "https://www.runnersworld.com/training/half-marathon-plan", "runnersworld.com — Half Marathon Plan", "runnersworld.com", "t-running", "", ["training", "plan"], 240),
    mk(6, "https://www.mastersportal.com/articles/study-in-germany-for-free.html", "mastersportal.com — Study In Germany For Free", "mastersportal.com", "t-study", "Tuition-free options worth comparing first", ["germany", "tuition"], 260),
    mk(7, "https://ielts.org/take-a-test/test-format", "ielts.org — Test Format", "ielts.org", "t-study", "", ["ielts", "exam"], 220),
    mk(8, "https://news.ycombinator.com/", "news.ycombinator.com", "news.ycombinator.com", null, "", ["tech", "news"], 200),
    mk(9, "https://www.youtube.com/watch?v=running-form-drills", "youtube.com — Running Form Drills", "youtube.com", null, "Form drills to try before the next easy run", ["running", "form"], 280),
    mk(10, "https://www.figma.com/community", "figma.com — Community", "figma.com", null, "", ["figma", "community"], 240),
  ];

  cached = { topics, links };
  return cached;
}
