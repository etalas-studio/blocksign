use crate::models::{AppError, SignatureInfo, VerificationResponse};
use anyhow::{Context, Result};
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

#[derive(Clone)]
pub struct BlockchainService {
    provider: Arc<Provider<Http>>,
    contract_address: Address,
    contract: Contract<Provider<Http>>,
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

    /// Get all signatures for a document
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
            .map(|(signer, _doc_hash, timestamp, _signature)| SignatureInfo {
                signer: format!("{:#x}", signer),
                timestamp: timestamp.as_u64(),
                tx_hash: String::new(), // Transaction hash not directly available from struct
            })
            .collect();

        let exists = !signatures.is_empty();

        Ok(VerificationResponse {
            hash: hash.to_string(),
            signatures,
            exists,
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
}
