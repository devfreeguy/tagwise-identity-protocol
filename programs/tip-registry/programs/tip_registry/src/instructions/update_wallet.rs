use anchor_lang::prelude::*;

use crate::constants::TAG_SEED_PREFIX;
use crate::error::TagRegistryError;
use crate::state::TagAccount;

pub fn handler(ctx: Context<UpdateWallet>, new_wallet: Pubkey) -> Result<()> {
    ctx.accounts.tag_account.wallet = new_wallet;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateWallet<'info> {
    #[account(
        mut,
        seeds = [TAG_SEED_PREFIX, &tag_account.tag[..tag_account.tag_len as usize]],
        bump = tag_account.bump,
        has_one = owner @ TagRegistryError::Unauthorized,
    )]
    pub tag_account: Account<'info, TagAccount>,

    pub owner: Signer<'info>,
}
