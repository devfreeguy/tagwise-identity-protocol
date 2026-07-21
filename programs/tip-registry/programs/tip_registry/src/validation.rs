use anchor_lang::prelude::*;

use crate::constants::{MAX_TAG_LENGTH, MIN_TAG_LENGTH};
use crate::error::TagRegistryError;

fn is_canonical_byte(byte: u8) -> bool {
    byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_'
}

/// Validates that `tag` is already in canonical form: length MIN_TAG_LENGTH
/// to MAX_TAG_LENGTH inclusive, every byte one of a-z, 0-9, or underscore.
/// This never transforms the input, it only accepts or rejects. Stripping
/// an "@" and lowercasing happen only on the client, in packages/core.
pub fn validate_canonical_tag(tag: &str) -> std::result::Result<(), TagRegistryError> {
    if tag.len() < MIN_TAG_LENGTH {
        return Err(TagRegistryError::TagTooShort);
    }
    if tag.len() > MAX_TAG_LENGTH {
        return Err(TagRegistryError::TagTooLong);
    }
    if !tag.bytes().all(is_canonical_byte) {
        return Err(TagRegistryError::TagInvalidChar);
    }
    Ok(())
}

/// Anchor-facing wrapper used by #[access_control], converting the plain
/// TagRegistryError into anchor_lang's Result via its generated From impl.
pub fn validate_tag_access(tag: &str) -> Result<()> {
    validate_canonical_tag(tag)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn too_short_precedes_invalid_char_at_length_two() {
        let result = validate_canonical_tag("a.");
        assert!(matches!(result, Err(TagRegistryError::TagTooShort)));
    }

    #[test]
    fn too_long_precedes_invalid_char_at_length_twenty_one() {
        let tag = format!("{}.", "a".repeat(20));
        assert_eq!(tag.len(), 21);
        let result = validate_canonical_tag(&tag);
        assert!(matches!(result, Err(TagRegistryError::TagTooLong)));
    }

    #[test]
    fn accepts_min_length_canonical_tag() {
        assert!(validate_canonical_tag("abc").is_ok());
    }

    #[test]
    fn accepts_max_length_canonical_tag() {
        let tag = "a".repeat(20);
        assert!(validate_canonical_tag(&tag).is_ok());
    }

    #[test]
    fn rejects_uppercase_as_invalid_char() {
        let result = validate_canonical_tag("Abc");
        assert!(matches!(result, Err(TagRegistryError::TagInvalidChar)));
    }

    #[test]
    fn rejects_at_sign_as_invalid_char() {
        let result = validate_canonical_tag("@abc");
        assert!(matches!(result, Err(TagRegistryError::TagInvalidChar)));
    }

    #[test]
    fn accepts_leading_and_trailing_underscore() {
        assert!(validate_canonical_tag("_abc").is_ok());
        assert!(validate_canonical_tag("abc_").is_ok());
    }
}
