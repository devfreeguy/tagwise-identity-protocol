import { describe, expect, it } from "vitest";

import { normalizeTag } from "../src/normalize.js";
import { buildTagSeeds } from "../src/seeds.js";
import { vectors } from "./vectors.js";

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

describe("buildTagSeeds", () => {
  for (const testCase of vectors.seedCases) {
    it(testCase.name, () => {
      const normalized = normalizeTag(testCase.tag);
      if (!normalized.ok) {
        throw new Error(`expected ${testCase.tag} to normalize successfully`);
      }
      const seeds = buildTagSeeds(normalized.tag);
      expect(seeds.map(toHex)).toEqual(testCase.seedsHex);
    });
  }
});
