import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type TransactionStep = 'initializing' | 'signing' | 'submitting' | 'submitted' | 'confirming' | 'confirmed' | 'failed';
type TransactionStatus = 'pending' | 'in-progress' | 'completed' | 'error';

interface TransactionStepInfo {
  key: TransactionStep;
  label: string;
  description: string;
  icon: string;
}

const STEPS: TransactionStepInfo[] = [
  { key: 'initializing', label: 'Initializing', description: 'Preparing transaction', icon: '⚙️' },
  { key: 'signing', label: 'Signing', description: 'Please confirm in wallet', icon: '✍️' },
  { key: 'submitting', label: 'Submitting', description: 'Sending to network', icon: '📤' },
  { key: 'submitted', label: 'Submitted', description: 'Transaction in mempool', icon: '⏳' },
  { key: 'confirming', label: 'Confirming', description: 'Waiting for confirmations', icon: '🔗' },
  { key: 'confirmed', label: 'Confirmed', description: 'Transaction successful', icon: '✅' },
  { key: 'failed', label: 'Failed', description: 'Transaction failed', icon: '❌' }
];

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="tx-modal-overlay" (click)="onOverlayClick()">
        <div class="tx-modal-content" (click)="$event.stopPropagation()">
          <div class="tx-modal-header">
            <h3>Transaction Progress</h3>
            @if (canClose()) {
              <button class="tx-close-btn" (click)="close.emit()">✕</button>
            }
          </div>

          <div class="tx-modal-body">
            <!-- Current Step -->
            <div class="tx-current-step">
              <div class="tx-step-icon">{{ currentStepInfo().icon }}</div>
              <div class="tx-step-info">
                <h4 class="tx-step-label">{{ currentStepInfo().label }}</h4>
                <p class="tx-step-description">{{ currentStepInfo().description }}</p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="tx-progress-container">
              <div class="tx-progress-bar">
                <div
                  class="tx-progress-fill"
                  [style.width.%]="progressPercent()"
                  [class.completed]="isCompleted()"
                  [class.error]="isFailed()"
                ></div>
              </div>
              <span class="tx-progress-text">{{ progressPercent() }}%</span>
            </div>

            <!-- Steps List -->
            <div class="tx-steps-list">
              @for (step of allSteps(); track step.key) {
                <div
                  class="tx-step-item"
                  [class.active]="step.key === currentStep()"
                  [class.completed]="isStepCompleted(step.key)"
                  [class.error]="step.key === 'failed' && isFailed()"
                >
                  <div class="tx-step-indicator">
                    @if (isStepCompleted(step.key)) {
                      <span class="tx-checkmark">✓</span>
                    } @else if (step.key === currentStep()) {
                      <div class="tx-spinner"></div>
                    } @else {
                      <span class="tx-step-number">{{ getStepNumber(step.key) }}</span>
                    }
                  </div>
                  <div class="tx-step-details">
                    <span class="tx-step-name">{{ step.label }}</span>
                    <span class="tx-step-desc">{{ step.description }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Transaction Details -->
            @if (txHash()) {
              <div class="tx-details">
                <div class="tx-detail-row">
                  <span class="tx-detail-label">Transaction Hash:</span>
                  <span class="tx-detail-value">{{ txHash()?.slice(0, 10) }}...</span>
                  <button class="tx-copy-btn" (click)="copyTxHash()">📋</button>
                </div>
                @if (confirmations() !== null) {
                  <div class="tx-detail-row">
                    <span class="tx-detail-label">Confirmations:</span>
                    <span class="tx-detail-value">{{ confirmations() }} / 12</span>
                  </div>
                }
                @if (gasEstimate()) {
                  <div class="tx-detail-row">
                    <span class="tx-detail-label">Est. Gas Cost:</span>
                    <span class="tx-detail-value">{{ gasEstimate() }} ETH</span>
                  </div>
                }
              </div>
            }

            <!-- Error Message -->
            @if (isFailed() && errorMessage()) {
              <div class="tx-error">
                <span class="tx-error-icon">⚠️</span>
                <span class="tx-error-message">{{ errorMessage() }}</span>
              </div>
            }

            <!-- Actions -->
            <div class="tx-actions">
              @if (isFailed()) {
                <button class="btn btn-primary" (click)="retry.emit()">Retry</button>
              }
              @if (isCompleted() && blockExplorerUrl()) {
                <a
                  [href]="blockExplorerUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-outline"
                >
                  View on Explorer
                </a>
              }
              @if (canClose()) {
                <button class="btn btn-secondary" (click)="close.emit()">Close</button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tx-modal-overlay {
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
      animation: fadeIn 0.2s ease;
      backdrop-filter: blur(4px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .tx-modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 480px;
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

    .tx-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .tx-modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .tx-close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      color: var(--color-text-secondary);
      transition: color var(--transition-fast);
    }

    .tx-close-btn:hover {
      color: var(--color-text-primary);
    }

    .tx-modal-body {
      padding: var(--spacing-lg);
    }

    .tx-current-step {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: var(--color-bg);
      border-radius: var(--radius-md);
    }

    .tx-step-icon {
      font-size: 32px;
    }

    .tx-step-info h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .tx-step-info p {
      margin: 0;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .tx-progress-container {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }

    .tx-progress-bar {
      flex: 1;
      height: 8px;
      background: var(--color-border);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .tx-progress-fill {
      height: 100%;
      background: var(--color-primary);
      transition: width 0.3s ease;
    }

    .tx-progress-fill.completed {
      background: var(--color-success);
    }

    .tx-progress-fill.error {
      background: var(--color-error);
    }

    .tx-progress-text {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
      min-width: 45px;
      text-align: right;
    }

    .tx-steps-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }

    .tx-step-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm);
      border-radius: var(--radius-md);
      transition: background var(--transition-fast);
    }

    .tx-step-item.active {
      background: rgba(34, 197, 94, 0.1);
    }

    .tx-step-item.completed {
      opacity: 0.6;
    }

    .tx-step-indicator {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--color-border);
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .tx-step-item.active .tx-step-indicator {
      background: var(--color-primary);
      color: white;
    }

    .tx-step-item.completed .tx-step-indicator {
      background: var(--color-success);
      color: white;
    }

    .tx-step-item.error .tx-step-indicator {
      background: var(--color-error);
      color: white;
    }

    .tx-checkmark {
      font-size: 14px;
    }

    .tx-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tx-step-number {
      font-size: 12px;
    }

    .tx-step-details {
      display: flex;
      flex-direction: column;
    }

    .tx-step-name {
      font-size: 14px;
      font-weight: 500;
    }

    .tx-step-desc {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .tx-details {
      padding: var(--spacing-md);
      background: var(--color-bg);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .tx-detail-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 13px;
    }

    .tx-detail-label {
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .tx-detail-value {
      color: var(--color-text-primary);
      font-family: monospace;
    }

    .tx-copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 2px;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
    }

    .tx-copy-btn:hover {
      opacity: 1;
    }

    .tx-error {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-lg);
    }

    .tx-error-icon {
      font-size: 18px;
    }

    .tx-error-message {
      color: var(--color-error);
      font-size: 13px;
    }

    .tx-actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
    }
  `]
})
export class TransactionModalComponent {
  open = input(false);
  currentStep = input<TransactionStep>('initializing');
  txHash = input<string | null>(null);
  confirmations = input<number | null>(null);
  gasEstimate = input<string | null>(null);
  errorMessage = input<string | null>(null);
  blockExplorerUrl = input<string | null>(null);

  close = output<void>();
  retry = output<void>();

  allSteps = () => STEPS;

  currentStepInfo = computed(() => {
    return STEPS.find(s => s.key === this.currentStep()) || STEPS[0];
  });

  progressPercent = computed(() => {
    const stepIndex = STEPS.findIndex(s => s.key === this.currentStep());
    const totalSteps = STEPS.length;
    if (this.currentStep() === 'failed') return 0;
    if (this.currentStep() === 'confirmed') return 100;
    return Math.round(((stepIndex + 1) / totalSteps) * 100);
  });

  isCompleted = () => this.currentStep() === 'confirmed';
  isFailed = () => this.currentStep() === 'failed';
  canClose = () => this.isCompleted() || this.isFailed();

  isStepCompleted(stepKey: TransactionStep): boolean {
    const currentIndex = STEPS.findIndex(s => s.key === this.currentStep());
    const stepIndex = STEPS.findIndex(s => s.key === stepKey);
    return stepIndex < currentIndex;
  }

  getStepNumber(stepKey: TransactionStep): number {
    return STEPS.findIndex(s => s.key === stepKey) + 1;
  }

  onOverlayClick() {
    if (this.canClose()) {
      this.close.emit();
    }
  }

  copyTxHash() {
    if (this.txHash()) {
      navigator.clipboard.writeText(this.txHash()!);
    }
  }
}
