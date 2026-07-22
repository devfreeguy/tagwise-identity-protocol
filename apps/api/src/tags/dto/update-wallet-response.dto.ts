import { ApiProperty } from "@nestjs/swagger";

export class UpdateWalletResponseDto {
  @ApiProperty({ description: "Base64-encoded unsigned transaction. The client signs and submits it." })
  transaction!: string;

  @ApiProperty({ description: "The tag account PDA this transaction will update" })
  pda!: string;

  @ApiProperty({
    description: "Last block height at which the blockhash used in this transaction is valid, as a string (u64)",
  })
  lastValidBlockHeight!: string;
}
