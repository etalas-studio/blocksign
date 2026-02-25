use crate::models::{is_allowed_content_type, AppError, HashResponse, UploadResponse};
use crate::services::compute_hash;
use crate::state::AppState;
use axum::{
    extract::{Extension, Multipart, Path},
    Json,
};

const MAX_FILE_SIZE_BYTES: usize = 10 * 1024 * 1024; // 10 MB

pub async fn post_upload(
    Extension(state): Extension<AppState>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, AppError> {
    let mut filename = String::new();
    let mut bytes = Vec::new();
    let mut content_type = String::new();

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

            // Validate file size
            if bytes.len() > MAX_FILE_SIZE_BYTES {
                return Err(AppError::FileTooLargeError { max_size_mb: 10 });
            }
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
    let upload = state.storage.save_file(filename, bytes, content_type, hash).await?;

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
