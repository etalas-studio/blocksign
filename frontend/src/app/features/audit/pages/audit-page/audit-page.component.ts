import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../../core/services/wallet.service';

interface AuditEvent {
  id: string;
  type: 'upload' | 'signature' | 'confirmation' | 'verification' | 'download';
  title: string;
  description: string;
  timestamp: Date;
  wallet?: string;
  txHash?: string;
  documentHash?: string;
  metadata?: Record<string, any>;
}

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Audit Trail</h1>
          <p>Complete history of all blockchain transactions and document activities</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <button class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Generate Report
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-group">
          <label>Event Type</label>
          <select class="filter-select">
            <option value="">All Events</option>
            <option value="upload">Upload</option>
            <option value="signature">Signature</option>
            <option value="confirmation">Blockchain Confirmation</option>
            <option value="verification">Verification</option>
            <option value="download">Download</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Date Range</label>
          <select class="filter-select">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Document</label>
          <select class="filter-select">
            <option value="">All Documents</option>
            <option value="doc1">Employment Contract.pdf</option>
            <option value="doc2">NDA_Agreement.pdf</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Wallet</label>
          <input type="text" class="filter-input" placeholder="0x..." />
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon upload">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.uploads }}</div>
            <div class="stat-label">Uploads</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon signature">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7-7-7 7-3-3"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.signatures }}</div>
            <div class="stat-label">Signatures</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon confirmation">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.confirmations }}</div>
            <div class="stat-label">Confirmations</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon verification">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.verifications }}</div>
            <div class="stat-label">Verifications</div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="timeline-card">
        <div class="timeline-header">
          <h2>Activity Timeline</h2>
          <div class="timeline-actions">
            <button class="btn-icon" title="Refresh">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="timeline">
          @for (event of auditEvents; track event.id) {
            <div class="timeline-item">
              <div class="timeline-dot" [ngClass]="'dot-' + event.type"></div>
              <div class="timeline-content">
                <div class="event-header">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-time">{{ event.timestamp | date:'medium' }}</div>
                </div>
                <div class="event-description">{{ event.description }}</div>
                @if (event.wallet) {
                  <div class="event-detail">
                    <span class="detail-label">Wallet:</span>
                    <span class="detail-value hash">{{ event.wallet }}</span>
                  </div>
                }
                @if (event.txHash) {
                  <div class="event-detail">
                    <span class="detail-label">Transaction:</span>
                    <span class="detail-value hash">{{ event.txHash }}</span>
                  </div>
                }
                @if (event.documentHash) {
                  <div class="event-detail">
                    <span class="detail-label">Document:</span>
                    <span class="detail-value hash">{{ event.documentHash }}</span>
                  </div>
                }
                @if (event.metadata && eventMetadataKeys(event.metadata).length > 0) {
                  <div class="event-metadata">
                    @for (key of eventMetadataKeys(event.metadata); track key) {
                      <div class="metadata-item">
                        <span class="detail-label">{{ key }}:</span>
                        <span class="detail-value">{{ event.metadata![key] }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
          @if (auditEvents.length === 0) {
            <div class="empty-timeline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>No audit events found</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .header-content p {
      margin: 0;
      font-size: 15px;
      color: var(--color-text-secondary);
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .filters-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-group label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
    }

    .filter-select, .filter-input {
      padding: 10px 12px;
      font-size: 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      transition: all var(--transition-base);
    }

    .filter-select:focus, .filter-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon svg {
      width: 24px;
      height: 24px;
    }

    .stat-icon.upload {
      background: rgba(59, 130, 246, 0.1);
      color: #3B82F6;
    }

    .stat-icon.signature {
      background: rgba(34, 197, 94, 0.1);
      color: #22C55E;
    }

    .stat-icon.confirmation {
      background: rgba(139, 92, 246, 0.1);
      color: #8B5CF6;
    }

    .stat-icon.verification {
      background: rgba(245, 158, 11, 0.1);
      color: #F59E0B;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .timeline-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border);
    }

    .timeline-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .timeline-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      padding: 8px;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .btn-icon:hover {
      background: var(--color-bg);
      border-color: var(--color-text-muted);
    }

    .btn-icon svg {
      width: 18px;
      height: 18px;
    }

    .timeline {
      padding: 24px;
    }

    .timeline-item {
      display: flex;
      gap: 20px;
      padding-bottom: 32px;
      position: relative;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 24px;
      bottom: 0;
      width: 2px;
      background: var(--color-border);
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-item:last-child::before {
      display: none;
    }

    .timeline-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      border: 2px solid white;
      box-shadow: 0 0 0 2px var(--color-border);
    }

    .dot-upload {
      background: #3B82F6;
    }

    .dot-signature {
      background: #22C55E;
    }

    .dot-confirmation {
      background: #8B5CF6;
    }

    .dot-verification {
      background: #F59E0B;
    }

    .dot-download {
      background: #64748B;
    }

    .timeline-content {
      flex: 1;
      padding: 16px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-light);
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .event-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .event-time {
      font-size: 12px;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    .event-description {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin-bottom: 12px;
    }

    .event-detail {
      display: flex;
      gap: 8px;
      font-size: 13px;
      margin-bottom: 6px;
    }

    .detail-label {
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .detail-value {
      color: var(--color-text-secondary);
    }

    .detail-value.hash {
      font-family: 'Courier New', monospace;
      color: var(--color-trust-blue);
    }

    .event-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border-light);
    }

    .metadata-item {
      display: flex;
      gap: 6px;
      font-size: 12px;
    }

    .empty-timeline {
      text-align: center;
      padding: 48px 24px;
      color: var(--color-text-secondary);
    }

    .empty-timeline svg {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      color: var(--color-text-muted);
    }

    @media (max-width: 1200px) {
      .filters-card {
        grid-template-columns: repeat(2, 1fr);
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
      .filters-card {
        grid-template-columns: 1fr;
      }
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AuditPageComponent implements OnInit {
  walletService = inject(WalletService);

  stats = {
    uploads: 12,
    signatures: 34,
    confirmations: 34,
    verifications: 28
  };

  auditEvents: AuditEvent[] = [
    {
      id: '1',
      type: 'verification',
      title: 'Document Verified',
      description: 'Employment Contract.pdf was successfully verified',
      timestamp: new Date(Date.now() - 3600000),
      wallet: '0x71C...A92F',
      documentHash: '0xA82F...91CD'
    },
    {
      id: '2',
      type: 'confirmation',
      title: 'Transaction Confirmed',
      description: 'Signature transaction confirmed on block #334455',
      timestamp: new Date(Date.now() - 7200000),
      txHash: '0xabc123...def456',
      metadata: {
        'Block Number': '334455',
        'Gas Used': '0.0021 ETH'
      }
    },
    {
      id: '3',
      type: 'signature',
      title: 'Document Signed',
      description: 'NDA_Agreement.pdf was signed with wallet 0x71C...A92F',
      timestamp: new Date(Date.now() - 10800000),
      wallet: '0x71C...A92F',
      documentHash: '0x5B3E...7F2A',
      metadata: {
        'Algorithm': 'ECDSA',
        'Curve': 'secp256k1'
      }
    },
    {
      id: '4',
      type: 'upload',
      title: 'Document Uploaded',
      description: 'NDA_Agreement.pdf was uploaded to IPFS',
      timestamp: new Date(Date.now() - 14400000),
      documentHash: '0x5B3E...7F2A',
      metadata: {
        'File Size': '2.4 MB',
        'IPFS CID': 'QmXy7...9AbC'
      }
    },
    {
      id: '5',
      type: 'verification',
      title: 'Document Verified',
      description: 'Service_Level_Agreement.docx verification completed',
      timestamp: new Date(Date.now() - 18000000),
      wallet: '0x45D...3C8E',
      documentHash: '0xC9D1...4E8B'
    }
  ];

  ngOnInit(): void {
    // In real app, fetch audit events from backend
  }

  eventMetadataKeys(metadata: Record<string, any>): string[] {
    return Object.keys(metadata);
  }
}
