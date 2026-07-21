import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const vectorsPath = fileURLToPath(
  new URL("../../../packages/core/test-vectors/tag-rules.json", import.meta.url),
);

export type AccountDecodeCase = {
  name: string;
  bufferHex: string;
  expected: {
    owner: string;
    wallet: string;
    tag: string;
    bump: number;
  };
};

export type TagRulesVectors = {
  accountDecodeCases: {
    discriminatorHex: string;
    cases: AccountDecodeCase[];
  };
};

export const vectors: TagRulesVectors = JSON.parse(readFileSync(vectorsPath, "utf8"));

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
