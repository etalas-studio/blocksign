import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WalletService } from '../../../../core/services/wallet.service';
import { ApiService } from '../../../../core/services/api.service';
import { DocumentResponse, DocumentMetrics } from '../../../../core/models/api.model';
import { ErrorDisplayComponent } from '../../../../shared/components';
import { SkeletonLoaderComponent } from '../../../../shared/components';

interface MetricCard {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface BlockchainActivity {
  type: string;
  message: string;
  timestamp: Date;
  hash?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ErrorDisplayComponent, SkeletonLoaderComponent],
  template: `
    <div class="dashboard">
      @if (error()) {
        <app-error-display [message]="error()!" (retry)="retry()" />
      }

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
              <span class="trust-item">
                <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Timestamp Service: Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Metrics Cards -->
      @if (loading()) {
        <div class="metrics-grid">
          @for (i of [1,2,3,4,5]; track i) {
            <app-skeleton-loader type="circle" />
          }
        </div>
      } @else {
        <div class="metrics-grid">
          <div class="metric-card" *ngFor="let metric of metricCards()">
            <div class="metric-icon" [style.background-color]="metric.color + '20'">
              <svg [style.color]="metric.color" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [innerHTML]="metric.icon"></svg>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metric.value }}</div>
              <div class="metric-label">{{ metric.title }}</div>
            </div>
          </div>
        </div>
      }

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Documents Table -->
        <div class="card documents-section">
          <div class="section-header">
            <h2>Recent Documents</h2>
            <button class="btn btn-secondary btn-sm" [routerLink]="['/documents']">View All</button>
          </div>
          @if (loading()) {
            <div class="table-container">
              <app-skeleton-loader type="table" />
            </div>
          } @else {
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Document Hash</th>
                    <th>Signer Address</th>
                    <th>Timestamp</th>
                    <th>Verification Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (doc of documents(); track doc.id) {
                    <tr>
                      <td class="doc-name" [title]="doc.name">{{ doc.name }}</td>
                      <td class="doc-hash">{{ doc.hash.slice(0, 10) }}...{{ doc.hash.slice(-8) }}</td>
                      <td class="signer">{{ doc.uploader_wallet.slice(0, 8) }}...{{ doc.uploader_wallet.slice(-6) }}</td>
                      <td class="timestamp">{{ doc.uploaded_at | date:'short' }}</td>
                      <td><span class="badge" [ngClass]="doc.verification_status === 'verified' ? 'badge-verified' : 'badge-pending'">{{ doc.verification_status }}</span></td>
                      <td class="actions-cell">
                        <div class="action-group">
                          <button class="action-btn" aria-label="View document" title="View document" [routerLink]="['/documents', doc.hash]">
                            <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @if (documents().length === 0) {
                    <tr>
                      <td colspan="6" class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <p>No documents yet. Upload your first document to get started.</p>
                        <a routerLink="/upload" class="btn btn-primary">Upload Document</a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Blockchain Activity -->
        <div class="card activity-section">
          <h2>Blockchain Activity</h2>
          @if (loading()) {
            <app-skeleton-loader type="row" />
          } @else {
            <div class="activity-timeline">
              @for (activity of blockchainActivities(); track activity.timestamp) {
                <div class="activity-item">
                  <div class="activity-dot" [ngClass]="'dot-' + activity.type"></div>
                  <div class="activity-content">
                    <div class="activity-message">{{ activity.message }}</div>
                    <div class="activity-time">{{ activity.timestamp | date:'short' }}</div>
                    @if (activity.hash) {
                      <div class="activity-hash">{{ activity.hash }}</div>
                    }
                  </div>
                </div>
              }
              @if (blockchainActivities().length === 0) {
                <div class="empty-activity">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  <p>No blockchain activity yet</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 0;
    }

    /* Trust Banner */
    .trust-banner {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
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
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .metric-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all var(--transition-base);
      min-width: 0;
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
      grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
      gap: 20px;
    }

    .card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .documents-section {
      min-width: 0;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
    }

    .section-header h2 {
      margin: 0;
      font-size: 16px;
    }

    /* Table */
    .table-container {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-gutter: stable;
    }

    .data-table {
      width: max-content;
      min-width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg);
      white-space: nowrap;
    }

    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-border-light);
      font-size: 14px;
      white-space: nowrap;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .doc-name {
      font-weight: 500;
      color: var(--color-text-primary);
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doc-hash {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .signer {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: var(--color-trust-blue);
    }

    .timestamp {
      color: var(--color-text-secondary);
    }

    .actions-cell {
      white-space: nowrap;
    }

    .action-group {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-wrap: nowrap;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      margin: 0;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
    }

    .action-btn:hover {
      background: var(--color-bg);
      border-color: var(--color-text-muted);
      color: var(--color-text-primary);
    }

    .action-icon {
      width: 13px;
      height: 13px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--color-text-secondary);
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      color: var(--color-text-muted);
    }

    .empty-state p {
      margin: 0 0 16px 0;
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

    .badge-confirmed {
      background: rgba(34, 197, 94, 0.1);
      color: var(--color-success);
    }

    .badge-pending {
      background: rgba(250, 204, 21, 0.1);
      color: var(--color-warning);
    }

    .badge-verified {
      background: rgba(22, 163, 74, 0.1);
      color: var(--color-success);
    }

    @media (max-width: 1400px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .trust-indicators {
        gap: 12px;
      }
    }

    @media (max-width: 768px) {
      .dashboard {
        gap: 16px;
      }

      .trust-banner {
        padding: 14px 16px;
      }

      .trust-banner-content {
        gap: 12px;
      }

      .trust-info h3 {
        font-size: 16px;
      }

      .trust-item {
        font-size: 12px;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .metric-value {
        font-size: 24px;
      }

      .section-header {
        flex-wrap: wrap;
        padding: 14px 16px;
      }

      .activity-section {
        padding: 16px;
      }
    }

    @media (max-width: 520px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .trust-banner-content {
        flex-direction: column;
      }

      .trust-icon {
        width: 40px;
        height: 40px;
      }

      .doc-name {
        max-width: 180px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  walletService = inject(WalletService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  // State with signals
  loading = signal(false);
  error = signal<string | null>(null);
  metrics = signal<DocumentMetrics | null>(null);
  documents = signal<DocumentResponse[]>([]);

  // Computed metrics for display
  metricCards = computed(() => {
    const m = this.metrics();
    if (!m) return this.getDefaultMetrics();

    return [
      {
        title: 'Documents Stored',
        value: m.total_documents.toString(),
        icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
        color: '#3B82F6'
      },
      {
        title: 'Total Signatures',
        value: m.total_signatures.toString(),
        icon: '<path d="M12 19l7-7 3 3-7-7-7-7 7-3-3"/><path d="M18 9l-5-5-5 5"/><path d="M2 12h20"/><path d="M7 12v5a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5v-5"/>',
        color: '#22C55E'
      },
      {
        title: 'On-Chain Records',
        value: m.on_chain_records.toString(),
        icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        color: '#8B5CF6'
      },
      {
        title: 'Verified Documents',
        value: m.verified_documents.toString(),
        icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
        color: '#F59E0B'
      },
      {
        title: 'Unique Signers',
        value: m.unique_signers.toString(),
        icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        color: '#22C55E'
      }
    ];
  });

  // Blockchain activities computed from documents
  blockchainActivities = computed(() => {
    const docs = this.documents();
    return docs.slice(0, 5).flatMap(doc =>
      doc.signatures.map(sig => ({
        type: sig.status === 'confirmed' ? 'sign' : 'pending',
        message: `Document signed by ${sig.wallet_address.slice(0, 6)}...${sig.wallet_address.slice(-4)}`,
        timestamp: new Date(sig.signed_at),
        hash: sig.tx_hash
      }))
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.error.set(null);

    // Load metrics and documents in parallel
    this.loadMetrics();
    this.loadDocuments();
  }

  private loadMetrics() {
    const walletState = this.walletService.getWalletState();
    const wallet = walletState.connected && walletState.address ? walletState.address : undefined;

    this.apiService.getDocumentMetrics(wallet).subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
      },
      error: (err) => {
        console.error('Failed to load metrics:', err);
        this.error.set('Failed to load metrics');
      }
    });
  }

  private loadDocuments() {
    const walletState = this.walletService.getWalletState();
    const wallet = walletState.connected && walletState.address ? walletState.address : undefined;

    this.apiService.getDocuments({ wallet, limit: 10, offset: 0 }).subscribe({
      next: (response) => {
        this.documents.set(response.documents);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.error.set('Failed to load documents');
        this.loading.set(false);
      }
    });
  }

  private getDefaultMetrics(): MetricCard[] {
    return [
      {
        title: 'Documents Stored',
        value: '0',
        icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
        color: '#3B82F6'
      },
      {
        title: 'Total Signatures',
        value: '0',
        icon: '<path d="M12 19l7-7 3 3-7-7-7-7 7-3-3"/><path d="M18 9l-5-5-5 5"/><path d="M2 12h20"/><path d="M7 12v5a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5v-5"/>',
        color: '#22C55E'
      },
      {
        title: 'On-Chain Records',
        value: '0',
        icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        color: '#8B5CF6'
      },
      {
        title: 'Verified Documents',
        value: '0',
        icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
        color: '#F59E0B'
      },
      {
        title: 'Unique Signers',
        value: '0',
        icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        color: '#22C55E'
      }
    ];
  }

  retry() {
    this.loadData();
  }
}
