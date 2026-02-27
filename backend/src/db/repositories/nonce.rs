//! Nonce repository for database operations
//!
//! Handles CRUD operations for nonces used in replay attack prevention.

use crate::db::models::{Nonce, NewNonce};
use anyhow::Result;
use sqlx::{Pool, Sqlite};

/// Nonce repository for database operations
pub struct NonceRepository {
    pool: Pool<Sqlite>,
}

impl NonceRepository {
    /// Create a new nonce repository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Create a new nonce
    pub async fn create(&self, nonce: &Nonce) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO nonces (nonce_value, wallet_address, document_hash, used, expires_at)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
        )
        .bind(&nonce.nonce_value)
        .bind(&nonce.wallet_address)
        .bind(&nonce.document_hash)
        .bind(nonce.used)
        .bind(nonce.expires_at)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    /// Find a nonce by its value
    pub async fn find_by_value(&self, nonce_value: &str) -> Result<Option<Nonce>> {
        let nonce = sqlx::query_as::<_, Nonce>(
            "SELECT * FROM nonces WHERE nonce_value = ?1"
        )
        .bind(nonce_value)
        .fetch_optional(&self.pool)
        .await?;

        Ok(nonce)
    }

    /// Mark a nonce as used
    pub async fn mark_used(&self, nonce_value: &str) -> Result<u64> {
        let result = sqlx::query(
            "UPDATE nonces SET used = 1 WHERE nonce_value = ?1"
        )
        .bind(nonce_value)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Delete expired nonces
    pub async fn delete_expired(&self) -> Result<u64> {
        let result = sqlx::query(
            "DELETE FROM nonces WHERE expires_at < datetime('now')"
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Clean up old used nonces
    pub async fn cleanup_old_used(&self, days: i64) -> Result<u64> {
        let result = sqlx::query(
            "DELETE FROM nonces WHERE used = 1 AND created_at < datetime('now', '-' || ?1 || ' days')"
        )
        .bind(days)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }
}
