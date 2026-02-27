import { Injectable, inject } from '@angular/core';
import { ContractService } from './contract.service';
import { ApiService } from './api.service';
import { DocumentHasherService } from './document-hasher.service';

export interface SignatureRecord {
  signer: string;
  docHash: string;
  timestamp: number;
  signature: string;
  txHash?: string;
  blockNumber?: number;
  blockTimestamp?: number;
  network: string;
}

export interface VerificationResult {
  verified: boolean;
  documentHash: string;
  signatures: SignatureRecord[];
  firstSignatureDate?: Date;
  lastSignatureDate?: Date;
  totalSignatures: number;
  verificationDate: Date;
  documentName?: string;
  fileSize?: number;
  tampered?: boolean;
}

export interface VerificationStatus {
  state: 'idle' | 'hashing' | 'querying' | 'verified' | 'not_found' | 'tampered' | 'error';
  progress?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private contractService = inject(ContractService);
  private apiService = inject(ApiService);
  private hasherService = inject(DocumentHasherService);

  private readonly NETWORK_NAME = 'Polygon Amoy Testnet';

  /**
   * Verify a document by hash (from blockchain directly)
   */
  async verifyByHash(documentHash: string): Promise<VerificationResult> {
    const normalizedHash = this.hasherService.normalizeHash(documentHash);

    // Validate hash format
    if (!this.hasherService.isValidHash(normalizedHash)) {
      throw new Error('Invalid document hash format');
    }

    try {
      // Query blockchain for signatures
      const signatures = await this.contractService.getSignatures(normalizedHash);

      if (signatures.length === 0) {
        return {
          verified: false,
          documentHash: normalizedHash,
          signatures: [],
          totalSignatures: 0,
          verificationDate: new Date()
        };
      }

      // Enhance signatures with additional data
      const enhancedSignatures: SignatureRecord[] = signatures.map(sig => ({
        signer: sig.signer,
        docHash: sig.docHash,
        timestamp: sig.timestamp,
        signature: sig.signature,
        network: this.NETWORK_NAME
      }));

      // Calculate date range
      const timestamps = signatures.map(s => s.timestamp).sort((a, b) => a - b);
      const firstSignatureDate = new Date(timestamps[0] * 1000);
      const lastSignatureDate = new Date(timestamps[timestamps.length - 1] * 1000);

      return {
        verified: true,
        documentHash: normalizedHash,
        signatures: enhancedSignatures,
        firstSignatureDate,
        lastSignatureDate,
        totalSignatures: signatures.length,
        verificationDate: new Date()
      };

    } catch (error: any) {
      console.error('Error verifying by hash:', error);
      throw new Error('Failed to verify document on blockchain');
    }
  }

  /**
   * Verify a document file (hash it first, then query blockchain)
   */
  async verifyFile(
    file: File,
    progressCallback?: (status: VerificationStatus) => void
  ): Promise<VerificationResult> {
    // Check if file type is supported
    if (!this.hasherService.isFileTypeSupported(file)) {
      throw new Error('File type not supported for hashing');
    }

    // Step 1: Hash the file
    progressCallback?.({ state: 'hashing', message: 'Computing document hash...' });

    const hashResult = await this.hasherService.computeHash(file, (progress) => {
      progressCallback?.({
        state: 'hashing',
        progress: progress.percentage,
        message: `Computing hash... ${progress.percentage}%`
      });
    });

    // Step 2: Query blockchain
    progressCallback?.({ state: 'querying', message: 'Querying blockchain...' });

    const result = await this.verifyByHash(hashResult.hash);

    // Add file metadata
    return {
      ...result,
      documentName: hashResult.fileName,
      fileSize: hashResult.fileSize
    };
  }

