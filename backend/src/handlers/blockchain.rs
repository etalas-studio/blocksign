//! Blockchain API handlers
//!
//! Provides endpoints for blockchain statistics, transaction history, and contract information.

use crate::models::AppError;
use crate::state::AppState;
use crate::config::Config;
use axum::{
    extract::{Extension, Query},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Query parameters for blockchain transactions listing
#[derive(Debug, Deserialize)]
pub struct TransactionQuery {
    pub wallet: Option<String>,
    pub document_hash: Option<String>,
    pub status: Option<String>,
    #[serde(default = "default_tx_limit")]
    pub limit: usize,
    #[serde(default = "default_offset")]
    pub offset: usize,
}

fn default_tx_limit() -> usize {
    50
}

fn default_offset() -> usize {
    0
}

/// Blockchain network information
#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub name: String,
    pub chain_id: u64,
    pub rpc_url: String,
    pub block_number: u64,
    pub block_time: f64,
}

/// Contract information
#[derive(Debug, Serialize, Deserialize)]
pub struct ContractInfo {
    pub address: String,
    pub name: String,
    pub symbol: String,
    pub owner: String,
    pub deployed_at: String,
    pub deployment_tx: String,
    pub verified: bool,
    pub network: String,
}

/// Transaction statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionStats {
    pub total: i64,
    pub successful: i64,
    pub pending: i64,
    pub failed: i64,
}

/// Document statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentStats {
    pub registered: i64,
    pub verified: i64,
}

/// Gas statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct GasStats {
    pub total_spent: String,
    pub average_cost: String,
}

/// Blockchain statistics response
#[derive(Debug, Serialize)]
pub struct BlockchainStatsResponse {
    pub network: NetworkInfo,
    pub contract: ContractInfo,
    pub transactions: TransactionStats,
    pub documents: DocumentStats,
    pub gas: GasStats,
}

/// Blockchain transaction response
#[derive(Debug, Serialize, Deserialize)]
pub struct BlockchainTransactionResponse {
    pub tx_hash: String,
    pub block_number: i64,
    pub timestamp: DateTime<Utc>,
    pub from: String,
    pub to: String,
    pub gas_used: String,
    pub gas_price: String,
    pub status: String,
    pub tx_type: String,
    pub document_hash: Option<String>,
    pub document_name: Option<String>,
    pub confirmations: i64,
}

/// Paginated blockchain transactions response
#[derive(Debug, Serialize)]
pub struct TransactionsResponse {
    pub transactions: Vec<BlockchainTransactionResponse>,
    pub total: i64,
    pub limit: usize,
    pub offset: usize,
}

/// GET /api/blockchain/stats - Get blockchain statistics
pub async fn get_blockchain_stats(
    Extension(state): Extension<AppState>,
    Extension(config): Extension<Config>,
) -> Result<Json<BlockchainStatsResponse>, AppError> {
    // Get current block number from blockchain
    let block_number = state
        .blockchain
        .get_current_block()
        .await
        .unwrap_or(0);

    // Get contract address from config
    let contract_address = config.blockchain.contract_address.clone();

    // Get transaction count from database (simplified)
    let total_txs = 100; // Placeholder - would query from signatures table

    // Derive network name from chain_id
    let network_name = match config.blockchain.chain_id {
        137 => "Polygon Mainnet",
        80002 => "Polygon Amoy Testnet",
        1 => "Ethereum Mainnet",
        5 => "Goerli Testnet",
        11155111 => "Sepolia Testnet",
        _ => "Unknown Network",
    };

    let network = NetworkInfo {
        name: network_name.to_string(),
        chain_id: config.blockchain.chain_id,
        rpc_url: config.blockchain.rpc_url.clone(),
        block_number,
        block_time: 2.1, // Average for Polygon
    };

    // Derive network name from chain_id
    let network_name = match config.blockchain.chain_id {
        137 => "Polygon Mainnet",
        80002 => "Polygon Amoy Testnet",
        1 => "Ethereum Mainnet",
        5 => "Goerli Testnet",
        11155111 => "Sepolia Testnet",
        _ => "Unknown Network",
    };

    let contract = ContractInfo {
        address: contract_address,
        name: "BlockSign".to_string(),
        symbol: "BLSIGN".to_string(),
        owner: "0x0000000000000000000000000000000000000000".to_string(), // Placeholder
        deployed_at: "2026-02-20T10:00:00Z".to_string(),
        deployment_tx: "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
        verified: true,
        network: network_name.to_string(),
    };

    let transactions = TransactionStats {
        total: total_txs,
        successful: total_txs - 2,
        pending: 0,
        failed: 2,
    };

    let documents = DocumentStats {
        registered: total_txs - 5,
        verified: total_txs - 10,
    };

    let gas = GasStats {
        total_spent: "150000000000000000".to_string(),
        average_cost: "300000000000000".to_string(),
    };

    Ok(Json(BlockchainStatsResponse {
        network,
        contract,
        transactions,
        documents,
        gas,
    }))
}

/// GET /api/blockchain/transactions - Get blockchain transaction history
pub async fn get_transactions(
    Extension(state): Extension<AppState>,
    Query(params): Query<TransactionQuery>,
) -> Result<Json<TransactionsResponse>, AppError> {
    // Placeholder transactions - in real implementation, would query signatures table
    let transactions = vec![
        BlockchainTransactionResponse {
            tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890".to_string(),
            block_number: 12345,
            timestamp: Utc::now(),
            from: "0xabc123def456abc123def456abc123def456abc1".to_string(),
            to: state.blockchain.contract_address(),
            gas_used: "50000".to_string(),
            gas_price: "30000000000".to_string(),
            status: "success".to_string(),
            tx_type: "signature".to_string(),
            document_hash: Some("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef".to_string()),
            document_name: Some("contract.pdf".to_string()),
            confirmations: 10,
        },
    ];

    Ok(Json(TransactionsResponse {
        transactions,
        total: 1,
        limit: params.limit,
        offset: params.offset,
    }))
}

/// GET /api/blockchain/contract - Get contract information
pub async fn get_contract_info(
    Extension(state): Extension<AppState>,
    Extension(config): Extension<Config>,
) -> Result<Json<ContractInfo>, AppError> {
    // Derive network name from chain_id
    let network_name = match config.blockchain.chain_id {
        137 => "Polygon Mainnet",
        80002 => "Polygon Amoy Testnet",
        1 => "Ethereum Mainnet",
        5 => "Goerli Testnet",
        11155111 => "Sepolia Testnet",
        _ => "Unknown Network",
    };

    Ok(Json(ContractInfo {
        address: config.blockchain.contract_address.clone(),
        name: "BlockSign".to_string(),
        symbol: "BLSIGN".to_string(),
        owner: "0x0000000000000000000000000000000000000000".to_string(),
        deployed_at: "2026-02-20T10:00:00Z".to_string(),
        deployment_tx: "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
        verified: true,
        network: network_name.to_string(),
    }))
}
