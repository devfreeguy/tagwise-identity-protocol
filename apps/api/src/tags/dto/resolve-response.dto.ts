import { ApiProperty } from "@nestjs/swagger";

export class ResolveLinksDto {
  @ApiProperty({ description: "URL of the public identity profile", example: "https://tagwise.me/@daniel" })
  profile!: string;

  @ApiProperty({ description: "URL of the QR payload endpoint", example: "https://tagwise.me/@daniel/qr" })
  qr!: string;
}

export class ResolveResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({
    description: "Base58 wallet address that receives payments",
    example: "8L2Z3nSXbwoFhK9x9BEs6b1qhF6xEcNJ7T4NqmiWaeuf",
  })
  wallet!: string;

  @ApiProperty({ required: false, nullable: true, example: "Daniel" })
  displayName!: string | null;

  @ApiProperty({ required: false, nullable: true, example: "https://cdn.tagwise.me/avatars/daniel.png" })
  avatar!: string | null;

  @ApiProperty({ example: false })
  verified!: boolean;

  @ApiProperty({ example: false })
  merchant!: boolean;

  @ApiProperty({ required: false, nullable: true, example: "USDC" })
  preferredToken!: string | null;

  @ApiProperty({ description: "PAYMENT_LINK_BASE_URL + /@ + tag", example: "https://tagwise.me/@daniel" })
  paymentLink!: string;

  @ApiProperty({ type: ResolveLinksDto })
  links!: ResolveLinksDto;
}
