import { ApiProperty } from "@nestjs/swagger";

/**
 * The public identity object. Deliberately excludes internal columns like
 * lastAppliedSlot and the row's UUID id; those are never exposed here.
 */
export class IdentityResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({
    description: "Base58 pubkey of the tag owner",
    example: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2akbP",
  })
  owner!: string;

  @ApiProperty({
    description: "Base58 wallet address that receives payments",
    example: "8L2Z3nSXbwoFhK9x9BEs6b1qhF6xEcNJ7T4NqmiWaeuf",
  })
  wallet!: string;

  @ApiProperty({ required: false, nullable: true, example: "Daniel" })
  displayName!: string | null;

  @ApiProperty({ required: false, nullable: true, example: "https://cdn.tagwise.me/avatars/daniel.png" })
  avatar!: string | null;

  @ApiProperty({ required: false, nullable: true, example: "Building on Solana" })
  bio!: string | null;

  @ApiProperty({ required: false, nullable: true, example: "USDC" })
  preferredToken!: string | null;

  @ApiProperty({ example: false })
  verified!: boolean;

  @ApiProperty({ example: false })
  merchant!: boolean;

  @ApiProperty({ example: "2026-01-15T12:00:00.000Z" })
  createdAt!: Date;
}
