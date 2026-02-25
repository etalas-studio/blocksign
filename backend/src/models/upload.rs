use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileUpload {
    pub id: String,
    pub filename: String,
    pub hash: String,
    pub size: u64,
    pub content_type: String,
    pub storage_path: String,
    pub uploaded_at: DateTime<Utc>,
    pub tx_hash: Option<String>,
    pub signer_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadResponse {
    pub id: String,
    pub filename: String,
    pub hash: String,
    pub size: u64,
    pub uploaded_at: DateTime<Utc>,
    pub storage_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashResponse {
    pub id: String,
    pub filename: String,
    pub hash: String,
    pub size: u64,
    pub uploaded_at: DateTime<Utc>,
    pub tx_hash: Option<String>,
    pub signer_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionHashRequest {
    pub tx_hash: String,
    pub signer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResponse {
    pub hash: String,
    pub signatures: Vec<SignatureInfo>,
    pub exists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureInfo {
    pub signer: String,
    pub timestamp: u64,
    pub tx_hash: String,
}

impl From<FileUpload> for UploadResponse {
    fn from(upload: FileUpload) -> Self {
        Self {
            id: upload.id,
            filename: upload.filename,
            hash: upload.hash,
            size: upload.size,
            uploaded_at: upload.uploaded_at,
            storage_path: upload.storage_path,
        }
    }
}

impl From<FileUpload> for HashResponse {
    fn from(upload: FileUpload) -> Self {
        Self {
            id: upload.id,
            filename: upload.filename,
            hash: upload.hash,
            size: upload.size,
            uploaded_at: upload.uploaded_at,
            tx_hash: upload.tx_hash,
            signer_address: upload.signer_address,
        }
    }
}

pub const ALLOWED_CONTENT_TYPES: &[&str] = &[
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
];

pub fn is_allowed_content_type(content_type: &str) -> bool {
    ALLOWED_CONTENT_TYPES.contains(&content_type.to_lowercase().as_str())
}
