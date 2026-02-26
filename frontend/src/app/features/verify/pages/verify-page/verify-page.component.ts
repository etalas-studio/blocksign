import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../../core/services/wallet.service';

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'tampered' | 'not_found';

interface VerificationResult {
  status: VerificationStatus;
  documentName?: string;
  documentHash?: string;
  signerAddress?: string;
  timestamp?: string;
  txHash?: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-verify-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verify-page">
      <!-- Page Header -->
      <div class="page-header">
        <h1>Document Verification</h1>
        <p>Verify the authenticity and integrity of documents on the blockchain</p>
      </div>

      <!-- Verification Card -->
      <div class="verify-card">
        <div class="verify-header">
          <svg class="verify-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>
          </svg>
          <h2>Verify Document</h2>
        </div>

        <div class="verify-body">
          <!-- Input Method Tabs -->
          <div class="input-tabs">
            <button class="tab-btn" [class.active]="inputMethod === 'hash'" (click)="inputMethod = 'hash'">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Paste Hash
            </button>
            <button class="tab-btn" [class.active]="inputMethod === 'file'" (click)="inputMethod = 'file'">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload Document
            </button>
          </div>

          <!-- Hash Input -->
          @if (inputMethod === 'hash') {
            <div class="hash-input-section">
              <label for="hashInput">Document Hash</label>
              <input
                id="hashInput"
                type="text"
                class="hash-input"
                placeholder="0x..."
                [value]="documentHash"
                (input)="documentHash = $any($event.target).value"
                [disabled]="verificationResult.status === 'verifying'"
              />
              <p class="input-hint">Enter the full document hash (SHA-256)</p>
            </div>
          }

          <!-- File Upload -->
          @if (inputMethod === 'file') {
            <div class="file-upload-section">
              <label for="fileInput">Upload Document</label>
              <div class="file-drop-zone" (click)="fileInput.click()" (dragover)="handleDragOver($event)" (drop)="handleDrop($event)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Drag and drop or click to upload</p>
                <span class="file-name" *ngIf="selectedFile">{{ selectedFile.name }}</span>
              </div>
              <input #fileInput type="file" (change)="handleFileSelect($event)" class="hidden-input" />
            </div>
          }

          <!-- Verify Button -->
          <button
            class="verify-btn btn btn-primary"
            [disabled]="!canVerify() || verificationResult.status === 'verifying'"
            (click)="verifyDocument()"
          >
            @if (verificationResult.status === 'verifying') {
              <svg class="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
              Verifying...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Verify on Blockchain
            }
          </button>
        </div>
      </div>

