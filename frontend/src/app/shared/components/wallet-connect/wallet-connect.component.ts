import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-wallet-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wallet-connect">
      @if (!walletService.isConnected()) {
        <button
          class="connect-btn"
          (click)="connectWallet()"
          [disabled]="!walletService.isMetaMaskInstalled()">
          @if (!walletService.isMetaMaskInstalled()) {
            <span>Install MetaMask</span>
          } @else {
            <span>Connect Wallet</span>
          }
        </button>
      } @else {
        <button class="disconnect-btn" (click)="disconnectWallet()">
          <span class="address">{{ truncatedAddress }}</span>
          <span class="status-indicator"></span>
        </button>
      }
    </div>
  `,
  styles: [`
    .wallet-connect {
      display: flex;
      justify-content: flex-end;
    }

    .connect-btn,
    .disconnect-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .connect-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .connect-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .connect-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .disconnect-btn {
      background: #f3f4f6;
      color: #1f2937;
      border: 1px solid #e5e7eb;
    }

    .disconnect-btn:hover {
      background: #e5e7eb;
    }

    .address {
      font-family: 'Courier New', monospace;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `]
})
export class WalletConnectComponent {
  walletService = inject(WalletService);

  get truncatedAddress(): string {
    const address = this.walletService.getWalletState().address;
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  async connectWallet(): Promise<void> {
    try {
      await this.walletService.connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }

  disconnectWallet(): void {
    this.walletService.disconnectWallet();
  }
}
