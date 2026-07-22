import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class VerifyRequestDto {
  @ApiProperty({
    description: "Base58 Solana wallet address that signed the message",
    example: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2akbP",
  })
  @IsString()
  @MinLength(32)
  pubkey!: string;

  @ApiProperty({
    description: "The exact message string returned by /v1/auth/challenge",
    example:
      "tagwise.me wants you to sign in with your Solana account:\n5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2akbP\n\nSign in to authenticate with the TIP API. This request will not trigger a blockchain transaction or cost any fees.\n\nNonce: 3f9a2b8c7d6e5f4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e\nIssued At: 2026-01-15T12:00:00.000Z\nExpiration Time: 2026-01-15T12:05:00.000Z",
  })
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiProperty({
    description: "Base58-encoded ed25519 signature over the message bytes",
    example: "5UfDuX7WXY9U9tXK7oJmB9Zt2Q6zqW8XvB4pQr9K1FVBQxVjxYh7EEqYFEr9ZjKmL8fRZ6DZuxYVLh6VJf6mJd8x",
  })
  @IsString()
  @MinLength(1)
  signature!: string;
}
