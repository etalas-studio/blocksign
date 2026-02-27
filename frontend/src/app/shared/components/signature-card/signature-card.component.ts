import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VerificationService, SignatureRecord } from '../../../core/services/verification.service';
import { QrCodeModalComponent } from '../qr-code-modal/qr-code-modal.component';

@Component({
  selector: 'app-signature-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signature-card">
      <!-- Signer Header -->
      <div class="signature-header">
        <div class="signer-info">
          <span class="signer-icon">👤</span>
          <div class="signer-details">
            <div class="signer-address" [title]="signature().signer">
              {{ formattedSigner().signerShort }}
            </div>
            <div class="signer-badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>
              </svg>
              Verified Signer
            </div>
          </div>
        </div>
        <button class="copy-btn" (click)="copyAddress()" [title]="copied ? 'Copied!' : 'Copy address'">
          @if (!copied) {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
        </button>
      </div>

      <!-- Signature Details -->
      <div class="signature-details">
        <div class="detail-row">
          <span class="detail-label">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Date & Time
          </span>
          <span class="detail-value" [title]="formattedSigner().date + ' at ' + formattedSigner().time">
            {{ formattedSigner().relativeTime }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Network
          </span>
          <span class="detail-value network-badge">
            {{ signature().network }}
          </span>
        </div>

        @if (signature().txHash) {
          <div class="detail-row">
            <span class="detail-label">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Transaction
            </span>
            <a
              class="detail-value tx-link"
              [href]="explorerUrl()"
              target="_blank"
              rel="noopener noreferrer"
              title="View on block explorer"
            >
              {{ truncatedTxHash() }}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        }

        @if (signature().blockNumber) {
          <div class="detail-row">
            <span class="detail-label">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              Block
            </span>
            <span class="detail-value">
              #{{ signature().blockNumber }}
            </span>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="signature-actions">
        <button class="action-btn secondary" (click)="viewOnExplorer()" *ngIf="signature().txHash">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          View Transaction
        </button>

        <button class="action-btn secondary" (click)="copySignatureData()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Copy Data
        </button>
      </div>
    </div>
  `,
  styles: [`
    .signature-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      transition: all var(--transition-base);
    }

    .signature-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
    }

    .signature-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .signer-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .signer-icon {
      font-size: 32px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg);
      border-radius: var(--radius-md);
    }

    .signer-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .signer-address {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .signer-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: rgba(34, 197, 94, 0.1);
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 500;
      color: var(--color-success);
    }

    .signer-badge svg {
      width: 12px;
      height: 12px;
    }

    .copy-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .copy-btn:hover {
      background: var(--color-bg);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .copy-btn.copied {
      background: var(--color-success);
      border-color: var(--color-success);
      color: white;
    }

    .copy-btn svg {
      width: 18px;
      height: 18px;
    }

    .signature-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .detail-label svg {
      width: 14px;
      height: 14px;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
      text-align: right;
    }

    .detail-value.network-badge {
      padding: 2px 8px;
      background: var(--color-primary-light, rgba(34, 197, 94, 0.1));
      border-radius: var(--radius-sm);
      color: var(--color-primary);
      font-size: 11px;
    }

    .tx-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--color-trust-blue);
      text-decoration: none;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      transition: all var(--transition-base);
    }

    .tx-link:hover {
      text-decoration: underline;
    }

    .tx-link svg {
      width: 14px;
      height: 14px;
    }

    .signature-actions {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border);
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .action-btn:hover {
      background: var(--color-bg-card);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .action-btn svg {
      width: 14px;
      height: 14px;
    }

    @media (max-width: 640px) {
      .signature-card {
        padding: 16px;
      }

      .signature-header {
        flex-direction: column;
        gap: 12px;
      }

      .signer-info {
        width: 100%;
      }

      .copy-btn {
        align-self: flex-end;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .detail-value {
        text-align: left;
      }

      .signature-actions {
        flex-direction: column;
      }
    }
  `]
})
export class SignatureCardComponent {
  private router = inject(Router);
  private verificationService = inject(VerificationService);

  signature = input.required<SignatureRecord>();
  copy = output<string>();

  copied = false;
  copyTimeout: any;

  formattedSigner = computed(() => {
    return this.verificationService.formatSignatureRecord(this.signature());
  });

  explorerUrl = computed(() => {
    const txHash = this.signature().txHash;
    const address = this.signature().signer;
    return this.verificationService.getExplorerUrl(txHash || undefined, address);
  });

  // Computed truncated tx hash for display
  truncatedTxHash = computed(() => {
    const txHash = this.signature().txHash;
    if (!txHash) return '';
    return txHash.slice(0, 10) + '...' + txHash.slice(-8);
  });

  copyAddress(): void {
    const address = this.signature().signer;
    this.copyToClipboard(address);
    this.copied = true;

    clearTimeout(this.copyTimeout);
    this.copyTimeout = setTimeout(() => {
      this.copied = false;
    }, 2000);

    this.copy.emit(address);
  }

  copySignatureData(): void {
    const data = JSON.stringify(this.signature(), null, 2);
    this.copyToClipboard(data);
  }

  viewOnExplorer(): void {
    if (this.signature().txHash) {
      window.open(this.explorerUrl(), '_blank', 'noopener,noreferrer');
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}
