//! Hash validation service for double-hash verification and tamper detection
//!
//! This service provides comprehensive hash validation including:
//! - Client vs server hash comparison
//! - Double-hash verification
//! - Tamper evidence detection
//! - Hash format validation

use crate::models::AppError;
use anyhow::Result;
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};

/// Hash validation result
#[derive(Debug, Clone)]
pub struct HashValidationResult {
    /// Whether the hash is valid
    pub valid: bool,
    /// Client-provided hash
    pub client_hash: String,
    /// Server-computed hash
    pub server_hash: String,
    /// Whether hashes match
    pub hashes_match: bool,
    /// Tamper evidence flag
    pub potential_tampering: bool,
    /// Validation timestamp
    pub validated_at: u64,
}

/// Validate hash string format (already exists in hashing.rs, but kept here for convenience)
///
/// Must be 66 characters: 0x prefix + 64 hex characters
pub fn validate_hash_format(hash: &str) -> Result<(), AppError> {
    if !hash.starts_with("0x") {
        return Err(AppError::ValidationError(
            "Hash must start with 0x prefix".to_string(),
        ));
    }

    let hex_part = &hash[2..];
    if hex_part.len() != 64 {
        return Err(AppError::ValidationError(format!(
            "Hash must be 64 hex characters (got {})",
            hex_part.len()
        )));
    }

    if !hex_part.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(AppError::ValidationError(
            "Hash contains non-hexadecimal characters".to_string(),
        ));
    }

    Ok(())
}

/// Verify hash matches client-provided hash
///
/// # Arguments
/// * `bytes` - File content
/// * `client_hash` - Hash provided by client
///
/// # Returns
/// HashValidationResult with comparison details
pub fn verify_hash(bytes: &[u8], client_hash: &str) -> Result<HashValidationResult, AppError> {
    // Validate client hash format
    validate_hash_format(client_hash)?;

    // Compute server hash
    let server_hash = compute_hash(bytes)?;

    // Compare hashes
    let hashes_match = server_hash.eq_ignore_ascii_case(client_hash);

    // Check for potential tampering (hashes don't match)
    let potential_tampering = !hashes_match;

    let validated_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(HashValidationResult {
        valid: hashes_match,
        client_hash: client_hash.to_string(),
        server_hash,
        hashes_match,
        potential_tampering,
        validated_at,
    })
}

/// Compute SHA-256 hash of byte array
/// Returns hex-encoded string with 0x prefix
fn compute_hash(bytes: &[u8]) -> Result<String> {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let result = hasher.finalize();
    Ok(format!("0x{}", hex::encode(result)))
}

/// Compute double hash (hash of hash) for additional security
///
/// # Arguments
/// * `hash` - Original hash to double-hash
///
/// # Returns
/// Double-hashed value
pub fn compute_double_hash(hash: &str) -> Result<String, AppError> {
    // Remove 0x prefix if present
    let hex_part = hash.strip_prefix("0x").unwrap_or(hash);

    // Decode hex to bytes
    let hash_bytes = hex::decode(hex_part)
        .map_err(|_| AppError::ValidationError("Invalid hex string for double-hash".to_string()))?;

    // Hash the hash
    compute_hash(&hash_bytes).map_err(|e| AppError::HashingError(e.to_string()))
}

/// Verify double hash matches expected value
///
/// # Arguments
/// * `hash` - Original hash
/// * `expected_double_hash` - Expected double hash value
///
/// # Returns
/// true if double hash matches
pub fn verify_double_hash(hash: &str, expected_double_hash: &str) -> Result<bool, AppError> {
    let computed = compute_double_hash(hash)?;
    Ok(computed.eq_ignore_ascii_case(expected_double_hash))
}

/// Check if two hashes are equivalent (case-insensitive)
///
/// # Arguments
/// * `hash1` - First hash
/// * `hash2` - Second hash
///
/// # Returns
/// true if hashes match
pub fn hashes_equivalent(hash1: &str, hash2: &str) -> bool {
    hash1.eq_ignore_ascii_case(hash2)
}

/// Detect if document has been tampered with based on hash mismatch
///
/// # Arguments
/// * `original_hash` - Hash from when document was uploaded
/// * `current_hash` - Hash computed from current document
///
/// # Returns
/// true if tampering detected
pub fn detect_tampering(original_hash: &str, current_hash: &str) -> bool {
    !hashes_equivalent(original_hash, current_hash)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_hash_format_valid() {
        let hash = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        assert!(validate_hash_format(hash).is_ok());
    }

    #[test]
    fn test_validate_hash_format_missing_prefix() {
        let hash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        assert!(validate_hash_format(hash).is_err());
    }

    #[test]
    fn test_validate_hash_format_wrong_length() {
        let hash = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a";
        assert!(validate_hash_format(hash).is_err());
    }

    #[test]
    fn test_verify_hash_matching() {
        let data = b"Hello, BlockSign!";
        let hash = "0x4a5e1b4fa6b3d8c9e2f1a4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d";
        let client_hash = compute_hash(data).unwrap();

        let result = verify_hash(data, &client_hash).unwrap();
        assert!(result.valid);
        assert!(result.hashes_match);
        assert!(!result.potential_tampering);
    }

    #[test]
    fn test_verify_hash_mismatch() {
        let data = b"Hello, BlockSign!";
        let wrong_hash = "0x0000000000000000000000000000000000000000000000000000000000000000";

        let result = verify_hash(data, wrong_hash).unwrap();
        assert!(!result.valid);
        assert!(!result.hashes_match);
        assert!(result.potential_tampering);
    }

    #[test]
    fn test_compute_double_hash() {
        let hash = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        let double_hash = compute_double_hash(hash).unwrap();

        assert!(double_hash.starts_with("0x"));
        assert_eq!(double_hash.len(), 66);
        assert_ne!(double_hash, hash); // Double hash should be different
    }

    #[test]
    fn test_verify_double_hash() {
        let hash = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        let double_hash = compute_double_hash(hash).unwrap();

        assert!(verify_double_hash(hash, &double_hash).unwrap());
        assert!(!verify_double_hash(hash, hash).unwrap()); // Same hash should not match double hash
    }

    #[test]
    fn test_hashes_equivalent() {
        let hash1 = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        let hash2 = "0X9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08"; // Uppercase
        let hash3 = "0x0000000000000000000000000000000000000000000000000000000000000000";

        assert!(hashes_equivalent(hash1, hash2));
        assert!(!hashes_equivalent(hash1, hash3));
    }

    #[test]
    fn test_detect_tampering() {
        let hash1 = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        let hash2 = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        let hash3 = "0x0000000000000000000000000000000000000000000000000000000000000000";

        assert!(!detect_tampering(hash1, hash2)); // Same hash, no tampering
        assert!(detect_tampering(hash1, hash3)); // Different hash, tampering detected
    }
}
