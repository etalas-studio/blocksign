import { Injectable, inject } from '@angular/core';
import { Contract } from 'ethers';
import { environment } from '../../../environments/environment';
import { BLOCKSIGN_ABI } from '../../../environments/contract.abi';
import { Web3Service } from './web3.service';
import { Signature } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private web3Service = inject(Web3Service);

  private contract: Contract | null = null;
  private contractAddress = environment.contractAddress;

  constructor() {
    this.initializeContract();
  }

  /**
   * Initialize contract instance
   */
  private async initializeContract(): Promise<void> {
    try {
      const signer = await this.web3Service.getSigner();
      if (signer) {
        this.contract = new Contract(
          this.contractAddress,
          BLOCKSIGN_ABI,
          signer
        );
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  }

  /**
   * Get contract instance
   */
  private async getContract(): Promise<Contract | null> {
    if (!this.contract) {
      await this.initializeContract();
    }
    return this.contract;
  }

  /**
   * Sign a document on the blockchain
   */
  async signDocument(docHash: string, signature: string): Promise<string> {
    const contract = await this.getContract();
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Convert hash to bytes32 format if needed
      const hashBytes32 = docHash.startsWith('0x') ? docHash : `0x${docHash}`;

      // Set appropriate gas parameters for Polygon Amoy
      // Minimum maxPriorityFeePerGas: 25 gwei (25000000000 wei)
      // Recommended maxFeePerGas: 100 gwei (100000000000 wei) for safety
      const gasOptions = {
        maxPriorityFeePerGas: 30000000000, // 30 gwei - above minimum
        maxFeePerGas: 100000000000,        // 100 gwei - safe upper bound
      };

      // Call signDocument function with gas options
      const tx = await (contract as any)['signDocument'](hashBytes32, signature, gasOptions);

      return tx.hash;
    } catch (error: any) {
      console.error('Error signing document:', error);

      // Parse common errors
      if (error.message.includes('AlreadySigned')) {
        throw new Error('You have already signed this document');
      } else if (error.message.includes('ZeroDocumentHash')) {
        throw new Error('Invalid document hash');
      } else if (error.message.includes('EmptySignature')) {
        throw new Error('Signature cannot be empty');
      } else if (error.message.includes('Contract is paused')) {
        throw new Error('Contract is currently paused');
      }

      throw error;
    }
  }

  /**
   * Verify if a signer has signed a document
   */
  async verify(docHash: string, signer: string): Promise<boolean> {
    const contract = await this.getContract();
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hashBytes32 = docHash.startsWith('0x') ? docHash : `0x${docHash}`;
      const verified = await (contract as any)['verify'](hashBytes32, signer);
      return verified;
    } catch (error) {
      console.error('Error verifying document:', error);
      return false;
    }
  }

  /**
   * Get all signatures for a document
   */
  async getSignatures(docHash: string): Promise<Signature[]> {
    const contract = await this.getContract();
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hashBytes32 = docHash.startsWith('0x') ? docHash : `0x${docHash}`;
      const signatures = await (contract as any)['getSignatures'](hashBytes32);

      return signatures.map((sig: any) => ({
        signer: sig.signer,
        docHash: sig.docHash,
        timestamp: Number(sig.timestamp),
        signature: sig.signature
      }));
    } catch (error) {
      console.error('Error getting signatures:', error);
      return [];
    }
  }

  /**
   * Get signature count for a document
   */
  async getSignatureCount(docHash: string): Promise<number> {
    const contract = await this.getContract();
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hashBytes32 = docHash.startsWith('0x') ? docHash : `0x${docHash}`;
      const count = await (contract as any)['getSignatureCount'](hashBytes32);
      return Number(count);
    } catch (error) {
      console.error('Error getting signature count:', error);
      return 0;
    }
  }

  /**
   * Listen to DocumentSigned events
   */
  async listenToDocumentSigned(
    callback: (signer: string, docHash: string, timestamp: number, signature: string) => void
  ): Promise<void> {
    const contract = await this.getContract();
    if (!contract) {
      console.error('Contract not initialized');
      return;
    }

    try {
      contract.on('DocumentSigned', (signer: string, docHash: string, timestamp: bigint, signature: string) => {
        callback(signer, docHash, Number(timestamp), signature);
      });
    } catch (error) {
      console.error('Error listening to events:', error);
    }
  }

  /**
   * Stop listening to events
   */
  async removeAllListeners(): Promise<void> {
    const contract = await this.getContract();
    if (contract) {
      contract.removeAllListeners();
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get block explorer URL for a transaction
   */
  getBlockExplorerTxUrl(txHash: string): string {
    return `${environment.blockExplorerUrl}/tx/${txHash}`;
  }

  /**
   * Get block explorer URL for an address
   */
  getBlockExplorerAddressUrl(address: string): string {
    return `${environment.blockExplorerUrl}/address/${address}`;
  }
}
