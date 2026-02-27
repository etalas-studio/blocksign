//! Audit Trail API handlers
//!
//! Provides endpoints for accessing audit logs, statistics, and exporting data.

use crate::db::models::AuditLog;
use crate::models::AppError;
use crate::state::AppState;
use axum::{
    extract::{Extension, Query},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Query parameters for audit logs listing
#[derive(Debug, Deserialize)]
pub struct AuditQuery {
    pub event_type: Option<String>,
    pub wallet: Option<String>,
    pub document_hash: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    #[serde(default = "default_audit_limit")]
    pub limit: usize,
    #[serde(default = "default_offset")]
    pub offset: usize,
}

fn default_audit_limit() -> usize {
    50
}

fn default_offset() -> usize {
    0
}

/// Audit event response
#[derive(Debug, Serialize, Deserialize)]
pub struct AuditEventResponse {
    pub id: i64,
    pub event_type: String,
    pub actor_wallet: Option<String>,
    pub entity_type: String,
    pub entity_id: i64,
    pub action: String,
    pub details: Option<serde_json::Value>,
    pub timestamp: DateTime<Utc>,
    pub blockchain_tx: Option<String>,
}

impl From<AuditLog> for AuditEventResponse {
    fn from(log: AuditLog) -> Self {
        // Parse event_data JSON if available
        let details = log.event_data.and_then(|data| serde_json::from_str(&data).ok());

        // Extract action from event_type (e.g., "document_uploaded" -> "uploaded")
        let action = log
            .event_type
            .split('_')
            .last()
            .unwrap_or(&log.event_type)
            .to_string();

        Self {
            id: log.id,
            event_type: log.event_type,
            actor_wallet: log.actor_wallet,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            action,
            details,
            timestamp: log.timestamp,
            blockchain_tx: log.blockchain_tx,
        }
    }
}

/// Paginated audit logs response
#[derive(Debug, Serialize)]
pub struct AuditLogsResponse {
    pub events: Vec<AuditEventResponse>,
    pub total: i64,
    pub limit: usize,
    pub offset: usize,
}

/// Audit statistics response
#[derive(Debug, Serialize, Deserialize)]
pub struct AuditStats {
    pub total_events: i64,
    pub uploads: i64,
    pub signatures: i64,
    pub confirmations: i64,
    pub verifications: i64,
    pub downloads: i64,
    pub unique_wallets: i64,
    pub unique_documents: i64,
}

/// Export request body
#[derive(Debug, Deserialize)]
pub struct ExportRequest {
    pub filters: AuditFilters,
    pub format: String,
}

/// Audit filters for export
#[derive(Debug, Deserialize, Serialize)]
pub struct AuditFilters {
    pub event_type: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub wallet: Option<String>,
    pub document_hash: Option<String>,
}

/// GET /api/audit - Get audit logs with filters
pub async fn get_audit_logs(
    Extension(state): Extension<AppState>,
    Query(params): Query<AuditQuery>,
) -> Result<Json<AuditLogsResponse>, AppError> {
    let logs = state
        .db
        .audit_logs
        .list_all(params.limit, params.offset)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch audit logs: {}", e)))?;

    let total = state
        .db
        .audit_logs
        .count()
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to count audit logs: {}", e)))?;

    let events: Vec<AuditEventResponse> = logs
        .into_iter()
        .filter(|log| {
            // Apply filters
            if let Some(event_type) = &params.event_type {
                if !log.event_type.contains(event_type) {
                    return false;
                }
            }
            if let Some(wallet) = &params.wallet {
                if log.actor_wallet.as_ref().map(|w| w.contains(wallet)).unwrap_or(false) {
                    return false;
                }
            }
            true
        })
        .map(AuditEventResponse::from)
        .collect();

    Ok(Json(AuditLogsResponse {
        events,
        total,
        limit: params.limit,
        offset: params.offset,
    }))
}

/// GET /api/audit/stats - Get audit statistics
pub async fn get_audit_stats(
    Extension(state): Extension<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<AuditStats>, AppError> {
    let logs = state
        .db
        .audit_logs
        .list_all(10000, 0)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch audit logs: {}", e)))?;

    let mut unique_wallets = std::collections::HashSet::new();
    let mut unique_documents = std::collections::HashSet::new();
    let mut uploads = 0i64;
    let mut signatures = 0i64;
    let mut confirmations = 0i64;
    let mut verifications = 0i64;
    let mut downloads = 0i64;

    for log in &logs {
        if let Some(wallet) = &log.actor_wallet {
            unique_wallets.insert(wallet.clone());
        }

        if log.entity_type == "document" {
            unique_documents.insert(log.entity_id);
        }

        match log.event_type.as_str() {
            evt if evt.contains("upload") => uploads += 1,
            evt if evt.contains("signature") => signatures += 1,
            evt if evt.contains("confirmation") => confirmations += 1,
            evt if evt.contains("verification") => verifications += 1,
            evt if evt.contains("download") => downloads += 1,
            _ => {}
        }
    }

    Ok(Json(AuditStats {
        total_events: logs.len() as i64,
        uploads,
        signatures,
        confirmations,
        verifications,
        downloads,
        unique_wallets: unique_wallets.len() as i64,
        unique_documents: unique_documents.len() as i64,
    }))
}

/// POST /api/audit/export - Export audit logs
pub async fn export_audit_logs(
    Extension(state): Extension<AppState>,
    Json(req): Json<ExportRequest>,
) -> Result<axum::response::Response, AppError> {
    let logs = state
        .db
        .audit_logs
        .list_all(10000, 0)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch audit logs: {}", e)))?;

    let filtered_logs: Vec<AuditEventResponse> = logs
        .into_iter()
        .filter(|log| {
            if let Some(event_type) = &req.filters.event_type {
                if !log.event_type.contains(event_type) {
                    return false;
                }
            }
            if let Some(wallet) = &req.filters.wallet {
                if log.actor_wallet.as_ref().map(|w| w.contains(wallet)).unwrap_or(false) {
                    return false;
                }
            }
            true
        })
        .map(AuditEventResponse::from)
        .collect();

    if req.format == "csv" {
        let csv = generate_audit_csv(&filtered_logs);

        Ok(axum::response::Response::builder()
            .status(200)
            .header("Content-Type", "text/csv")
            .header(
                "Content-Disposition",
                format!("attachment; filename=\"audit-export-{}.csv\"", Utc::now().format("%Y-%m-%d")),
            )
            .body(axum::body::Body::from(csv))
            .unwrap())
    } else {
        let json = serde_json::to_string_pretty(&filtered_logs).map_err(|e| {
            AppError::ValidationError(format!("Failed to serialize audit logs: {}", e))
        })?;

        Ok(axum::response::Response::builder()
            .status(200)
            .header("Content-Type", "application/json")
            .header(
                "Content-Disposition",
                format!("attachment; filename=\"audit-export-{}.json\"", Utc::now().format("%Y-%m-%d")),
            )
            .body(axum::body::Body::from(json))
            .unwrap())
    }
}

/// Generate CSV from audit logs
fn generate_audit_csv(logs: &[AuditEventResponse]) -> String {
    let mut csv = String::from("Timestamp,Event Type,Wallet,Entity Type,Entity ID,Action,Details,Tx Hash\n");

    for log in logs {
        let timestamp = log.timestamp.format("%Y-%m-%d %H:%M:%S").to_string();
        let wallet = log.actor_wallet.as_deref().unwrap_or("N/A");
        let details = log
            .details
            .as_ref()
            .and_then(|v| serde_json::to_string(v).ok())
            .unwrap_or_else(|| "N/A".to_string());
        let tx_hash = log.blockchain_tx.as_deref().unwrap_or("N/A");

        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{}\n",
            timestamp, log.event_type, wallet, log.entity_type, log.entity_id, log.action, details, tx_hash
        ));
    }

    csv
}
