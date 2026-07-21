import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { normalizeTagParamOrThrow, presentTag } from "../src/tags/tag-param.js";

describe("normalizeTagParamOrThrow", () => {
  it("returns the normalized tag for canonical input", () => {
    expect(normalizeTagParamOrThrow("daniel")).toBe("daniel");
  });

  it("normalizes a leading @ and uppercase", () => {
    expect(normalizeTagParamOrThrow("@Daniel")).toBe("daniel");
  });

  it("throws BadRequestException with the rejection reason for non-canonical input", () => {
    try {
      normalizeTagParamOrThrow("ab");
      throw new Error("expected normalizeTagParamOrThrow to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as { reason: string };
      expect(response.reason).toBe("TOO_SHORT");
    }
  });

  it("throws 400 for an invalid character", () => {
    try {
      normalizeTagParamOrThrow("ab cd");
      throw new Error("expected normalizeTagParamOrThrow to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as { reason: string };
      expect(response.reason).toBe("INVALID_CHAR");
    }
  });
});

describe("presentTag", () => {
  it("adds a leading @", () => {
    expect(presentTag("daniel")).toBe("@daniel");
  });
});
