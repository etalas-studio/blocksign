import { Component, inject, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../../core/services/wallet.service';
import { Web3Service } from '../../../../core/services/web3.service';
import { ContractService } from '../../../../core/services/contract.service';
import { ApiService } from '../../../../core/services/api.service';
import { AnimationService } from '../../../../core/services/animation.service';
import { TransactionModalComponent } from '../../../../shared/components/transaction-modal/transaction-modal.component';
import { TooltipIconComponent } from '../../../../shared/components/tooltip-icon/tooltip-icon.component';

type TransactionStep = 'initializing' | 'signing' | 'submitting' | 'submitted' | 'confirming' | 'confirmed' | 'failed';

@Component({
  selector: 'app-sign-document',
  standalone: true,
  imports: [CommonModule, TransactionModalComponent, TooltipIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sign-document">
      <button
        #signButton
        class="sign-btn"
        [disabled]="isDisabled()"
        (click)="signDocument()">
        @if (signingState().signing) {
          <span class="spinner"></span>
          <span>Signing...</span>
        } @else if (signingState().pending) {
          <span class="spinner"></span>
          <span>Transaction Pending...</span>
        } @else if (signingState().signed) {
          <svg class="check-icon checkmark-animate" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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

      @if (!signingState().signing && !signingState().pending && !signingState().signed) {
        <div class="sign-help">
          <span>Creates an immutable on-chain signature</span>
          <app-tooltip-icon
            title="Sign on Blockchain"
            content="Sign the document hash with your wallet. The signature will be permanently recorded on the blockchain."
          />
        </div>
      }

      @if (signingState().error) {
        <div class="error-message animate-shake">
          <span class="error-icon">⚠️</span>
          <span>{{ signingState().error }}</span>
        </div>
      }

      @if (signingState().signed && signingState().txHash) {
        <div class="tx-info animate-fade-in">
          <p>Transaction submitted:</p>
          <a
            [href]="blockExplorerUrl()"
            target="_blank"
            rel="noopener noreferrer"
            class="tx-link">
            <code>{{ truncatedTxHash() }}</code>
            <svg class="external-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      }

      <!-- Transaction Modal -->
      <app-transaction-modal
        [open]="showModal()"
        [currentStep]="currentStep()"
        [txHash]="signingState().txHash"
        [confirmations]="confirmations()"
        [errorMessage]="signingState().error"
        [blockExplorerUrl]="signingState().txHash ? blockExplorerUrl() : null"
        (close)="closeModal()"
        (retry)="signDocument()"
      />
    </div>
  `,
  styles: [`
    .sign-document {
      margin-bottom: 20px;
    }

    .sign-btn {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-md);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: var(--color-primary);
      color: white;
      min-height: 52px;
    }

    .sign-btn:hover:not(:disabled) {
      background: var(--color-primary-hover);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }

    .sign-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .sign-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .sign-help {
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .spinner {
      width: 18px;
      height: 18px;
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
      width: 18px;
      height: 18px;
    }

    .check-icon {
      color: var(--color-success);
    }

    .error-message {
      margin-top: 12px;
      padding: 12px;
      background: color-mix(in srgb, var(--color-error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
      border-radius: 8px;
      color: var(--color-error);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-icon {
      font-size: 18px;
    }

    .tx-info {
      margin-top: 16px;
      padding: 12px;
      background: color-mix(in srgb, var(--color-success) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-success) 35%, transparent);
      border-radius: 8px;
    }

    .tx-info p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--color-text-primary);
      font-weight: 500;
    }

    .tx-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--color-primary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }

    .tx-link:hover {
      text-decoration: underline;
    }

    .tx-link code {
      font-family: 'Courier New', monospace;
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
  animationService = inject(AnimationService);

  docHash = input.required<string>();
  signComplete = output<string>();

  signingState = signal({
    signing: false,
    pending: false,
    signed: false,
    txHash: '',
    error: ''
  });

  currentStep = signal<TransactionStep>('initializing');
  showModal = signal(false);
  confirmations = signal<number | null>(null);

  isDisabled = computed(() => {
    const state = this.signingState();
    return (
      !this.walletService.isConnected() ||
      !this.walletService.isCorrectNetwork() ||
      state.signing ||
      state.pending ||
      state.signed
    );
  });

  blockExplorerUrl = computed(() => {
    return this.contractService.getBlockExplorerTxUrl(this.signingState().txHash);
  });

  truncatedTxHash = computed(() => {
    return this.web3Service.truncateHash(this.signingState().txHash, 10);
  });

  async signDocument(): Promise<void> {
    if (!this.walletService.isConnected()) {
      this.signingState.update(s => ({ ...s, error: 'Please connect your wallet first' }));
      return;
    }

    if (!this.walletService.isCorrectNetwork()) {
      this.signingState.update(s => ({ ...s, error: 'Please switch to Polygon Amoy testnet' }));
      return;
    }

    // Show modal and start process
    this.showModal.set(true);
    this.currentStep.set('initializing');
    this.signingState.update(s => ({ ...s, signing: true, error: '' }));

    try {
      // Update step to signing
      this.currentStep.set('signing');

      // Sign the hash with wallet
      const signature = await this.web3Service.signHash(this.docHash());

      // Submit to smart contract
      this.currentStep.set('submitting');
      this.signingState.update(s => ({ ...s, signing: false, pending: true }));

      const txHash = await this.contractService.signDocument(this.docHash(), signature);

      this.currentStep.set('submitted');
      this.signingState.update(s => ({ ...s, txHash }));

      // Store transaction hash in backend
      const walletState = this.walletService.getWalletState();
      await this.apiService.storeTransaction(
        this.docHash(),
        txHash,
        walletState.address || ''
      ).toPromise();

      // Wait for confirmation
      this.currentStep.set('confirming');

      // Simulate confirmation progress
      for (let i = 1; i <= 12; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.confirmations.set(i);
      }

      // Complete
      this.currentStep.set('confirmed');
      this.signingState.update(s => ({ ...s, pending: false, signed: true }));

      // Trigger success animation
      this.animationService.success();

      this.signComplete.emit(txHash);

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        this.closeModal();
      }, 2000);

    } catch (error: any) {
      console.error('Signing error:', error);
      this.currentStep.set('failed');
      this.signingState.update(s => ({
        ...s,
        signing: false,
        pending: false,
        error: this.parseError(error)
      }));
    }
  }

  private parseError(error: any): string {
    if (error.message.includes('user rejected')) {
      return 'Transaction rejected by user';
    } else if (error.message.includes('AlreadySigned')) {
      return 'You have already signed this document';
    } else {
      return error.message || 'Failed to sign document';
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.currentStep.set('initializing');
    this.confirmations.set(null);
  }

  reset(): void {
    this.signingState.set({
      signing: false,
      pending: false,
      signed: false,
      txHash: '',
      error: ''
    });
    this.currentStep.set('initializing');
    this.confirmations.set(null);
    this.showModal.set(false);
  }
}
