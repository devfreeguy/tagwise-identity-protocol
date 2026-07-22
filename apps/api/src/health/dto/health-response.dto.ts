import { ApiProperty } from "@nestjs/swagger";

export class HealthResponseDto {
  @ApiProperty({ enum: ["ok"], example: "ok" })
  status!: "ok";

  @ApiProperty({ description: "Postgres reachability", enum: ["reachable", "unreachable"], example: "reachable" })
  db!: "reachable" | "unreachable";

  @ApiProperty({ description: "Redis reachability", enum: ["reachable", "unreachable"], example: "reachable" })
  redis!: "reachable" | "unreachable";
}
