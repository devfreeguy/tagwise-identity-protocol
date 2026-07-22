import { ApiProperty } from "@nestjs/swagger";

export class MeResponseDto {
  @ApiProperty({ description: "The authenticated caller's base58 Solana wallet address" })
  pubkey!: string;
}
