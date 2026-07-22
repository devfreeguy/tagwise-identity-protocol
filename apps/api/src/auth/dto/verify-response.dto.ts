import { ApiProperty } from "@nestjs/swagger";

export class VerifyResponseDto {
  @ApiProperty({
    description: "Short-lived session JWT, subject is the authenticated pubkey",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Rkh3a3JkeG50ZEsyNGhnUVU4In0.k7f2Qd8B3ZJ9x1YvW6rT4pL0mN2sA5cH",
  })
  token!: string;
}
