//! Documents API handlers
//!
//! Provides endpoints for listing documents, getting metrics, and fetching document details.

use crate::db::models::Document;
use crate::models::AppError;
use crate::state::AppState;
use axum::{
    extract::{Extension, Path, Query},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Query parameters for documents listing
#[derive(Debug, Deserialize)]
pub struct DocumentsQuery {
    pub wallet: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default = "default_offset")]
    pub offset: usize,
    pub status: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

fn default_limit() -> usize {
    20
}

fn default_offset() -> usize {
    0
}

/// Document signature information
#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentSignature {
    pub wallet_address: String,
    pub signed_at: DateTime<Utc>,
    pub tx_hash: Option<String>,
    pub block_number: Option<i64>,
    pub status: String,
}

/// Document response with signatures
#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentResponse {
    pub id: i64,
    pub name: String,
    pub hash: String,
    pub file_size: i64,
    pub mime_type: String,
    pub uploaded_at: DateTime<Utc>,
    pub uploader_wallet: String,
    pub signatures: Vec<DocumentSignature>,
    pub verification_status: String,
    pub signature_count: i64,
}

/// Paginated documents response
#[derive(Debug, Serialize)]
pub struct DocumentsResponse {
    pub documents: Vec<DocumentResponse>,
    pub total: i64,
    pub limit: usize,
    pub offset: usize,
}

impl From<Document> for DocumentResponse {
    fn from(doc: Document) -> Self {
        Self {
            id: doc.id,
            name: doc.file_name,
            hash: doc.document_hash,
            file_size: doc.file_size,
            mime_type: doc.content_type,
            uploaded_at: doc.created_at,
            uploader_wallet: doc.uploader_wallet,
            signatures: Vec::new(),
            verification_status: "pending".to_string(),
            signature_count: 0,
        }
    }
}

/// Document metrics response
#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentMetrics {
    pub total_documents: i64,
    pub total_signatures: i64,
    pub verified_documents: i64,
    pub pending_documents: i64,
    pub failed_documents: i64,
    pub on_chain_records: i64,
    pub unique_signers: i64,
}

/// GET /api/documents - List documents with pagination and filters
pub async fn get_documents(
    Extension(state): Extension<AppState>,
    Query(params): Query<DocumentsQuery>,
) -> Result<Json<DocumentsResponse>, AppError> {
    let documents = if let Some(wallet) = &params.wallet {
        state
            .db
            .documents
            .list_by_wallet(wallet, params.limit, params.offset)
            .await
    } else {
        state
            .db
            .documents
            .list_all(params.limit, params.offset)
            .await
    }
    .map_err(|e| AppError::InternalError(format!("Failed to fetch documents: {}", e)))?;

    let total = if let Some(wallet) = &params.wallet {
        state
            .db
            .documents
            .count_by_wallet(wallet)
            .await
            .unwrap_or(0)
    } else {
        state.db.documents.count().await.unwrap_or(0)
    };

    let document_responses: Vec<DocumentResponse> = documents
        .into_iter()
        .map(|mut doc| {
            // Fetch signatures for this document
            let signatures = fetch_signatures_for_document(&state, doc.id);
            let signature_count = signatures.len() as i64;

            // Determine verification status
            let verification_status = if signature_count > 0 {
                "verified".to_string()
            } else {
                "pending".to_string()
            };

            let mut doc_response: DocumentResponse = doc.into();
            doc_response.signatures = signatures;
            doc_response.signature_count = signature_count;
            doc_response.verification_status = verification_status;
            doc_response
        })
        .collect();

    Ok(Json(DocumentsResponse {
        documents: document_responses,
        total,
        limit: params.limit,
        offset: params.offset,
    }))
}

/// GET /api/documents/metrics - Get document metrics
pub async fn get_document_metrics(
    Extension(state): Extension<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<DocumentMetrics>, AppError> {
    let wallet_filter = params.get("wallet");

    let total_documents = if let Some(wallet) = wallet_filter {
        state
            .db
            .documents
            .count_by_wallet(wallet)
            .await
            .unwrap_or(0)
    } else {
        state.db.documents.count().await.unwrap_or(0)
    };

    // Get all documents to calculate other metrics
    let documents = if let Some(wallet) = wallet_filter {
        state
            .db
            .documents
            .list_by_wallet(wallet, 10000, 0)
            .await
            .unwrap_or_default()
    } else {
        state
            .db
            .documents
            .list_all(10000, 0)
            .await
            .unwrap_or_default()
    };

    let mut total_signatures = 0i64;
    let mut verified_documents = 0i64;
    let mut unique_signers = std::collections::HashSet::new();

    for doc in &documents {
        let sigs = fetch_signatures_for_document(&state, doc.id);
        let sig_count = sigs.len() as i64;
        total_signatures += sig_count;

        if sig_count > 0 {
            verified_documents += 1;
        }

        for sig in &sigs {
            unique_signers.insert(sig.wallet_address.clone());
        }
    }

    let pending_documents = total_documents - verified_documents;
    let on_chain_records = total_signatures;

    Ok(Json(DocumentMetrics {
        total_documents,
        total_signatures,
        verified_documents,
        pending_documents,
        failed_documents: 0, // No failed state in current model
        on_chain_records,
        unique_signers: unique_signers.len() as i64,
    }))
}

/// GET /api/documents/:hash - Get document by hash
pub async fn get_document_by_hash(
    Extension(state): Extension<AppState>,
    Path(hash): Path<String>,
) -> Result<Json<DocumentResponse>, AppError> {
    let doc = state
        .db
        .documents
        .find_by_hash(&hash)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch document: {}", e)))?
        .ok_or_else(|| AppError::NotFoundError(format!("Document with hash {} not found", hash)))?;

    let signatures = fetch_signatures_for_document(&state, doc.id);
    let signature_count = signatures.len() as i64;

    let verification_status = if signature_count > 0 {
        "verified".to_string()
    } else {
        "pending".to_string()
    };

    let mut doc_response: DocumentResponse = doc.into();
    doc_response.signatures = signatures;
    doc_response.signature_count = signature_count;
    doc_response.verification_status = verification_status;

    Ok(Json(doc_response))
}

/// Helper function to fetch signatures for a document
fn fetch_signatures_for_document(state: &AppState, document_id: i64) -> Vec<DocumentSignature> {
    // This would query the signature repository when connected
    // For now, return empty vec as placeholder
    Vec::new()
}
