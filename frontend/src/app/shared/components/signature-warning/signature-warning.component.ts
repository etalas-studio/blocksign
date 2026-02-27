import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipIconComponent } from '../tooltip-icon/tooltip-icon.component';

/**
 * Component displaying security warnings before wallet signature
 * Helps prevent phishing attacks by showing exactly what will be signed
 */
@Component({
  selector: 'app-signature-warning',
  standalone: true,
  imports: [CommonModule, TooltipIconComponent],
  template: `
    <div class="signature-warning" [class.warning]="severity() === 'warning'" [class.critical]="severity() === 'critical'">
      <div class="warning-header">
        <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <h3>{{ title() }}</h3>
      </div>

      <div class="warning-content">
        <p class="warning-message">{{ message() }}</p>

        @if (showDetails()) {
          <div class="warning-details">
            <div class="detail-row">
              <span class="detail-label">Document:</span>
              <span class="detail-value">{{ filename() }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hash:</span>
              <span class="detail-value hash-value">{{ hash() }}</span>
              <app-tooltip-icon title="What is a hash?" [content]="'This is the unique fingerprint of your document. Any change to the document will result in a completely different hash.'" />
            </div>
            <div class="detail-row">
              <span class="detail-label">Wallet:</span>
              <span class="detail-value">{{ walletAddress() }}</span>
              <app-tooltip-icon title="Wallet verification" [content]="'Your wallet address that will sign the document. Verify this is correct.'" />
            </div>
          </div>
        }

        <div class="security-tips">
          <p class="tips-title">Important Security Reminders:</p>
          <ul class="tips-list">
            <li>Only sign if you initiated this request yourself</li>
            <li>Never sign requests you didn't initiate</li>
            <li>BlockSign will never ask for your private key</li>
            <li>Verify the hash matches your document exactly</li>
          </ul>
        </div>
      </div>

      @if (dismissible()) {
        <button class="dismiss-btn" (click)="onDismiss.emit()">
          I Understand, Dismiss
        </button>
      }
    </div>
  `,
  styles: [`
    .signature-warning {
      border: 2px solid;
      border-radius: 12px;
      padding: 20px;
      margin: 16px 0;
      background: var(--warning-bg, #fffbeb);
    }

    .signature-warning.warning {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .signature-warning.critical {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .warning-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .warning-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .signature-warning.warning .warning-icon {
      color: #f59e0b;
    }

    .signature-warning.critical .warning-icon {
      color: #ef4444;
    }

    .warning-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .warning-message {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #4b5563;
      line-height: 1.5;
    }

    .warning-details {
      background: rgba(255, 255, 255, 0.6);
      border-radius: 8px;
      padding: 12px;
      margin: 16px 0;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 600;
      color: #374151;
      min-width: 80px;
    }

    .detail-value {
      font-family: monospace;
      font-size: 13px;
      color: #6b7280;
      word-break: break-all;
    }

    .hash-value {
      color: #059669;
    }

    .security-tips {
      margin-top: 16px;
    }

    .tips-title {
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 8px 0;
    }

    .tips-list {
      margin: 0;
      padding-left: 20px;
      color: #4b5563;
      font-size: 13px;
      line-height: 1.6;
    }

    .dismiss-btn {
      margin-top: 16px;
      padding: 10px 20px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .dismiss-btn:hover {
      background: #4338ca;
    }
  `]
})
export class SignatureWarningComponent {
  /** Warning severity */
  severity = input<'warning' | 'critical'>('warning');

  /** Warning title */
  title = input<string>('Security Warning');

  /** Warning message */
  message = input<string>('Please review the details below before signing.');

  /** Document filename */
  filename = input<string>('');

  /** Document hash */
  hash = input<string>('');

  /** Wallet address */
  walletAddress = input<string>('');

  /** Whether to show detailed info */
  showDetails = input<boolean>(true);

  /** Whether warning can be dismissed */
  dismissible = input<boolean>(true);

  /** Emit when dismissed */
  onDismiss = output<void>();
}
