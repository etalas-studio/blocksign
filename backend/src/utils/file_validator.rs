//! File validation utilities for security
//!
//! Provides file validation including magic bytes verification,
//! filename sanitization, and content type validation.

use crate::models::AppError;
use std::path::Path;

/// Maximum file size in bytes (10 MB default)
pub const MAX_FILE_SIZE_BYTES: usize = 10 * 1024 * 1024;

/// Allowed MIME types for file upload
pub const ALLOWED_CONTENT_TYPES: &[&str] = &[
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
];

/// Magic byte signatures for common file types
const MAGIC_BYTES: &[(&[u8], &str)] = &[
    // PDF
    (&[0x25, 0x50, 0x44, 0x46], "application/pdf"),
    // PNG
    (&[0x89, 0x50, 0x4E, 0x47], "image/png"),
    // JPEG
    (&[0xFF, 0xD8, 0xFF], "image/jpeg"),
    // DOC (MS Word)
    (&[0xD0, 0xCF, 0x11, 0xE0], "application/msword"),
    // DOCX (ZIP signature)
    (&[0x50, 0x4B, 0x03, 0x04], "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    // Plain text (no magic bytes, handled separately)
];

/// Validate file size against maximum allowed
///
/// # Arguments
/// * `size` - File size in bytes
/// * `max_size` - Maximum allowed size in bytes
///
/// # Returns
/// Ok(()) if size is valid, Err otherwise
pub fn validate_file_size(size: usize, max_size: usize) -> Result<(), AppError> {
    if size > max_size {
        return Err(AppError::FileTooLargeError {
            max_size_mb: max_size / (1024 * 1024),
        });
    }
    Ok(())
}

/// Validate content type against allowed list
///
/// # Arguments
/// * `content_type` - MIME type to validate
///
/// # Returns
/// Ok(()) if content type is allowed, Err otherwise
pub fn validate_content_type(content_type: &str) -> Result<(), AppError> {
    if !is_allowed_content_type(content_type) {
        return Err(AppError::ValidationError(format!(
            "Content type '{}' is not allowed. Allowed types: PDF, DOC, DOCX, TXT, PNG, JPEG",
            content_type
        )));
    }
    Ok(())
}

/// Check if content type is in allowed list
pub fn is_allowed_content_type(content_type: &str) -> bool {
    ALLOWED_CONTENT_TYPES
        .contains(&content_type.to_lowercase().as_str())
}

/// Validate file content using magic bytes
///
/// # Arguments
/// * `bytes` - File content to validate
/// * `declared_content_type` - Content type declared by uploader
///
/// # Returns
/// Ok(()) if magic bytes match declared type, Err otherwise
pub fn validate_magic_bytes(bytes: &[u8], declared_content_type: &str) -> Result<(), AppError> {
    // Skip magic byte check for plain text (no signature)
    if declared_content_type == "text/plain" {
        // Additional check: verify it's actually text
        if !bytes.iter().all(|&b| b.is_ascii() || b <= 0x7F) {
            return Err(AppError::ValidationError(
                "File contains binary content but declared as text/plain".to_string(),
            ));
        }
        return Ok(());
    }

    // Check magic bytes against declared content type
    let detected_type = detect_content_type_from_magic_bytes(bytes);

    if let Some(detected) = detected_type {
        // For DOCX, we need to be more lenient as ZIP signature is shared
        if declared_content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            && detected == "application/zip"
        {
            return Ok(());
        }

        if detected != declared_content_type {
            return Err(AppError::ValidationError(format!(
                "File content (detected as {}) does not match declared type ({})",
                detected, declared_content_type
            )));
        }
    }

    Ok(())
}

/// Detect content type from magic bytes
///
/// # Arguments
/// * `bytes` - File content
///
/// # Returns
/// Some(content_type) if detected, None if unable to detect
fn detect_content_type_from_magic_bytes(bytes: &[u8]) -> Option<&'static str> {
    for &(magic, content_type) in MAGIC_BYTES {
        if bytes.starts_with(magic) {
            return Some(content_type);
        }
    }
    None
}

