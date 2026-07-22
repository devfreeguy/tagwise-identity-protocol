import { ApiProperty } from "@nestjs/swagger";

export class UpdateWalletResponseDto {
  @ApiProperty({
    description: "Base64-encoded unsigned transaction. The client signs and submits it.",
    example: "AQABAwLd0EBAvJf3fKh1QMwbTvbnFbf/lYw/BhqlBTQU2WeUsWfz9L5o1LYh...",
  })
  transaction!: string;

  @ApiProperty({
    description: "The tag account PDA this transaction will update",
    example: "3fMxKPQvRnZ8Ldq2vBcTHYRWQnJ8gAxE4tCyF6mWzUKp",
  })
  pda!: string;

  @ApiProperty({
    description: "Last block height at which the blockhash used in this transaction is valid, as a string (u64)",
    example: "301234567",
  })
  lastValidBlockHeight!: string;
}
