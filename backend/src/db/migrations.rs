//! Migration runner for SQLite database
//!
//! Handles running SQL migration files to set up and update database schema.

use anyhow::{Context, Result};
use sqlx::{Pool, Sqlite};

/// Runs all pending migrations
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// # Returns
/// Ok(()) if migrations succeeded
///
/// # Example
/// ```no_run
/// use blocksign_backend::db::run_migrations;
/// use sqlx::SqlitePool;
///
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let pool = SqlitePool::connect("sqlite::memory:").await?;
///     run_migrations(&pool).await?;
///     Ok(())
/// }
/// ```
pub async fn run_migrations(pool: &Pool<Sqlite>) -> Result<()> {
    // Create migrations table if it doesn't exist
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await
    .context("Failed to create migrations table")?;

    // Get list of already executed migrations
    let executed: Vec<String> =
        sqlx::query_scalar("SELECT name FROM _migrations ORDER BY id")
            .fetch_all(pool)
            .await
            .context("Failed to fetch executed migrations")?;

    // Read and run pending migrations
    let migrations = get_migrations();

    for migration in &migrations {
        if !executed.contains(&migration.name.to_string()) {
            tracing::info!("Running migration: {}", migration.name);

            sqlx::query(migration.sql)
                .execute(pool)
                .await
                .with_context(|| format!("Failed to run migration: {}", migration.name))?;

            // Record migration
            sqlx::query("INSERT INTO _migrations (name) VALUES (?)")
                .bind(&migration.name)
                .execute(pool)
                .await
                .context("Failed to record migration")?;

            tracing::info!("Migration completed: {}", migration.name);
        }
    }

    Ok(())
}

/// Represents a database migration
struct Migration {
    name: &'static str,
    sql: &'static str,
}

/// Returns all migrations in order
fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            name: "001_initial_schema",
            sql: include_str!("../../migrations/001_initial_schema.sql"),
        },
        Migration {
            name: "002_add_security_tables",
            sql: include_str!("../../migrations/002_add_security_tables.sql"),
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_run_migrations() {
        let pool = sqlx::SqlitePool::connect("sqlite::memory:")
            .await
            .unwrap();

        run_migrations(&pool).await.unwrap();

        // Verify tables exist
        let tables: Vec<String> =
            sqlx::query_scalar("SELECT name FROM sqlite_master WHERE type='table'")
                .fetch_all(&pool)
                .await
                .unwrap();

        assert!(tables.contains(&"documents".to_string()));
        assert!(tables.contains(&"signatures".to_string()));
        assert!(tables.contains(&"wallets".to_string()));
        assert!(tables.contains(&"audit_logs".to_string()));
        assert!(tables.contains(&"verification_requests".to_string()));
    }
}
