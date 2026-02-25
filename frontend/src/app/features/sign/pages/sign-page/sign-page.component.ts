import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WalletService } from '../../../../core/services/wallet.service';
import {
  WalletConnectComponent,
  WalletInfoComponent,
  NetworkWarningComponent
} from '../../../../shared';
import {
  FileUploadComponent,
  HashDisplayComponent,
  SignDocumentComponent
} from '../../components';
import { UploadResponse } from '../../../../core/models/document.model';

@Component({
  selector: 'app-sign-page',
  standalone: true,
  imports: [
    CommonModule,
    WalletConnectComponent,
    WalletInfoComponent,
    NetworkWarningComponent,
    FileUploadComponent,
    HashDisplayComponent,
    SignDocumentComponent
  ],
  template: `
    <div class="sign-page">
      <header class="page-header">
        <h1>BlockSign</h1>
        <p class="subtitle">Sign Documents on the Blockchain</p>
      </header>

      <div class="header-actions">
        <app-wallet-connect />
      </div>

      <app-network-warning />

      <div class="content">
        @if (walletService.isConnected()) {
          <app-wallet-info />
        }

        <section class="upload-section">
          <h2>Upload Document</h2>
          <app-file-upload
            (uploadComplete)="onUploadComplete($event)" />
        </section>

        @if (uploadData) {
          <section class="hash-section">
            <app-hash-display />
          </section>

          <section class="sign-section">
            <h2>Sign Document</h2>
            <p class="section-description">
              Sign this document with your wallet to create an immutable record on the blockchain
            </p>
            <app-sign-document
              [docHash]="uploadData.hash"
              (signComplete)="onSignComplete($event)" />
          </section>
        }

        @if (txHash) {
          <section class="success-section">
            <div class="success-message">
              <svg class="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
              <h3>Document Signed Successfully!</h3>
              <p>Your signature has been recorded on the Polygon Amoy blockchain</p>
              <a
                [href]="blockExplorerUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="explorer-link">
                View on Block Explorer
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          </section>
        }
      </div>

      <footer class="page-footer">
        <p>Powered by Polygon Amoy Testnet</p>
      </footer>
    </div>
  `,
  styles: [`
    .sign-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .page-header {
      text-align: center;
      color: white;
      margin-bottom: 20px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }

    .header-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .content {
      max-width: 800px;
      margin: 0 auto;
    }

    section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    section h2 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .section-description {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #6b7280;
    }

    .success-section {
      background: #f0fdf4;
      border: 2px solid #86efac;
    }

    .success-message {
      text-align: center;
      padding: 20px;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      color: #10b981;
      margin-bottom: 16px;
    }

    .success-message h3 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #166534;
    }

    .success-message p {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #15803d;
    }

    .explorer-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #166534;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .explorer-link:hover {
      background: #14532d;
      transform: translateY(-1px);
    }

    .explorer-link svg {
      width: 20px;
      height: 20px;
    }

    .page-footer {
      text-align: center;
      color: white;
      padding: 20px;
      font-size: 14px;
      opacity: 0.8;
    }

    .page-footer p {
      margin: 0;
    }
  `]
})
export class SignPageComponent {
  walletService = inject(WalletService);
  router = inject(Router);

  @ViewChild(HashDisplayComponent) hashDisplay!: HashDisplayComponent;
  @ViewChild(SignDocumentComponent) signDocument!: SignDocumentComponent;

  uploadData: UploadResponse | null = null;
  txHash: string = '';

  get blockExplorerUrl(): string {
    return `https://amoy.polygonscan.com/tx/${this.txHash}`;
  }

  onUploadComplete(data: UploadResponse): void {
    this.uploadData = data;
    if (this.hashDisplay) {
      this.hashDisplay.setUploadData(data);
    }
  }

  onSignComplete(txHash: string): void {
    this.txHash = txHash;
  }

  reset(): void {
    this.uploadData = null;
    this.txHash = '';
  }
}
