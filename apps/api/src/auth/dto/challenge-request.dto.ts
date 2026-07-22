import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChallengeRequestDto {
  @ApiProperty({
    description: "Base58 Solana wallet address to issue a challenge for",
    example: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2akbP",
  })
  @IsString()
  @MinLength(32)
  pubkey!: string;
}
