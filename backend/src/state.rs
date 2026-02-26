use crate::services::{BlockchainService, StorageService};
use crate::db::repositories::{DocumentRepository, SignatureRepository, WalletRepository, AuditLogRepository, VerificationRepository};
use sqlx::{Pool, Sqlite};
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub storage: Arc<StorageService>,
    pub blockchain: Arc<BlockchainService>,
    pub db: DatabaseState,
}

/// Database repositories and pool
#[derive(Clone)]
pub struct DatabaseState {
    pub pool: Pool<Sqlite>,
    pub documents: Arc<DocumentRepository>,
    pub signatures: Arc<SignatureRepository>,
    pub wallets: Arc<WalletRepository>,
    pub audit_logs: Arc<AuditLogRepository>,
    pub verifications: Arc<VerificationRepository>,
}

impl AppState {
    pub fn new(
        storage: Arc<StorageService>,
        blockchain: Arc<BlockchainService>,
        db: DatabaseState,
    ) -> Self {
        Self { storage, blockchain, db }
    }
}

impl DatabaseState {
    /// Creates a new DatabaseState with all repositories
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self {
            pool: pool.clone(),
            documents: Arc::new(DocumentRepository::new(pool.clone())),
            signatures: Arc::new(SignatureRepository::new(pool.clone())),
            wallets: Arc::new(WalletRepository::new(pool.clone())),
            audit_logs: Arc::new(AuditLogRepository::new(pool.clone())),
            verifications: Arc::new(VerificationRepository::new(pool)),
        }
    }
}
