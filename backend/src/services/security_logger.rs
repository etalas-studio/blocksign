//! Security event logging service
//!
//! This service logs all security-relevant events for audit and monitoring.

use crate::db::repositories::SecurityEventRepository;
use crate::db::models::SecurityEvent;
use anyhow::Result;
use std::sync::Arc;

/// Security event severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Info,
    Warning,
    Critical,
}

impl Severity {
    /// Convert to string for database storage
    pub fn as_str(&self) -> &'static str {
        match self {
            Severity::Info => "info",
            Severity::Warning => "warning",
            Severity::Critical => "critical",
        }
    }

    /// Parse from string
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "info" => Some(Severity::Info),
            "warning" => Some(Severity::Warning),
            "critical" => Some(Severity::Critical),
            _ => None,
        }
    }
}

/// Security event types
#[derive(Debug, Clone)]
pub enum SecurityEventType {
    // File upload events
    FileUploadSuccess,
    FileUploadSizeExceeded,
    FileUploadInvalidType,
    FileUploadMagicBytesMismatch,

    // Hash validation events
    HashValidationSuccess,
    HashValidationMismatch,
    HashTamperingDetected,

    // Replay attack events
    NonceGenerated,
    NonceUsed,
    NonceExpired,
    NonceReuseAttempt,
    NonceInvalidBinding,

    // Rate limiting events
    RateLimitExceeded,
    RateLimitReset,

    // Authentication events
    WalletConnection,
    WalletDisconnection,

    // Signing events
    SigningSuccess,
    SigningFailed,

    // Verification events
    VerificationSuccess,
    VerificationFailed,
    VerificationTampered,

    // General security events
    SuspiciousActivity,
    InvalidRequest,
}

impl SecurityEventType {
    /// Convert to string for database storage
    pub fn as_str(&self) -> &'static str {
        match self {
            SecurityEventType::FileUploadSuccess => "file_upload_success",
            SecurityEventType::FileUploadSizeExceeded => "file_upload_size_exceeded",
            SecurityEventType::FileUploadInvalidType => "file_upload_invalid_type",
            SecurityEventType::FileUploadMagicBytesMismatch => "file_upload_magic_bytes_mismatch",
            SecurityEventType::HashValidationSuccess => "hash_validation_success",
            SecurityEventType::HashValidationMismatch => "hash_validation_mismatch",
            SecurityEventType::HashTamperingDetected => "hash_tampering_detected",
            SecurityEventType::NonceGenerated => "nonce_generated",
            SecurityEventType::NonceUsed => "nonce_used",
            SecurityEventType::NonceExpired => "nonce_expired",
            SecurityEventType::NonceReuseAttempt => "nonce_reuse_attempt",
            SecurityEventType::NonceInvalidBinding => "nonce_invalid_binding",
            SecurityEventType::RateLimitExceeded => "rate_limit_exceeded",
            SecurityEventType::RateLimitReset => "rate_limit_reset",
            SecurityEventType::WalletConnection => "wallet_connection",
            SecurityEventType::WalletDisconnection => "wallet_disconnection",
            SecurityEventType::SigningSuccess => "signing_success",
            SecurityEventType::SigningFailed => "signing_failed",
            SecurityEventType::VerificationSuccess => "verification_success",
            SecurityEventType::VerificationFailed => "verification_failed",
            SecurityEventType::VerificationTampered => "verification_tampered",
            SecurityEventType::SuspiciousActivity => "suspicious_activity",
            SecurityEventType::InvalidRequest => "invalid_request",
        }
    }

    /// Get default severity for event type
    pub fn default_severity(&self) -> Severity {
        match self {
            SecurityEventType::FileUploadSuccess
            | SecurityEventType::HashValidationSuccess
            | SecurityEventType::NonceGenerated
            | SecurityEventType::NonceUsed
            | SecurityEventType::RateLimitReset
            | SecurityEventType::WalletConnection
            | SecurityEventType::WalletDisconnection
            | SecurityEventType::SigningSuccess
            | SecurityEventType::VerificationSuccess => Severity::Info,

            SecurityEventType::FileUploadSizeExceeded
            | SecurityEventType::FileUploadInvalidType
            | SecurityEventType::NonceExpired
            | SecurityEventType::SigningFailed
            | SecurityEventType::VerificationFailed => Severity::Warning,

            SecurityEventType::FileUploadMagicBytesMismatch
            | SecurityEventType::HashValidationMismatch
            | SecurityEventType::HashTamperingDetected
            | SecurityEventType::NonceReuseAttempt
            | SecurityEventType::NonceInvalidBinding
            | SecurityEventType::RateLimitExceeded
            | SecurityEventType::SuspiciousActivity
            | SecurityEventType::InvalidRequest
            | SecurityEventType::VerificationTampered => Severity::Critical,
        }
    }
}

