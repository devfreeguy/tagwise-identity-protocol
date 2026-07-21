use anchor_lang::prelude::*;

use crate::constants::TAG_SEED_PREFIX;
use crate::error::TagRegistryError;
use crate::state::TagAccount;

pub fn handler(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
    ctx.accounts.tag_account.owner = new_owner;
    Ok(())
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(
        mut,
        seeds = [TAG_SEED_PREFIX, &tag_account.tag[..tag_account.tag_len as usize]],
        bump = tag_account.bump,
        has_one = owner @ TagRegistryError::Unauthorized,
    )]
    pub tag_account: Account<'info, TagAccount>,

    pub owner: Signer<'info>,
}
