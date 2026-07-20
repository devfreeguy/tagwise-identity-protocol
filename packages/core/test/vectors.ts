import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const vectorsPath = fileURLToPath(
  new URL("../test-vectors/tag-rules.json", import.meta.url),
);

export type NormalizationCase = {
  name: string;
  input: string;
  expected:
    | { ok: true; tag: string }
    | { ok: false; reason: string };
};

export type SeedCase = {
  name: string;
  tag: string;
  seedsHex: string[];
};

export type PdaCase = {
  name: string;
  tag: string;
  programId: string;
  expectedAddress: string;
  expectedBump: number;
};

export type TagRulesVectors = {
  description: string;
  seedPrefix: string;
  minLength: number;
  maxLength: number;
  normalizationCases: NormalizationCase[];
  seedCases: SeedCase[];
  pdaCases: PdaCase[];
};

export const vectors: TagRulesVectors = JSON.parse(
  readFileSync(vectorsPath, "utf8"),
);
