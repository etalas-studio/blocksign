//! Database models
//!
//! These structs represent the database entities and are used for
//! type-safe database operations with SQLx.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ============================================================================
// Document Models
// ============================================================================

/// Represents a document record in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Document {
    pub id: i64,
    pub document_hash: String,
    pub ipfs_hash: Option<String>,
    pub file_name: String,
    pub file_size: i64,
    pub content_type: String,
    pub storage_path: String,
    pub uploader_wallet: String,
    pub metadata: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Represents a new document to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewDocument {
    pub document_hash: String,
    pub ipfs_hash: Option<String>,
    pub file_name: String,
    pub file_size: i64,
    pub content_type: String,
    pub storage_path: String,
    pub uploader_wallet: String,
    pub metadata: Option<String>,
}

/// Represents document update payload
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDocument {
    pub ipfs_hash: Option<Option<String>>,
    pub metadata: Option<Option<String>>,
}

// ============================================================================
// Signature Models
// ============================================================================

/// Represents a signature record in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Signature {
    pub id: i64,
    pub document_id: i64,
    pub signer_address: String,
    pub signature_hash: String,
    pub timestamp: DateTime<Utc>,
    pub blockchain_tx: Option<String>,
    pub block_number: Option<i64>,
    pub gas_used: Option<f64>,
    pub network: i64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Represents a new signature to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewSignature {
    pub document_id: i64,
    pub signer_address: String,
    pub signature_hash: String,
    pub timestamp: DateTime<Utc>,
    pub blockchain_tx: Option<String>,
    pub block_number: Option<i64>,
    pub gas_used: Option<f64>,
    pub network: i64,
    pub status: String,
}

/// Represents signature update payload
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSignature {
    pub blockchain_tx: Option<Option<String>>,
    pub block_number: Option<Option<i64>>,
    pub gas_used: Option<Option<f64>>,
    pub status: Option<String>,
}

// ============================================================================
// Wallet Models
// ============================================================================

/// Represents a wallet record in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Wallet {
    pub address: String,
    pub network: i64,
    pub first_seen: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
    pub metadata: Option<String>,
}

/// Represents a new wallet to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewWallet {
    pub address: String,
    pub network: i64,
    pub metadata: Option<String>,
}

/// Represents wallet update payload
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateWallet {
    pub last_seen: Option<DateTime<Utc>>,
    pub metadata: Option<Option<String>>,
}

// ============================================================================
// Audit Log Models
// ============================================================================

/// Represents an audit log entry in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AuditLog {
    pub id: i64,
    pub entity_type: String,
    pub entity_id: i64,
    pub event_type: String,
    pub event_data: Option<String>,
    pub actor_wallet: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub blockchain_tx: Option<String>,
}

/// Represents a new audit log entry to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewAuditLog {
    pub entity_type: String,
    pub entity_id: i64,
    pub event_type: String,
    pub event_data: Option<String>,
    pub actor_wallet: Option<String>,
    pub blockchain_tx: Option<String>,
}

// ============================================================================
// Verification Request Models
// ============================================================================

/// Represents a verification request in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct VerificationRequest {
    pub id: i64,
    pub document_id: Option<i64>,
    pub document_hash: String,
    pub requester_ip: Option<String>,
    pub requested_at: DateTime<Utc>,
    pub verified: bool,
    pub result_status: Option<String>,
    pub result_details: Option<String>,
}

/// Represents a new verification request to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewVerificationRequest {
    pub document_id: Option<i64>,
    pub document_hash: String,
    pub requester_ip: Option<String>,
}

/// Represents verification result update payload
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateVerificationResult {
    pub verified: bool,
    pub result_status: String,
    pub result_details: Option<String>,
}

// ============================================================================
// Statistics Models
// ============================================================================

/// Database statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub total_documents: i64,
    pub total_signatures: i64,
    pub active_wallets: i64,
    pub total_audit_logs: i64,
    pub total_verifications: i64,
}

// ============================================================================
// Nonce Models (for replay attack prevention)
// ============================================================================

/// Represents a nonce record in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Nonce {
    pub id: i64,
    pub nonce_value: String,
    pub wallet_address: String,
    pub document_hash: Option<String>,
    pub used: bool,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

/// Represents a new nonce to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewNonce {
    pub nonce_value: String,
    pub wallet_address: String,
    pub document_hash: Option<String>,
    pub expires_at: DateTime<Utc>,
}

// ============================================================================
// Rate Limit Models
// ============================================================================

/// Represents a rate limit entry in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct RateLimitEntry {
    pub id: i64,
    pub identifier: String,
    pub endpoint: String,
    pub requested_at: DateTime<Utc>,
}

/// Represents a new rate limit entry to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewRateLimitEntry {
    pub identifier: String,
    pub endpoint: String,
    pub requested_at: DateTime<Utc>,
}

// ============================================================================
// Security Event Models
// ============================================================================

/// Represents a security event record in the database
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct SecurityEvent {
    pub id: i64,
    pub event_type: String,
    pub severity: String,
    pub ip_address: Option<String>,
    pub wallet_address: Option<String>,
    pub document_hash: Option<String>,
    pub details: Option<String>,
    pub user_agent: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Represents a new security event to be inserted
#[derive(Debug, Serialize, Deserialize)]
pub struct NewSecurityEvent {
    pub event_type: String,
    pub severity: String,
    pub ip_address: Option<String>,
    pub wallet_address: Option<String>,
    pub document_hash: Option<String>,
    pub details: Option<String>,
    pub user_agent: Option<String>,
}
