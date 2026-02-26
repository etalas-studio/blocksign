//! Storage service for file management and database persistence
//!
//! This service handles file uploads, storage, and retrieval with database persistence.

use crate::db::models::{NewDocument, Document};
use crate::db::repositories::{DocumentRepository, AuditLogRepository, WalletRepository};
use crate::models::{AppError, FileUpload};
use anyhow::{Context, Result};
use chrono::Utc;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Arc;

pub struct StorageService {
    upload_dir: String,
    file_retention_hours: u64,
    db: DatabaseRepositories,
}

/// Database repositories needed by storage service
#[derive(Clone)]
pub struct DatabaseRepositories {
    pub documents: Arc<DocumentRepository>,
    pub audit_logs: Arc<AuditLogRepository>,
    pub wallets: Arc<WalletRepository>,
}

impl StorageService {
    /// Create a new storage service with database persistence
    pub fn new(
        upload_dir: String,
        file_retention_hours: u64,
        db: DatabaseRepositories,
    ) -> Result<Self> {
        // Create upload directory if it doesn't exist
        std::fs::create_dir_all(&upload_dir)
            .context("Failed to create upload directory")?;

        Ok(Self {
            upload_dir,
            file_retention_hours,
            db,
        })
    }

    /// Save uploaded file to disk and store metadata in database
    pub async fn save_file(
        &self,
        filename: String,
        bytes: Vec<u8>,
        content_type: String,
        hash: String,
        uploader_wallet: String,
    ) -> Result<FileUpload, AppError> {
        // Generate UUID for this upload
        let id = uuid::Uuid::new_v4().to_string();

        // Create storage path using UUID
        let storage_path = self.get_storage_path(&id);

        // Write file to disk
        let mut file = File::create(&storage_path)
            .map_err(|e| AppError::StorageError(format!("Failed to create file: {}", e)))?;
        file.write_all(&bytes)
            .map_err(|e| AppError::StorageError(format!("Failed to write file: {}", e)))?;

        // Create document record in database
        let new_doc = NewDocument {
            document_hash: hash.clone(),
            ipfs_hash: None,
            file_name: filename.clone(),
            file_size: bytes.len() as i64,
            content_type: content_type.clone(),
            storage_path: storage_path.to_string_lossy().to_string(),
            uploader_wallet: uploader_wallet.clone(),
            metadata: None,
        };

        let doc = self.db.documents.create(&new_doc).await
            .map_err(|e| AppError::StorageError(format!("Failed to save document to database: {}", e)))?;

        // Track wallet
        let _ = self.db.wallets.get_or_create(&uploader_wallet, 80002).await;
        let _ = self.db.wallets.update_last_seen(&uploader_wallet).await;

        // Log audit event
        let _ = self.db.audit_logs.create(&crate::db::models::NewAuditLog {
            entity_type: "document".to_string(),
            entity_id: doc.id,
            event_type: "upload".to_string(),
            event_data: Some(serde_json::json!({
                "filename": filename,
                "size": bytes.len(),
                "content_type": content_type,
            }).to_string()),
            actor_wallet: Some(uploader_wallet),
            blockchain_tx: None,
        }).await;

        // Convert to FileUpload for backward compatibility
        Ok(FileUpload {
            id: doc.id.to_string(),
            filename: doc.file_name,
            hash: doc.document_hash,
            size: doc.file_size as u64,
            content_type: doc.content_type,
            storage_path: doc.storage_path,
            uploaded_at: doc.created_at,
            tx_hash: None,
            signer_address: None,
        })
    }

    /// Get upload by ID
    pub async fn get_by_id(&self, id: &str) -> Option<FileUpload> {
        let doc_id = id.parse::<i64>().ok()?;
        self.db.documents.find_by_id(doc_id).await.ok()?.map(|doc| self.to_file_upload(doc))
    }

    /// Get uploads by document hash
    pub async fn get_by_hash(&self, hash: &str) -> Vec<FileUpload> {
        match self.db.documents.find_by_hash(hash).await {
            Ok(Some(doc)) => vec![self.to_file_upload(doc)],
            Ok(None) => vec![],
            Err(_) => vec![],
        }
    }

    /// Update transaction hash for an upload (called after blockchain transaction)
    pub async fn update_transaction(
        &self,
        hash: &str,
        tx_hash: String,
        signer: String,
    ) -> Result<Option<FileUpload>, AppError> {
        // Find document by hash
        let doc = match self.db.documents.find_by_hash(hash).await {
            Ok(Some(d)) => d,
            Ok(None) => return Ok(None),
            Err(e) => return Err(AppError::StorageError(format!("Database error: {}", e))),
        };

        // Track wallet
        let _ = self.db.wallets.get_or_create(&signer, 80002).await;
        let _ = self.db.wallets.update_last_seen(&signer).await;

        // Log audit event
        let _ = self.db.audit_logs.create(&crate::db::models::NewAuditLog {
            entity_type: "signature".to_string(),
            entity_id: doc.id,
            event_type: "sign".to_string(),
            event_data: Some(serde_json::json!({
                "tx_hash": tx_hash,
                "signer": signer,
            }).to_string()),
            actor_wallet: Some(signer.clone()),
            blockchain_tx: Some(tx_hash.clone()),
        }).await;

        // Return updated file upload (with transaction info)
        Ok(Some(FileUpload {
            id: doc.id.to_string(),
            filename: doc.file_name,
            hash: doc.document_hash,
            size: doc.file_size as u64,
            content_type: doc.content_type,
            storage_path: doc.storage_path,
            uploaded_at: doc.created_at,
            tx_hash: Some(tx_hash),
            signer_address: Some(signer),
        }))
    }

    /// Delete file from disk
    pub fn delete_file(path: &str) -> Result<()> {
        std::fs::remove_file(path).context("Failed to delete file")?;
        Ok(())
    }

    /// Cleanup files older than retention period
    pub async fn cleanup_old_files(&self) -> Result<usize> {
        let retention_duration = chrono::Duration::hours(self.file_retention_hours as i64);
        let cutoff_time = Utc::now() - retention_duration;
        let mut removed_count = 0;

        // Note: In a real implementation, we'd need to add a method to DocumentRepository
        // to find documents older than the cutoff time. For now, this is a placeholder.
        // TODO: Add cleanup functionality to DocumentRepository

        Ok(removed_count)
    }

    /// Get storage path for a given ID
    fn get_storage_path(&self, id: &str) -> PathBuf {
        PathBuf::from(&self.upload_dir).join(id)
    }

    /// Convert database Document to FileUpload model
    fn to_file_upload(&self, doc: Document) -> FileUpload {
        FileUpload {
            id: doc.id.to_string(),
            filename: doc.file_name,
            hash: doc.document_hash,
            size: doc.file_size as u64,
            content_type: doc.content_type,
            storage_path: doc.storage_path,
            uploaded_at: doc.created_at,
            tx_hash: None,  // These would need to be joined from signatures table
            signer_address: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: Tests would need a test database setup
    // For now, we keep the test structure but mark as integration test
}
