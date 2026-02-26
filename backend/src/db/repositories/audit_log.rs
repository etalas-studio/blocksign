//! Audit log repository for database operations
//!
//! Provides CRUD operations for audit logs stored in the database.

use super::super::models::{AuditLog, NewAuditLog};
use anyhow::{Context, Result};
use sqlx::{Pool, Sqlite};

/// Repository for audit log database operations
pub struct AuditLogRepository {
    pool: Pool<Sqlite>,
}

impl AuditLogRepository {
    /// Creates a new AuditLogRepository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Creates a new audit log entry
    pub async fn create(&self, log: &NewAuditLog) -> Result<AuditLog> {
        let query = r#"
            INSERT INTO audit_logs (
                entity_type, entity_id, event_type, event_data,
                actor_wallet, blockchain_tx
            ) VALUES (?, ?, ?, ?, ?, ?)
            RETURNING *
        "#;

        let audit = sqlx::query_as::<_, AuditLog>(query)
            .bind(&log.entity_type)
            .bind(log.entity_id)
            .bind(&log.event_type)
            .bind(&log.event_data)
            .bind(&log.actor_wallet)
            .bind(&log.blockchain_tx)
            .fetch_one(&self.pool)
            .await
            .context("Failed to create audit log")?;

        Ok(audit)
    }

    /// Finds audit logs by entity
    pub async fn find_by_entity(
        &self,
        entity_type: &str,
        entity_id: i64,
    ) -> Result<Vec<AuditLog>> {
        let query = r#"
            SELECT * FROM audit_logs
            WHERE entity_type = ? AND entity_id = ?
            ORDER BY timestamp DESC
        "#;

        let logs = sqlx::query_as::<_, AuditLog>(query)
            .bind(entity_type)
            .bind(entity_id)
            .fetch_all(&self.pool)
            .await
            .context("Failed to find audit logs by entity")?;

        Ok(logs)
    }

    /// Finds audit logs by event type
    pub async fn find_by_event_type(&self, event_type: &str, limit: usize) -> Result<Vec<AuditLog>> {
        let query = r#"
            SELECT * FROM audit_logs
            WHERE event_type = ?
            ORDER BY timestamp DESC
            LIMIT ?
        "#;

        let logs = sqlx::query_as::<_, AuditLog>(query)
            .bind(event_type)
            .bind(limit as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to find audit logs by event type")?;

        Ok(logs)
    }

    /// Finds audit logs by actor wallet
    pub async fn find_by_actor(&self, actor_wallet: &str, limit: usize) -> Result<Vec<AuditLog>> {
        let query = r#"
            SELECT * FROM audit_logs
            WHERE actor_wallet = ?
            ORDER BY timestamp DESC
            LIMIT ?
        "#;

        let logs = sqlx::query_as::<_, AuditLog>(query)
            .bind(actor_wallet)
            .bind(limit as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to find audit logs by actor")?;

        Ok(logs)
    }

    /// Lists all audit logs with pagination
    pub async fn list_all(&self, limit: usize, offset: usize) -> Result<Vec<AuditLog>> {
        let query = r#"
            SELECT * FROM audit_logs
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        "#;

        let logs = sqlx::query_as::<_, AuditLog>(query)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list audit logs")?;

        Ok(logs)
    }

    /// Lists audit logs in a time range
    pub async fn list_by_time_range(
        &self,
        start: chrono::DateTime<chrono::Utc>,
        end: chrono::DateTime<chrono::Utc>,
    ) -> Result<Vec<AuditLog>> {
        let query = r#"
            SELECT * FROM audit_logs
            WHERE timestamp BETWEEN ? AND ?
            ORDER BY timestamp DESC
        "#;

        let logs = sqlx::query_as::<_, AuditLog>(query)
            .bind(start)
            .bind(end)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list audit logs by time range")?;

        Ok(logs)
    }

    /// Counts total audit logs
    pub async fn count(&self) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM audit_logs")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count audit logs")?;

        Ok(count.0)
    }

    /// Deletes old audit logs (cleanup)
    pub async fn delete_older_than(&self, days: i32) -> Result<u64> {
        let result = sqlx::query("DELETE FROM audit_logs WHERE timestamp < datetime('now', '-' || ? || ' days')")
            .bind(days)
            .execute(&self.pool)
            .await
            .context("Failed to delete old audit logs")?;

        Ok(result.rows_affected())
    }
}
