//! Repository module for database operations
//!
//! Repositories provide a clean abstraction layer over database operations
//! following the repository pattern.

pub mod document;
pub mod signature;
pub mod wallet;
pub mod audit_log;
pub mod verification;

pub use document::DocumentRepository;
pub use signature::SignatureRepository;
pub use wallet::WalletRepository;
pub use audit_log::AuditLogRepository;
pub use verification::VerificationRepository;