      <!-- Verification Result -->
      @if (verificationResult.status !== 'idle') {
        <div class="result-card" [ngClass]="'result-' + verificationResult.status">
          <div class="result-header">
            @switch (verificationResult.status) {
              @case ('verified') {
                <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3>Document Verified</h3>
              }
              @case ('tampered') {
                <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <h3>Document Tampered</h3>
              }
              @case ('not_found') {
                <svg class="result-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>Document Not Found</h3>
              }
            }
          </div>

          @if (verificationResult.status === 'verified') {
            <div class="result-details">
              <div class="detail-row">
                <span class="detail-label">Document Name</span>
                <span class="detail-value">{{ verificationResult.documentName }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Document Hash</span>
                <span class="detail-value hash">{{ verificationResult.documentHash }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Signer Address</span>
                <span class="detail-value address">{{ verificationResult.signerAddress }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Timestamp</span>
                <span class="detail-value">{{ verificationResult.timestamp }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction Hash</span>
                <span class="detail-value hash">{{ verificationResult.txHash }}</span>
              </div>
            </div>
          }

          @if (verificationResult.status === 'tampered') {
            <div class="result-message error">
              <p>This document has been modified since it was signed.</p>
              <p class="error-detail">{{ verificationResult.errorMessage }}</p>
            </div>
          }

          @if (verificationResult.status === 'not_found') {
            <div class="result-message error">
              <p>This document was not found on the blockchain.</p>
              <p class="error-detail">{{ verificationResult.errorMessage || 'The document hash does not match any registered documents.' }}</p>
            </div>
          }

          <button class="reset-btn" (click)="resetVerification()">
            Verify Another Document
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .verify-page {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .page-header p {
      margin: 0;
      font-size: 15px;
      color: var(--color-text-secondary);
    }

    .verify-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 32px;
      margin-bottom: 24px;
    }

    .verify-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }

    .verify-icon {
      width: 48px;
      height: 48px;
      color: var(--color-primary);
    }

    .verify-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .input-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .tab-btn:hover {
      background: var(--color-bg-card);
      border-color: var(--color-text-muted);
    }

    .tab-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .tab-btn svg {
      width: 20px;
      height: 20px;
    }

    .hash-input-section, .file-upload-section {
      margin-bottom: 24px;
    }

    .hash-input-section label, .file-upload-section label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }

    .hash-input {
      width: 100%;
      padding: 12px 16px;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all var(--transition-base);
    }

    .hash-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .input-hint {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: var(--color-text-muted);
    }

    .file-drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      background: var(--color-bg);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .file-drop-zone:hover {
      border-color: var(--color-primary);
      background: rgba(34, 197, 94, 0.02);
    }

    .file-drop-zone.drag-over {
      border-color: var(--color-primary);
      background: rgba(34, 197, 94, 0.05);
    }

    .file-drop-zone svg {
      width: 48px;
      height: 48px;
      color: var(--color-text-muted);
      margin-bottom: 16px;
    }

    .file-drop-zone p {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .file-name {
      margin-top: 12px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-primary);
    }

    .hidden-input {
      display: none;
    }

    .verify-btn {
      width: 100%;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 600;
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .result-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 32px;
    }

    .result-verified {
      border-color: var(--color-success);
      background: rgba(22, 163, 74, 0.02);
    }

    .result-tampered, .result-not_found {
      border-color: var(--color-error);
      background: rgba(239, 68, 68, 0.02);
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .result-icon {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }

    .result-verified .result-icon {
      color: var(--color-success);
    }

    .result-tampered .result-icon,
    .result-not_found .result-icon {
      color: var(--color-error);
    }

    .result-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .result-verified h3 {
      color: var(--color-success);
    }

    .result-tampered h3,
    .result-not_found h3 {
      color: var(--color-error);
    }

    .result-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
    }

    .detail-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      text-align: right;
    }

    .detail-value.hash {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: var(--color-trust-blue);
    }

    .detail-value.address {
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .result-message {
      padding: 20px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
      margin-bottom: 24px;
    }

    .result-message p {
      margin: 0 0 8px 0;
      font-size: 14px;
    }

    .result-message p:last-child {
      margin-bottom: 0;
    }

    .error-detail {
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .reset-btn {
      width: 100%;
      padding: 12px 24px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .reset-btn:hover {
      background: var(--color-bg-card);
      border-color: var(--color-text-muted);
    }
  `]
})
export class VerifyPageComponent {
  walletService = inject(WalletService);

  inputMethod: 'hash' | 'file' = 'hash';
  documentHash = '';
  selectedFile: File | null = null;
  verificationResult: VerificationResult = { status: 'idle' };

  canVerify(): boolean {
    if (this.inputMethod === 'hash') {
      return this.documentHash.length > 0;
    }
    return this.selectedFile !== null;
  }

  verifyDocument(): void {
    this.verificationResult = { status: 'verifying' };

    // Simulate verification delay
    setTimeout(() => {
      // In real app, this would call backend API
      // For now, return a mock result
      this.verificationResult = {
        status: 'verified',
        documentName: 'Employment Contract.pdf',
        documentHash: this.documentHash || '0xA82F91CD1234567890...',
        signerAddress: '0x71C...A92F',
        timestamp: '2025-02-26 14:22:15',
        txHash: '0xdef456...abc123'
      };
    }, 2000);
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  resetVerification(): void {
    this.verificationResult = { status: 'idle' };
    this.documentHash = '';
    this.selectedFile = null;
  }
}
