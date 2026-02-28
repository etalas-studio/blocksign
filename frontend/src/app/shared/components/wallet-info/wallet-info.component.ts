import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletState } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-wallet-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wallet-info" *ngIf="walletService.isConnected()">
      <div class="info-card">
        <div class="info-row">
          <span class="label">Network:</span>
          <span class="value">{{ networkName }}</span>
        </div>
        <div class="info-row">
          <span class="label">Address:</span>
          <span class="value address" (click)="copyAddress()" [title]="'Click to copy'">
            {{ truncatedAddress }}
          </span>
        </div>
        <div class="info-row">
          <span class="label">Balance:</span>
          <span class="value">{{ balance }} POL</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-info {
      margin-bottom: 20px;
    }

    .info-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .info-row:not(:last-child) {
      border-bottom: 1px solid #e5e7eb;
    }

    .label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 600;
    }

    .address {
      font-family: 'Courier New', monospace;
      cursor: pointer;
      transition: color 0.2s;
    }

    .address:hover {
      color: #667eea;
    }
  `]
})
export class WalletInfoComponent implements OnInit {
  walletService = inject(WalletService);

  walletState: WalletState | null = null;
  copied = false;

  ngOnInit(): void {
    this.walletService.walletState$.subscribe(state => {
      this.walletState = state;
    });
  }

  get truncatedAddress(): string {
    if (!this.walletState?.address) return '';
    const address = this.walletState.address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  }

  get networkName(): string {
    return this.walletService.getNetworkName();
  }

  get balance(): string {
    return this.walletState?.balance || '0';
  }

  copyAddress(): void {
    if (this.walletState?.address) {
      navigator.clipboard.writeText(this.walletState.address);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }
  }
}
