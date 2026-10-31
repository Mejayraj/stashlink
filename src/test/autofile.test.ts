import { describe, expect, it } from "vitest";

import { autoFile } from "@/lib/autofile";
import { parsePastedLink } from "@/lib/url";
import type { Topic } from "@/lib/types";

// Same fixtures the Phase 1 seed used, kept inline now that mock data is gone
// from the app itself.
const topics: Topic[] = [
  { id: "t-design", name: "Design", parentId: null, createdAt: 1769000000000 },
  { id: "t-inspiration", name: "Inspiration", parentId: "t-design", createdAt: 1768999999000 },
  { id: "t-tools", name: "Tools", parentId: "t-design", createdAt: 1768999998000 },
  { id: "t-running", name: "Running", parentId: null, createdAt: 1768999997000 },
  { id: "t-study", name: "Study abroad", parentId: null, createdAt: 1768999996000 },
];

describe("autoFile", () => {
  it("files running links into Running", () => {
    const id = autoFile(
      { url: "https://www.strava.com/activities/123", domain: "strava.com", title: "strava.com", keywords: [] },
      topics,
    );
    expect(id).toBe("t-running");
  });

  it("files ielts links into Study abroad", () => {
    const id = autoFile(
      { url: "https://ielts.org/take-a-test", domain: "ielts.org", title: "ielts.org", keywords: [] },
      topics,
    );
    expect(id).toBe("t-study");
  });

  it("files design tool links into the Tools subtopic", () => {
    const id = autoFile(
      {
        url: "https://fonts.google.com/specimen/Inter",
        domain: "fonts.google.com",
        title: "fonts.google.com",
        keywords: ["font"],
      },
      topics,
    );
    expect(id).toBe("t-tools");
  });

  it("returns null when nothing matches, so the link lands in Unsorted", () => {
    const id = autoFile(
      { url: "https://example.com/xyz", domain: "example.com", title: "example.com", keywords: [] },
      topics,
    );
    expect(id).toBeNull();
  });
});

describe("parsePastedLink", () => {
  it("adds https, derives the domain and a readable title from path words", () => {
    const parsed = parsePastedLink("runnersworld.com/training/half-marathon-plan");
    expect(parsed?.domain).toBe("runnersworld.com");
    expect(parsed?.title).toContain("Half Marathon Plan");
    expect(parsed?.url.startsWith("https://")).toBe(true);
  });

  it("rejects text that is not a link", () => {
    expect(parsePastedLink("just some words")).toBeNull();
    expect(parsePastedLink("")).toBeNull();
  });
});
