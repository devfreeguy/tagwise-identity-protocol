use anchor_lang::prelude::Pubkey;
use anchor_lang::{solana_program::instruction::Instruction, AccountDeserialize, InstructionData, ToAccountMetas};
use litesvm::LiteSVM;
use solana_keypair::Keypair;
use solana_message::{Message, VersionedMessage};
use solana_signer::Signer;
use solana_transaction::versioned::VersionedTransaction;
use tip_registry::state::TagAccount;
use tip_registry::{accounts as tip_registry_accounts, instruction as tip_registry_instruction};

fn setup() -> (LiteSVM, Keypair) {
    let bytes = include_bytes!("../../../target/deploy/tip_registry.so");
    let program_id = tip_registry::id();
    let payer = Keypair::new();
    let mut svm = LiteSVM::new();
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&payer.pubkey(), 10_000_000_000).unwrap();
    (svm, payer)
}

fn send_ix(
    svm: &mut LiteSVM,
    payer: &Keypair,
    ix: Instruction,
    signers: Vec<&Keypair>,
) -> litesvm::types::TransactionResult {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&payer.pubkey()), &blockhash);
    let mut all_signers = vec![payer];
    all_signers.extend(signers);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &all_signers).unwrap();
    svm.send_transaction(tx)
}

fn tag_pda(tag: &str) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[tip_registry::TAG_SEED_PREFIX, tag.as_bytes()], &tip_registry::id())
}

fn register_ix(tag: &str, tag_account: Pubkey, owner: Pubkey, payer: Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        tip_registry::id(),
        &tip_registry_instruction::RegisterTag { tag: tag.to_string() }.data(),
        tip_registry_accounts::RegisterTag {
            tag_account,
            owner,
            payer,
            system_program: Pubkey::default(),
        }
        .to_account_metas(None),
    )
}

fn update_wallet_ix(tag_account: Pubkey, owner: Pubkey, new_wallet: Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        tip_registry::id(),
        &tip_registry_instruction::UpdateWallet { new_wallet }.data(),
        tip_registry_accounts::UpdateWallet { tag_account, owner }.to_account_metas(None),
    )
}

fn transfer_ownership_ix(tag_account: Pubkey, owner: Pubkey, new_owner: Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        tip_registry::id(),
        &tip_registry_instruction::TransferOwnership { new_owner }.data(),
        tip_registry_accounts::TransferOwnership { tag_account, owner }.to_account_metas(None),
    )
}

fn read_tag_account(svm: &LiteSVM, pda: &Pubkey) -> TagAccount {
    let account = svm.get_account(pda).expect("tag account should exist");
    let mut data: &[u8] = &account.data;
    TagAccount::try_deserialize(&mut data).expect("tag account should deserialize")
}

#[test]
fn register_tag_writes_expected_fields() {
    let (mut svm, payer) = setup();
    let tag = "devfreeguy";
    let (pda, bump) = tag_pda(tag);

    let res = send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]);
    assert!(res.is_ok(), "register_tag failed: {:?}", res.err());

    let tag_account = read_tag_account(&svm, &pda);
    assert_eq!(tag_account.owner, payer.pubkey());
    assert_eq!(tag_account.wallet, payer.pubkey());
    assert_eq!(tag_account.tag_len as usize, tag.len());
    assert_eq!(&tag_account.tag[..tag.len()], tag.as_bytes());
    assert!(tag_account.tag[tag.len()..].iter().all(|&b| b == 0), "tag buffer should be zero-padded");
    assert_eq!(tag_account.bump, bump);
}

#[test]
fn duplicate_register_fails() {
    let (mut svm, payer) = setup();
    let tag = "alice";
    let (pda, _) = tag_pda(tag);

    assert!(send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]).is_ok());
    let res = send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]);
    assert!(res.is_err(), "duplicate register_tag should fail");
}

#[test]
fn update_wallet_by_owner_succeeds() {
    let (mut svm, payer) = setup();
    let tag = "bob";
    let (pda, _) = tag_pda(tag);
    send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]).unwrap();

    let new_wallet = Keypair::new().pubkey();
    let res = send_ix(&mut svm, &payer, update_wallet_ix(pda, payer.pubkey(), new_wallet), vec![]);
    assert!(res.is_ok(), "update_wallet by owner failed: {:?}", res.err());

    let tag_account = read_tag_account(&svm, &pda);
    assert_eq!(tag_account.wallet, new_wallet);
}

