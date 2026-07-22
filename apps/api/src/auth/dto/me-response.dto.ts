import { ApiProperty } from "@nestjs/swagger";

export class MeResponseDto {
  @ApiProperty({
    description: "The authenticated caller's base58 Solana wallet address",
    example: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2akbP",
  })
  pubkey!: string;
}
