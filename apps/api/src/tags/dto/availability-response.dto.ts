import { ApiProperty } from "@nestjs/swagger";

export class AvailabilityResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty()
  available!: boolean;

  @ApiProperty({
    description:
      "Short machine-readable reason. Only canonical-form and mirror-presence are checked in this stage; reserved-list and profanity checks land in stage 3 with registration.",
    example: "canonical_and_unused",
  })
  reason!: string;
}
