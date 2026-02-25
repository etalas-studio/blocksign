use crate::services::{BlockchainService, StorageService};
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub storage: Arc<StorageService>,
    pub blockchain: Arc<BlockchainService>,
}

impl AppState {
    pub fn new(storage: Arc<StorageService>, blockchain: Arc<BlockchainService>) -> Self {
        Self { storage, blockchain }
    }
}
