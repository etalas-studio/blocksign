import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../../core/services/wallet.service';
import { Web3Service } from '../../../../core/services/web3.service';
import { ContractService } from '../../../../core/services/contract.service';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-sign-document',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sign-document">
      <button
        class="sign-btn"
        [disabled]="isDisabled"
        (click)="signDocument()">
        @if (signingState.signing) {
          <span class="spinner"></span>
          <span>Signing...</span>
        } @else if (signingState.pending) {
          <span class="spinner"></span>
          <span>Transaction Pending...</span>
        } @else if (signingState.signed) {
          <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <span>Document Signed!</span>
        } @else {
          <svg class="sign-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
          </svg>
          <span>Sign Document</span>
        }
      </button>

      @if (signingState.error) {
        <div class="error-message">
          {{ signingState.error }}
        </div>
      }

      @if (signingState.txHash) {
        <div class="tx-info">
          <p>Transaction submitted:</p>
          <a
            [href]="blockExplorerUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="tx-link">
            {{ truncatedTxHash }}
            <svg class="external-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .sign-document {
      margin-bottom: 20px;
    }

    .sign-btn {
      width: 100%;
      padding: 16px 24px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .sign-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .sign-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sign-icon,
    .check-icon {
      width: 24px;
      height: 24px;
    }

    .check-icon {
      color: #10b981;
    }

    .error-message {
      margin-top: 12px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #991b1b;
      font-size: 14px;
    }

    .tx-info {
      margin-top: 16px;
      padding: 12px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
    }

    .tx-info p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #166534;
      font-weight: 500;
    }

    .tx-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #667eea;
      text-decoration: none;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: 600;
    }

    .tx-link:hover {
      text-decoration: underline;
    }

    .external-icon {
      width: 16px;
      height: 16px;
    }
  `]
})
export class SignDocumentComponent {
  walletService = inject(WalletService);
  web3Service = inject(Web3Service);
  contractService = inject(ContractService);
  apiService = inject(ApiService);

  docHash = input.required<string>();
  signComplete = output<string>();

  signingState = {
    signing: false,
    pending: false,
    signed: false,
    txHash: '',
    error: ''
  };

  get isDisabled(): boolean {
    return (
      !this.walletService.isConnected() ||
      !this.walletService.isCorrectNetwork() ||
      this.signingState.signing ||
      this.signingState.pending ||
      this.signingState.signed
    );
  }

  get blockExplorerUrl(): string {
    return this.contractService.getBlockExplorerTxUrl(this.signingState.txHash);
  }

  get truncatedTxHash(): string {
    return this.web3Service.truncateHash(this.signingState.txHash, 10);
  }

  async signDocument(): Promise<void> {
    if (!this.walletService.isConnected()) {
      this.signingState.error = 'Please connect your wallet first';
      return;
    }

    if (!this.walletService.isCorrectNetwork()) {
      this.signingState.error = 'Please switch to Polygon Amoy testnet';
      return;
    }

    this.signingState.signing = true;
    this.signingState.error = '';

    try {
      // Sign the hash with wallet
      const signature = await this.web3Service.signHash(this.docHash());

      // Submit to smart contract
      this.signingState.signing = false;
      this.signingState.pending = true;

      const txHash = await this.contractService.signDocument(this.docHash(), signature);
      this.signingState.txHash = txHash;

      // Store transaction hash in backend
      const walletState = this.walletService.getWalletState();
      await this.apiService.storeTransaction(
        this.docHash(),
        txHash,
        walletState.address || ''
      ).toPromise();

      this.signingState.pending = false;
      this.signingState.signed = true;

      this.signComplete.emit(txHash);
    } catch (error: any) {
      this.signingState.signing = false;
      this.signingState.pending = false;

      if (error.message.includes('user rejected')) {
        this.signingState.error = 'Transaction rejected by user';
      } else if (error.message.includes('AlreadySigned')) {
        this.signingState.error = 'You have already signed this document';
      } else {
        this.signingState.error = error.message || 'Failed to sign document';
      }
    }
  }

  reset(): void {
    this.signingState = {
      signing: false,
      pending: false,
      signed: false,
      txHash: '',
      error: ''
    };
  }
}
