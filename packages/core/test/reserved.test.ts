import { describe, expect, it } from "vitest";

import { isReservedTag, RESERVED_TAGS } from "../src/reserved.js";
import { vectors } from "./vectors.js";

describe("isReservedTag", () => {
  for (const testCase of vectors.reservedTagCases) {
    it(`${testCase.tag} is ${testCase.reserved ? "" : "not "}reserved`, () => {
      expect(isReservedTag(testCase.tag)).toBe(testCase.reserved);
    });
  }

  it("is an exact match, not a substring match", () => {
    expect(isReservedTag("adminx")).toBe(false);
    expect(isReservedTag("xadmin")).toBe(false);
  });

  it("every entry in RESERVED_TAGS is already lowercase", () => {
    for (const tag of RESERVED_TAGS) {
      expect(tag).toBe(tag.toLowerCase());
    }
  });
});
