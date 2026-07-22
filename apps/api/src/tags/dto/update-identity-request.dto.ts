import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from "class-validator";

function trimIfString({ value }: { value: unknown }): unknown {
  return typeof value === "string" ? value.trim() : value;
}

// A short uppercase symbol (SOL, USDC, USDT, ...) was chosen over a base58
// mint address: it is the simpler, less error-prone hint for display and
// payment-flow purposes. A real mint address can be layered in later if a
// symbol turns out to be ambiguous.
const PREFERRED_TOKEN_PATTERN = /^[A-Z]{2,10}$/;

/**
 * Every field is optional and nullable: omitting a key leaves that column
 * unchanged, sending it as `null` explicitly clears it. See tags.service.ts
 * for how "provided" (key present in the raw body) is distinguished from
 * "value is null" using the raw request body, independent of this DTO.
 *
 * @IsOptional() skips all further validation when the value is null or
 * undefined, so an explicit null to clear a field is never subjected to the
 * length/URL/pattern checks below; only a non-null value is validated.
 */
export class UpdateIdentityRequestDto {
  @ApiPropertyOptional({ nullable: true, description: "Display name shown in search results and payment pages", example: "Daniel" })
  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MinLength(1, { message: "displayName must not be empty" })
  @MaxLength(50)
  displayName?: string | null;

  // Avatar upload to R2/Cloudinary is a separate later concern; this stage
  // only accepts a pre-hosted https URL, never a file.
  @ApiPropertyOptional({ nullable: true, description: "Absolute https URL to an avatar image" })
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true, require_tld: false })
  @MaxLength(2048)
  avatar?: string | null;

  @ApiPropertyOptional({ nullable: true, description: "Short bio shown on the profile", example: "Building on Solana" })
  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MinLength(1, { message: "bio must not be empty" })
  @MaxLength(160)
  bio?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Preferred token symbol, uppercase, 2-10 letters (for example SOL, USDC, USDT)",
    example: "USDC",
  })
  @IsOptional()
  @IsString()
  @Matches(PREFERRED_TOKEN_PATTERN, {
    message: "preferredToken must be an uppercase symbol of 2-10 letters, for example SOL, USDC, or USDT",
  })
  preferredToken?: string | null;
}
