import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class RegisterRequestDto {
  @ApiProperty({ description: "The tag to register (any raw form; normalized server-side)", example: "daniel" })
  @IsString()
  @MinLength(1)
  tag!: string;

  @ApiProperty({
    required: false,
    description:
      "Base58 wallet address to receive payments. Defaults to the authenticated owner pubkey if omitted. May differ from the owner.",
    example: "8L2Z3nSXbwoFhK9x9BEs6b1qhF6xEcNJ7T4NqmiWaeuf",
  })
  @IsOptional()
  @IsString()
  @MinLength(32)
  wallet?: string;
}
