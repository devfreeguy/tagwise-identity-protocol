import { describe, expect, it } from "vitest";

import { normalizeTag } from "../src/normalize.js";
import { deriveTagPda } from "../src/pda.js";
import { vectors } from "./vectors.js";

describe("deriveTagPda", () => {
  for (const testCase of vectors.pdaCases) {
    it(testCase.name, async () => {
      const normalized = normalizeTag(testCase.tag);
      if (!normalized.ok) {
        throw new Error(`expected ${testCase.tag} to normalize successfully`);
      }
      const [address, bump] = await deriveTagPda(
        normalized.tag,
        testCase.programId,
      );
      expect(address).toBe(testCase.expectedAddress);
      expect(bump).toBe(testCase.expectedBump);
    });
  }
});
