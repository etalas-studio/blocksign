//! Rate limit repository for database operations
//!
//! Handles rate limiting tracking and cleanup.

use crate::db::models::{NewRateLimitEntry, RateLimitEntry};
use anyhow::Result;
use chrono::{DateTime, Utc};
use sqlx::{Pool, Sqlite};

/// Rate limit repository for database operations
pub struct RateLimitRepository {
    pool: Pool<Sqlite>,
}

impl RateLimitRepository {
    /// Create a new rate limit repository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Record a request
    pub async fn record_request(
        &self,
        identifier: &str,
        endpoint: &str,
        requested_at: DateTime<Utc>,
    ) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO rate_limit_entries (identifier, endpoint, requested_at)
            VALUES (?1, ?2, ?3)
            "#,
        )
        .bind(identifier)
        .bind(endpoint)
        .bind(requested_at)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    /// Count requests for identifier in time window
    pub async fn count_requests(
        &self,
        identifier: &str,
        endpoint: &str,
        since: DateTime<Utc>,
    ) -> Result<u32> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM rate_limit_entries
            WHERE identifier = ?1
            AND endpoint = ?2
            AND requested_at > ?3
            "#,
        )
        .bind(identifier)
        .bind(endpoint)
        .bind(since)
        .fetch_one(&self.pool)
        .await?;

        Ok(count as u32)
    }

    /// Delete entries older than timestamp
    pub async fn cleanup_before(&self, before: DateTime<Utc>) -> Result<u64> {
        let result = sqlx::query(
            "DELETE FROM rate_limit_entries WHERE requested_at < ?1"
        )
        .bind(before)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Delete all entries for an identifier
    pub async fn delete_for_identifier(&self, identifier: &str) -> Result<u64> {
        let result = sqlx::query(
            "DELETE FROM rate_limit_entries WHERE identifier = ?1"
        )
        .bind(identifier)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// Get total count for identifier
    pub async fn get_total_count(&self, identifier: &str) -> Result<u32> {
        let count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM rate_limit_entries WHERE identifier = ?1"
        )
        .bind(identifier)
        .fetch_one(&self.pool)
        .await?;

        Ok(count as u32)
    }
}
