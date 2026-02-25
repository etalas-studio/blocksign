use crate::models::{AppError, TransactionHashRequest, VerificationResponse};
use crate::services::validate_hash_format;
use crate::state::AppState;
use axum::{
    extract::{Extension, Path},
    Json,
};

pub async fn post_tx_hash(
    Extension(state): Extension<AppState>,
    Path(hash): Path<String>,
    Json(req): Json<TransactionHashRequest>,
) -> Result<Json<String>, AppError> {
    // Validate hash format
    validate_hash_format(&hash)?;

    // Validate transaction hash format
    if !req.tx_hash.starts_with("0x") || req.tx_hash.len() != 66 {
        return Err(AppError::ValidationError(
            "Invalid transaction hash format".to_string(),
        ));
    }

    // Validate signer address format
    if !req.signer.starts_with("0x") || req.signer.len() != 42 {
        return Err(AppError::ValidationError(
            "Invalid signer address format".to_string(),
        ));
    }

    // Update transaction hash
    let updated = state
        .storage
        .update_transaction(&hash, req.tx_hash, req.signer)
        .await?;

    if updated.is_some() {
        Ok(Json("Transaction hash stored successfully".to_string()))
    } else {
        Err(AppError::NotFoundError(format!(
            "No upload found for hash {}",
            hash
        )))
    }
}

pub async fn get_verification(
    Extension(state): Extension<AppState>,
    Path(hash): Path<String>,
) -> Result<Json<VerificationResponse>, AppError> {
    // Validate hash format
    validate_hash_format(&hash)?;

    // Query blockchain for signatures
    let response = state.blockchain.get_signatures(&hash).await?;

    Ok(Json(response))
}
