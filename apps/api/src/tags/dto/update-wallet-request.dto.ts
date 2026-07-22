import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdateWalletRequestDto {
  @ApiProperty({ description: "Base58 wallet address that should receive future payments" })
  @IsString()
  @MinLength(32)
  wallet!: string;
}
