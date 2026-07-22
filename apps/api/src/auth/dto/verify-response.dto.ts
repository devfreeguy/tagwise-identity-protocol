import { ApiProperty } from "@nestjs/swagger";

export class VerifyResponseDto {
  @ApiProperty({ description: "Short-lived session JWT, subject is the authenticated pubkey" })
  token!: string;
}
