import { describe, expect, it } from "vitest";

import { buildResolveCacheKey } from "../src/cache-key.js";
import { normalizeTag } from "../src/normalize.js";

function normalized(raw: string) {
  const result = normalizeTag(raw);
  if (!result.ok) {
    throw new Error(`expected ${raw} to normalize successfully`);
  }
  return result.tag;
}

describe("buildResolveCacheKey", () => {
  it("builds the exact key string for a known tag and prefix", () => {
    expect(buildResolveCacheKey("tip:", normalized("daniel"))).toBe("tip:resolve:daniel");
  });

  it("builds the exact key string for a different known tag", () => {
    expect(buildResolveCacheKey("tip:", normalized("e2ereg2491"))).toBe("tip:resolve:e2ereg2491");
  });

  it("reflects a different prefix verbatim", () => {
    expect(buildResolveCacheKey("staging:", normalized("daniel"))).toBe("staging:resolve:daniel");
  });

  it("produces different keys for different tags under the same prefix", () => {
    const a = buildResolveCacheKey("tip:", normalized("alice"));
    const b = buildResolveCacheKey("tip:", normalized("bob"));
    expect(a).not.toBe(b);
  });
});
