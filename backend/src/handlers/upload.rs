use crate::models::{is_allowed_content_type, AppError, HashResponse, UploadResponse};
use crate::services::compute_hash;
use crate::state::AppState;
use crate::utils::{validate_file, MAX_FILE_SIZE_BYTES};
use axum::{
    extract::{Extension, Multipart, Path},
    Json,
};

pub async fn post_upload(
    Extension(state): Extension<AppState>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, AppError> {
    let mut filename = String::new();
    let mut bytes = Vec::new();
    let mut content_type = String::new();
    let mut uploader_wallet = String::from("anonymous"); // Default wallet address

    // Process multipart form data
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::ValidationError(format!("Failed to read multipart field: {}", e))
    })? {
        let name = field.name().unwrap_or("").to_string();

        if name == "file" {
            filename = field
                .file_name()
                .unwrap_or("unknown")
                .to_string();

            content_type = field
                .content_type()
                .unwrap_or("application/octet-stream")
                .to_string();

            // Validate content type
            if !is_allowed_content_type(&content_type) {
                return Err(AppError::ValidationError(format!(
                    "Content type '{}' is not allowed",
                    content_type
                )));
            }

            // Read file bytes
            bytes = field
                .bytes()
                .await
                .map_err(|e| AppError::StorageError(format!("Failed to read file bytes: {}", e)))?
                .to_vec();

            // Comprehensive file validation including magic bytes
            let sanitized_filename = validate_file(
                &filename,
                &bytes,
                &content_type,
                MAX_FILE_SIZE_BYTES,
            )?;

            filename = sanitized_filename;
        } else if name == "wallet" {
            // Extract uploader wallet address
            let wallet_bytes = field
                .bytes()
                .await
                .map_err(|e| AppError::ValidationError(format!("Failed to read wallet: {}", e)))?;
            uploader_wallet = String::from_utf8(wallet_bytes.to_vec())
                .map_err(|_| AppError::ValidationError("Invalid wallet address".to_string()))?;
        }
    }

    // Check if file was uploaded
    if bytes.is_empty() {
        return Err(AppError::ValidationError("No file uploaded".to_string()));
    }

    // Compute hash
    let hash = compute_hash(&bytes)
        .map_err(|e| AppError::HashingError(format!("Failed to compute hash: {}", e)))?;

    // Store file
    let upload = state.storage.save_file(filename, bytes, content_type, hash, uploader_wallet).await?;

    Ok(Json(upload.into()))
}

pub async fn get_upload_by_id(
    Extension(state): Extension<AppState>,
    Path(id): Path<String>,
) -> Result<Json<HashResponse>, AppError> {
    let upload = state
        .storage
        .get_by_id(&id)
        .await
        .ok_or_else(|| AppError::NotFoundError(format!("Upload {} not found", id)))?;

    Ok(Json(upload.into()))
}

pub async fn get_upload_by_hash(
    Extension(state): Extension<AppState>,
    Path(hash): Path<String>,
) -> Result<Json<Vec<HashResponse>>, AppError> {
    // Validate hash format
    crate::services::validate_hash_format(&hash)?;

    let uploads = state.storage.get_by_hash(&hash).await;

    if uploads.is_empty() {
        return Err(AppError::NotFoundError(format!("No uploads found for hash {}", hash)));
    }

    let responses: Vec<HashResponse> = uploads.into_iter().map(Into::into).collect();

    Ok(Json(responses))
}
