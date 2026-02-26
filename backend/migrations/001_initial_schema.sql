-- Initial schema for BlockSign SQLite database
-- This migration creates the core tables for documents, signatures, wallets, audit logs, and verification requests

-- Documents table: stores uploaded document metadata
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_hash TEXT NOT NULL UNIQUE,
    ipfs_hash TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploader_wallet TEXT NOT NULL,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_hash ON documents(document_hash);
CREATE INDEX idx_documents_uploader ON documents(uploader_wallet);
CREATE INDEX idx_documents_created ON documents(created_at);

-- Signatures table: stores blockchain signatures for documents
CREATE TABLE signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    signer_address TEXT NOT NULL,
    signature_hash TEXT NOT NULL UNIQUE,
    timestamp DATETIME NOT NULL,
    blockchain_tx TEXT UNIQUE,
    block_number INTEGER,
    gas_used REAL,
    network INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_signatures_document ON signatures(document_id);
CREATE INDEX idx_signatures_signer ON signatures(signer_address);
CREATE INDEX idx_signatures_tx ON signatures(blockchain_tx);
CREATE INDEX idx_signatures_status ON signatures(status);

-- Wallets table: tracks wallet addresses and activity
CREATE TABLE wallets (
    address TEXT PRIMARY KEY,
    network INTEGER NOT NULL,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON
);

CREATE INDEX idx_wallets_network ON wallets(network);
CREATE INDEX idx_wallets_last_seen ON wallets(last_seen);

-- Audit logs table: comprehensive audit trail
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'document', 'signature', 'verification'
    entity_id INTEGER NOT NULL,
    event_type TEXT NOT NULL, -- 'upload', 'sign', 'verify', 'confirm', 'download'
    event_data TEXT, -- JSON
    actor_wallet TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    blockchain_tx TEXT
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_actor ON audit_logs(actor_wallet);

-- Verification requests table: tracks document verification attempts
CREATE TABLE verification_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER,
    document_hash TEXT NOT NULL,
    requester_ip TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    result_status TEXT, -- 'verified', 'tampered', 'not_found'
    result_details TEXT, -- JSON
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_verification_hash ON verification_requests(document_hash);
CREATE INDEX idx_verification_requested_at ON verification_requests(requested_at);
CREATE INDEX idx_verification_status ON verification_requests(result_status);
