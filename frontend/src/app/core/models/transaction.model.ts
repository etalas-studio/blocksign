/**
 * Transaction status types
 */
export type TransactionStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

/**
 * Signature record stored on blockchain
 */
export interface Signature {
  signer: string;
  docHash: string;
  timestamp: number;
  signature: string;
}

/**
 * Transaction state interface
 */
export interface TransactionState {
  hash: string;
  status: TransactionStatus;
  from: string;
  to: string;
  gasUsed: string;
  blockNumber: number;
  timestamp: Date;
  error?: string;
}

/**
 * Empty transaction state
 */
export const emptyTransactionState: TransactionState = {
  hash: '',
  status: 'pending',
  from: '',
  to: '',
  gasUsed: '',
  blockNumber: 0,
  timestamp: new Date()
};

/**
 * Transaction submission request
 */
export interface TransactionRequest {
  to: string;
  data?: string;
  value?: string;
  gasLimit?: string;
}

/**
 * Transaction receipt from blockchain
 */
export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  status: boolean;
  logs: any[];
}
