import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdateWalletRequestDto {
  @ApiProperty({
    description: "Base58 wallet address that should receive future payments",
    example: "8L2Z3nSXbwoFhK9x9BEs6b1qhF6xEcNJ7T4NqmiWaeuf",
  })
  @IsString()
  @MinLength(32)
  wallet!: string;
}