  /**
   * Verify document using backend API (with additional metadata)
   */
  async verifyViaBackend(documentHash: string): Promise<VerificationResult> {
    const normalizedHash = this.hasherService.normalizeHash(documentHash);

    return new Promise((resolve, reject) => {
      this.apiService.verifyDocument(normalizedHash).subscribe({
        next: (response) => {
          if (response.verified && response.signatures.length > 0) {
            const timestamps = response.signatures
              .map((s: any) => s.timestamp || s.date)
              .sort((a: number, b: number) => a - b);

            resolve({
              verified: true,
              documentHash: normalizedHash,
              signatures: response.signatures.map((sig: any) => ({
                signer: sig.signer || sig.address,
                docHash: sig.docHash || sig.hash,
                timestamp: sig.timestamp || sig.date,
                signature: sig.signature,
                txHash: sig.txHash || sig.transaction_hash,
                blockNumber: sig.blockNumber || sig.block_number,
                network: this.NETWORK_NAME
              })),
              firstSignatureDate: new Date(timestamps[0] * 1000),
              lastSignatureDate: new Date(timestamps[timestamps.length - 1] * 1000),
              totalSignatures: response.signatures.length,
              verificationDate: new Date()
            });
          } else {
            resolve({
              verified: false,
              documentHash: normalizedHash,
              signatures: [],
              totalSignatures: 0,
              verificationDate: new Date()
            });
          }
        },
        error: (error) => {
          console.error('Error verifying via backend:', error);
          reject(new Error('Failed to verify document'));
        }
      });
    });
  }

  /**
   * Check if a specific signer signed a document
   */
  async checkSigner(documentHash: string, signerAddress: string): Promise<boolean> {
    const normalizedHash = this.hasherService.normalizeHash(documentHash);
    return await this.contractService.verify(normalizedHash, signerAddress);
  }

  /**
   * Get signature count for a document
   */
  async getSignatureCount(documentHash: string): Promise<number> {
    const normalizedHash = this.hasherService.normalizeHash(documentHash);
    return await this.contractService.getSignatureCount(normalizedHash);
  }

  /**
   * Format signature record for display
   */
  formatSignatureRecord(signature: SignatureRecord): {
    signer: string;
    signerShort: string;
    date: string;
    time: string;
    relativeTime: string;
    explorerUrl: string;
  } {
    const signerShort = this.truncateAddress(signature.signer);
    const date = new Date(signature.timestamp * 1000);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const relativeTime = this.getRelativeTime(date);
    const explorerUrl = signature.txHash
      ? this.contractService.getBlockExplorerTxUrl(signature.txHash)
      : this.contractService.getBlockExplorerAddressUrl(signature.signer);

    return {
      signer: signature.signer,
      signerShort,
      date: dateStr,
      time: timeStr,
      relativeTime,
      explorerUrl
    };
  }

  /**
   * Get block explorer URL for transaction or address
   */
  getExplorerUrl(txHash?: string, address?: string): string {
    if (txHash) {
      return this.contractService.getBlockExplorerTxUrl(txHash);
    }
    if (address) {
      return this.contractService.getBlockExplorerAddressUrl(address);
    }
    return '';
  }

  /**
   * Truncate Ethereum address for display
   */
  private truncateAddress(address: string, startChars = 6, endChars = 4): string {
    const normalized = address.toLowerCase();
    if (normalized.startsWith('0x')) {
      return `0x${normalized.slice(2, 2 + startChars)}...${normalized.slice(-endChars)}`;
    }
    return `${normalized.slice(0, startChars)}...${normalized.slice(-endChars)}`;
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      }
      const diffYears = Math.floor(diffDays / 365);
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Generate shareable verification URL
   */
  generateVerificationUrl(hash: string, baseUrl = window.location.origin): string {
    const normalizedHash = this.hasherService.normalizeHash(hash);
    return `${baseUrl}/verify/${normalizedHash.slice(2)}`;
  }

  /**
   * Parse hash from URL parameter
   */
  parseHashFromUrl(urlHash: string): string {
    return '0x' + urlHash;
  }

