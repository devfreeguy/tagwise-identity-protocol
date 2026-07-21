import { ApiProperty } from "@nestjs/swagger";

export class SearchResultItemDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({ required: false, nullable: true })
  displayName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  avatar!: string | null;

  @ApiProperty()
  verified!: boolean;
}
