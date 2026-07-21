import { ApiProperty } from "@nestjs/swagger";

export class PaymentLinkResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({ description: "Base58 wallet address that receives payments" })
  wallet!: string;

  @ApiProperty({ description: "PAYMENT_LINK_BASE_URL + /@ + tag" })
  paymentLink!: string;
}
