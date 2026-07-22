import { ApiProperty } from "@nestjs/swagger";

export class ChallengeResponseDto {
  @ApiProperty({
    description: "The exact message string the client must sign with its wallet",
    example:
      "tagwise.me wants you to sign in with your Solana account:\n5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2akbP\n\nSign in to authenticate with the TIP API. This request will not trigger a blockchain transaction or cost any fees.\n\nNonce: 3f9a2b8c7d6e5f4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e\nIssued At: 2026-01-15T12:00:00.000Z\nExpiration Time: 2026-01-15T12:05:00.000Z",
  })
  message!: string;
}
