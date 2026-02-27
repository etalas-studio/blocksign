/**
 * API response models for dynamic pages
 */

// ============================================================================
// Documents API Models
// ============================================================================

/**
 * Document signature information
 */
export interface DocumentSignature {
  wallet_address: string;
  signed_at: string;
  tx_hash?: string;
  block_number?: number;
  status: string;
}

/**
 * Document response with signatures
 */
export interface DocumentResponse {
  id: number;
  name: string;
  hash: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploader_wallet: string;
  signatures: DocumentSignature[];
  verification_status: string;
  signature_count: number;
}

/**
 * Paginated documents response
 */
export interface DocumentsResponse {
  documents: DocumentResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Document metrics response
 */
export interface DocumentMetrics {
  total_documents: number;
  total_signatures: number;
  verified_documents: number;
  pending_documents: number;
  failed_documents: number;
  on_chain_records: number;
  unique_signers: number;
}

/**
 * Query parameters for documents listing
 */
export interface DocumentsQueryParams {
  wallet?: string;
  limit?: number;
  offset?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// Audit Trail API Models
// ============================================================================

/**
 * Audit event response
 */
export interface AuditEventResponse {
  id: number;
  event_type: string;
  actor_wallet?: string;
  entity_type: string;
  entity_id: number;
  action: string;
  details?: any;
  timestamp: string;
  blockchain_tx?: string;
}

/**
 * Paginated audit logs response
 */
export interface AuditLogsResponse {
  events: AuditEventResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Audit statistics response
 */
export interface AuditStats {
  total_events: number;
  uploads: number;
  signatures: number;
  confirmations: number;
  verifications: number;
  downloads: number;
  unique_wallets: number;
  unique_documents: number;
}

/**
 * Query parameters for audit logs
 */
export interface AuditQueryParams {
  event_type?: string;
  wallet?: string;
  document_hash?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit filters for export
 */
export interface AuditFilters {
  event_type?: string;
  start_date?: string;
  end_date?: string;
  wallet?: string;
  document_hash?: string;
}

// ============================================================================
// Blockchain API Models
// ============================================================================

/**
 * Network information
 */
export interface BlockchainNetworkInfo {
  name: string;
  chain_id: number;
  rpc_url: string;
  block_number: number;
  block_time: number;
}

/**
 * Contract information
 */
export interface ContractInfo {
  address: string;
  name: string;
  symbol: string;
  owner: string;
  deployed_at: string;
  deployment_tx: string;
  verified: boolean;
  network: string;
}

/**
 * Transaction statistics
 */
export interface TransactionStats {
  total: number;
  successful: number;
  pending: number;
  failed: number;
}

/**
 * Document statistics
 */
export interface DocumentStats {
  registered: number;
  verified: number;
}

/**
 * Gas statistics
 */
export interface GasStats {
  total_spent: string;
  average_cost: string;
}

/**
 * Blockchain statistics response
 */
export interface BlockchainStatsResponse {
  network: BlockchainNetworkInfo;
  contract: ContractInfo;
  transactions: TransactionStats;
  documents: DocumentStats;
  gas: GasStats;
}

/**
 * Blockchain transaction response
 */
export interface BlockchainTransactionResponse {
  tx_hash: string;
  block_number: number;
  timestamp: string;
  from: string;
  to: string;
  gas_used: string;
  gas_price: string;
  status: string;
  tx_type: string;
  document_hash?: string;
  document_name?: string;
  confirmations: number;
}

/**
 * Paginated blockchain transactions response
 */
export interface TransactionsResponse {
  transactions: BlockchainTransactionResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Query parameters for blockchain transactions
 */
export interface TransactionQueryParams {
  wallet?: string;
  document_hash?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Common Models
// ============================================================================

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
