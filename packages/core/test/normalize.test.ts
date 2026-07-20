import { describe, expect, it } from "vitest";

import { normalizeTag, isValidTag } from "../src/normalize.js";
import { vectors } from "./vectors.js";

describe("normalizeTag", () => {
  for (const testCase of vectors.normalizationCases) {
    it(testCase.name, () => {
      const result = normalizeTag(testCase.input);
      expect(result).toEqual(testCase.expected);
    });
  }
});

describe("isValidTag", () => {
  for (const testCase of vectors.normalizationCases) {
    it(testCase.name, () => {
      expect(isValidTag(testCase.input)).toBe(testCase.expected.ok);
    });
  }
});