/// Security logger service
pub struct SecurityLogger {
    repository: Arc<SecurityEventRepository>,
}

impl SecurityLogger {
    /// Create a new security logger
    pub fn new(repository: Arc<SecurityEventRepository>) -> Self {
        Self { repository }
    }

    /// Log a security event
    ///
    /// # Arguments
    /// * `event_type` - Type of security event
    /// * `ip_address` - Optional IP address
    /// * `wallet_address` - Optional wallet address
    /// * `document_hash` - Optional document hash
    /// * `details` - Additional event details (JSON string)
    pub async fn log_security_event(
        &self,
        event_type: SecurityEventType,
        ip_address: Option<String>,
        wallet_address: Option<String>,
        document_hash: Option<String>,
        details: Option<String>,
    ) -> Result<()> {
        let severity = event_type.default_severity();

        let event = SecurityEvent {
            id: 0,
            event_type: event_type.as_str().to_string(),
            severity: severity.as_str().to_string(),
            ip_address,
            wallet_address,
            document_hash,
            details,
            user_agent: None,
            timestamp: chrono::Utc::now(),
        };

        self.repository.create(&event).await?;

        Ok(())
    }

    /// Log a security event with custom severity
    pub async fn log_security_event_with_severity(
        &self,
        event_type: SecurityEventType,
        severity: Severity,
        ip_address: Option<String>,
        wallet_address: Option<String>,
        document_hash: Option<String>,
        details: Option<String>,
    ) -> Result<()> {
        let event = SecurityEvent {
            id: 0,
            event_type: event_type.as_str().to_string(),
            severity: severity.as_str().to_string(),
            ip_address,
            wallet_address,
            document_hash,
            details,
            user_agent: None,
            timestamp: chrono::Utc::now(),
        };

        self.repository.create(&event).await?;

        Ok(())
    }

    /// Get recent security events
    pub async fn get_recent_events(
        &self,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        self.repository.get_recent(limit).await
    }

    /// Get events by severity
    pub async fn get_events_by_severity(
        &self,
        severity: Severity,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        self.repository
            .get_by_severity(severity.as_str(), limit)
            .await
    }

    /// Get events by wallet address
    pub async fn get_events_by_wallet(
        &self,
        wallet_address: &str,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        self.repository
            .get_by_wallet(wallet_address, limit)
            .await
    }

    /// Get events by type
    pub async fn get_events_by_type(
        &self,
        event_type: &str,
        limit: usize,
    ) -> Result<Vec<SecurityEvent>> {
        self.repository.get_by_type(event_type, limit).await
    }

    /// Get security statistics
    pub async fn get_statistics(&self) -> Result<SecurityStatistics> {
        let recent = self.repository.get_recent(1000).await?;

        let total = recent.len();
        let critical = recent.iter()
            .filter(|e| e.severity == "critical")
            .count();
        let warning = recent.iter()
            .filter(|e| e.severity == "warning")
            .count();
        let info = recent.iter()
            .filter(|e| e.severity == "info")
            .count();

        Ok(SecurityStatistics {
            total_events: total,
            critical_events: critical,
            warning_events: warning,
            info_events: info,
        })
    }
}

/// Security statistics
#[derive(Debug, Clone)]
pub struct SecurityStatistics {
    pub total_events: usize,
    pub critical_events: usize,
    pub warning_events: usize,
    pub info_events: usize,
}

/// Helper macro for logging security events
#[macro_export]
macro_rules! log_security {
    ($logger:expr, $event_type:expr) => {
        $logger.log_security_event($event_type, None, None, None, None).await
    };
    ($logger:expr, $event_type:expr, $ip:expr) => {
        $logger.log_security_event($event_type, Some($ip.to_string()), None, None, None).await
    };
    ($logger:expr, $event_type:expr, $ip:expr, $wallet:expr) => {
        $logger.log_security_event(
            $event_type,
            $ip.map(|i| i.to_string()),
            $wallet.map(|w| w.to_string()),
            None,
            None,
        )
        .await
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_severity_from_str() {
        assert_eq!(Severity::from_str("info"), Some(Severity::Info));
        assert_eq!(Severity::from_str("warning"), Some(Severity::Warning));
        assert_eq!(Severity::from_str("critical"), Some(Severity::Critical));
        assert_eq!(Severity::from_str("invalid"), None);
    }

    #[test]
    fn test_event_type_default_severity() {
        assert_eq!(
            SecurityEventType::FileUploadSuccess.default_severity(),
            Severity::Info
        );
        assert_eq!(
            SecurityEventType::HashTamperingDetected.default_severity(),
            Severity::Critical
        );
        assert_eq!(
            SecurityEventType::FileUploadSizeExceeded.default_severity(),
            Severity::Warning
        );
    }
}
