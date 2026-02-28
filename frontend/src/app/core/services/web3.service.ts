import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BrowserProvider, JsonRpcSigner, JsonRpcProvider } from 'ethers';
import { WalletService } from './wallet.service';
import { environment } from '../../../environments/environment';
import {
  TransactionState,
  emptyTransactionState,
  TransactionReceipt
} from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private walletService = inject(WalletService);

  private transactionState = new BehaviorSubject<TransactionState>(emptyTransactionState);
  public transactionState$ = this.transactionState.asObservable();

  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;
  private readOnlyProvider: JsonRpcProvider | null = null;

  constructor() {
    this.initializeProvider();
    this.initializeReadOnlyProvider();
  }

  /**
   * Initialize provider and signer from wallet
   */
  private initializeProvider(): void {
    const ethereum = this.walletService.getProvider();
    if (ethereum) {
      try {
        this.provider = new BrowserProvider(ethereum);
      } catch (error) {
        console.error('Error initializing provider:', error);
      }
    }
  }

  /**
   * Initialize read-only provider for queries without wallet
   */
  private initializeReadOnlyProvider(): void {
    try {
      this.readOnlyProvider = new JsonRpcProvider(environment.rpcUrl);
    } catch (error) {
      console.error('Error initializing read-only provider:', error);
    }
  }

  /**
   * Get signer for transactions
   */
  async getSigner(): Promise<JsonRpcSigner | null> {
    if (!this.provider) {
      await this.initializeProvider();
    }

    if (!this.provider) return null;

    if (!this.signer) {
      try {
        this.signer = await this.provider.getSigner();
      } catch (error) {
        console.error('Error getting signer:', error);
        return null;
      }
    }

    return this.signer;
  }

  /**
   * Get read-only provider for queries
   */
  getReadOnlyProvider(): JsonRpcProvider | null {
    return this.readOnlyProvider;
  }

  /**
   * Get the provider (browser or read-only)
   */
  getProvider(): BrowserProvider | JsonRpcProvider | null {
    return this.provider || this.readOnlyProvider;
  }

  /**
   * Sign a hash with wallet
   */
  async signHash(hash: string): Promise<string> {
    const signer = await this.getSigner();
    if (!signer) {
      throw new Error('No signer available');
    }

    try {
      // Sign the hash
      const signature = await signer.signMessage(hash);
      return signature;
    } catch (error: any) {
      console.error('Error signing hash:', error);
      throw error;
    }
  }

  /**
   * Send transaction to blockchain
   */
  async sendTransaction(to: string, data: string): Promise<string> {
    const signer = await this.getSigner();
    if (!signer) {
      throw new Error('No signer available');
    }

    try {
      // Update transaction state to pending
      this.transactionState.next({
        ...emptyTransactionState,
        status: 'pending',
        from: '',
        to
      });

      // Send transaction
      const tx = await signer.sendTransaction({ to, data });

      // Update state with transaction hash
      this.transactionState.next({
        ...this.transactionState.value,
        hash: tx.hash,
        status: 'submitted',
        from: tx.from,
        timestamp: new Date()
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (receipt) {
        this.transactionState.next({
          ...this.transactionState.value,
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        });
      }

      return tx.hash;
    } catch (error: any) {
      console.error('Error sending transaction:', error);

      this.transactionState.next({
        ...this.transactionState.value,
        status: 'failed',
        error: error.message || 'Transaction failed'
      });

      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string): Promise<TransactionReceipt | null> {
    if (!this.provider) return null;

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return null;

      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1,
        logs: [...receipt.logs]
      };
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return null;
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(to: string, data: string): Promise<string> {
    const signer = await this.getSigner();
    if (!signer) {
      throw new Error('No signer available');
    }

    try {
      const gasEstimate = await signer.estimateGas({ to, data });
      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '0';
    }
  }

  /**
   * Get current transaction state
   */
  getTransactionState(): TransactionState {
    return this.transactionState.value;
  }

  /**
   * Reset transaction state
   */
  resetTransactionState(): void {
    this.transactionState.next(emptyTransactionState);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    if (!this.provider) return null;

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return null;

      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1,
        logs: [...receipt.logs]
      };
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  /**
   * Format address for display
   */
  truncateAddress(address: string, chars: number = 6): string {
    if (!address) return '';
    return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
  }

  /**
   * Format hash for display
   */
  truncateHash(hash: string, chars: number = 8): string {
    if (!hash) return '';
    return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
  }

  /**
   * Validate address format
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate hash format
   */
  isValidHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }
}
