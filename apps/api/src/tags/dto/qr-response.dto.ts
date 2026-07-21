import { ApiProperty } from "@nestjs/swagger";

/**
 * The QR payload data, never an image. A formal Solana Pay URI can be
 * standardized later; this keeps the payload minimal and correct for now.
 */
export class QrResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({ description: "Base58 wallet address that should receive the payment" })
  wallet!: string;

  @ApiProperty({ description: "PAYMENT_LINK_BASE_URL + /@ + tag" })
  paymentLink!: string;
}
