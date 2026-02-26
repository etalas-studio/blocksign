//! Database connection pool management
//!
//! Provides SQLite connection pool with optimized settings for production use.

use anyhow::{Context, Result};
use sqlx::{Pool, Sqlite, sqlite::SqliteConnectOptions, sqlite::SqliteJournalMode};
use std::str::FromStr;

/// Creates a new SQLite connection pool with optimized settings
///
/// # Arguments
/// * `database_url` - SQLite database URL (e.g., "sqlite:///data/blocksign.db")
///
/// # Returns
/// A configured connection pool
///
/// # Example
/// ```no_run
/// use blocksign_backend::db::create_pool;
///
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let pool = create_pool("sqlite:///data/blocksign.db").await?;
///     // Use pool...
///     Ok(())
/// }
/// ```
pub async fn create_pool(database_url: &str) -> Result<Pool<Sqlite>> {
    // Parse and configure connection options
    let options = SqliteConnectOptions::from_str(database_url)
        .context("Failed to parse database URL")?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
        .busy_timeout(std::time::Duration::from_secs(30));

    // Create connection pool
    let pool = sqlx::SqlitePool::connect_with(options)
        .await
        .context("Failed to create database pool")?;

    // Run optimizations
    optimize_database(&pool).await?;

    Ok(pool)
}

/// Applies performance optimizations to the database
///
/// These optimizations include:
/// - WAL mode for better concurrency
/// - Normal synchronous mode for balance of safety and performance
/// - Increased cache size
async fn optimize_database(pool: &Pool<Sqlite>) -> Result<()> {
    // Set cache size to 64MB (negative value means KB)
    sqlx::query("PRAGMA cache_size=-64000")
        .execute(pool)
        .await
        .context("Failed to set cache size")?;

    // Enable foreign key constraints
    sqlx::query("PRAGMA foreign_keys=ON")
        .execute(pool)
        .await
        .context("Failed to enable foreign keys")?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_in_memory_pool() {
        let pool = create_pool("sqlite::memory:").await.unwrap();
        // Simple health check
        sqlx::query("SELECT 1")
            .fetch_one(&pool)
            .await
            .unwrap();
    }
}
