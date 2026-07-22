import { ApiProperty } from "@nestjs/swagger";

export class SearchResultItemDto {
  @ApiProperty({ description: "The tag, presented with a leading @", example: "@daniel" })
  tag!: string;

  @ApiProperty({ required: false, nullable: true, example: "Daniel" })
  displayName!: string | null;

  @ApiProperty({ required: false, nullable: true, example: "https://cdn.tagwise.me/avatars/daniel.png" })
  avatar!: string | null;

  @ApiProperty({ example: false })
  verified!: boolean;
}
