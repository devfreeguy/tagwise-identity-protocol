import { ApiProperty } from "@nestjs/swagger";

export class AvailabilityResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty()
  available!: boolean;

  @ApiProperty({
    description: "One of: available, invalid, reserved, inappropriate, already_registered.",
    example: "available",
  })
  reason!: string;
}
