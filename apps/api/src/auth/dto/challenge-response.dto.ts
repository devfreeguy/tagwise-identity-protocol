import { ApiProperty } from "@nestjs/swagger";

export class ChallengeResponseDto {
  @ApiProperty({ description: "The exact message string the client must sign with its wallet" })
  message!: string;
}
