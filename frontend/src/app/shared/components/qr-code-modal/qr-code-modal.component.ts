import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="qr-modal-overlay" (click)="close.emit()">
        <div class="qr-modal-content" (click)="$event.stopPropagation()">
          <div class="qr-modal-header">
            <h3>Share Verification</h3>
            <button class="qr-close-btn" (click)="close.emit()">✕</button>
          </div>

          <div class="qr-modal-body">
            <p class="qr-description">
              Scan to verify this document on blockchain
            </p>

            <div class="qr-code-container">
              <canvas #qrCanvas></canvas>
            </div>

            <div class="qr-url-container">
              <input
                type="text"
                class="qr-url-input"
                [value]="verificationUrl()"
                readonly
              />
              <button class="btn-copy" (click)="copyLink()">Copy</button>
            </div>

            @if (copied()) {
              <p class="qr-copied-text">Link copied to clipboard!</p>
            }

            <div class="qr-actions">
              <button class="btn btn-secondary" (click)="downloadQR('png')">
                Download PNG
              </button>
              <button class="btn btn-secondary" (click)="downloadQR('svg')">
                Download SVG
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .qr-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .qr-modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .qr-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .qr-modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .qr-close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      color: var(--color-text-secondary);
      transition: color var(--transition-fast);
    }

    .qr-close-btn:hover {
      color: var(--color-text-primary);
    }

    .qr-modal-body {
      padding: var(--spacing-lg);
      text-align: center;
    }

    .qr-description {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    .qr-code-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: var(--color-bg);
      border-radius: var(--radius-md);
    }

    .qr-code-container canvas {
      max-width: 100%;
      height: auto;
    }

    .qr-url-container {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }

    .qr-url-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 13px;
      background: var(--color-bg);
      color: var(--color-text-secondary);
    }

    .btn-copy {
      padding: 8px 16px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background var(--transition-fast);
    }

    .btn-copy:hover {
      background: var(--color-primary-hover);
    }

    .qr-copied-text {
      color: var(--color-success);
      font-size: 13px;
      margin-bottom: var(--spacing-md);
      animation: fadeIn 0.3s ease;
    }

    .qr-actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: center;
    }

    .qr-actions .btn {
      flex: 1;
    }
  `]
})
export class QrCodeModalComponent {
  open = input.required<boolean>();
  documentHash = input.required<string>();
  verificationUrl = input.required<string>();
  close = output<void>();

  copied = signal(false);
  qrDataUrl = signal<string>('');

  ngOnChanges() {
    if (this.open() && this.documentHash()) {
      this.generateQRCode();
    }
  }

  private async generateQRCode() {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        await QRCode.toCanvas(canvas, this.verificationUrl(), {
          width: 200,
          margin: 2,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF'
          }
        });
        this.qrDataUrl.set(canvas.toDataURL());
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  copyLink() {
    navigator.clipboard.writeText(this.verificationUrl());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  downloadQR(format: 'png' | 'svg') {
    const link = document.createElement('a');
    const hash = this.documentHash().slice(0, 8);

    if (format === 'png') {
      link.download = `blocksign-${hash}.png`;
      link.href = this.qrDataUrl();
    } else {
      QRCode.toString(this.verificationUrl(), { type: 'svg' }).then(svg => {
        link.download = `blocksign-${hash}.svg`;
        link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        link.click();
      });
      return;
    }

    link.click();
  }
}
