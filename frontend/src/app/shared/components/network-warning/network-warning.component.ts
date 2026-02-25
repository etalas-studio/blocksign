import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-network-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="network-warning" *ngIf="showWarning">
      <div class="warning-content">
        <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <div class="warning-message">
          <h3>Wrong Network</h3>
          <p>Please switch to Polygon Amoy Testnet to use BlockSign</p>
        </div>
        <button class="switch-btn" (click)="switchNetwork()">
          Switch Network
        </button>
      </div>
    </div>
  `,
  styles: [`
    .network-warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .warning-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .warning-icon {
      width: 32px;
      height: 32px;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .warning-message {
      flex: 1;
    }

    .warning-message h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
    }

    .warning-message p {
      margin: 0;
      font-size: 14px;
      color: #b45309;
    }

    .switch-btn {
      background: #f59e0b;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .switch-btn:hover {
      background: #d97706;
      transform: translateY(-1px);
    }
  `]
})
export class NetworkWarningComponent {
  walletService = inject(WalletService);

  get showWarning(): boolean {
    return this.walletService.isConnected() && !this.walletService.isCorrectNetwork();
  }

  async switchNetwork(): Promise<void> {
    try {
      await this.walletService.switchNetwork();
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }
}
