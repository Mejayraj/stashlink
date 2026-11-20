import { describe, expect, it } from "vitest";

import { MAX_NOTE_LENGTH } from "@/lib/constants";
import { passwordError } from "@/lib/password";
import { resolveTopicChoice } from "@/lib/topic-choice";
import { parsePastedLink } from "@/lib/url";

describe("Phase 2 rules", () => {
  it("requires at least 8 characters for passwords", () => {
    expect(passwordError("short1")).not.toBeNull();
    expect(passwordError("12345678")).toBeNull();
    expect(passwordError("123456789")).toBeNull();
  });

  it("caps notes at 120 characters", () => {
    expect(MAX_NOTE_LENGTH).toBe(120);
  });

  it("enables Save only for a valid-looking URL", () => {
    expect(parsePastedLink("example.com/article")).not.toBeNull();
    expect(parsePastedLink("https://example.com/article")).not.toBeNull();
    expect(parsePastedLink("not a link at all")).toBeNull();
    expect(parsePastedLink("")).toBeNull();
  });

  it("keeps Auto filing unless a topic is already being viewed", () => {
    expect(resolveTopicChoice("auto", null)).toEqual({
      topicId: null,
      shouldAutoFile: true,
      explicitTopic: false,
    });
    expect(resolveTopicChoice("auto", "topic-current")).toEqual({
      topicId: "topic-current",
      shouldAutoFile: false,
      explicitTopic: false,
    });
  });

  it("keeps Unsorted and chosen topics out of auto-filing", () => {
    expect(resolveTopicChoice("unsorted", null)).toEqual({
      topicId: null,
      shouldAutoFile: false,
      explicitTopic: false,
    });
    expect(resolveTopicChoice("topic-chosen", null)).toEqual({
      topicId: "topic-chosen",
      shouldAutoFile: false,
      explicitTopic: true,
    });
  });
});
