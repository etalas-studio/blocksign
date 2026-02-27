//! Security event repository for database operations
//!
//! Handles logging and retrieval of security events.

use crate::db::models::{NewSecurityEvent, SecurityEvent};
use anyhow::Result;
use sqlx::{Pool, Sqlite};

/// Security event repository for database operations
pub struct SecurityEventRepository {
    pool: Pool<Sqlite>,
}

impl SecurityEventRepository {
    /// Create a new security event repository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Create a new security event
    pub async fn create(&self, event: &SecurityEvent) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO security_events
            (event_type, severity, ip_address, wallet_address, document_hash, details, user_agent)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
        )
        .bind(&event.event_type)
        .bind(&event.severity)
        .bind(&event.ip_address)
        .bind(&event.wallet_address)
        .bind(&event.document_hash)
        .bind(&event.details)
        .bind(&event.user_agent)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    /// Get recent security events
    pub async fn get_recent(&self, limit: usize) -> Result<Vec<SecurityEvent>> {
        let events = sqlx::query_as::<_, SecurityEvent>(
            "SELECT * FROM security_events ORDER BY timestamp DESC LIMIT ?1"
        )
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        Ok(events)
    }

    /// Get events by severity
    pub async fn get_by_severity(
        &self,
        severity: &str,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        let events = sqlx::query_as::<_, SecurityEvent>(
            "SELECT * FROM security_events WHERE severity = ?1 ORDER BY timestamp DESC LIMIT ?2"
        )
        .bind(severity)
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        Ok(events)
    }

    /// Get events by wallet address
    pub async fn get_by_wallet(
        &self,
        wallet_address: &str,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        let events = sqlx::query_as::<_, SecurityEvent>(
            "SELECT * FROM security_events WHERE wallet_address = ?1 ORDER BY timestamp DESC LIMIT ?2"
        )
        .bind(wallet_address)
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        Ok(events)
    }

    /// Get events by type
    pub async fn get_by_type(
        &self,
        event_type: &str,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        let events = sqlx::query_as::<_, SecurityEvent>(
            "SELECT * FROM security_events WHERE event_type = ?1 ORDER BY timestamp DESC LIMIT ?2"
        )
        .bind(event_type)
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        Ok(events)
    }

    /// Get events by IP address
    pub async fn get_by_ip(
        &self,
        ip_address: &str,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        let events = sqlx::query_as::<_, SecurityEvent>(
            "SELECT * FROM security_events WHERE ip_address = ?1 ORDER BY timestamp DESC LIMIT ?2"
        )
        .bind(ip_address)
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        Ok(events)
    }

    /// Delete old events
    pub async fn cleanup_old(&self, days: i64) -> Result<u64> {
        let result = sqlx::query(
            "DELETE FROM security_events WHERE timestamp < datetime('now', '-' || ?1 || ' days')"
        )
        .bind(days)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }
}
