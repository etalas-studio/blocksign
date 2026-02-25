use crate::models::AppError;
use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;
use std::path::Path;

/// Compute SHA-256 hash of byte array
/// Returns hex-encoded string with 0x prefix
pub fn compute_hash(bytes: &[u8]) -> Result<String> {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let result = hasher.finalize();
    Ok(format!("0x{}", hex::encode(result)))
}

/// Compute SHA-256 hash from file path
/// Reads entire file into memory (suitable for files under 10MB)
pub fn compute_hash_from_file<P: AsRef<Path>>(path: P) -> Result<String> {
    let mut file = File::open(path.as_ref())
        .context("Failed to open file for hashing")?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .context("Failed to read file for hashing")?;
    compute_hash(&buffer)
}

/// Validate hash string format
/// Must be 66 characters: 0x prefix + 64 hex characters
pub fn validate_hash_format(hash: &str) -> Result<(), AppError> {
    if !hash.starts_with("0x") {
        return Err(AppError::ValidationError(
            "Hash must start with 0x prefix".to_string(),
        ));
    }

    let hex_part = &hash[2..];
    if hex_part.len() != 64 {
        return Err(AppError::ValidationError(
            format!("Hash must be 64 hex characters (got {})", hex_part.len())
        ));
    }

    if !hex_part.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(AppError::ValidationError(
            "Hash contains non-hexadecimal characters".to_string(),
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_hash() {
        let data = b"Hello, BlockSign!";
        let hash = compute_hash(data).unwrap();
        assert!(hash.starts_with("0x"));
        assert_eq!(hash.len(), 66);
    }

    #[test]
    fn test_hash_deterministic() {
        let data = b"Test data";
        let hash1 = compute_hash(data).unwrap();
        let hash2 = compute_hash(data).unwrap();
        assert_eq!(hash1, hash2);
    }

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
    fn test_validate_hash_format_invalid_hex() {
        let hash = "0x9g86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        assert!(validate_hash_format(hash).is_err());
    }
}
