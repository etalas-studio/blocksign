//! Signature repository for database operations
//!
//! Provides CRUD operations for signatures stored in the database.

use super::super::models::{Signature, NewSignature, UpdateSignature};
use anyhow::{Context, Result};
use sqlx::{Pool, Sqlite};

/// Repository for signature database operations
pub struct SignatureRepository {
    pool: Pool<Sqlite>,
}

impl SignatureRepository {
    /// Creates a new SignatureRepository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Creates a new signature in the database
    pub async fn create(&self, signature: &NewSignature) -> Result<Signature> {
        let query = r#"
            INSERT INTO signatures (
                document_id, signer_address, signature_hash, timestamp,
                blockchain_tx, block_number, gas_used, network, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        "#;

        let sig = sqlx::query_as::<_, Signature>(query)
            .bind(signature.document_id)
            .bind(&signature.signer_address)
            .bind(&signature.signature_hash)
            .bind(signature.timestamp)
            .bind(&signature.blockchain_tx)
            .bind(signature.block_number)
            .bind(signature.gas_used)
            .bind(signature.network)
            .bind(&signature.status)
            .fetch_one(&self.pool)
            .await
            .context("Failed to create signature")?;

        Ok(sig)
    }

    /// Finds a signature by its hash
    pub async fn find_by_hash(&self, hash: &str) -> Result<Option<Signature>> {
        let query = "SELECT * FROM signatures WHERE signature_hash = ?";

        let sig = sqlx::query_as::<_, Signature>(query)
            .bind(hash)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to find signature by hash")?;

        Ok(sig)
    }

    /// Finds a signature by its ID
    pub async fn find_by_id(&self, id: i64) -> Result<Option<Signature>> {
        let query = "SELECT * FROM signatures WHERE id = ?";

        let sig = sqlx::query_as::<_, Signature>(query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to find signature by id")?;

        Ok(sig)
    }

    /// Lists all signatures for a document
    pub async fn list_by_document(&self, document_id: i64) -> Result<Vec<Signature>> {
        let query = r#"
            SELECT * FROM signatures
            WHERE document_id = ?
            ORDER BY timestamp DESC
        "#;

        let sigs = sqlx::query_as::<_, Signature>(query)
            .bind(document_id)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list signatures by document")?;

        Ok(sigs)
    }

    /// Lists signatures by signer address
    pub async fn list_by_signer(&self, signer: &str, limit: usize) -> Result<Vec<Signature>> {
        let query = r#"
            SELECT * FROM signatures
            WHERE signer_address = ?
            ORDER BY timestamp DESC
            LIMIT ?
        "#;

        let sigs = sqlx::query_as::<_, Signature>(query)
            .bind(signer)
            .bind(limit as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list signatures by signer")?;

        Ok(sigs)
    }

    /// Lists signatures by status
    pub async fn list_by_status(&self, status: &str) -> Result<Vec<Signature>> {
        let query = r#"
            SELECT * FROM signatures
            WHERE status = ?
            ORDER BY created_at DESC
        "#;

        let sigs = sqlx::query_as::<_, Signature>(query)
            .bind(status)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list signatures by status")?;

        Ok(sigs)
    }

    /// Updates a signature
    pub async fn update(&self, id: i64, update: &UpdateSignature) -> Result<Option<Signature>> {
        let mut query_set = Vec::new();
        let mut bind_idx = 1;

        if update.blockchain_tx.is_some() {
            query_set.push(format!("blockchain_tx = ?{}", bind_idx));
            bind_idx += 1;
        }
        if update.block_number.is_some() {
            query_set.push(format!("block_number = ?{}", bind_idx));
            bind_idx += 1;
        }
        if update.gas_used.is_some() {
            query_set.push(format!("gas_used = ?{}", bind_idx));
            bind_idx += 1;
        }
        if update.status.is_some() {
            query_set.push(format!("status = ?{}", bind_idx));
            bind_idx += 1;
        }

        if query_set.is_empty() {
            return self.find_by_id(id).await;
        }

        let query_str = format!(
            "UPDATE signatures SET {} WHERE id = ? RETURNING *",
            query_set.join(", ")
        );

        let mut query = sqlx::query_as::<_, Signature>(&query_str);

        if let Some(blockchain_tx) = &update.blockchain_tx {
            query = query.bind(blockchain_tx);
        }
        if let Some(block_number) = &update.block_number {
            query = query.bind(block_number);
        }
        if let Some(gas_used) = &update.gas_used {
            query = query.bind(gas_used);
        }
        if let Some(status) = &update.status {
            query = query.bind(status);
        }
        query = query.bind(id);

        let sig = query
            .fetch_optional(&self.pool)
            .await
            .context("Failed to update signature")?;

        Ok(sig)
    }

    /// Deletes a signature by ID
    pub async fn delete(&self, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM signatures WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .context("Failed to delete signature")?;

        Ok(result.rows_affected() > 0)
    }

    /// Counts total signatures
    pub async fn count(&self) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM signatures")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count signatures")?;

        Ok(count.0)
    }

    /// Counts signatures by document
    pub async fn count_by_document(&self, document_id: i64) -> Result<i64> {
        let count: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM signatures WHERE document_id = ?")
                .bind(document_id)
                .fetch_one(&self.pool)
                .await
                .context("Failed to count signatures by document")?;

        Ok(count.0)
    }
}
