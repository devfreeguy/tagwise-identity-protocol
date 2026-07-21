use std::path::{Path, PathBuf};

use serde::Deserialize;
use tip_registry::validation::validate_canonical_tag;
use tip_registry::TAG_SEED_PREFIX;

#[derive(Deserialize)]
struct TagRules {
    #[serde(rename = "seedPrefix")]
    seed_prefix: String,
    #[serde(rename = "normalizationCases")]
    normalization_cases: Vec<NormalizationCase>,
    #[serde(rename = "seedCases")]
    seed_cases: Vec<SeedCase>,
}

#[derive(Deserialize)]
struct NormalizationCase {
    name: String,
    input: String,
    expected: Expected,
}

#[derive(Deserialize)]
struct Expected {
    ok: bool,
    tag: Option<String>,
}

#[derive(Deserialize)]
struct SeedCase {
    name: String,
    tag: String,
    #[serde(rename = "seedsHex")]
    seeds_hex: Vec<String>,
}

/// packages/core/test-vectors/tag-rules.json lives four directories above
/// this crate: tip_registry -> programs -> tip-registry -> tip (repo root).
fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(4)
        .expect("repo root should be four levels above CARGO_MANIFEST_DIR")
        .to_path_buf()
}

fn load_tag_rules() -> TagRules {
    let path = repo_root().join("packages/core/test-vectors/tag-rules.json");
    let data = std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("failed to read {}: {}", path.display(), e));
    serde_json::from_str(&data).expect("tag-rules.json should be valid JSON matching TagRules")
}

fn hex_decode(s: &str) -> Vec<u8> {
    assert_eq!(s.len() % 2, 0, "hex string must have even length: {s}");
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).expect("valid hex byte"))
        .collect()
}

fn build_seeds(tag: &str) -> Vec<u8> {
    let mut seeds = TAG_SEED_PREFIX.to_vec();
    seeds.extend_from_slice(tag.as_bytes());
    seeds
}

/// SEED parity, strict byte-for-byte: for every seedCase, and for every
/// normalizationCase whose expected.ok is true, seeds built from the
/// canonical tag must equal [b"tag", tag_bytes] with no hashing.
#[test]
fn seed_parity() {
    let rules = load_tag_rules();
    assert_eq!(
        TAG_SEED_PREFIX,
        rules.seed_prefix.as_bytes(),
        "TAG_SEED_PREFIX must match tag-rules.json seedPrefix"
    );

    for case in &rules.seed_cases {
        assert_eq!(case.seeds_hex.len(), 2, "seedCase {} must have two seed parts", case.name);
        let expected_prefix = hex_decode(&case.seeds_hex[0]);
        let expected_tag = hex_decode(&case.seeds_hex[1]);
        assert_eq!(TAG_SEED_PREFIX, expected_prefix.as_slice(), "seed prefix mismatch for seedCase {}", case.name);
        assert_eq!(case.tag.as_bytes(), expected_tag.as_slice(), "tag seed mismatch for seedCase {}", case.name);

        let seeds = build_seeds(&case.tag);
        let expected: Vec<u8> = [expected_prefix, expected_tag].concat();
        assert_eq!(seeds, expected, "built seeds mismatch for seedCase {}", case.name);
    }

    for case in &rules.normalization_cases {
        if !case.expected.ok {
            continue;
        }
        let tag = case
            .expected
            .tag
            .as_ref()
            .unwrap_or_else(|| panic!("ok=true normalizationCase {} must have expected.tag", case.name));

        let seeds = build_seeds(tag);
        let mut expected = TAG_SEED_PREFIX.to_vec();
        expected.extend_from_slice(tag.as_bytes());
        assert_eq!(seeds, expected, "built seeds mismatch for normalizationCase {}", case.name);
    }
}

/// ACCEPTANCE parity: for every normalizationCase with expected.ok true,
/// the program validator must accept the canonical expected.tag.
#[test]
fn acceptance_parity() {
    let rules = load_tag_rules();
    for case in &rules.normalization_cases {
        if !case.expected.ok {
            continue;
        }
        let tag = case
            .expected
            .tag
            .as_ref()
            .unwrap_or_else(|| panic!("ok=true normalizationCase {} must have expected.tag", case.name));

        assert!(
            validate_canonical_tag(tag).is_ok(),
            "validator should accept canonical tag for normalizationCase {}: {:?}",
            case.name,
            tag
        );
    }
}

/// REJECTION parity: the validator answers a different question than
/// packages/core normalization, so we never compare reason codes, only
/// accept/reject outcomes.
///
/// For every normalizationCase with expected.ok false, the validator must
/// reject the raw input. For every case with expected.ok true whose raw
/// input differs from the canonical tag, the validator must also reject the
/// raw input directly: non-canonical forms like "@Daniel" or "@abc" must
/// never be registrable without going through client-side normalization
/// first.
#[test]
fn rejection_parity() {
    let rules = load_tag_rules();
    for case in &rules.normalization_cases {
        if !case.expected.ok {
            assert!(
                validate_canonical_tag(&case.input).is_err(),
                "validator should reject raw input for normalizationCase {}: {:?}",
                case.name,
                case.input
            );
            continue;
        }

        let tag = case
            .expected
            .tag
            .as_ref()
            .unwrap_or_else(|| panic!("ok=true normalizationCase {} must have expected.tag", case.name));

        if &case.input != tag {
            assert!(
                validate_canonical_tag(&case.input).is_err(),
                "validator should reject non-canonical raw input for normalizationCase {}: {:?}",
                case.name,
                case.input
            );
        }
    }
}
