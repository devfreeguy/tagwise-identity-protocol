import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class VerifyRequestDto {
  @ApiProperty({ description: "Base58 Solana wallet address that signed the message" })
  @IsString()
  @MinLength(32)
  pubkey!: string;

  @ApiProperty({ description: "The exact message string returned by /v1/auth/challenge" })
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiProperty({ description: "Base58-encoded ed25519 signature over the message bytes" })
  @IsString()
  @MinLength(1)
  signature!: string;
}
