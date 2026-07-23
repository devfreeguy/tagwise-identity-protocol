import { describe, expect, it } from "vitest";

import { isBlockedName } from "../src/profanity.js";

describe("isBlockedName", () => {
  it("blocks an obvious profane tag", () => {
    expect(isBlockedName("fuck").blocked).toBe(true);
  });

  it("blocks a leetspeak evasion of a profane tag", () => {
    // "sh1t" -> normalized to "shit" by the leetspeak re-check pass.
    expect(isBlockedName("sh1t").blocked).toBe(true);
  });

  it("blocks an ambiguous-digit evasion that only resolves on the l branch", () => {
    // "1" must be tried as both "i" and "l": "s1ut" only becomes the
    // blocked word "slut" on the "l" branch, never on "i" ("siut").
    expect(isBlockedName("s1ut").blocked).toBe(true);
  });

  it("blocks an underscore-separated evasion", () => {
    expect(isBlockedName("f_u_c_k").blocked).toBe(true);
  });

  it("allows an allowlisted word containing a rude substring (analyze)", () => {
    expect(isBlockedName("analyze").blocked).toBe(false);
  });

  it("allows an allowlisted word containing a rude substring (classic)", () => {
    expect(isBlockedName("classic").blocked).toBe(false);
  });

  it("allows an allowlisted word containing a rude substring (scunthorpe)", () => {
    expect(isBlockedName("scunthorpe").blocked).toBe(false);
  });

  it("allows an ordinary, unremarkable tag", () => {
    expect(isBlockedName("daniel").blocked).toBe(false);
  });
});
