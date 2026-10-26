import type { Link, Topic } from "./types";

// Phase 1 mock auto-filer. Keyed by lowercased topic name so it works for
// user-created topics too. Phase 3 replaces this whole function with real AI.
const KEYWORDS: Record<string, string[]> = {
  design: ["design", "ui", "ux", "figma", "typography", "layout", "wireframe", "prototype", "sketch"],
  inspiration: ["inspiration", "gallery", "shots", "dribbble", "behance", "showcase", "moodboard"],
  tools: ["tool", "tools", "app", "font", "fonts", "plugin", "generator", "editor", "palette", "utility"],
  running: ["running", "run", "marathon", "race", "shoes", "training", "strava", "pace", "5k", "10k", "trail"],
  "study abroad": [
    "study",
    "abroad",
    "university",
    "college",
    "visa",
    "ielts",
    "toefl",
    "gre",
    "scholarship",
    "student",
    "masters",
    "admission",
  ],
};

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(Boolean);
}

export function autoFile(
  link: Pick<Link, "url" | "domain" | "title" | "keywords">,
  topics: Topic[],
): string | null {
  if (topics.length === 0) return null;
  const urlTokens = tokens(`${link.domain} ${link.url} ${link.title} ${link.keywords.join(" ")}`);

  let best: { id: string; score: number; depth: number } | null = null;
  for (const topic of topics) {
    const mapKey = topic.name.toLowerCase();
    const vocabulary = KEYWORDS[mapKey] ?? tokens(topic.name);
    const depth = topic.parentId ? 1 : 0;
    let score = 0;
    for (const word of vocabulary) {
      if (urlTokens.includes(word)) score += 2;
    }
    for (const word of tokens(topic.name)) {
      if (word.length > 2 && urlTokens.includes(word)) score += 3;
    }
    if (score > 0 && (!best || score > best.score || (score === best.score && depth > best.depth))) {
      best = { id: topic.id, score, depth };
    }
  }
  return best ? best.id : null;
}
