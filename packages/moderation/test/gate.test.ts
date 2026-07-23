import { beforeEach, describe, expect, it, vi } from "vitest";

const { isBlockedNameMock } = vi.hoisted(() => ({
  isBlockedNameMock: vi.fn().mockReturnValue({ blocked: false }),
}));

vi.mock("../src/profanity.js", () => ({
  isBlockedName: isBlockedNameMock,
}));

const { checkModerationGate } = await import("../src/gate.js");

describe("checkModerationGate", () => {
  beforeEach(() => {
    isBlockedNameMock.mockClear();
    isBlockedNameMock.mockReturnValue({ blocked: false });
  });

  it("checks reserved before profanity: a reserved tag never reaches the profanity check", () => {
    const result = checkModerationGate("admin" as never);

    expect(result).toEqual({ allowed: false, reason: "reserved" });
    expect(isBlockedNameMock).not.toHaveBeenCalled();
  });

  it("returns inappropriate when the profanity check blocks a non-reserved tag", () => {
    isBlockedNameMock.mockReturnValue({ blocked: true, reason: "profanity" });

    const result = checkModerationGate("notreserved" as never);

    expect(result).toEqual({ allowed: false, reason: "inappropriate" });
    expect(isBlockedNameMock).toHaveBeenCalledWith("notreserved");
  });

  it("allows a clean, non-reserved tag", () => {
    const result = checkModerationGate("freshtag123" as never);

    expect(result).toEqual({ allowed: true });
  });
});
