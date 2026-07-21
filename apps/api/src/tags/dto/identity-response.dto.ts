import { ApiProperty } from "@nestjs/swagger";

/**
 * The public identity object. Deliberately excludes internal columns like
 * lastAppliedSlot and the row's UUID id; those are never exposed here.
 */
export class IdentityResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({ description: "Base58 pubkey of the tag owner" })
  owner!: string;

  @ApiProperty({ description: "Base58 wallet address that receives payments" })
  wallet!: string;

  @ApiProperty({ required: false, nullable: true })
  displayName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  avatar!: string | null;

  @ApiProperty({ required: false, nullable: true })
  bio!: string | null;

  @ApiProperty({ required: false, nullable: true })
  preferredToken!: string | null;

  @ApiProperty()
  verified!: boolean;

  @ApiProperty()
  merchant!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
