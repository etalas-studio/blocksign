import { Component, inject, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VerificationService, VerificationResult, VerificationStatus, SignatureRecord } from '../../../../core/services/verification.service';
import { DocumentHasherService } from '../../../../core/services/document-hasher.service';
import { ProofDownloadService } from '../../../../core/services/proof-download.service';
import { SignatureCardComponent } from '../../../../shared/components/signature-card/signature-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfettiService } from '../../../../core/services/confetti.service';

type TabType = 'hash' | 'file';

@Component({
  selector: 'app-verify-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SignatureCardComponent, EmptyStateComponent],
  template: `
    <div class="verify-page">
      <!-- Page Header -->
      <div class="page-header">
        <h1>Document Verification</h1>
        <p>Verify the authenticity and integrity of documents on the blockchain</p>
      </div>

      <!-- Verification Card -->
      @if (!result || showInput) {
        <div class="verify-card">
          <div class="verify-header">
            <svg class="verify-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>
            </svg>
            <div class="verify-title">
              <h2>Verify Document</h2>
            </div>
          </div>

          <div class="verify-body">
            <!-- Input Method Tabs -->
            <div class="input-tabs">
              <button type="button" class="tab-btn" [class.active]="inputMethod === 'hash'" (click)="setInputMethod('hash')">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Paste Hash
              </button>
              <button type="button" class="tab-btn" [class.active]="inputMethod === 'file'" (click)="setInputMethod('file')">
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
                  [disabled]="verificationState.state === 'hashing' || verificationState.state === 'querying'"
                />
                <p class="input-hint">Enter the full document hash (SHA-256)</p>
              </div>
            }

            <!-- File Upload -->
            @if (inputMethod === 'file') {
              <div class="file-upload-section">
                <label for="fileInput">Upload Document</label>
                <div
                  class="file-drop-zone"
                  (click)="fileInput.click()"
                  (dragover)="handleDragOver($event)"
                  (dragleave)="handleDragLeave($event)"
                  (drop)="handleDrop($event)"
                  [class.drag-over]="isDragOver"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>Drag and drop or click to upload</p>
                  <span class="file-name" *ngIf="selectedFile">
                    {{ selectedFile.name }}
                    <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
                  </span>
                </div>
                <input #fileInput type="file" (change)="handleFileSelect($event)" class="hidden-input" />
              </div>
            }

            <!-- Progress Display -->
            @if (verificationState.state === 'hashing' || verificationState.state === 'querying') {
              <div class="progress-section">
                <div class="progress-header">
                  <svg class="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                  </svg>
                  <span class="progress-text">{{ progressText }}</span>
                </div>
                @if (verificationState.progress !== undefined) {
                  <div
                    class="progress-bar"
                    role="progressbar"
                    aria-label="Verification progress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    [attr.aria-valuenow]="progressValue()"
                  >
                    <div class="progress-fill" [style.transform]="'scaleX(' + (progressValue() / 100) + ')'" aria-hidden="true"></div>
                  </div>
                  <p class="progress-percentage">{{ progressValue() }}%</p>
                }
              </div>
            }

            <!-- Verify Button -->
            <button
              type="button"
              class="verify-btn"
              [disabled]="!canVerify() || isVerifying"
              (click)="verifyDocument()"
            >
              @if (isVerifying) {
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
      }

      <!-- Verification Result -->
      @if (result && !showInput) {
        <div class="result-section">
          <!-- Status Banner -->
          <div class="status-banner" [ngClass]="'status-' + statusDisplay().color">
            <div class="status-icon">
              @if (statusDisplay().icon === 'shield-check') {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              } @else if (statusDisplay().icon === 'alert-triangle') {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              }
            </div>
            <div class="status-content">
              <h3>{{ statusDisplay().title }}</h3>
              <p>{{ statusDisplay().description }}</p>
            </div>
          </div>

          <!-- Document Information -->
          <div class="info-card">
            <div class="info-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Document Information
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Document Hash</span>
                <span class="info-value hash" [title]="result.documentHash">
                  {{ truncateHash(result.documentHash) }}
                  <button class="copy-icon" (click)="copyToClipboard(result.documentHash)" title="Copy full hash">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </span>
              </div>

              @if (result.documentName) {
                <div class="info-item">
                  <span class="info-label">Document Name</span>
                  <span class="info-value">{{ result.documentName }}</span>
                </div>
              }

              @if (result.fileSize) {
                <div class="info-item">
                  <span class="info-label">File Size</span>
                  <span class="info-value">{{ formatFileSize(result.fileSize) }}</span>
                </div>
              }

              <div class="info-item">
                <span class="info-label">Verification Date</span>
                <span class="info-value">{{ result.verificationDate | date:'medium' }}</span>
              </div>

              @if (result.verified) {
                <div class="info-item">
                  <span class="info-label">Total Signatures</span>
                  <span class="info-value signature-count">{{ result.totalSignatures }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Blockchain Signatures -->
          @if (result.verified && result.signatures.length > 0) {
            <div class="signatures-section">
              <div class="section-header">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                Blockchain Signatures ({{ result.totalSignatures }})
              </div>

              <div class="signatures-list">
                @for (sig of result.signatures; track sig.signer) {
                  <app-signature-card [signature]="sig" (copy)="handleCopy($event)" />
                }
              </div>

              <!-- Date Range -->
              @if (result.firstSignatureDate && result.lastSignatureDate) {
                <div class="date-range">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>
                    Signature period:
                    <strong>{{ result.firstSignatureDate | date:'mediumDate' }}</strong>
                    to
                    <strong>{{ result.lastSignatureDate | date:'mediumDate' }}</strong>
                  </span>
                </div>
              }
            </div>
          }

          <!-- Not Found Message -->
          @if (!result.verified && result.signatures.length === 0) {
            <app-empty-state
              icon="🔍"
              title="No Signatures Found"
              description="This document has not been signed on BlockSign. Make sure you have the correct file or contact the document sender."
              actionText="Try Another Document"
              (action)="resetVerification()"
            />
          }

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="action-btn secondary" (click)="shareVerification()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>

            <button class="action-btn secondary" (click)="copyLink()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Copy Link
            </button>

            @if (result.verified) {
              <button class="action-btn secondary" (click)="downloadProof('json')">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download JSON
              </button>

              <button class="action-btn primary" (click)="downloadProof('pdf')">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Download Certificate
              </button>
            }

            <button class="action-btn secondary" (click)="resetVerification()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Verify Another
            </button>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (errorMessage) {
        <div class="error-banner">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ errorMessage }}</span>
          <button class="close-btn" (click)="errorMessage = ''">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .verify-page {
      max-width: 760px;
      margin: 0 auto;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .page-header p {
      margin: 0;
      color: var(--color-text-secondary);
    }

    .verify-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }

    .verify-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .verify-icon {
      width: 24px;
      height: 24px;
      color: var(--color-primary);
    }

    .verify-title h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .input-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 13px;
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
      width: 16px;
      height: 16px;
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
      box-shadow: var(--shadow-sm);
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
      padding: 24px 16px;
      background: var(--color-bg);
      border: 1px dashed var(--color-border);
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
      width: 24px;
      height: 24px;
      color: var(--color-text-muted);
      margin-bottom: 8px;
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

    .file-size {
      color: var(--color-text-muted);
      font-weight: 400;
    }

    .hidden-input {
      display: none;
    }

    .progress-section {
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);
    }

    .progress-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .progress-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .progress-bar {
      height: 10px;
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1px solid var(--color-border);
      contain: paint;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
      transform-origin: left center;
      transition: transform 0.24s linear;
      will-change: transform;
    }

    .progress-percentage {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: var(--color-text-muted);
      text-align: right;
    }

    .verify-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      color: white;
      cursor: pointer;
      transition: background var(--transition-base);
    }

    .verify-btn svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .verify-btn:hover:not(:disabled) {
      background: var(--color-primary-hover);
    }

    .verify-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .verify-btn .spinner {
      color: white;
    }

    .spinner {
      animation: spin 1s linear infinite;
      width: 18px;
      height: 18px;
      color: var(--color-primary);
      flex-shrink: 0;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .result-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .status-banner {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 24px;
      border-radius: var(--radius-lg);
      border: 2px solid;
    }

    .status-banner.status-success {
      background: rgba(22, 163, 74, 0.1);
      border-color: var(--color-success);
    }

    .status-banner.status-warning {
      background: rgba(251, 191, 36, 0.1);
      border-color: var(--color-warning);
    }

    .status-banner.status-error {
      background: rgba(239, 68, 68, 0.1);
      border-color: var(--color-error);
    }

    .status-icon {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }

    .status-success .status-icon {
      color: var(--color-success);
    }

    .status-warning .status-icon {
      color: var(--color-warning);
    }

    .status-error .status-icon {
      color: var(--color-error);
    }

    .status-content h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .status-success h3 {
      color: var(--color-success);
    }

    .status-warning h3 {
      color: var(--color-warning);
    }

    .status-error h3 {
      color: var(--color-error);
    }

    .status-content p {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .info-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .info-header svg {
      width: 24px;
      height: 24px;
      color: var(--color-primary);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      word-break: break-word;
    }

    .info-value.hash {
      font-family: 'Courier New', monospace;
      color: var(--color-trust-blue);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-value.signature-count {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-success);
    }

    .copy-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: color var(--transition-base);
    }

    .copy-icon:hover {
      color: var(--color-primary);
    }

    .signatures-section {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .section-header svg {
      width: 24px;
      height: 24px;
      color: var(--color-success);
    }

    .signatures-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .date-range svg {
      width: 20px;
      height: 20px;
      color: var(--color-primary);
    }

    .date-range strong {
      color: var(--color-text-primary);
    }

    .action-buttons {
      display: flex;
      flex-wrap: nowrap;
      gap: 10px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-weight: 500;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all var(--transition-base);
      white-space: nowrap;
    }

    .action-btn:hover {
      background: var(--color-bg);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .action-btn.primary {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .action-btn.primary:hover {
      background: #22c55e;
      border-color: #22c55e;
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--color-error);
      border-radius: var(--radius-md);
      color: var(--color-error);
      font-size: 14px;
    }

    .error-banner svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .error-banner span {
      flex: 1;
    }

    .close-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      flex-shrink: 0;
    }

    @media (max-width: 640px) {
      .page-header h1 {
        font-size: 24px;
      }

      .verify-card {
        padding: 24px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-wrap: wrap;
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }
    }
  `]
})
export class VerifyPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private verificationService = inject(VerificationService);
  private hasherService = inject(DocumentHasherService);
  private proofService = inject(ProofDownloadService);
  private confettiService = inject(ConfettiService);
  private destroyRef = inject(DestroyRef);

  inputMethod: TabType = 'hash';
  documentHash = '';
  selectedFile: File | null = null;
  isDragOver = false;
  isVerifying = false;
  showInput = true;
  errorMessage = '';

  result: VerificationResult | null = null;
  verificationState: VerificationStatus = { state: 'idle' };

  progressText = '';
  copiedAddress = '';
  showCopiedToast = false;

  statusDisplay = computed(() => {
    if (!this.result) {
      return { icon: '', title: '', description: '', color: 'success' as const };
    }
    return this.verificationService.getStatusDisplay(this.result);
  });

  ngOnInit(): void {
    // Check if hash is provided in URL
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const hashParam = params.get('hash');
      if (hashParam) {
        const hash = '0x' + hashParam;
        this.documentHash = hash;
        this.inputMethod = 'hash';
        this.verifyByHash(hash);
      }
    });
  }

  setInputMethod(method: TabType): void {
    this.inputMethod = method;
    this.selectedFile = null;
  }

  canVerify(): boolean {
    if (this.inputMethod === 'hash') {
      return this.hasherService.isValidHash(this.documentHash);
    }
    return this.selectedFile !== null;
  }

  progressValue(): number {
    const progress = this.verificationState.progress ?? 0;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  async verifyDocument(): Promise<void> {
    if (this.inputMethod === 'hash') {
      await this.verifyByHash(this.documentHash);
    } else {
      await this.verifyFile();
    }
  }

  async verifyByHash(hash: string): Promise<void> {
    this.isVerifying = true;
    this.errorMessage = '';
    this.progressText = 'Querying blockchain...';

    try {
      const result = await this.verificationService.verifyByHash(hash);
      this.displayResult(result);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to verify document';
      console.error('Verification error:', error);
    } finally {
      this.isVerifying = false;
    }
  }

  async verifyFile(): Promise<void> {
    if (!this.selectedFile) {
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';

    try {
      const result = await this.verificationService.verifyFile(this.selectedFile, (status) => {
        this.progressText = status.message || 'Verifying...';
      });
      this.displayResult(result);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to verify document';
      console.error('Verification error:', error);
    } finally {
      this.isVerifying = false;
      this.selectedFile = null;
    }
  }

  private displayResult(result: VerificationResult): void {
    this.result = result;
    this.showInput = false;

    if (result.verified) {
      this.confettiService.success();
    }
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
    this.isDragOver = true;
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  resetVerification(): void {
    this.result = null;
    this.showInput = true;
    this.documentHash = '';
    this.selectedFile = null;
    this.errorMessage = '';
    this.progressText = '';

    // Update URL
    this.router.navigate(['/verify']);
  }

  async downloadProof(format: 'json' | 'pdf' | 'text'): Promise<void> {
    if (!this.result) return;

    try {
      await this.proofService.downloadProof(this.result, { format });
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to download proof';
    }
  }

  async copyLink(): Promise<void> {
    if (!this.result) return;

    try {
      await this.proofService.copyVerificationLink(this.result);
      this.showToast('Link copied to clipboard');
    } catch (error) {
      this.errorMessage = 'Failed to copy link';
    }
  }

  async shareVerification(): Promise<void> {
    if (!this.result) return;

    try {
      await this.proofService.shareVerification(this.result);
    } catch (error) {
      console.error('Share error:', error);
    }
  }

  handleCopy(address: string): void {
    this.showToast('Address copied to clipboard');
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard');
    } catch (error) {
      this.errorMessage = 'Failed to copy';
    }
  }

  private showToast(message: string): void {
    this.showCopiedToast = true;
    setTimeout(() => {
      this.showCopiedToast = false;
    }, 2000);
  }

  truncateHash(hash: string): string {
    return this.hasherService.truncateHash(hash);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
