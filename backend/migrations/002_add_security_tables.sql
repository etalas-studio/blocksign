-- Migration 002: Add security-related tables
-- This migration adds tables for nonces, rate limiting, and security events

-- Nonces table: for replay attack prevention
CREATE TABLE IF NOT EXISTS nonces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonce_value TEXT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    document_hash TEXT,
    used BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nonces_value ON nonces(nonce_value);
CREATE INDEX idx_nonces_wallet ON nonces(wallet_address);
CREATE INDEX idx_nonces_expires ON nonces(expires_at);
CREATE INDEX idx_nonces_used ON nonces(used);

-- Rate limit entries table: for rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    requested_at DATETIME NOT NULL
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_entries(identifier);
CREATE INDEX idx_rate_limit_endpoint ON rate_limit_entries(endpoint);
CREATE INDEX idx_rate_limit_requested_at ON rate_limit_entries(requested_at);
CREATE INDEX idx_rate_limit_composite ON rate_limit_entries(identifier, endpoint, requested_at);

-- Security events table: for security audit logging
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
    ip_address TEXT,
    wallet_address TEXT,
    document_hash TEXT,
    details TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_wallet ON security_events(wallet_address);
CREATE INDEX idx_security_events_ip ON security_events(ip_address);
CREATE INDEX idx_security_events_hash ON security_events(document_hash);

-- Add hash verification columns to documents table
ALTER TABLE documents ADD COLUMN client_hash TEXT;
ALTER TABLE documents ADD COLUMN server_hash TEXT;
ALTER TABLE documents ADD COLUMN hash_verified BOOLEAN DEFAULT FALSE;
