import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const keypairPath = path.join(os.homedir(), ".config", "solana", "tip-devnet-deployer.json");
const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
const wallet = Keypair.fromSecretKey(Uint8Array.from(keypairData));

const programId = new PublicKey("4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx");
const TAG = process.env.TIP_TEST_TAG;
if (!TAG) {
  throw new Error("set TIP_TEST_TAG to the tag to update");
}

const newWalletKeypair = Keypair.generate();

async function main() {
  const [tagPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tag"), Buffer.from(TAG as string)],
    programId
  );

  console.log(`Updating wallet for @${TAG}...`);
  console.log(`Tag PDA: ${tagPda.toBase58()}`);
  console.log(`New wallet: ${newWalletKeypair.publicKey.toBase58()}`);

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
    .updateWallet(newWalletKeypair.publicKey)
    .accounts({
      tagAccount: tagPda,
      owner: wallet.publicKey,
    })
    .rpc();

  console.log(`Wallet updated for @${TAG}.`);
  console.log(`TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main().catch(console.error);
