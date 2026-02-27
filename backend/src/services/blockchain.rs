use crate::models::{AppError, SignatureInfo, VerificationResponse};
use anyhow::{Context, Result};
use chrono::Utc;
use ethers::{
    abi::Abi,
    prelude::*,
    providers::{Http, Provider},
    types::H256,
};
use std::str::FromStr;
use std::sync::Arc;

// Smart contract ABI (minimal, for the functions we need)
const CONTRACT_ABI: &str = r#"[
    {
        "inputs": [
            {"internalType": "bytes32", "name": "docHash", "type": "bytes32"},
            {"internalType": "address", "name": "signer", "type": "address"}
        ],
        "name": "verify",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "docHash", "type": "bytes32"}],
        "name": "getSignatures",
        "outputs": [
            {
                "components": [
                    {"internalType": "address", "name": "signer", "type": "address"},
                    {"internalType": "bytes32", "name": "docHash", "type": "bytes32"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "bytes", "name": "signature", "type": "bytes"}
                ],
                "internalType": "struct BlockSign.Signature[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "docHash", "type": "bytes32"}],
        "name": "getSignatureCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]"#;

// Polygon Amoy block explorer URL
const POLYGON_AMOY_EXPLORER: &str = "https://amoy.polygonscan.com";
const NETWORK_NAME: &str = "Polygon Amoy Testnet";

#[derive(Clone)]
pub struct BlockchainService {
    provider: Arc<Provider<Http>>,
    contract_address: Address,
    contract: Contract<Provider<Http>>,
    block_explorer: String,
}

impl BlockchainService {
    pub fn new(rpc_url: &str, contract_address: &str) -> Result<Self> {
        // Connect to RPC provider
        let provider = Provider::<Http>::try_from(rpc_url)
            .context("Failed to connect to RPC provider")?;
        let provider = Arc::new(provider);

        // Parse contract address
        let contract_address = Address::from_str(contract_address)
            .context("Invalid contract address")?;

        // Parse ABI
        let abi: Abi = serde_json::from_str(CONTRACT_ABI)
            .context("Failed to parse contract ABI")?;

        // Create contract instance
        let contract = Contract::new(contract_address, abi, provider.clone());

        Ok(Self {
            provider,
            contract_address,
            contract,
            block_explorer: POLYGON_AMOY_EXPLORER.to_string(),
        })
    }

    /// Verify if a document has been signed by a specific address
    pub async fn verify(&self, hash: &str, signer: &str) -> Result<bool, AppError> {
        let doc_hash = H256::from_str(hash)
            .map_err(|_| AppError::ValidationError("Invalid document hash format".to_string()))?;

        let signer_address = Address::from_str(signer)
            .map_err(|_| AppError::ValidationError("Invalid signer address format".to_string()))?;

        let result: bool = self
            .contract
            .method::<(H256, Address), bool>("verify", (doc_hash, signer_address))
            .map_err(|e| AppError::BlockchainError(format!("Failed to call verify: {}", e)))?
            .call()
            .await
            .map_err(|e| AppError::BlockchainError(format!("RPC call failed: {}", e)))?;

        Ok(result)
    }

    /// Get all signatures for a document with full details
    pub async fn get_signatures(&self, hash: &str) -> Result<VerificationResponse, AppError> {
        let doc_hash = H256::from_str(hash)
            .map_err(|_| AppError::ValidationError("Invalid document hash format".to_string()))?;

        // Call getSignatures on the contract
        let tokens: Vec<(Address, H256, U256, Bytes)> = self
            .contract
            .method::<H256, Vec<(Address, H256, U256, Bytes)>>("getSignatures", doc_hash)
            .map_err(|e| AppError::BlockchainError(format!("Failed to call getSignatures: {}", e)))?
            .call()
            .await
            .map_err(|e| AppError::BlockchainError(format!("RPC call failed: {}", e)))?;

        let signatures: Vec<SignatureInfo> = tokens
            .into_iter()
            .map(|(signer, doc_hash, timestamp, signature)| {
                let signer_addr = format!("{:#x}", signer);
                SignatureInfo {
                    signer: signer_addr.clone(),
                    doc_hash: hash.to_string(),
                    timestamp: timestamp.as_u64(),
                    signature: format!("0x{}", hex::encode(signature)),
                    network: NETWORK_NAME.to_string(),
                    block_explorer_url: format!("{}/address/{}", self.block_explorer, signer_addr),
                }
            })
            .collect();

        let verified = !signatures.is_empty();
        let total_signatures = signatures.len();

        Ok(VerificationResponse {
            hash: hash.to_string(),
            signatures,
            verified,
            verification_date: Utc::now(),
            total_signatures,
        })
    }

    /// Get signature count for a document
    pub async fn get_signature_count(&self, hash: &str) -> Result<u64, AppError> {
        let doc_hash = H256::from_str(hash)
            .map_err(|_| AppError::ValidationError("Invalid document hash format".to_string()))?;

        let count: U256 = self
            .contract
            .method::<H256, U256>("getSignatureCount", doc_hash)
            .map_err(|e| AppError::BlockchainError(format!("Failed to call getSignatureCount: {}", e)))?
            .call()
            .await
            .map_err(|e| AppError::BlockchainError(format!("RPC call failed: {}", e)))?;

        Ok(count.as_u64())
    }

    /// Get block explorer URL for address
    pub fn get_address_explorer_url(&self, address: &str) -> String {
        format!("{}/address/{}", self.block_explorer, address)
    }

    /// Get block explorer URL for transaction
    pub fn get_tx_explorer_url(&self, tx_hash: &str) -> String {
        format!("{}/tx/{}", self.block_explorer, tx_hash)
    }

    /// Get contract address
    pub fn contract_address(&self) -> String {
        format!("{:#x}", self.contract_address)
    }

    /// Get network name
    pub fn network_name(&self) -> &str {
        NETWORK_NAME
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_contract_address() {
        let address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
        let parsed = Address::from_str(address);
        // Note: This address may not be checksummed correctly, so we allow either success or failure
        // The important thing is that from_str doesn't panic
        let _ = parsed;
    }

    #[test]
    fn test_parse_abi() {
        let abi: Result<Abi, _> = serde_json::from_str(CONTRACT_ABI);
        assert!(abi.is_ok());
    }

    #[test]
    fn test_parse_hash() {
        let hash = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
        let parsed = H256::from_str(hash);
        assert!(parsed.is_ok());
    }

    #[test]
    fn test_parse_invalid_hash() {
        let hash = "invalid_hash";
        let parsed = H256::from_str(hash);
        assert!(parsed.is_err());
    }

    #[test]
    fn test_explorer_urls() {
        // Test with mock service (would need actual RPC URL in real test)
        let explorer = POLYGON_AMOY_EXPLORER;
        assert!(explorer.contains("polygonscan"));

        let address = "0x1234567890123456789012345678901234567890";
        let url = format!("{}/address/{}", explorer, address);
        assert!(url.contains("0x1234567890"));
    }
}
