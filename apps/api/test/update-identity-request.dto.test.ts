import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";

import { UpdateIdentityRequestDto } from "../src/tags/dto/update-identity-request.dto.js";

/** Mirrors exactly what main.ts's global ValidationPipe({ whitelist, forbidNonWhitelisted, transform }) does. */
async function validatePlain(plain: Record<string, unknown>) {
  const instance = plainToInstance(UpdateIdentityRequestDto, plain);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  return { instance, errors };
}

describe("UpdateIdentityRequestDto", () => {
  it("accepts a valid partial body with no errors", async () => {
    const { errors } = await validatePlain({ displayName: "Daniel" });
    expect(errors).toHaveLength(0);
  });

  it("trims displayName and bio via the Transform decorator", async () => {
    const { instance, errors } = await validatePlain({ displayName: "  Daniel  ", bio: "  hello  " });
    expect(errors).toHaveLength(0);
    expect(instance.displayName).toBe("Daniel");
    expect(instance.bio).toBe("hello");
  });

  it("rejects an unknown property (wallet) via forbidNonWhitelisted", async () => {
    const { errors } = await validatePlain({ wallet: "SomeWallet1111111111111111111111111111" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects owner, verified, merchant, and status as unknown properties", async () => {
    for (const field of ["owner", "verified", "merchant", "status"]) {
      const { errors } = await validatePlain({ [field]: "anything" });
      expect(errors.length, `expected ${field} to be rejected`).toBeGreaterThan(0);
    }
  });

  it("rejects an over-length displayName", async () => {
    const { errors } = await validatePlain({ displayName: "x".repeat(51) });
    expect(errors.some((e) => e.property === "displayName")).toBe(true);
  });

  it("rejects displayName that is empty after trim", async () => {
    const { errors } = await validatePlain({ displayName: "   " });
    expect(errors.some((e) => e.property === "displayName")).toBe(true);
  });

  it("rejects an over-length bio", async () => {
    const { errors } = await validatePlain({ bio: "x".repeat(161) });
    expect(errors.some((e) => e.property === "bio")).toBe(true);
  });

  it("rejects an http avatar URL", async () => {
    const { errors } = await validatePlain({ avatar: "http://example.com/a.png" });
    expect(errors.some((e) => e.property === "avatar")).toBe(true);
  });

  it("rejects a malformed avatar URL", async () => {
    const { errors } = await validatePlain({ avatar: "not-a-url" });
    expect(errors.some((e) => e.property === "avatar")).toBe(true);
  });

  it("accepts a valid https avatar URL", async () => {
    const { errors } = await validatePlain({ avatar: "https://example.com/a.png" });
    expect(errors).toHaveLength(0);
  });

  it("rejects an invalid preferredToken", async () => {
    for (const bad of ["usdc", "12345", "TOOLONGTOKEN", ""]) {
      const { errors } = await validatePlain({ preferredToken: bad });
      expect(errors.some((e) => e.property === "preferredToken"), `expected "${bad}" to be rejected`).toBe(true);
    }
  });

  it("accepts a valid uppercase preferredToken symbol", async () => {
    for (const good of ["SOL", "USDC", "USDT"]) {
      const { errors } = await validatePlain({ preferredToken: good });
      expect(errors).toHaveLength(0);
    }
  });

  it("lets an explicit null through every field without triggering validation", async () => {
    const { errors } = await validatePlain({ displayName: null, avatar: null, bio: null, preferredToken: null });
    expect(errors).toHaveLength(0);
  });
});
