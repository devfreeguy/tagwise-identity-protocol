import { ApiProperty } from "@nestjs/swagger";

export class PaymentLinkResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({
    description: "Base58 wallet address that receives payments",
    example: "8L2Z3nSXbwoFhK9x9BEs6b1qhF6xEcNJ7T4NqmiWaeuf",
  })
  wallet!: string;

  @ApiProperty({ description: "PAYMENT_LINK_BASE_URL + /@ + tag", example: "https://tagwise.me/@daniel" })
  paymentLink!: string;
}
