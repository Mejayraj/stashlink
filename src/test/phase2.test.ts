import { describe, expect, it } from "vitest";

import { MAX_NOTE_LENGTH } from "@/lib/constants";
import { passwordError } from "@/lib/password";
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
});
