import { describe, expect, it } from "vitest";

import { shouldApply } from "../src/out-of-order-guard.js";

describe("shouldApply", () => {
  it("applies when there is no stored row yet", () => {
    expect(shouldApply(100n, undefined)).toBe(true);
  });

  it("skips an older incoming slot", () => {
    expect(shouldApply(99n, 100n)).toBe(false);
  });

  it("applies an equal incoming slot", () => {
    expect(shouldApply(100n, 100n)).toBe(true);
  });

  it("applies a newer incoming slot", () => {
    expect(shouldApply(101n, 100n)).toBe(true);
  });
});
