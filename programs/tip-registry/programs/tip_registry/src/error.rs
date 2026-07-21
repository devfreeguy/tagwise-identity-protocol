use anchor_lang::prelude::*;

#[error_code]
pub enum TagRegistryError {
    #[msg("Tag is too short (minimum 3 characters)")]
    TagTooShort,

    #[msg("Tag is too long (maximum 20 characters)")]
    TagTooLong,

    #[msg("Tag contains an invalid character; only a-z, 0-9, and underscore are allowed")]
    TagInvalidChar,

    #[msg("Only the tag owner may perform this action")]
    Unauthorized,
}
