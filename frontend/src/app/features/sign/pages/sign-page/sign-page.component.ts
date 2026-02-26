import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WalletService } from '../../../../core/services/wallet.service';
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
    FileUploadComponent,
    HashDisplayComponent,
    SignDocumentComponent
  ],
  template: `
    <div class="dashboard-page">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="brand">
          <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="brand-name">BlockSign</span>
        </div>

        <div class="top-bar-right">
          <!-- Network Badge -->
          <div class="network-badge">
            <span class="status-dot online"></span>
            <span>Polygon Amoy</span>
          </div>

          <!-- Wallet Status -->
          @if (walletService.isConnected()) {
            <div class="wallet-status connected">
              <span class="status-dot online"></span>
              <span class="wallet-address">{{ truncatedAddress }}</span>
            </div>
          }

          <!-- Sign Action Button -->
          <button class="btn btn-primary" (click)="scrollToSign()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7-7-7-3-3"/>
            </svg>
            Sign Document
          </button>
        </div>
      </header>

      <!-- Trust Status Banner -->
      <div class="trust-banner">
        <div class="trust-banner-content">
          <svg class="trust-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>
          </svg>
          <div class="trust-info">
            <h3>System Trust Status: Secure</h3>
            <div class="trust-indicators">
              <span class="trust-item">
                <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Blockchain: Connected
              </span>
              <span class="trust-item">
                <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Smart Contract: Verified
              </span>
              <span class="trust-item">
                <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Wallet: {{ walletService.isConnected() ? 'Connected' : 'Not Connected' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card" *ngFor="let metric of metrics">
          <div class="metric-icon" [style.background-color]="metric.color + '20'">
            <svg [style.color]="metric.color" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [innerHTML]="metric.icon"></svg>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-label">{{ metric.title }}</div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-grid">
        <!-- Upload & Sign Section -->
        <div class="card sign-section">
          <div class="section-header">
            <h2>Sign New Document</h2>
          </div>
          <div class="sign-content">
            <app-file-upload (uploadComplete)="onUploadComplete($event)" />
            @if (uploadData) {
              <app-hash-display />
              <app-sign-document
                [docHash]="uploadData.hash"
                (signComplete)="onSignComplete($event)" />
            }
          </div>
        </div>

        <!-- Blockchain Activity -->
        <div class="card activity-section">
          <h2>Blockchain Activity</h2>
          <div class="activity-timeline">
            <div class="activity-item" *ngFor="let activity of blockchainActivities">
              <div class="activity-dot" [ngClass]="'dot-' + activity.type"></div>
              <div class="activity-content">
                <div class="activity-message">{{ activity.message }}</div>
                <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
                @if (activity.hash) {
                  <div class="activity-hash">{{ activity.hash }}</div>
                }
              </div>
            </div>
            @if (blockchainActivities.length === 0) {
              <div class="empty-activity">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                <p>No blockchain activity yet</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Success Display -->
      @if (txHash) {
        <div class="success-section card">
          <div class="success-content">
            <svg class="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11 25"/>
            </svg>
            <h3>Document Signed Successfully!</h3>
            <p>Your signature has been permanently recorded on the Polygon Amoy blockchain</p>
            <a [href]="blockExplorerUrl" target="_blank" rel="noopener noreferrer" class="explorer-link">
              View on Block Explorer
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0H5z"/>
              </svg>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      min-height: 100vh;
      background: var(--color-bg);
      padding: 0;
    }

    /* Top Bar */
    .top-bar {
      background: var(--color-bg-card);
      border-bottom: 1px solid var(--color-border);
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      color: var(--color-primary);
    }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .network-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--color-bg);
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .wallet-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(34, 197, 94, 0.1);
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 500;
    }

    .wallet-status.connected {
      color: var(--color-success);
    }

    .wallet-address {
      font-family: 'Courier New', monospace;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .btn-primary {
      background: var(--color-primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    /* Trust Banner */
    .trust-banner {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      margin-bottom: 24px;
    }

    .trust-banner-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .trust-icon {
      width: 48px;
      height: 48px;
      color: var(--color-success);
      flex-shrink: 0;
    }

    .trust-info h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: var(--color-text-primary);
    }

    .trust-indicators {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .trust-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .check-icon {
      width: 16px;
      height: 16px;
      color: var(--color-success);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .top-bar-right {
        gap: 8px;
      }
      .network-badge span:last-child {
        display: none;
      }
    }

    .metric-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all var(--transition-base);
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon svg {
      width: 24px;
      height: 24px;
    }

    .metric-content {
      flex: 1;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .section-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border);
    }

    .section-header h2 {
      margin: 0;
      font-size: 16px;
    }

    .sign-content {
      padding: 24px;
    }

    /* Activity Section */
    .activity-section {
      padding: 20px;
    }

    .activity-section h2 {
      margin: 0 0 20px 0;
      font-size: 16px;
    }

    .activity-timeline {
      position: relative;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding-bottom: 20px;
      position: relative;
    }

    .activity-item::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 24px;
      bottom: 0;
      width: 2px;
      background: var(--color-border);
    }

    .activity-item:last-child::before {
      display: none;
    }

    .activity-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .dot-sign {
      background: var(--color-success);
    }

    .dot-verify {
      background: var(--color-info);
    }

    .dot-confirm {
      background: var(--color-primary);
    }

    .activity-content {
      flex: 1;
    }

    .activity-message {
      font-size: 14px;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .activity-time {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .activity-hash {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: var(--color-trust-blue);
      margin-top: 4px;
    }

    .empty-activity {
      text-align: center;
      padding: 48px 20px;
      color: var(--color-text-secondary);
    }

    .empty-activity svg {
      width: 40px;
      height: 40px;
      margin: 0 auto 12px;
      color: var(--color-text-muted);
    }

    /* Success Section */
    .success-section {
      background: rgba(34, 197, 94, 0.05);
      border: 2px solid var(--color-success);
      margin-bottom: 24px;
    }

    .success-content {
      text-align: center;
      padding: 32px;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      color: var(--color-success);
      margin: 0 auto 16px;
    }

    .success-content h3 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--color-success);
    }

    .success-content p {
      margin: 0 0 24px 0;
      font-size: 16px;
      color: var(--color-text-secondary);
    }

    .explorer-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--color-success);
      color: white;
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: all var(--transition-base);
    }

    .explorer-link:hover {
      background: var(--color-success-hover);
      transform: translateY(-1px);
    }

    .explorer-link svg {
      width: 20px;
      height: 20px;
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

  metrics = [
    {
      title: 'Documents Stored',
      value: '12',
      icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
      color: '#3B82F6'
    },
    {
      title: 'Total Signatures',
      value: '34',
      icon: '<path d="M12 19l7-7 3 3-7-7-7-7-3-3"/><path d="M18 9l-5-5-5 5"/><path d="M2 12h20"/><path d="M7 12v5a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5v-5"/>',
      color: '#22C55E'
    },
    {
      title: 'On-Chain Records',
      value: '34',
      icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
      color: '#8B5CF6'
    },
    {
      title: 'Verification Requests',
      value: '5',
      icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      color: '#F59E0B'
    },
    {
      title: 'Trust Integrity Score',
      value: '100%',
      icon: '<path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>',
      color: '#22C55E'
    }
  ];

  blockchainActivities = [
    {
      type: 'sign',
      message: 'Document signed by 0x71C...A92F',
      timestamp: new Date(Date.now() - 3600000),
      hash: '0xabc123...def456'
    },
    {
      type: 'confirm',
      message: 'Transaction confirmed on block #334455',
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      type: 'verify',
      message: 'Document verified: Employment Contract.pdf',
      timestamp: new Date(Date.now() - 10800000)
    }
  ];

  get truncatedAddress(): string {
    const address = this.walletService.getWalletState().address;
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  get blockExplorerUrl(): string {
    return `https://amoy.polygonscan.com/tx/${this.txHash}`;
  }

  scrollToSign(): void {
    document.querySelector('.sign-section')?.scrollIntoView({ behavior: 'smooth' });
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

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }
}