#[test]
fn update_wallet_by_non_owner_fails() {
    let (mut svm, payer) = setup();
    let attacker = Keypair::new();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();
    let tag = "carol";
    let (pda, _) = tag_pda(tag);
    send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]).unwrap();

    let res = send_ix(&mut svm, &attacker, update_wallet_ix(pda, attacker.pubkey(), attacker.pubkey()), vec![]);
    assert!(res.is_err(), "update_wallet by non-owner should fail");
}

#[test]
fn transfer_ownership_by_non_owner_fails() {
    let (mut svm, payer) = setup();
    let attacker = Keypair::new();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();
    let tag = "dave";
    let (pda, _) = tag_pda(tag);
    send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]).unwrap();

    let res = send_ix(&mut svm, &attacker, transfer_ownership_ix(pda, attacker.pubkey(), attacker.pubkey()), vec![]);
    assert!(res.is_err(), "transfer_ownership by non-owner should fail");
}

#[test]
fn transfer_ownership_by_owner_succeeds_and_old_owner_loses_access() {
    let (mut svm, payer) = setup();
    let new_owner = Keypair::new();
    svm.airdrop(&new_owner.pubkey(), 1_000_000_000).unwrap();
    let tag = "eve";
    let (pda, _) = tag_pda(tag);
    send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]).unwrap();

    let res = send_ix(&mut svm, &payer, transfer_ownership_ix(pda, payer.pubkey(), new_owner.pubkey()), vec![]);
    assert!(res.is_ok(), "transfer_ownership by owner failed: {:?}", res.err());

    let tag_account = read_tag_account(&svm, &pda);
    assert_eq!(tag_account.owner, new_owner.pubkey());

    let res = send_ix(&mut svm, &payer, update_wallet_ix(pda, payer.pubkey(), payer.pubkey()), vec![]);
    assert!(res.is_err(), "old owner should no longer be able to update_wallet after transfer");
}

#[test]
fn register_tag_self_pay_owner_equals_payer_succeeds() {
    let (mut svm, payer) = setup();
    let tag = "selfpay";
    let (pda, _) = tag_pda(tag);

    let res = send_ix(&mut svm, &payer, register_ix(tag, pda, payer.pubkey(), payer.pubkey()), vec![]);
    assert!(res.is_ok(), "self-paid register_tag failed: {:?}", res.err());

    let tag_account = read_tag_account(&svm, &pda);
    assert_eq!(tag_account.owner, payer.pubkey());
}

#[test]
fn register_tag_sponsored_succeeds_and_owner_is_recorded_not_payer() {
    let (mut svm, _funder) = setup();
    let owner = Keypair::new();
    let sponsor = Keypair::new();
    svm.airdrop(&sponsor.pubkey(), 10_000_000_000).unwrap();
    let tag = "sponsored";
    let (pda, _) = tag_pda(tag);

    // The sponsor is both the transaction's fee payer and the instruction's
    // rent payer; the owner signs separately and pays nothing.
    let res = send_ix(&mut svm, &sponsor, register_ix(tag, pda, owner.pubkey(), sponsor.pubkey()), vec![&owner]);
    assert!(res.is_ok(), "sponsored register_tag failed: {:?}", res.err());

    let tag_account = read_tag_account(&svm, &pda);
    assert_eq!(tag_account.owner, owner.pubkey(), "owner field must be the owner, not the sponsor");
    assert_ne!(tag_account.owner, sponsor.pubkey());
}

#[test]
fn register_tag_missing_payer_signature_fails() {
    let (mut svm, funder) = setup();
    let owner = Keypair::new();
    let sponsor = Keypair::new();
    let tag = "unsponsored";
    let (pda, _) = tag_pda(tag);

    // sponsor is named as the payer account (a required Signer) but never
    // actually signs; this must fail, whether the SDK refuses to build the
    // transaction at all or the runtime rejects it for a missing signature.
    let ix = register_ix(tag, pda, owner.pubkey(), sponsor.pubkey());
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&funder.pubkey()), &blockhash);
    let signers: Vec<&Keypair> = vec![&funder, &owner];
    let result = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &signers);

    match result {
        Err(_) => {} // SDK refused to build a transaction missing a required signer: expected.
        Ok(tx) => {
            let res = svm.send_transaction(tx);
            assert!(res.is_err(), "register_tag should fail when the payer account has no matching signature");
        }
    }
}
