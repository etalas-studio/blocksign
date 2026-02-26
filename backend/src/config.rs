use anyhow::{Context, Result};
use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub storage: StorageConfig,
    pub blockchain: BlockchainConfig,
    pub database: DatabaseConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StorageConfig {
    pub upload_dir: String,
    pub max_file_size_mb: usize,
    pub file_retention_hours: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BlockchainConfig {
    pub rpc_url: String,
    pub contract_address: String,
    pub chain_id: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub backup_dir: String,
    pub max_connections: u32,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            server: ServerConfig {
                host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
                port: env::var("PORT")
                    .unwrap_or_else(|_| "3000".to_string())
                    .parse()
                    .context("Invalid PORT value")?,
            },
            storage: StorageConfig {
                upload_dir: env::var("UPLOAD_DIR")
                    .unwrap_or_else(|_| "/tmp/blocksign_uploads".to_string()),
                max_file_size_mb: env::var("MAX_FILE_SIZE_MB")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .context("Invalid MAX_FILE_SIZE_MB value")?,
                file_retention_hours: env::var("FILE_RETENTION_HOURS")
                    .unwrap_or_else(|_| "24".to_string())
                    .parse()
                    .context("Invalid FILE_RETENTION_HOURS value")?,
            },
            blockchain: BlockchainConfig {
                rpc_url: env::var("RPC_URL").context("RPC_URL must be set")?,
                contract_address: env::var("CONTRACT_ADDRESS")
                    .context("CONTRACT_ADDRESS must be set")?,
                chain_id: env::var("CHAIN_ID")
                    .unwrap_or_else(|_| "80002".to_string())
                    .parse()
                    .context("Invalid CHAIN_ID value")?,
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "sqlite:///data/blocksign.db".to_string()),
                backup_dir: env::var("DATABASE_BACKUP_DIR")
                    .unwrap_or_else(|_| "/data/backups".to_string()),
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .context("Invalid DATABASE_MAX_CONNECTIONS value")?,
            },
        })
    }

    pub fn max_file_size_bytes(&self) -> usize {
        self.storage.max_file_size_mb * 1024 * 1024
    }
}
