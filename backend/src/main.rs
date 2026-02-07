mod handlers;
mod models;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .init();

    tracing::info!("BlockSign Backend starting...");

    // TODO: Implement Axum server
    // Routes will be added in Day 4

    Ok(())
}
