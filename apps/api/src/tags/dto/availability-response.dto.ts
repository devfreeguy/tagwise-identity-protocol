import { ApiProperty } from "@nestjs/swagger";

export class AvailabilityResponseDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({ example: true })
  available!: boolean;

  @ApiProperty({
    description:
      "available if free to register; invalid if the tag fails canonical-form rules; reserved if it's on the protocol's reserved list; inappropriate if it fails the profanity filter; already_registered if an active row already exists for it.",
    enum: ["available", "invalid", "reserved", "inappropriate", "already_registered"],
    example: "available",
  })
  reason!: string;
}
