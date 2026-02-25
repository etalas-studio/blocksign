mod config;
mod handlers;
mod models;
mod services;
mod state;

use crate::config::Config;
use crate::handlers::{get_health, get_upload_by_hash, get_upload_by_id, get_verification, post_upload, post_tx_hash};
use crate::services::{BlockchainService, StorageService};
use crate::state::AppState;
use axum::{
    http::Method,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
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

    // Initialize services
    let storage_service = Arc::new(StorageService::new(
        config.storage.upload_dir.clone(),
        config.storage.file_retention_hours,
    )?);
    tracing::info!("Storage service initialized");

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
        .layer(axum::extract::Extension(AppState::new(storage_service, blockchain_service)))
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
