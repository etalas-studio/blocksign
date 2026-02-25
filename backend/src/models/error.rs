use axum::{
    http::StatusCode,
    response::{IntoResponse, Json, Response},
};
use serde::Serialize;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    ValidationError(String),
    FileTooLargeError { max_size_mb: usize },
    NotFoundError(String),
    StorageError(String),
    HashingError(String),
    BlockchainError(String),
    InternalError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AppError::FileTooLargeError { max_size_mb } => {
                write!(f, "File exceeds maximum size of {} MB", max_size_mb)
            }
            AppError::NotFoundError(msg) => write!(f, "Not found: {}", msg),
            AppError::StorageError(msg) => write!(f, "Storage error: {}", msg),
            AppError::HashingError(msg) => write!(f, "Hashing error: {}", msg),
            AppError::BlockchainError(msg) => write!(f, "Blockchain error: {}", msg),
            AppError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match self {
            AppError::ValidationError(msg) => {
                (StatusCode::BAD_REQUEST, "validation_error", msg)
            }
            AppError::FileTooLargeError { max_size_mb } => (
                StatusCode::PAYLOAD_TOO_LARGE,
                "file_too_large",
                format!("File exceeds maximum size of {} MB", max_size_mb),
            ),
            AppError::NotFoundError(msg) => (StatusCode::NOT_FOUND, "not_found", msg),
            AppError::StorageError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "storage_error", msg),
            AppError::HashingError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "hashing_error", msg),
            AppError::BlockchainError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "blockchain_error", msg)
            }
            AppError::InternalError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", msg)
            }
        };

        let body = Json(ErrorResponse {
            error: error_type.to_string(),
            message,
        });

        (status, body).into_response()
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalError(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::StorageError(err.to_string())
    }
}
