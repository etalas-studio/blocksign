mod config;
mod db;
mod handlers;
mod models;
mod services;
mod state;
mod utils;

use crate::config::Config;
use crate::db::{create_pool, run_migrations};
use crate::handlers::{
    get_audit_logs, get_audit_stats, export_audit_logs,
    get_blockchain_stats, get_transactions, get_contract_info,
    get_documents, get_document_metrics, get_document_by_hash,
    get_health, get_upload_by_hash, get_upload_by_id, get_verification, post_upload, post_tx_hash
};
use crate::services::{BlockchainService, StorageService};
use crate::services::storage::DatabaseRepositories;
use crate::state::{AppState, DatabaseState};
use axum::{
    http::Method,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use anyhow::Context;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file
    dotenv::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "blocksign_backend=info,tower_http=info,axum=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    tracing::info!("Loaded configuration: {:?}", config.server);

    // Initialize database
    tracing::info!("Connecting to database: {}", config.database.url);
    let db_pool = create_pool(&config.database.url).await?;
    run_migrations(&db_pool).await?;
    tracing::info!("Database initialized and migrations completed");

    let db_state = DatabaseState::new(db_pool);

    // Create data directory for database if needed
    if let Some(db_path) = config.database.url.strip_prefix("sqlite:///") {
        if let Some(parent) = std::path::Path::new(db_path).parent() {
            std::fs::create_dir_all(parent).context("Failed to create database directory")?;
        }
    }

    // Initialize database repositories for storage service
    let storage_repos = DatabaseRepositories {
        documents: db_state.documents.clone(),
        audit_logs: db_state.audit_logs.clone(),
        wallets: db_state.wallets.clone(),
    };

    // Initialize services
    let storage_service = Arc::new(StorageService::new(
        config.storage.upload_dir.clone(),
        config.storage.file_retention_hours,
        storage_repos,
    )?);
    tracing::info!("Storage service initialized with database persistence");

    let blockchain_service = Arc::new(BlockchainService::new(
        &config.blockchain.rpc_url,
        &config.blockchain.contract_address,
    )?);
    tracing::info!("Blockchain service initialized");

    // Spawn cleanup task
    let storage_cleanup = storage_service.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600));
        loop {
            interval.tick().await;
            match storage_cleanup.cleanup_old_files().await {
                Ok(count) => {
                    if count > 0 {
                        tracing::info!("Cleaned up {} old files", count);
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to cleanup old files: {}", e);
                }
            }
        }
    });

    // Build router
    let app = Router::new()
        // Health check
        .route("/health", get(get_health))
        // Upload endpoints
        .route("/api/upload", post(post_upload))
        .route("/api/hash/:id", get(get_upload_by_id))
        .route("/api/document/:hash", get(get_upload_by_hash))
        // Transaction endpoints
        .route("/api/tx/:hash", post(post_tx_hash))
        .route("/api/verify/:hash", get(get_verification))
        // Documents endpoints
        .route("/api/documents", get(get_documents))
        .route("/api/documents/metrics", get(get_document_metrics))
        .route("/api/documents/:hash", get(get_document_by_hash))
        // Audit endpoints
        .route("/api/audit", get(get_audit_logs))
        .route("/api/audit/stats", get(get_audit_stats))
        .route("/api/audit/export", post(export_audit_logs))
        // Blockchain endpoints
        .route("/api/blockchain/stats", get(get_blockchain_stats))
        .route("/api/blockchain/transactions", get(get_transactions))
        .route("/api/blockchain/contract", get(get_contract_info))
        .layer(axum::extract::Extension(AppState::new(storage_service, blockchain_service, db_state)))
        // Middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::new().allow_origin(Any).allow_methods([Method::GET, Method::POST]).allow_headers(Any)),
        );

    // Start server
    let addr = format!("{}:{}", config.server.host, config.server.port);
    tracing::info!("BlockSign Backend starting on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
