//! Rate limiting service for preventing abuse
//!
//! This service provides IP-based and wallet-based rate limiting
//! to prevent abuse and ensure fair usage of the system.

use crate::db::repositories::RateLimitRepository;
use crate::models::AppError;
use anyhow::{Context, Result};
use chrono::{Duration, Utc};
use std::sync::Arc;

/// Rate limit configuration
#[derive(Debug, Clone)]
pub struct RateLimitConfig {
    /// Maximum requests allowed in the window
    pub max_requests: u32,
    /// Time window in seconds
    pub window_seconds: i64,
}

impl RateLimitConfig {
    /// Create a new rate limit config
    pub fn new(max_requests: u32, window_seconds: i64) -> Self {
        Self {
            max_requests,
            window_seconds,
        }
    }

    /// Conservative rate limit for public endpoints
    pub fn conservative() -> Self {
        Self::new(100, 60) // 100 requests per minute
    }

    /// Strict rate limit for expensive operations
    pub fn strict() -> Self {
        Self::new(5, 60) // 5 requests per minute
    }

    /// Moderate rate limit for general operations
    pub fn moderate() -> Self {
        Self::new(20, 60) // 20 requests per minute
    }
}

/// Rate limiter service
pub struct RateLimiter {
    repository: Arc<RateLimitRepository>,
}

impl RateLimiter {
    /// Create a new rate limiter service
    pub fn new(repository: Arc<RateLimitRepository>) -> Self {
        Self { repository }
    }

    /// Check if request is allowed based on IP address
    ///
    /// # Arguments
    /// * `ip_address` - Client IP address
    /// * `endpoint` - API endpoint being accessed
    /// * `config` - Rate limit configuration
    ///
    /// # Returns
    /// Ok(remaining_requests) if allowed, Err if rate limited
    pub async fn check_rate_limit_ip(
        &self,
        ip_address: &str,
        endpoint: &str,
        config: RateLimitConfig,
    ) -> Result<u32, AppError> {
        self.check_rate_limit(
            format!("ip:{}", ip_address),
            endpoint.to_string(),
            config,
        )
            .await
    }

    /// Check if request is allowed based on wallet address
    ///
    /// # Arguments
    /// * `wallet_address` - Wallet address
    /// * `endpoint` - API endpoint being accessed
    /// * `config` - Rate limit configuration
    ///
    /// # Returns
    /// Ok(remaining_requests) if allowed, Err if rate limited
    pub async fn check_rate_limit_wallet(
        &self,
        wallet_address: &str,
        endpoint: &str,
        config: RateLimitConfig,
    ) -> Result<u32, AppError> {
        self.check_rate_limit(
            format!("wallet:{}", wallet_address.to_lowercase()),
            endpoint.to_string(),
            config,
        )
            .await
    }

    /// Check if request is allowed
    ///
    /// # Arguments
    /// * `identifier` - Unique identifier (ip:address or wallet:address)
    /// * `endpoint` - API endpoint being accessed
    /// * `config` - Rate limit configuration
    ///
    /// # Returns
    /// Ok(remaining_requests) if allowed, Err if rate limited
    async fn check_rate_limit(
        &self,
        identifier: String,
        endpoint: String,
        config: RateLimitConfig,
    ) -> Result<u32, AppError> {
        let now = Utc::now();
        let window_start = now - Duration::seconds(config.window_seconds);

        // Clean up old entries first
        let _ = self.repository.cleanup_before(window_start).await;

        // Get current count
        let current_count = self
            .repository
            .count_requests(&identifier, &endpoint, window_start)
            .await
            .unwrap_or(0);

        // Check if limit exceeded
        if current_count >= config.max_requests {
            return Err(AppError::RateLimitError {
                limit: config.max_requests,
                window_seconds: config.window_seconds,
                retry_after: config.window_seconds,
            });
        }

        // Record this request
        self.repository
            .record_request(&identifier, &endpoint, now)
            .await
            .map_err(|e| AppError::StorageError(format!("Failed to record request: {}", e)))?;

        Ok(config.max_requests - (current_count + 1))
    }

    /// Reset rate limit for an identifier (admin function)
    ///
    /// # Arguments
    /// * `identifier` - Identifier to reset
    pub async fn reset_rate_limit(&self, identifier: &str) -> Result<()> {
        self.repository
            .delete_for_identifier(identifier)
            .await
            .map(|_| ())
            .context("Failed to reset rate limit")
    }

    /// Get current usage statistics
    ///
    /// # Arguments
    /// * `identifier` - Identifier to check
    /// * `endpoint` - API endpoint
    /// * `config` - Rate limit configuration
    ///
    /// # Returns
    /// (current_count, max_allowed)
    pub async fn get_usage_stats(
        &self,
        identifier: &str,
        endpoint: &str,
        config: RateLimitConfig,
    ) -> Result<(u32, u32)> {
        let window_start = Utc::now() - Duration::seconds(config.window_seconds);

        let current_count = self
            .repository
            .count_requests(identifier, endpoint, window_start)
            .await
            .unwrap_or(0);

        Ok((current_count, config.max_requests))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_limit_config_conservative() {
        let config = RateLimitConfig::conservative();
        assert_eq!(config.max_requests, 100);
        assert_eq!(config.window_seconds, 60);
    }

    #[test]
    fn test_rate_limit_config_strict() {
        let config = RateLimitConfig::strict();
        assert_eq!(config.max_requests, 5);
        assert_eq!(config.window_seconds, 60);
    }

    #[test]
    fn test_rate_limit_config_custom() {
        let config = RateLimitConfig::new(50, 120);
        assert_eq!(config.max_requests, 50);
        assert_eq!(config.window_seconds, 120);
    }
}
