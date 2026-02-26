//! Wallet repository for database operations
//!
//! Provides CRUD operations for wallets stored in the database.

use super::super::models::{Wallet, NewWallet};
use anyhow::{Context, Result};
use sqlx::{Pool, Sqlite};

/// Repository for wallet database operations
pub struct WalletRepository {
    pool: Pool<Sqlite>,
}

impl WalletRepository {
    /// Creates a new WalletRepository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Creates a new wallet in the database
    pub async fn create(&self, wallet: &NewWallet) -> Result<Wallet> {
        let query = r#"
            INSERT INTO wallets (address, network, metadata)
            VALUES (?, ?, ?)
            RETURNING *
        "#;

        let w = sqlx::query_as::<_, Wallet>(query)
            .bind(&wallet.address)
            .bind(wallet.network)
            .bind(&wallet.metadata)
            .fetch_one(&self.pool)
            .await
            .context("Failed to create wallet")?;

        Ok(w)
    }

    /// Finds a wallet by its address
    pub async fn find_by_address(&self, address: &str) -> Result<Option<Wallet>> {
        let query = "SELECT * FROM wallets WHERE address = ?";

        let w = sqlx::query_as::<_, Wallet>(query)
            .bind(address)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to find wallet by address")?;

        Ok(w)
    }

    /// Gets or creates a wallet (upsert operation)
    pub async fn get_or_create(&self, address: &str, network: i64) -> Result<Wallet> {
        // Try to find existing wallet
        if let Some(wallet) = self.find_by_address(address).await? {
            Ok(wallet)
        } else {
            // Create new wallet
            let new_wallet = NewWallet {
                address: address.to_string(),
                network,
                metadata: None,
            };
            self.create(&new_wallet).await
        }
    }

    /// Updates a wallet's last seen timestamp
    pub async fn update_last_seen(&self, address: &str) -> Result<Option<Wallet>> {
        let query = r#"
            UPDATE wallets
            SET last_seen = CURRENT_TIMESTAMP
            WHERE address = ?
            RETURNING *
        "#;

        let w = sqlx::query_as::<_, Wallet>(query)
            .bind(address)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to update wallet last seen")?;

        Ok(w)
    }

    /// Lists all wallets with pagination
    pub async fn list_all(&self, limit: usize, offset: usize) -> Result<Vec<Wallet>> {
        let query = r#"
            SELECT * FROM wallets
            ORDER BY last_seen DESC
            LIMIT ? OFFSET ?
        "#;

        let wallets = sqlx::query_as::<_, Wallet>(query)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list wallets")?;

        Ok(wallets)
    }

    /// Lists wallets by network
    pub async fn list_by_network(&self, network: i64) -> Result<Vec<Wallet>> {
        let query = r#"
            SELECT * FROM wallets
            WHERE network = ?
            ORDER BY last_seen DESC
        "#;

        let wallets = sqlx::query_as::<_, Wallet>(query)
            .bind(network)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list wallets by network")?;

        Ok(wallets)
    }

    /// Counts total wallets
    pub async fn count(&self) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM wallets")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count wallets")?;

        Ok(count.0)
    }

    /// Counts active wallets (seen in last 24 hours)
    pub async fn count_active(&self) -> Result<i64> {
        let count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM wallets WHERE datetime(last_seen) > datetime('now', '-1 day')",
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to count active wallets")?;

        Ok(count.0)
    }

    /// Deletes a wallet by address
    pub async fn delete(&self, address: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM wallets WHERE address = ?")
            .bind(address)
            .execute(&self.pool)
            .await
            .context("Failed to delete wallet")?;

        Ok(result.rows_affected() > 0)
    }
}
