//! Nonce service for replay attack prevention
//!
//! This service manages nonces used in signing operations to prevent
//! replay attacks. Each nonce is unique, time-bound, and can only be used once.

use crate::db::models::Nonce;
use crate::db::repositories::NonceRepository;
use crate::models::AppError;
use anyhow::{Context, Result};
use chrono::{Duration, Utc};
use std::sync::Arc;
use uuid::Uuid;

/// Nonce service for managing unique, time-bound nonces
pub struct NonceService {
    repository: Arc<NonceRepository>,
    /// Default nonce expiration time in minutes
    expiration_minutes: i64,
}

impl NonceService {
    /// Create a new nonce service
    ///
    /// # Arguments
    /// * `repository` - Nonce repository for database operations
    /// * `expiration_minutes` - Time before nonce expires (default 5 minutes)
    pub fn new(repository: Arc<NonceRepository>, expiration_minutes: i64) -> Self {
        Self {
            repository,
            expiration_minutes,
        }
    }

    /// Generate a new nonce for a wallet address
    ///
    /// # Arguments
    /// * `wallet_address` - Wallet address requesting the nonce
    /// * `document_hash` - Optional document hash to bind nonce to
    ///
    /// # Returns
    /// Generated nonce value
    pub async fn generate_nonce(
        &self,
        wallet_address: &str,
        document_hash: Option<String>,
    ) -> Result<String, AppError> {
        // Generate unique nonce
        let nonce_value = Uuid::new_v4().to_string();

        // Calculate expiration time
        let expires_at = Utc::now() + Duration::minutes(self.expiration_minutes);

        // Create nonce record
        let nonce = Nonce {
            id: 0,
            nonce_value: nonce_value.clone(),
            wallet_address: wallet_address.to_lowercase(),
            document_hash,
            used: false,
            expires_at,
            created_at: Utc::now(),
        };

        // Save to database
        self.repository.create(&nonce).await.map_err(|e| {
            AppError::StorageError(format!("Failed to create nonce: {}", e))
        })?;

        Ok(nonce_value)
    }

    /// Validate and consume a nonce
    ///
    /// # Arguments
    /// * `nonce_value` - Nonce to validate
    /// * `wallet_address` - Wallet address using the nonce
    /// * `document_hash` - Optional document hash to verify binding
    ///
    /// # Returns
    /// Ok(()) if nonce is valid, Err otherwise
    ///
    /// This will mark the nonce as used, preventing reuse
    pub async fn use_nonce(
        &self,
        nonce_value: &str,
        wallet_address: &str,
        document_hash: Option<String>,
    ) -> Result<(), AppError> {
        // Find nonce
        let nonce = self
            .repository
            .find_by_value(nonce_value)
            .await
            .map_err(|e| AppError::StorageError(format!("Failed to find nonce: {}", e)))?
            .ok_or_else(|| AppError::ValidationError("Invalid nonce".to_string()))?;

        // Check if already used
        if nonce.used {
            return Err(AppError::ValidationError(
                "Nonce has already been used (possible replay attack)".to_string(),
            ));
        }

        // Check if expired
        if nonce.expires_at < Utc::now() {
            return Err(AppError::ValidationError("Nonce has expired".to_string()));
        }

        // Verify wallet address matches (case-insensitive)
        if nonce.wallet_address.to_lowercase() != wallet_address.to_lowercase() {
            return Err(AppError::ValidationError(
                "Nonce does not belong to this wallet".to_string(),
            ));
        }

        // Verify document hash binding if present
        if let (Some(nonce_doc_hash), Some(request_doc_hash)) =
            (nonce.document_hash, document_hash)
        {
            if nonce_doc_hash.to_lowercase() != request_doc_hash.to_lowercase() {
                return Err(AppError::ValidationError(
                    "Nonce is bound to a different document".to_string(),
                ));
            }
        }

        // Mark nonce as used
        self.repository.mark_used(nonce_value).await.map_err(|e| {
            AppError::StorageError(format!("Failed to mark nonce as used: {}", e))
        })?;

        Ok(())
    }

    /// Validate a nonce without consuming it
    ///
    /// # Arguments
    /// * `nonce_value` - Nonce to validate
    ///
    /// # Returns
    /// true if nonce is valid and available
    pub async fn validate_nonce(&self, nonce_value: &str) -> Result<bool, AppError> {
        match self.repository.find_by_value(nonce_value).await {
            Ok(Some(nonce)) => Ok(!nonce.used && nonce.expires_at > Utc::now()),
            Ok(None) => Ok(false),
            Err(_) => Err(AppError::StorageError(
                "Failed to validate nonce".to_string(),
            )),
        }
    }

    /// Clean up expired nonces
    ///
    /// # Returns
    /// Number of nonces cleaned up
    pub async fn cleanup_expired(&self) -> Result<usize> {
        self.repository
            .delete_expired()
            .await
            .map(|count| count as usize)
            .context("Failed to cleanup expired nonces")
    }

    /// Get nonce expiration time in seconds
    pub fn expiration_seconds(&self) -> i64 {
        self.expiration_minutes * 60
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::create_pool;
    use crate::db::repositories::NonceRepository;

    // Integration tests would require a test database
    // Unit tests for nonce generation logic
}
