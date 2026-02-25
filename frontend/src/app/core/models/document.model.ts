/**
 * Upload state interface
 */
export interface UploadState {
  file: File | null;
  uploading: boolean;
  hash: string | null;
  uploadId: string | null;
  error: string | null;
}

/**
 * Initial upload state
 */
export const initialUploadState: UploadState = {
  file: null,
  uploading: false,
  hash: null,
  uploadId: null,
  error: null
};

/**
 * Upload response from backend API
 */
export interface UploadResponse {
  id: string;
  filename: string;
  hash: string;
  size: number;
  uploaded_at: string;
  storage_path: string;
}

/**
 * Hash response from backend API
 */
export interface HashResponse {
  id: string;
  filename: string;
  hash: string;
  size: number;
  uploaded_at: string;
  tx_hash: string | null;
}

/**
 * Transaction hash storage request
 */
export interface TransactionHashRequest {
  tx_hash: string;
  signer: string;
}

/**
 * Verification response from backend
 */
export interface VerificationResponse {
  hash: string;
  signatures: SignatureInfo[];
  verified: boolean;
}

/**
 * Signature information from blockchain
 */
export interface SignatureInfo {
  signer: string;
  docHash: string;
  timestamp: number;
  signature: string;
}
