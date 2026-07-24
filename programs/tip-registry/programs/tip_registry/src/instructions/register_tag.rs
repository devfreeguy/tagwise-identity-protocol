use anchor_lang::prelude::*;

use crate::constants::*;
use crate::state::TagAccount;
use crate::validation::validate_tag_access;

#[access_control(validate_tag_access(&tag))]
pub fn handler(ctx: Context<RegisterTag>, tag: String) -> Result<()> {
    let tag_bytes = tag.as_bytes();

    let mut padded = [0u8; MAX_TAG_LENGTH];
    padded[..tag_bytes.len()].copy_from_slice(tag_bytes);

    let tag_account = &mut ctx.accounts.tag_account;
    tag_account.owner = ctx.accounts.owner.key();
    tag_account.wallet = ctx.accounts.owner.key();
    tag_account.tag = padded;
    tag_account.tag_len = tag_bytes.len() as u8;
    tag_account.bump = ctx.bumps.tag_account;

    Ok(())
}

#[derive(Accounts)]
#[instruction(tag: String)]
pub struct RegisterTag<'info> {
    #[account(
        init,
        payer = payer,
        space = ANCHOR_DISCRIMINATOR + TagAccount::INIT_SPACE,
        seeds = [TAG_SEED_PREFIX, tag.as_bytes()],
        bump,
    )]
    pub tag_account: Account<'info, TagAccount>,

    /// Recorded as the tag's owner. Never pays; may be the same key as
    /// `payer` for a self-paid registration (one signature covers both).
    pub owner: Signer<'info>,

    /// Funds the tag account's rent-exemption. Decoupled from `owner` so a
    /// sponsor can cover rent and fees on behalf of a user who holds none.
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
