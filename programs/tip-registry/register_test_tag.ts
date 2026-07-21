import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
const wallet = Keypair.fromSecretKey(Uint8Array.from(keypairData));

const programId = new PublicKey("4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx");
const TAG = "test_user";

async function main() {
  const [tagPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tag"), Buffer.from(TAG)],
    programId
  );

  console.log(`Registering @${TAG}...`);
  console.log(`Tag PDA: ${tagPda.toBase58()}`);
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  const idl = JSON.parse(
    fs.readFileSync("./target/idl/tip_registry.json", "utf-8")
  );

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );

  const program = new Program(idl, provider);

  const tx = await (program.methods as any)
    .registerTag(TAG)
    .accounts({
      tagAccount: tagPda,
      owner: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log(`Tag @${TAG} registered.`);
  console.log(`TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main().catch(console.error);
