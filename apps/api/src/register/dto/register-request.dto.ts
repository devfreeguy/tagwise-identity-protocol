import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class RegisterRequestDto {
  @ApiProperty({ description: "The tag to register (any raw form; normalized server-side)" })
  @IsString()
  @MinLength(1)
  tag!: string;

  @ApiProperty({
    required: false,
    description:
      "Base58 wallet address to receive payments. Defaults to the authenticated owner pubkey if omitted. May differ from the owner.",
  })
  @IsOptional()
  @IsString()
  @MinLength(32)
  wallet?: string;
}
