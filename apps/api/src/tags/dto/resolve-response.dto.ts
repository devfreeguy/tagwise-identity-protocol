import { ApiProperty } from "@nestjs/swagger";

export class ResolveLinksDto {
  @ApiProperty({ description: "URL of the public identity profile" })
  profile!: string;

  @ApiProperty({ description: "URL of the QR payload endpoint" })
  qr!: string;
}

export class ResolveResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({ description: "Base58 wallet address that receives payments" })
  wallet!: string;

  @ApiProperty({ required: false, nullable: true })
  displayName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  avatar!: string | null;

  @ApiProperty()
  verified!: boolean;

  @ApiProperty()
  merchant!: boolean;

  @ApiProperty({ required: false, nullable: true })
  preferredToken!: string | null;

  @ApiProperty({ description: "PAYMENT_LINK_BASE_URL + /@ + tag" })
  paymentLink!: string;

  @ApiProperty({ type: ResolveLinksDto })
  links!: ResolveLinksDto;
}
