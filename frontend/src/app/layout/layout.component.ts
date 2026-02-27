import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { WalletService } from '../core/services/wallet.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Brand -->
        <div class="sidebar-brand">
          <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3v10c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="brand-name">BlockSign</span>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="nav-section-title">Main</span>
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>Dashboard</span>
            </a>
            <a class="nav-item" routerLink="/documents" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Documents</span>
            </a>
            <a class="nav-item" routerLink="/signatures" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7-7-7 7-3-3"/>
                <path d="M18 9l-5-5-5 5"/>
                <path d="M2 12h20"/>
                <path d="M7 12v5a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5v-5"/>
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
              <span>Signatures</span>
            </a>
            <a class="nav-item" routerLink="/verify" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span>Verification</span>
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-section-title">Blockchain</span>
            <a class="nav-item" routerLink="/blockchain" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span>On-Chain Records</span>
            </a>
            <a class="nav-item" routerLink="/contracts" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Smart Contracts</span>
            </a>
            <a class="nav-item" routerLink="/audit" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4-4L14.5 6.5a2.121 2.121 0 0 1 3-3L14.5 6.5"/>
                <path d="m16 17 4 4"/>
                <path d="M21 21v-7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7"/>
                <circle cx="12" cy="13" r="2"/>
                <circle cx="12" cy="18" r="2"/>
                <circle cx="17" cy="13" r="2"/>
                <circle cx="7" cy="13" r="2"/>
              </svg>
              <span>Audit Trail</span>
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-section-title">Identity</span>
            <a class="nav-item" routerLink="/wallets" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M7 15h0M7 9h0M12 9h0M12 15h0M17 9h0M17 15h0"/>
              </svg>
              <span>Wallets</span>
            </a>
            <a class="nav-item" routerLink="/identity" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Identity Binding (KYC)</span>
            </a>
          </div>

          <div class="nav-section">
            <span class="nav-section-title">System</span>
            <a class="nav-item" routerLink="/reports" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Reports</span>
            </a>
            <a class="nav-item" routerLink="/settings" routerLinkActive="active">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="M4.93 4.93l4.24 4.24m8.48 8.48l4.24 4.24"/>
                <path d="M1 12h6m6 0h6"/>
                <path d="M4.93 19.07l4.24-4.24m8.48-8.48l4.24-4.24"/>
              </svg>
              <span>Settings</span>
            </a>
          </div>
        </nav>

        <!-- Bottom -->
        <div class="sidebar-bottom">
          <a class="nav-item" routerLink="/help" routerLinkActive="active">
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Help</span>
          </a>
          <a class="nav-item" routerLink="/api-keys" routerLinkActive="active">
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <span>API Keys</span>
          </a>
          <a class="nav-item" routerLink="/profile" routerLinkActive="active">
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>User Profile</span>
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <header class="header">
          <div class="header-left">
            <span class="breadcrumb">Dashboard / Overview</span>
          </div>
          <div class="header-right">
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
            } @else {
              <button class="btn btn-primary btn-sm" (click)="connectWallet()">
                Connect Wallet
              </button>
            }

            <!-- Sign Button -->
            <a routerLink="/sign" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7-7-7 7-3-3"/>
              </svg>
              Sign Document
            </a>

          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: var(--color-bg);
    }

    /* Sidebar */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--color-bg-sidebar);
      border-right: none;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 50;
    }

    .sidebar-brand {
      height: var(--header-height);
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
      box-sizing: border-box;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      color: var(--color-primary);
    }

    .brand-name {
      font-size: 20px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-section:last-of-type {
      margin-bottom: 0;
    }

    .nav-section-title {
      display: block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
      margin-bottom: 8px;
      padding: 0 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all var(--transition-fast);
      margin-bottom: 4px;
    }

    .nav-item:hover {
      background: var(--color-bg);
      color: var(--color-text-primary);
    }

    .nav-item.active {
      background: var(--color-primary);
      color: white;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .sidebar-bottom {
      padding: 16px;
      border-top: 1px solid var(--color-border);
    }

    /* Main Content */
    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Header */
    .header {
      height: var(--header-height);
      background: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 20px;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .breadcrumb {
      font-size: 14px;
      color: var(--color-border-light);
    }

    .header-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 12px;
      min-width: 0;
    }

    .network-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 500;
      color: var(--color-border-light);
    }

    .wallet-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(34, 197, 94, 0.18);
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

    /* Page Content */
    .page-content {
      flex: 1;
      padding: 20px;
      min-width: 0;
      overflow-y: auto;
    }

    @media (max-width: 1280px) {
      .header {
        padding: 0 16px;
      }

      .page-content {
        padding: 16px;
      }
    }

    @media (max-width: 1024px) {
      .sidebar {
        width: 220px;
      }

      .main-content {
        margin-left: 220px;
      }

      .sidebar-brand {
        padding: 20px;
      }

      .sidebar-nav,
      .sidebar-bottom {
        padding: 12px;
      }

      .nav-item {
        padding: 9px 10px;
      }

      .brand-name {
        font-size: 18px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }

      .main-content {
        margin-left: 0;
      }

      .header {
        height: auto;
        min-height: var(--header-height);
        align-items: flex-start;
        flex-direction: column;
        padding: 12px 16px;
      }

      .header-right {
        width: 100%;
        justify-content: flex-start;
      }

      .breadcrumb {
        font-size: 12px;
      }
    }
  `]
})
export class LayoutComponent {
  walletService = inject(WalletService);
  router = inject(Router);

  get truncatedAddress(): string {
    const address = this.walletService.getWalletState().address;
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }

  connectWallet(): void {
    this.walletService.connectWallet().catch(console.error);
  }
}
