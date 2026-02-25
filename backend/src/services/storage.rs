use crate::models::{AppError, FileUpload};
use anyhow::{Context, Result};
use chrono::Utc;
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct StorageService {
    upload_dir: String,
    file_retention_hours: u64,
    by_id: Arc<RwLock<HashMap<String, FileUpload>>>,
    by_hash: Arc<RwLock<HashMap<String, Vec<String>>>>, // hash -> list of upload IDs
}

impl StorageService {
    pub fn new(upload_dir: String, file_retention_hours: u64) -> Result<Self> {
        // Create upload directory if it doesn't exist
        fs::create_dir_all(&upload_dir)
            .context("Failed to create upload directory")?;

        Ok(Self {
            upload_dir,
            file_retention_hours,
            by_id: Arc::new(RwLock::new(HashMap::new())),
            by_hash: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Save uploaded file to disk and store metadata
    pub async fn save_file(
        &self,
        filename: String,
        bytes: Vec<u8>,
        content_type: String,
        hash: String,
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

        // Create upload record
        let upload = FileUpload {
            id: id.clone(),
            filename,
            hash: hash.clone(),
            size: bytes.len() as u64,
            content_type,
            storage_path: storage_path.to_string_lossy().to_string(),
            uploaded_at: Utc::now(),
            tx_hash: None,
            signer_address: None,
        };

        // Store in memory
        {
            let mut by_id = self.by_id.write().await;
            by_id.insert(id.clone(), upload.clone());
        }

        {
            let mut by_hash = self.by_hash.write().await;
            by_hash.entry(hash).or_default().push(id);
        }

        Ok(upload)
    }

    /// Get upload by ID
    pub async fn get_by_id(&self, id: &str) -> Option<FileUpload> {
        let by_id = self.by_id.read().await;
        by_id.get(id).cloned()
    }

    /// Get uploads by document hash
    pub async fn get_by_hash(&self, hash: &str) -> Vec<FileUpload> {
        let by_hash = self.by_hash.read().await;
        let by_id = self.by_id.read().await;

        if let Some(ids) = by_hash.get(hash) {
            ids.iter()
                .filter_map(|id| by_id.get(id).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Update transaction hash for an upload
    pub async fn update_transaction(
        &self,
        hash: &str,
        tx_hash: String,
        signer: String,
    ) -> Result<Option<FileUpload>, AppError> {
        let mut by_id = self.by_id.write().await;

        // Find the upload with this hash (get the first one if multiple)
        let by_hash = self.by_hash.read().await;
        if let Some(ids) = by_hash.get(hash) {
            if let Some(id) = ids.first() {
                if let Some(upload) = by_id.get_mut(id) {
                    upload.tx_hash = Some(tx_hash);
                    upload.signer_address = Some(signer);
                    return Ok(Some(upload.clone()));
                }
            }
        }

        Ok(None)
    }

    /// Delete file from disk
    pub fn delete_file(path: &str) -> Result<()> {
        fs::remove_file(path).context("Failed to delete file")?;
        Ok(())
    }

    /// Cleanup files older than retention period
    pub async fn cleanup_old_files(&self) -> Result<usize> {
        let retention_duration = chrono::Duration::hours(self.file_retention_hours as i64);
        let cutoff_time = Utc::now() - retention_duration;
        let mut removed_count = 0;

        // Find expired uploads
        let expired_ids: Vec<String> = {
            let by_id = self.by_id.read().await;
            by_id.iter()
                .filter(|(_, upload)| upload.uploaded_at < cutoff_time)
                .map(|(id, _)| id.clone())
                .collect()
        };

        // Remove expired uploads
        for id in expired_ids {
            if let Some(upload) = self.get_by_id(&id).await {
                // Delete file from disk
                if let Err(e) = Self::delete_file(&upload.storage_path) {
                    eprintln!("Failed to delete file {}: {}", upload.storage_path, e);
                }

                // Remove from memory
                {
                    let mut by_id = self.by_id.write().await;
                    by_id.remove(&id);
                }

                {
                    let mut by_hash = self.by_hash.write().await;
                    by_hash.remove(&upload.hash);
                }

                removed_count += 1;
            }
        }

        Ok(removed_count)
    }

    /// Get storage path for a given ID
    fn get_storage_path(&self, id: &str) -> PathBuf {
        PathBuf::from(&self.upload_dir).join(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_save_and_retrieve_file() {
        let temp_dir = "/tmp/test_blocksign_uploads";
        let _ = fs::remove_dir_all(temp_dir);

        let service = StorageService::new(temp_dir.to_string(), 24).unwrap();

        let filename = "test.txt".to_string();
        let bytes = b"Hello, BlockSign!".to_vec();
        let content_type = "text/plain".to_string();
        let hash = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08".to_string();

        let upload = service
            .save_file(filename.clone(), bytes.clone(), content_type, hash.clone())
            .await
            .unwrap();

        assert_eq!(upload.filename, filename);
        assert_eq!(upload.hash, hash);
        assert!(upload.size > 0);

        // Test retrieval by ID
        let retrieved = service.get_by_id(&upload.id).await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().filename, filename);

        // Test retrieval by hash
        let by_hash = service.get_by_hash(&hash).await;
        assert_eq!(by_hash.len(), 1);
        assert_eq!(by_hash[0].filename, filename);

        // Cleanup
        let _ = fs::remove_dir_all(temp_dir);
    }

    #[tokio::test]
    async fn test_update_transaction() {
        let temp_dir = "/tmp/test_blocksign_tx";
        let _ = fs::remove_dir_all(temp_dir);

        let service = StorageService::new(temp_dir.to_string(), 24).unwrap();

        let hash = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08".to_string();
        service
            .save_file(
                "test.txt".to_string(),
                b"test".to_vec(),
                "text/plain".to_string(),
                hash.clone(),
            )
            .await
            .unwrap();

        let tx_hash = "0xabcd1234".to_string();
        let signer = "0x1234567890abcdef".to_string();

        let updated = service
            .update_transaction(&hash, tx_hash.clone(), signer.clone())
            .await
            .unwrap();

        assert!(updated.is_some());
        let upload = updated.unwrap();
        assert_eq!(upload.tx_hash, Some(tx_hash));
        assert_eq!(upload.signer_address, Some(signer));

        // Cleanup
        let _ = fs::remove_dir_all(temp_dir);
    }
}
