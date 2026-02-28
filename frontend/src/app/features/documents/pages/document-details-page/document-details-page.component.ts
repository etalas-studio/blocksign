import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../core/services/api.service';
import { ContractService } from '../../../../core/services/contract.service';
import { QrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { TooltipIconComponent } from '../../../../shared/components/tooltip-icon/tooltip-icon.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { environment } from '../../../../../environments/environment';

interface DocumentSignature {
  signer: string;
  docHash: string;
  timestamp: number;
  txHash: string;
  blockNumber?: number;
  status: 'confirmed' | 'pending' | 'failed';
}

interface DocumentDetails {
  hash: string;
  uploadDate: string;
  fileName?: string;
  fileSize?: number;
  signatures: DocumentSignature[];
}

@Component({
  selector: 'app-document-details-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    QrCodeModalComponent,
    TooltipIconComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="document-details-page">
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-link">← Back to Documents</a>
          <h1>Document Details</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openQRModal()">
            <span>📤</span> Share Verification
          </button>
          <button class="btn btn-outline" (click)="downloadProof()">
            <span>📥</span> Download Proof
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <app-skeleton-loader type="card" height="200px"></app-skeleton-loader>
          <app-skeleton-loader type="card" height="200px"></app-skeleton-loader>
          <app-skeleton-loader type="card" height="200px"></app-skeleton-loader>
        </div>
      } @else if (error()) {
        <app-empty-state
          icon="⚠️"
          title="Error Loading Document"
          [description]="error()!"
          [actionText]="'Go Back'"
          (action)="goBack()"
        />
      } @else if (document()) {
        <div class="details-content">
          <!-- Document Info Card -->
          <div class="card document-info-card">
            <div class="card-header">
              <h2>
                <span class="document-icon">📄</span>
                {{ document()!.fileName || 'Unknown Document' }}
              </h2>
              <span class="badge badge-success">
                {{ document()!.signatures.length }} Signature(s)
              </span>
            </div>
            <div class="document-meta">
              <div class="meta-row">
                <span class="meta-label">File Size:</span>
                <span class="meta-value">{{ formatFileSize(document()!.fileSize) }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Uploaded:</span>
                <span class="meta-value">{{ formatDate(document()!.uploadDate) }}</span>
              </div>
            </div>
          </div>

          <!-- Hash Card -->
          <div class="card hash-card">
            <div class="card-header">
              <h2>
                Document Hash
                <app-tooltip-icon
                  title="Document Hash"
                  content="Unique SHA-256 fingerprint of this document. Any change to the file will result in a completely different hash."
                />
              </h2>
            </div>
            <div class="hash-content">
              <code class="hash-text">{{ document()!.hash }}</code>
              <div class="hash-actions">
                <button class="btn-copy" (click)="copyHash()">📋 Copy</button>
                <a
                  [href]="blockchainExplorerUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-link"
                >
                  🔗 Verify on Blockchain
                </a>
              </div>
            </div>
            @if (hashCopied()) {
              <p class="copied-text">Hash copied to clipboard!</p>
            }
          </div>

          <!-- Signatures Card -->
          <div class="card signatures-card">
            <div class="card-header">
              <h2>
                Blockchain Signatures
                <app-tooltip-icon
                  title="Blockchain Signatures"
                  content="Cryptographic signatures recorded on the blockchain, providing immutable proof of signing."
                />
              </h2>
            </div>

            @if (document()!.signatures.length === 0) {
              <app-empty-state
                icon="✍️"
                title="No Signatures Yet"
                description="This document hasn't been signed on the blockchain yet."
                [actionText]="'Sign Document'"
                (action)="navigateToSign()"
              />
            } @else {
              <div class="signatures-list">
                @for (signature of document()!.signatures; track signature.txHash) {
                  <div class="signature-item">
                    <div class="signature-header">
                      <div class="signer-info">
                        <span class="signer-label">Signer:</span>
                        <code class="signer-address">{{ signature.signer }}</code>
                        <button class="copy-small" (click)="copyAddress(signature.signer)">📋</button>
                      </div>
                      <span class="badge" [class]="getStatusBadgeClass(signature.status)">
                        {{ signature.status }}
                      </span>
                    </div>

                    <div class="signature-details">
                      <div class="detail-row">
                        <span class="detail-label">Signed:</span>
                        <span class="detail-value">{{ formatTimestamp(signature.timestamp) }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Transaction:</span>
                        <code class="tx-hash">{{ signature.txHash }}</code>
                        <a
                          [href]="getTxExplorerUrl(signature.txHash)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="view-link"
                        >
                          View
                        </a>
                      </div>
                      @if (signature.blockNumber) {
                        <div class="detail-row">
                          <span class="detail-label">Block:</span>
                          <span class="detail-value">#{{ signature.blockNumber }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- QR Code Modal -->
      <app-qr-code-modal
        [open]="qrModalOpen()"
        [documentHash]="document()?.hash || ''"
        [verificationUrl]="verificationUrl()"
        (close)="closeQRModal()"
      />
    </div>
  `,
  styles: [`
    .document-details-page {
      padding: var(--spacing-lg);
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-lg);
      gap: var(--spacing-md);
    }

    .header-left h1 {
      margin: var(--spacing-sm) 0 0 0;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 14px;
      transition: color var(--transition-fast);
    }

    .back-link:hover {
      color: var(--color-primary);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .details-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .card-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .document-icon {
      font-size: 20px;
    }

    .document-meta {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .meta-row {
      display: flex;
      gap: var(--spacing-sm);
      font-size: 14px;
    }

    .meta-label {
      color: var(--color-text-secondary);
      font-weight: 500;
      min-width: 80px;
    }

    .meta-value {
      color: var(--color-text-primary);
    }

    .hash-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .hash-text {
      display: block;
      padding: var(--spacing-md);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: monospace;
      font-size: 13px;
      word-break: break-all;
      color: var(--color-text-primary);
    }

    .hash-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .btn-copy {
      padding: 8px 16px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background var(--transition-fast);
    }

    .btn-copy:hover {
      background: var(--color-primary-hover);
    }

    .btn-link {
      padding: 8px 16px;
      color: var(--color-trust-blue);
      text-decoration: none;
      border: 1px solid var(--color-trust-blue);
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      transition: all var(--transition-fast);
    }

    .btn-link:hover {
      background: rgba(37, 99, 235, 0.05);
    }

    .copied-text {
      color: var(--color-success);
      font-size: 13px;
      margin: 0;
    }

    .signatures-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .signature-item {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      background: var(--color-bg);
    }

    .signature-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .signer-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex: 1;
    }

    .signer-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .signer-address {
      font-family: monospace;
      font-size: 13px;
      color: var(--color-text-primary);
    }

    .copy-small {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      opacity: 0.5;
      transition: opacity var(--transition-fast);
    }

    .copy-small:hover {
      opacity: 1;
    }

    .signature-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .detail-row {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
      font-size: 13px;
    }

    .detail-label {
      color: var(--color-text-secondary);
      font-weight: 500;
      min-width: 80px;
    }

    .detail-value {
      color: var(--color-text-primary);
    }

    .tx-hash {
      font-family: monospace;
      font-size: 12px;
      color: var(--color-text-primary);
    }

    .view-link {
      color: var(--color-trust-blue);
      text-decoration: none;
      font-size: 13px;
    }

    .view-link:hover {
      text-decoration: underline;
    }

    .badge-success { background: rgba(22, 163, 74, 0.1); color: var(--color-success); }
    .badge-pending { background: rgba(250, 204, 21, 0.1); color: var(--color-warning); }
    .badge-failed { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions .btn {
        flex: 1;
      }

      .signature-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }
    }
  `]
})
export class DocumentDetailsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private contractService = inject(ContractService);
  private destroyRef = inject(DestroyRef);

  document = signal<DocumentDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  hashCopied = signal(false);
  qrModalOpen = signal(false);

  verificationUrl = computed(() => {
    const hash = this.document()?.hash;
    return `${window.location.origin}/verify/${hash}`;
  });

  blockchainExplorerUrl = computed(() => {
    const hash = this.document()?.hash;
    return `${environment.blockExplorerUrl}/search?q=${hash}`;
  });

  ngOnInit(): void {
    const hash = this.route.snapshot.paramMap.get('hash');
    if (hash) {
      this.loadDocumentDetails(hash);
    } else {
      this.error.set('Document hash not provided');
      this.loading.set(false);
    }
  }

  loadDocumentDetails(hash: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Use getDocumentDetails instead of getDocumentByHash
    this.apiService.getDocumentDetails(hash)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          // Load blockchain signatures with the document info
          this.loadBlockchainSignatures(hash, data);
        },
        error: (err) => {
          console.error('Error loading document:', err);
          this.error.set('Failed to load document details');
          this.loading.set(false);
        }
      });
  }

  loadBlockchainSignatures(hash: string, apiData?: any): void {
    this.contractService.getSignatures(hash).then((signatures) => {
      const docDetails: DocumentDetails = {
        hash,
        uploadDate: apiData?.uploaded_at || new Date().toISOString(),
        fileName: apiData?.name,
        fileSize: apiData?.file_size,
        signatures: signatures.map(sig => ({
          signer: sig.signer,
          docHash: sig.docHash,
          timestamp: Number(sig.timestamp),
          txHash: '0x' + sig.signature.slice(0, 40),
          status: 'confirmed'
        }))
      };

      this.document.set(docDetails);
      this.loading.set(false);
    }).catch((err) => {
      console.error('Error loading signatures:', err);
      // Even if signatures fail to load, show the document info from API
      this.document.set({
        hash,
        uploadDate: apiData?.uploaded_at || new Date().toISOString(),
        fileName: apiData?.name,
        fileSize: apiData?.file_size,
        signatures: []
      });
      this.loading.set(false);
    });
  }

  getTxExplorerUrl(txHash: string): string {
    return `${environment.blockExplorerUrl}/tx/${txHash}`;
  }

  openQRModal(): void {
    this.qrModalOpen.set(true);
  }

  closeQRModal(): void {
    this.qrModalOpen.set(false);
  }

  copyHash(): void {
    const hash = this.document()?.hash;
    if (hash) {
      navigator.clipboard.writeText(hash);
      this.hashCopied.set(true);
      setTimeout(() => this.hashCopied.set(false), 2000);
    }
  }

  copyAddress(address: string): void {
    navigator.clipboard.writeText(address);
  }

  downloadProof(): void {
    const doc = this.document();
    if (!doc) return;

    const proof = {
      documentHash: doc.hash,
      fileName: doc.fileName,
      uploadDate: doc.uploadDate,
      signatures: doc.signatures.map(sig => ({
        signer: sig.signer,
        timestamp: sig.timestamp,
        txHash: sig.txHash,
        blockNumber: sig.blockNumber
      })),
      verifiedAt: new Date().toISOString(),
      network: 'Polygon Amoy Testnet',
      contractAddress: environment.contractAddress
    };

    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocksign-proof-${doc.hash.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  navigateToSign(): void {
    this.router.navigate(['/sign']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  getStatusBadgeClass(status: string): string {
    return `badge-${status}`;
  }
}
