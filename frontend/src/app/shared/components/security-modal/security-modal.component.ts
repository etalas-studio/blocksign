import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfettiService } from '../../../core/services/confetti.service';

/**
 * Security education modal for first-time users
 * Covers phishing prevention and security best practices
 */
@Component({
  selector: 'app-security-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onClose.emit()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🔐 Security Guide</h2>
            <button class="close-btn" (click)="onClose.emit()">×</button>
          </div>

          <div class="modal-body">
            <div class="progress-dots">
              @for (step of steps; track step) {
                <div class="dot" [class.active]="currentStep() === step" [class.completed]="currentStep() > step"></div>
              }
            </div>

            @switch (currentStep()) {
              @case (1) {
                <div class="step-content animate-fade-in">
                  <h3>Welcome to BlockSign 🔒</h3>
                  <p>
                    BlockSign uses blockchain technology to create <strong>tamper-proof</strong> digital signatures.
                    Your documents are cryptographically secured and verifiable by anyone.
                  </p>
                  <div class="tip-box">
                    <span class="tip-icon">💡</span>
                    <p>Your signature is legally binding and impossible to forge.</p>
                  </div>
                </div>
              }

              @case (2) {
                <div class="step-content animate-fade-in">
                  <h3>Recognize Legitimate Transactions ✅</h3>
                  <p>A genuine BlockSign transaction will always:</p>
                  <ul class="check-list">
                    <li>✓ Show your exact document hash</li>
                    <li>✓ Display the correct contract address</li>
                    <li>✓ Use a reasonable gas fee</li>
                    <li>✓ Come from blocksign.dev (in production)</li>
                  </ul>
                  <div class="warning-box">
                    <span class="warning-icon">⚠️</span>
                    <p>Never sign if the hash doesn't match your document!</p>
                  </div>
                </div>
              }

              @case (3) {
                <div class="step-content animate-fade-in">
                  <h3>Protect Your Wallet 🛡️</h3>
                  <p><strong>NEVER share these with anyone:</strong></p>
                  <ul class="danger-list">
                    <li>🔴 Your private key</li>
                    <li>🔴 Your 12/24 word seed phrase</li>
                    <li>🔴 Your password</li>
                  </ul>
                  <p class="note">
                    BlockSign staff will NEVER ask for these. Anyone asking is trying to steal your funds.
                  </p>
                </div>
              }

              @case (4) {
                <div class="step-content animate-fade-in">
                  <h3>Phishing Attacks 🎣</h3>
                  <p><strong>Warning signs of phishing:</strong></p>
                  <ul class="warning-list">
                    <li>⚠️ Requests to sign unexpected transactions</li>
                    <li>⚠️ Urgent messages threatening account loss</li>
                    <li>⚠️ Fake URLs that look similar to blocksign.dev</li>
                    <li>⚠️ Requests for your private key or seed phrase</li>
                  </ul>
                  <div class="tip-box">
                    <span class="tip-icon">💡</span>
                    <p>When in doubt, close the tab and come back directly to blocksign.dev</p>
                  </div>
                </div>
              }

              @case (5) {
                <div class="step-content animate-fade-in">
                  <h3>You're All Set! 🎉</h3>
                  <p>
                    Remember these key points:
                  </p>
                  <div class="recap-box">
                    <p>✅ Only sign transactions you initiate</p>
                    <p>✅ Verify the document hash before signing</p>
                    <p>✅ Never share your private key</p>
                    <p>✅ Check the URL is blocksign.dev</p>
                  </div>
                  <p class="final-note">
                    Stay safe and happy signing! 🚀
                  </p>
                </div>
              }
            }
          </div>

          <div class="modal-footer">
            @if (currentStep() > 1) {
              <button class="btn-secondary" (click)="previousStep()">Back</button>
            }
            @if (currentStep() < 5) {
              <button class="btn-primary" (click)="nextStep()">Next</button>
            } @else {
              <button class="btn-primary" (click)="complete()">Got it! 👍</button>
            }
            <button class="btn-text" (click)="skip()">Skip Tour</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-container {
      background: white;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 32px;
      color: #6b7280;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .close-btn:hover {
      background: #f3f4f6;
    }

    .modal-body {
      padding: 32px 24px;
    }

    .progress-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d1d5db;
      transition: all 0.3s;
    }

    .dot.active {
      background: #4f46e5;
      transform: scale(1.5);
    }

    .dot.completed {
      background: #10b981;
    }

    .step-content {
      text-align: center;
    }

    .step-content h3 {
      font-size: 24px;
      color: #1f2937;
      margin: 0 0 16px 0;
    }

    .step-content p {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .step-content ul {
      text-align: left;
      margin: 16px 0;
      padding-left: 24px;
    }

    .step-content li {
      color: #4b5563;
      line-height: 1.8;
      font-size: 15px;
    }

    .check-list li {
      color: #059669;
    }

    .danger-list li {
      color: #dc2626;
      font-weight: 500;
    }

    .warning-list li {
      color: #d97706;
    }

    .tip-box, .warning-box, .recap-box {
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 16px;
      border-radius: 8px;
      text-align: left;
      margin: 16px 0;
    }

    .warning-box {
      background: #fef3c7;
      border-left-color: #f59e0b;
    }

    .recap-box {
      background: #f0fdf4;
      border-left-color: #22c55e;
    }

    .tip-box p, .warning-box p, .recap-box p {
      margin: 0;
    }

    .tip-icon, .warning-icon {
      font-size: 20px;
      margin-right: 8px;
    }

    .note {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
    }

    .final-note {
      font-weight: 600;
      color: #4f46e5;
      margin-top: 24px;
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      border-top: 1px solid #e5e7eb;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary, .btn-text {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-size: 15px;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-secondary {
      background: #e5e7eb;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #d1d5db;
    }

    .btn-text {
      background: none;
      color: #6b7280;
    }

    .btn-text:hover {
      color: #374151;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SecurityModalComponent {
  isOpen = signal<boolean>(true);
  currentStep = signal<number>(1);
  steps = [1, 2, 3, 4, 5];

  /** Emit when modal is closed */
  onClose = output<void>();

  /** Emit when tour is completed */
  onComplete = output<void>();

  constructor(private confetti: ConfettiService) {}

  nextStep(): void {
    if (this.currentStep() < 5) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  skip(): void {
    this.onClose.emit();
  }

  complete(): void {
    this.confetti.trigger('celebration');
    this.onComplete.emit();
    this.onClose.emit();
  }
}
