import { normalizeTag } from "@tip/core";
import { describe, expect, it, vi } from "vitest";

import { shouldBlockTag } from "../src/moderation-gate.js";

function normalizedTagOf(raw: string) {
  const result = normalizeTag(raw);
  if (!result.ok) {
    throw new Error(`expected ${raw} to normalize successfully`);
  }
  return result.tag;
}

function makeFakeLogger() {
  return { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() } as never;
}

describe("shouldBlockTag", () => {
  it("blocks a profane tag", () => {
    expect(shouldBlockTag(normalizedTagOf("fuck"), makeFakeLogger())).toBe(true);
  });

  it("does not block a clean tag", () => {
    expect(shouldBlockTag(normalizedTagOf("daniel"), makeFakeLogger())).toBe(false);
  });

  it("does not block a reserved name: reserved is not checked here", () => {
    // "admin" is on @tip/core's reserved list but contains no profanity, so
    // the profanity-only gate this function runs must pass it.
    expect(shouldBlockTag(normalizedTagOf("admin"), makeFakeLogger())).toBe(false);
  });

  it("fails safe: an exception from the gate leaves the tag unblocked and logs a warning", async () => {
    const logger = makeFakeLogger();
    vi.doMock("@tip/moderation", () => ({
      isBlockedName: () => {
        throw new Error("engine exploded");
      },
    }));
    vi.resetModules();
    const { shouldBlockTag: shouldBlockTagWithBrokenEngine } = await import("../src/moderation-gate.js");

    const result = shouldBlockTagWithBrokenEngine(normalizedTagOf("daniel"), logger);

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ tag: "daniel" }),
      expect.stringContaining("threw"),
    );

    vi.doUnmock("@tip/moderation");
    vi.resetModules();
  });
});