  /**
   * Get network name
   */
  getNetworkName(): string {
    return this.NETWORK_NAME;
  }

  /**
   * Get verification status display information
   */
  getStatusDisplay(result: VerificationResult): {
    icon: string;
    title: string;
    description: string;
    color: 'success' | 'warning' | 'error';
  } {
    if (result.verified && result.signatures.length > 0) {
      return {
        icon: 'shield-check',
        title: 'Document Verified on Blockchain',
        description: `This document has been signed by ${result.totalSignatures} ${result.totalSignatures > 1 ? 'parties' : 'party'}. The blockchain provides immutable proof of authenticity.`,
        color: 'success'
      };
    } else if (!result.verified && result.tampered) {
      return {
        icon: 'alert-triangle',
        title: 'Document Tampered',
        description: 'This document has been modified since it was signed. The current hash does not match the blockchain record.',
        color: 'error'
      };
    } else {
      return {
        icon: 'search',
        title: 'No Signatures Found',
        description: 'This document has not been signed on BlockSign. Verify you have the correct file or contact the document sender.',
        color: 'warning'
      };
    }
  }

  /**
   * Export verification result as JSON for proof download
   */
  exportToJson(result: VerificationResult): string {
    return JSON.stringify({
      verificationDate: result.verificationDate.toISOString(),
      documentHash: result.documentHash,
      documentName: result.documentName,
      fileSize: result.fileSize,
      verified: result.verified,
      signatures: result.signatures.map(sig => ({
        signer: sig.signer,
        timestamp: new Date(sig.timestamp * 1000).toISOString(),
        txHash: sig.txHash,
        blockNumber: sig.blockNumber,
        network: sig.network,
        signature: sig.signature
      })),
      blockchainData: {
        network: this.NETWORK_NAME,
        smartContractAddress: this.contractService.getContractAddress()
      }
    }, null, 2);
  }

  /**
   * Export verification result as text format
   */
  exportToText(result: VerificationResult): string {
    const lines: string[] = [];

    lines.push('BLOCKSIGN VERIFICATION CERTIFICATE');
    lines.push('===================================');
    lines.push('');
    lines.push(`Document Hash: ${result.documentHash}`);

    if (result.documentName) {
      lines.push(`Document Name: ${result.documentName}`);
    }

    if (result.fileSize) {
      lines.push(`File Size: ${this.apiService.formatFileSize(result.fileSize)}`);
    }

    lines.push(`Verification Date: ${result.verificationDate.toLocaleString()}`);
    lines.push('');
    lines.push(`Verified: ${result.verified ? 'Yes' : 'No'}`);

    if (result.verified && result.signatures.length > 0) {
      lines.push(`Total Signatures: ${result.totalSignatures}`);
      lines.push('');
      lines.push('BLOCKCHAIN SIGNATURES:');
      lines.push('');

      result.signatures.forEach((sig, index) => {
        const formatted = this.formatSignatureRecord(sig);
        lines.push(`Signature ${index + 1}:`);
        lines.push(`  Signer: ${sig.signer}`);
        lines.push(`  Date: ${formatted.date} at ${formatted.time}`);
        if (sig.txHash) {
          lines.push(`  Transaction: ${sig.txHash}`);
          lines.push(`  Verify: ${this.getExplorerUrl(sig.txHash)}`);
        }
        if (sig.blockNumber) {
          lines.push(`  Block: #${sig.blockNumber}`);
        }
        lines.push(`  Network: ${sig.network}`);
        lines.push('');
      });
    }

    lines.push(`Verify Online: ${this.generateVerificationUrl(result.documentHash)}`);
    lines.push('');
    lines.push('Legal Disclaimer:');
    lines.push('This certificate is based on blockchain data from the Polygon Amoy');
    lines.push('network. The information represents cryptographically verifiable');
    lines.push('proof that the document with the above hash was signed by the');
    lines.push('listed wallet addresses at the specified times.');

    return lines.join('\n');
  }
}
