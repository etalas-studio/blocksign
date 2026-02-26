import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../../core/services/wallet.service';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  signatureComplete: boolean;
  documentVerified: boolean;
  blockchainConfirmation: boolean;
  securityAlerts: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  requireSignatureConfirm: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
}

interface NetworkSettings {
  autoNetworkSwitch: boolean;
  preferredNetwork: string;
  gasPricePreference: 'low' | 'medium' | 'high';
  showTestNetworks: boolean;
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <!-- Page Header -->
      <div class="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and security settings</p>
      </div>

      <!-- Settings Navigation -->
      <div class="settings-layout">
        <aside class="settings-nav">
          @for (section of settingsSections; track section.id) {
            <button
              class="nav-item"
              [class.active]="activeSection === section.id"
              (click)="activeSection = section.id"
            >
              <svg *ngIf="section.id === 'notifications'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <svg *ngIf="section.id === 'security'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <svg *ngIf="section.id === 'network'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <svg *ngIf="section.id === 'display'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>{{ section.title }}</span>
            </button>
          }
        </aside>

        <main class="settings-content">
          <!-- Notifications Section -->
          @if (activeSection === 'notifications') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Notifications</h2>
                <p>Manage how you receive notifications about your documents</p>
              </div>

              <div class="settings-group">
                <h3>Email Notifications</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Enable Email Notifications</label>
                    <p class="setting-description">Receive notifications via email</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="notificationSettings.emailNotifications" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Signature Complete</label>
                    <p class="setting-description">When a document is fully signed</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="notificationSettings.signatureComplete" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Document Verified</label>
                    <p class="setting-description">When a document verification completes</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="notificationSettings.documentVerified" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Blockchain Confirmation</label>
                    <p class="setting-description">When blockchain transaction confirms</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="notificationSettings.blockchainConfirmation" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div class="settings-group">
                <h3>Push Notifications</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Browser Push Notifications</label>
                    <p class="setting-description">Receive in-browser notifications</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="notificationSettings.pushNotifications" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Security Alerts</label>
                    <p class="setting-description">Critical security-related notifications</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="notificationSettings.securityAlerts" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          }

          <!-- Security Section -->
          @if (activeSection === 'security') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Security</h2>
                <p>Manage your account security settings</p>
              </div>

              <div class="settings-group">
                <h3>Two-Factor Authentication</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Enable 2FA</label>
                    <p class="setting-description">Add an extra layer of security</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="securitySettings.twoFactorEnabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div class="settings-group">
                <h3>Signature Security</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Require Confirmation</label>
                    <p class="setting-description">Always confirm before signing</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="securitySettings.requireSignatureConfirm" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Session Timeout</label>
                    <p class="setting-description">Auto-logout after inactivity</p>
                  </div>
                  <select class="setting-select" [(ngModel)]="securitySettings.sessionTimeout">
                    <option [value]="15">15 minutes</option>
                    <option [value]="30">30 minutes</option>
                    <option [value]="60">1 hour</option>
                    <option [value]="120">2 hours</option>
                  </select>
                </div>
              </div>

              <div class="settings-group">
                <h3>IP Whitelist</h3>
                <div class="setting-item full-width">
                  <div class="setting-info">
                    <label class="setting-label">Allowed IP Addresses</label>
                    <p class="setting-description">Only these IPs can access your account</p>
                  </div>
                  <input
                    type="text"
                    class="setting-input"
                    placeholder="Add IP address (e.g., 192.168.1.1)"
                  />
                </div>
              </div>
            </div>
          }

          <!-- Network Section -->
          @if (activeSection === 'network') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Network Settings</h2>
                <p>Configure blockchain network preferences</p>
              </div>

              <div class="settings-group">
                <h3>Network Configuration</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Auto Network Switch</label>
                    <p class="setting-description">Automatically switch to correct network</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="networkSettings.autoNetworkSwitch" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Preferred Network</label>
                    <p class="setting-description">Default network for transactions</p>
                  </div>
                  <select class="setting-select" [(ngModel)]="networkSettings.preferredNetwork">
                    <option value="polygon">Polygon Mainnet</option>
                    <option value="amoy">Polygon Amoy Testnet</option>
                    <option value="ethereum">Ethereum Mainnet</option>
                    <option value="goerli">Ethereum Goerli</option>
                  </select>
                </div>
              </div>

              <div class="settings-group">
                <h3>Gas Settings</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Gas Price Preference</label>
                    <p class="setting-description">Balance between speed and cost</p>
                  </div>
                  <select class="setting-select" [(ngModel)]="networkSettings.gasPricePreference">
                    <option value="low">Low (Slower)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Faster)</option>
                  </select>
                </div>
              </div>

              <div class="settings-group">
                <h3>Advanced</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Show Test Networks</label>
                    <p class="setting-description">Display test networks in wallet</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="networkSettings.showTestNetworks" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          }

          <!-- Display Section -->
          @if (activeSection === 'display') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Display Settings</h2>
                <p>Customize your dashboard appearance</p>
              </div>

              <div class="settings-group">
                <h3>Appearance</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Theme</label>
                    <p class="setting-description">Choose your preferred theme</p>
                  </div>
                  <select class="setting-select" [(ngModel)]="displaySettings.theme">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>

              <div class="settings-group">
                <h3>Language & Region</h3>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Language</label>
                  </div>
                  <select class="setting-select" [(ngModel)]="displaySettings.language">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Currency</label>
                  </div>
                  <select class="setting-select" [(ngModel)]="displaySettings.currency">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <label class="setting-label">Timezone</label>
                  </div>
                  <select class="setting-select" [(ngModel)]="displaySettings.timezone">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>
            </div>
          }

          <!-- Save Button -->
          <div class="settings-actions">
            <button class="btn btn-secondary" (click)="resetSettings()">
              Reset to Defaults
            </button>
            <button class="btn btn-primary" (click)="saveSettings()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Changes
            </button>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .page-header p {
      margin: 0;
      font-size: 15px;
      color: var(--color-text-secondary);
    }

    .settings-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 32px;
      align-items: start;
    }

    .settings-nav {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 12px;
      position: sticky;
      top: 24px;
    }

    .nav-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all var(--transition-base);
      text-align: left;
    }

    .nav-item:hover {
      background: var(--color-bg);
      color: var(--color-text-primary);
    }

    .nav-item.active {
      background: var(--color-primary);
      color: white;
    }

    .nav-item svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .settings-content {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 32px;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .section-header {
      margin-bottom: 24px;
    }

    .section-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .section-header p {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .settings-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--color-border);
    }

    .settings-group:last-of-type {
      border-bottom: none;
    }

    .settings-group h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }

    .setting-item.full-width {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .setting-info {
      flex: 1;
    }

    .setting-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .setting-description {
      margin: 0;
      font-size: 13px;
      color: var(--color-text-muted);
    }

    .setting-select, .setting-input {
      padding: 8px 12px;
      font-size: 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      min-width: 200px;
    }

    .setting-input {
      width: 100%;
    }

    .setting-select:focus, .setting-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 28px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--color-border);
      transition: var(--transition-base);
      border-radius: var(--radius-full);
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: var(--transition-base);
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: var(--color-primary);
    }

    input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid var(--color-border);
      margin-top: 8px;
    }

    @media (max-width: 768px) {
      .settings-layout {
        grid-template-columns: 1fr;
      }

      .settings-nav {
        position: static;
        display: flex;
        flex-direction: column;
      }

      .settings-content {
        padding: 20px;
      }

      .setting-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class SettingsPageComponent implements OnInit {
  walletService = inject(WalletService);

  activeSection = 'notifications';

  settingsSections: SettingsSection[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage how you receive notifications'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Account security and authentication'
    },
    {
      id: 'network',
      title: 'Network',
      description: 'Blockchain network preferences'
    },
    {
      id: 'display',
      title: 'Display',
      description: 'Appearance and language settings'
    }
  ];

  notificationSettings: NotificationSettings = {
    emailNotifications: true,
    pushNotifications: true,
    signatureComplete: true,
    documentVerified: true,
    blockchainConfirmation: false,
    securityAlerts: true
  };

  securitySettings: SecuritySettings = {
    twoFactorEnabled: false,
    requireSignatureConfirm: true,
    sessionTimeout: 30,
    ipWhitelist: []
  };

  networkSettings: NetworkSettings = {
    autoNetworkSwitch: true,
    preferredNetwork: 'amoy',
    gasPricePreference: 'medium',
    showTestNetworks: true
  };

  displaySettings: DisplaySettings = {
    theme: 'light',
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York'
  };

  saveSettings(): void {
    // In real app, save to backend API
    console.log('Saving settings...', {
      notification: this.notificationSettings,
      security: this.securitySettings,
      network: this.networkSettings,
      display: this.displaySettings
    });
    alert('Settings saved successfully!');
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to defaults
      this.notificationSettings = {
        emailNotifications: true,
        pushNotifications: true,
        signatureComplete: true,
        documentVerified: true,
        blockchainConfirmation: false,
        securityAlerts: true
      };
      this.securitySettings = {
        twoFactorEnabled: false,
        requireSignatureConfirm: true,
        sessionTimeout: 30,
        ipWhitelist: []
      };
      this.networkSettings = {
        autoNetworkSwitch: true,
        preferredNetwork: 'amoy',
        gasPricePreference: 'medium',
        showTestNetworks: true
      };
      this.displaySettings = {
        theme: 'light',
        language: 'en',
        currency: 'USD',
        timezone: 'America/New_York'
      };
    }
  }

  ngOnInit(): void {
    // In real app, load settings from backend API
  }
}
