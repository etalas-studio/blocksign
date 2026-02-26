import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../../core/services/wallet.service';

interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  status: 'success' | 'pending' | 'failed';
  type: 'signature' | 'verification' | 'upload' | 'contract_interaction';
  documentHash?: string;
}

interface ContractInfo {
  address: string;
  name: string;
  network: string;
  totalTransactions: number;
  lastUpdate: Date;
}

@Component({
  selector: 'app-blockchain-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="blockchain-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>On-Chain Records</h1>
          <p>Explore all blockchain transactions and smart contract interactions</p>
        </div>
        <div class="header-actions">
          <a href="https://amoy.polygonscan.com" target="_blank" class="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View on Explorer
          </a>
        </div>
      </div>

      <!-- Network Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalTransactions }}</div>
            <div class="stat-label">Total Transactions</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.documentsRegistered }}</div>
            <div class="stat-label">Documents Registered</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.avgBlockTime }}s</div>
            <div class="stat-label">Avg Block Time</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalGasSpent }}</div>
            <div class="stat-label">Total Gas Spent (MATIC)</div>
          </div>
        </div>
      </div>

      <!-- Contract Info Card -->
      <div class="contract-card">
        <div class="contract-header">
          <div class="contract-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="contract-info">
            <h2>BlockSign Smart Contract</h2>
            <div class="contract-address">{{ contractInfo.address }}</div>
          </div>
          <div class="contract-badge verified">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Verified
          </div>
        </div>
        <div class="contract-details">
          <div class="contract-detail">
            <span class="detail-label">Network</span>
            <span class="detail-value">{{ contractInfo.network }}</span>
          </div>
          <div class="contract-detail">
            <span class="detail-label">Total Transactions</span>
            <span class="detail-value">{{ contractInfo.totalTransactions }}</span>
          </div>
          <div class="contract-detail">
            <span class="detail-label">Last Activity</span>
            <span class="detail-value">{{ contractInfo.lastUpdate | date:'medium' }}</span>
          </div>
        </div>
      </div>

      <!-- Transactions -->
      <div class="transactions-card">
        <div class="transactions-header">
          <h2>Transaction History</h2>
          <div class="transactions-actions">
            <input
              type="text"
              class="search-input"
              placeholder="Search by hash, address..."
              [value]="searchQuery"
              (input)="searchQuery = $any($event.target).value"
            />
            <select class="filter-select" [(ngModel)]="typeFilter">
              <option value="">All Types</option>
              <option value="signature">Signatures</option>
              <option value="verification">Verifications</option>
              <option value="upload">Uploads</option>
              <option value="contract_interaction">Contract Interactions</option>
            </select>
          </div>
        </div>

        <div class="transactions-list">
          @for (tx of filteredTransactions; track tx.txHash) {
            <div class="transaction-item">
              <div class="transaction-icon" [ngClass]="'icon-' + tx.type">
                <svg *ngIf="tx.type === 'signature'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 19l7-7 3 3-7-7-7 7-3-3"/>
                </svg>
                <svg *ngIf="tx.type === 'verification'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"/>
                </svg>
                <svg *ngIf="tx.type === 'upload'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <svg *ngIf="tx.type === 'contract_interaction'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div class="transaction-content">
                <div class="transaction-header">
                  <div class="transaction-title">
                    <span class="tx-type">{{ tx.type.replace('_', ' ') | titlecase }}</span>
                    <span class="tx-status" [ngClass]="'status-' + tx.status">{{ tx.status }}</span>
                  </div>
                  <div class="transaction-time">{{ tx.timestamp | date:'short' }}</div>
                </div>
                <div class="transaction-details">
                  <div class="tx-detail">
                    <span class="detail-label">Tx Hash</span>
                    <span class="detail-value hash">{{ tx.txHash }}</span>
                  </div>
                  <div class="tx-detail">
                    <span class="detail-label">Block</span>
                    <span class="detail-value">#{{ tx.blockNumber }}</span>
                  </div>
                  <div class="tx-detail">
                    <span class="detail-label">From</span>
                    <span class="detail-value hash">{{ tx.from }}</span>
                  </div>
                  <div class="tx-detail">
                    <span class="detail-label">Gas Used</span>
                    <span class="detail-value">{{ tx.gasUsed }}</span>
                  </div>
                  @if (tx.documentHash) {
                    <div class="tx-detail">
                      <span class="detail-label">Document</span>
                      <span class="detail-value hash">{{ tx.documentHash }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
          @if (filteredTransactions.length === 0) {
            <div class="empty-transactions">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <p>No transactions found</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .blockchain-page {
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
      background: rgba(34, 197, 94, 0.1);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon svg {
      width: 24px;
      height: 24px;
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

    .contract-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .contract-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .contract-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      background: rgba(34, 197, 94, 0.1);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contract-icon svg {
      width: 28px;
      height: 28px;
    }

    .contract-info h2 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .contract-address {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .contract-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 500;
      margin-left: auto;
    }

    .contract-badge svg {
      width: 16px;
      height: 16px;
    }

    .contract-badge.verified {
      background: rgba(22, 163, 74, 0.1);
      color: var(--color-success);
    }

    .contract-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding-top: 20px;
      border-top: 1px solid var(--color-border);
    }

    .contract-detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .transactions-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .transactions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border);
      gap: 16px;
    }

    .transactions-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .transactions-actions {
      display: flex;
      gap: 12px;
      flex: 1;
      justify-content: flex-end;
    }

    .search-input {
      width: 300px;
      padding: 10px 16px;
      font-size: 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .filter-select {
      padding: 10px 16px;
      font-size: 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .transactions-list {
      padding: 16px;
    }

    .transaction-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: var(--color-bg);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
      margin-bottom: 12px;
      transition: all var(--transition-base);
    }

    .transaction-item:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    .transaction-item:last-child {
      margin-bottom: 0;
    }

    .transaction-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .transaction-icon svg {
      width: 20px;
      height: 20px;
    }

    .icon-signature {
      background: rgba(34, 197, 94, 0.1);
      color: #22C55E;
    }

    .icon-verification {
      background: rgba(245, 158, 11, 0.1);
      color: #F59E0B;
    }

    .icon-upload {
      background: rgba(59, 130, 246, 0.1);
      color: #3B82F6;
    }

    .icon-contract_interaction {
      background: rgba(139, 92, 246, 0.1);
      color: #8B5CF6;
    }

    .transaction-content {
      flex: 1;
    }

    .transaction-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .transaction-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tx-type {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .tx-status {
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 500;
      border-radius: var(--radius-full);
    }

    .status-success {
      background: rgba(22, 163, 74, 0.1);
      color: var(--color-success);
    }

    .status-pending {
      background: rgba(250, 204, 21, 0.1);
      color: var(--color-warning);
    }

    .status-failed {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
    }

    .transaction-time {
      font-size: 13px;
      color: var(--color-text-muted);
    }

    .transaction-details {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .tx-detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-value.hash {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: var(--color-trust-blue);
    }

    .empty-transactions {
      text-align: center;
      padding: 48px 24px;
      color: var(--color-text-secondary);
    }

    .empty-transactions svg {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      color: var(--color-text-muted);
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .contract-details {
        grid-template-columns: 1fr;
      }
      .transaction-details {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .transactions-header {
        flex-direction: column;
        align-items: stretch;
      }
      .search-input {
        width: 100%;
      }
      .transaction-item {
        flex-direction: column;
      }
    }
  `]
})
export class BlockchainPageComponent implements OnInit {
  walletService = inject(WalletService);

  stats = {
    totalTransactions: 34,
    documentsRegistered: 12,
    avgBlockTime: 2,
    totalGasSpent: '0.0234'
  };

  contractInfo: ContractInfo = {
    address: '0x1234...5678',
    name: 'BlockSign',
    network: 'Polygon Amoy Testnet',
    totalTransactions: 34,
    lastUpdate: new Date(Date.now() - 3600000)
  };

  searchQuery = '';
  typeFilter = '';

  transactions: BlockchainTransaction[] = [
    {
      txHash: '0xabc123...def456',
      blockNumber: 334455,
      timestamp: new Date(Date.now() - 3600000),
      from: '0x71C...A92F',
      to: '0x1234...5678',
      value: '0',
      gasUsed: '0.000021',
      status: 'success',
      type: 'signature',
      documentHash: '0xA82F...91CD'
    },
    {
      txHash: '0xghi789...jkl012',
      blockNumber: 334452,
      timestamp: new Date(Date.now() - 7200000),
      from: '0x71C...A92F',
      to: '0x1234...5678',
      value: '0',
      gasUsed: '0.000018',
      status: 'success',
      type: 'verification',
      documentHash: '0xA82F...91CD'
    },
    {
      txHash: '0xmno345...pqr678',
      blockNumber: 334450,
      timestamp: new Date(Date.now() - 10800000),
      from: '0x45D...3C8E',
      to: '0x1234...5678',
      value: '0',
      gasUsed: '0.000025',
      status: 'success',
      type: 'upload',
      documentHash: '0x5B3E...7F2A'
    },
    {
      txHash: '0xstu901...vwx234',
      blockNumber: 334448,
      timestamp: new Date(Date.now() - 14400000),
      from: '0x71C...A92F',
      to: '0x1234...5678',
      value: '0',
      gasUsed: '0.000019',
      status: 'success',
      type: 'signature',
      documentHash: '0xC9D1...4E8B'
    },
    {
      txHash: '0yza567...bcd890',
      blockNumber: 334445,
      timestamp: new Date(Date.now() - 18000000),
      from: '0x71C...A92F',
      to: '0x1234...5678',
      value: '0',
      gasUsed: '0.000022',
      status: 'pending',
      type: 'contract_interaction'
    }
  ];

  get filteredTransactions(): BlockchainTransaction[] {
    return this.transactions.filter(tx => {
      const matchesSearch = !this.searchQuery ||
        tx.txHash.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        tx.from.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (tx.documentHash && tx.documentHash.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchesType = !this.typeFilter || tx.type === this.typeFilter;

      return matchesSearch && matchesType;
    });
  }

  ngOnInit(): void {
    // In real app, fetch blockchain data from backend/Web3
  }
}
