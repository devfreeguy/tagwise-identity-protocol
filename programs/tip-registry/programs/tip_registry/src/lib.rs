pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod validation;

use anchor_lang::prelude::*;
pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx");

#[program]
pub mod tip_registry {
    use super::*;

    pub fn register_tag(ctx: Context<RegisterTag>, tag: String) -> Result<()> {
        instructions::register_tag::handler(ctx, tag)
    }

    pub fn update_wallet(ctx: Context<UpdateWallet>, new_wallet: Pubkey) -> Result<()> {
        instructions::update_wallet::handler(ctx, new_wallet)
    }

    pub fn transfer_ownership(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
        instructions::transfer_ownership::handler(ctx, new_owner)
    }
}
