//! Verification request repository for database operations
//!
//! Provides CRUD operations for verification requests stored in the database.

use super::super::models::{VerificationRequest, NewVerificationRequest, UpdateVerificationResult};
use anyhow::{Context, Result};
use sqlx::{Pool, Sqlite};

/// Repository for verification request database operations
pub struct VerificationRepository {
    pool: Pool<Sqlite>,
}

impl VerificationRepository {
    /// Creates a new VerificationRepository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Creates a new verification request
    pub async fn create(&self, request: &NewVerificationRequest) -> Result<VerificationRequest> {
        let query = r#"
            INSERT INTO verification_requests (document_id, document_hash, requester_ip)
            VALUES (?, ?, ?)
            RETURNING *
        "#;

        let req = sqlx::query_as::<_, VerificationRequest>(query)
            .bind(request.document_id)
            .bind(&request.document_hash)
            .bind(&request.requester_ip)
            .fetch_one(&self.pool)
            .await
            .context("Failed to create verification request")?;

        Ok(req)
    }

    /// Finds a verification request by ID
    pub async fn find_by_id(&self, id: i64) -> Result<Option<VerificationRequest>> {
        let query = "SELECT * FROM verification_requests WHERE id = ?";

        let req = sqlx::query_as::<_, VerificationRequest>(query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to find verification request by id")?;

        Ok(req)
    }

    /// Finds verification requests by document hash
    pub async fn find_by_document_hash(&self, hash: &str) -> Result<Vec<VerificationRequest>> {
        let query = r#"
            SELECT * FROM verification_requests
            WHERE document_hash = ?
            ORDER BY requested_at DESC
        "#;

        let reqs = sqlx::query_as::<_, VerificationRequest>(query)
            .bind(hash)
            .fetch_all(&self.pool)
            .await
            .context("Failed to find verification requests by document hash")?;

        Ok(reqs)
    }

    /// Lists all verification requests with pagination
    pub async fn list_all(&self, limit: usize, offset: usize) -> Result<Vec<VerificationRequest>> {
        let query = r#"
            SELECT * FROM verification_requests
            ORDER BY requested_at DESC
            LIMIT ? OFFSET ?
        "#;

        let reqs = sqlx::query_as::<_, VerificationRequest>(query)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list verification requests")?;

        Ok(reqs)
    }

    /// Lists verification requests by status
    pub async fn list_by_status(&self, result_status: &str) -> Result<Vec<VerificationRequest>> {
        let query = r#"
            SELECT * FROM verification_requests
            WHERE result_status = ?
            ORDER BY requested_at DESC
        "#;

        let reqs = sqlx::query_as::<_, VerificationRequest>(query)
            .bind(result_status)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list verification requests by status")?;

        Ok(reqs)
    }

    /// Updates verification result
    pub async fn update_result(
        &self,
        id: i64,
        update: &UpdateVerificationResult,
    ) -> Result<Option<VerificationRequest>> {
        let query = r#"
            UPDATE verification_requests
            SET verified = ?, result_status = ?, result_details = ?
            WHERE id = ?
            RETURNING *
        "#;

        let req = sqlx::query_as::<_, VerificationRequest>(query)
            .bind(update.verified)
            .bind(&update.result_status)
            .bind(&update.result_details)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to update verification result")?;

        Ok(req)
    }

    /// Counts total verification requests
    pub async fn count(&self) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM verification_requests")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count verification requests")?;

        Ok(count.0)
    }

    /// Gets verification statistics
    pub async fn get_stats(&self) -> Result<VerificationStats> {
        let total = self.count().await?;

        let verified: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM verification_requests WHERE result_status = 'verified'",
        )
        .fetch_one(&self.pool)
        .await?;

        let tampered: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM verification_requests WHERE result_status = 'tampered'",
        )
        .fetch_one(&self.pool)
        .await?;

        let not_found: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM verification_requests WHERE result_status = 'not_found'",
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(VerificationStats {
            total,
            verified: verified.0,
            tampered: tampered.0,
            not_found: not_found.0,
        })
    }

    /// Deletes verification requests older than specified days
    pub async fn delete_older_than(&self, days: i32) -> Result<u64> {
        let result = sqlx::query(
            "DELETE FROM verification_requests WHERE requested_at < datetime('now', '-' || ? || ' days')",
        )
        .bind(days)
        .execute(&self.pool)
        .await
        .context("Failed to delete old verification requests")?;

        Ok(result.rows_affected())
    }
}

/// Verification statistics
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct VerificationStats {
    pub total: i64,
    pub verified: i64,
    pub tampered: i64,
    pub not_found: i64,
}
