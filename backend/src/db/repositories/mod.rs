//! Repository module for database operations
//!
//! Repositories provide a clean abstraction layer over database operations
//! following the repository pattern.

pub mod audit_log;
pub mod document;
pub mod nonce;
pub mod rate_limit;
pub mod security_event;
pub mod signature;
pub mod verification;
pub mod wallet;

pub use audit_log::AuditLogRepository;
pub use document::DocumentRepository;
pub use nonce::NonceRepository;
pub use rate_limit::RateLimitRepository;
pub use security_event::SecurityEventRepository;
pub use signature::SignatureRepository;
pub use verification::VerificationRepository;
pub use wallet::WalletRepository;
