use anchor_lang::prelude::*;

use crate::constants::MAX_TAG_LENGTH;

#[account]
#[derive(InitSpace)]
pub struct TagAccount {
    /// The wallet that owns/controls this tag (can update the target wallet or transfer ownership)
    pub owner: Pubkey,

    /// The wallet address that receives payments sent to this tag
    pub wallet: Pubkey,

    /// ASCII tag bytes, zero-padded to MAX_TAG_LENGTH. Only the first tag_len bytes are meaningful.
    pub tag: [u8; MAX_TAG_LENGTH],

    /// Number of meaningful bytes in tag
    pub tag_len: u8,

    /// Bump seed for PDA derivation
    pub bump: u8,
}