/// Sanitize filename to prevent path traversal attacks
///
/// # Arguments
/// * `filename` - Original filename
///
/// # Returns
/// Sanitized filename safe for storage
pub fn sanitize_filename(filename: &str) -> String {
    let path = Path::new(filename);

    // Extract just the file name, removing any path components
    let clean_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");

    // Remove null bytes and control characters
    let cleaned: String = clean_name
        .chars()
        .filter(|c| *c != '\0' && !c.is_control())
        .collect();

    // If empty after cleaning, use default
    if cleaned.is_empty() {
        "unnamed_file".to_string()
    } else {
        cleaned
    }
}

/// Comprehensive file validation
///
/// # Arguments
/// * `filename` - File name
/// * `bytes` - File content
/// * `content_type` - Declared content type
/// * `max_size` - Maximum allowed file size
///
/// # Returns
/// Ok(sanitized_filename) if valid, Err otherwise
pub fn validate_file(
    filename: &str,
    bytes: &[u8],
    content_type: &str,
    max_size: usize,
) -> Result<String, AppError> {
    // Validate file size
    validate_file_size(bytes.len(), max_size)?;

    // Validate content type
    validate_content_type(content_type)?;

    // Validate magic bytes
    validate_magic_bytes(bytes, content_type)?;

    // Sanitize filename
    let sanitized = sanitize_filename(filename);

    Ok(sanitized)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_file_size_valid() {
        assert!(validate_file_size(1024, 10 * 1024 * 1024).is_ok());
    }

    #[test]
    fn test_validate_file_size_invalid() {
        assert!(validate_file_size(11 * 1024 * 1024, 10 * 1024 * 1024).is_err());
    }

    #[test]
    fn test_validate_content_type_valid() {
        assert!(validate_content_type("application/pdf").is_ok());
        assert!(validate_content_type("image/png").is_ok());
    }

    #[test]
    fn test_validate_content_type_invalid() {
        assert!(validate_content_type("application/exe").is_err());
        assert!(validate_content_type("video/mp4").is_err());
    }

    #[test]
    fn test_is_allowed_content_type() {
        assert!(is_allowed_content_type("application/pdf"));
        assert!(is_allowed_content_type("Application/PDF")); // Case insensitive
        assert!(!is_allowed_content_type("application/exe"));
    }

    #[test]
    fn test_validate_magic_bytes_pdf() {
        let pdf_bytes = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34];
        assert!(validate_magic_bytes(&pdf_bytes, "application/pdf").is_ok());
    }

    #[test]
    fn test_validate_magic_bytes_mismatch() {
        let pdf_bytes = [0x25, 0x50, 0x44, 0x46]; // PDF magic bytes
        assert!(validate_magic_bytes(&pdf_bytes, "image/png").is_err());
    }

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("test.pdf"), "test.pdf");
        assert_eq!(sanitize_filename("path/to/file.pdf"), "file.pdf");
        assert_eq!(sanitize_filename("../../../etc/passwd"), "passwd");
        assert_eq!(
            sanitize_filename("file\0with\0nulls.pdf"),
            "filewithnulls.pdf"
        );
        assert_eq!(sanitize_filename(""), "unnamed_file");
    }

    #[test]
    fn test_validate_pdf_file() {
        let pdf_bytes = [
            0x25, 0x50, 0x44, 0x46, // %PDF
            0x2D, 0x31, 0x2E, 0x34, // -1.4
        ];
        assert!(validate_file("test.pdf", &pdf_bytes, "application/pdf", 1024).is_ok());
    }

    #[test]
    fn test_validate_file_too_large() {
        let large_bytes = vec![0u8; 11 * 1024 * 1024];
        assert!(validate_file("test.pdf", &large_bytes, "application/pdf", 10 * 1024 * 1024).is_err());
    }
}
