import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  action?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to BlockSign',
    description: 'Blockchain-based digital signatures that are immutable, verifiable, and court-grade. Your documents are cryptographically secured on the Polygon network.',
    icon: '🛡️'
  },
  {
    title: 'Upload Your Document',
    description: 'Upload any PDF, Word document, or image. We\'ll create a unique cryptographic fingerprint (hash) that proves the document\'s integrity.',
    icon: '📄'
  },
  {
    title: 'Sign with Your Wallet',
    description: 'Connect your MetaMask wallet to sign. Your cryptographic signature is recorded on the blockchain, creating undeniable proof of signing.',
    icon: '✍️'
  },
  {
    title: 'Immutable Blockchain Proof',
    description: 'Once signed, the signature is permanently recorded on Polygon Amoy testnet. Anyone can verify the document\'s authenticity at any time.',
    icon: '⛓️'
  },
  {
    title: 'Share & Verify',
    description: 'Share a QR code or link for others to verify. The blockchain provides neutral, third-party verification that cannot be forged.',
    icon: '✅'
  }
];

@Component({
  selector: 'app-onboarding-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="onboarding-overlay" (click)="close.emit()">
        <div class="onboarding-content" (click)="$event.stopPropagation()">
          <div class="onboarding-header">
            <div class="progress-dots">
              @for (step of allSteps(); track $index; let i = $index) {
                <div
                  class="dot"
                  [class.active]="currentStep() === i"
                  [class.completed]="i < currentStep()"
                ></div>
              }
            </div>
            @if (currentStep() > 0) {
              <button class="skip-btn" (click)="skip()">Skip Tour</button>
            }
          </div>

          <div class="onboarding-body">
            <div class="step-icon">{{ currentStepInfo().icon }}</div>
            <h2 class="step-title">{{ currentStepInfo().title }}</h2>
            <p class="step-description">{{ currentStepInfo().description }}</p>

            @if (currentStep() === 0) {
              <div class="demo-option">
                <label class="demo-checkbox">
                  <input
                    type="checkbox"
                    [checked]="useDemo()"
                    (change)="toggleDemo($event)"
                  />
                  <span>Start with demo document</span>
                </label>
              </div>
            }

            @if (showHighlight()) {
              <div class="highlight-info">
                <span class="highlight-icon">👆</span>
                <span>Look for the highlighted area</span>
              </div>
            }
          </div>

          <div class="onboarding-footer">
            @if (currentStep() > 0) {
              <button class="btn btn-secondary" (click)="previous()">
                ← Previous
              </button>
            }

            @if (isLastStep()) {
              <button class="btn btn-primary" (click)="finish()">
                Get Started →
              </button>
            } @else {
              <button class="btn btn-primary" (click)="next()">
                Next →
              </button>
            }
          </div>

          @if (currentStep() === allSteps().length - 1) {
            <div class="completion-badge">
              <span class="badge-icon">🎉</span>
              <span class="badge-text">You're ready!</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .onboarding-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.3s ease;
      backdrop-filter: blur(8px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .onboarding-content {
      background: white;
      border-radius: var(--radius-xl);
      width: 90%;
      max-width: 520px;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.4s ease;
      padding: var(--spacing-xl);
      position: relative;
    }

    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .onboarding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .progress-dots {
      display: flex;
      gap: 8px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-border);
      transition: all var(--transition-base);
    }

    .dot.active {
      background: var(--color-primary);
      width: 24px;
      border-radius: 4px;
    }

    .dot.completed {
      background: var(--color-success);
    }

    .skip-btn {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      font-size: 13px;
      padding: 4px 8px;
      transition: color var(--transition-fast);
    }

    .skip-btn:hover {
      color: var(--color-primary);
    }

    .onboarding-body {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }

    .step-icon {
      font-size: 64px;
      margin-bottom: var(--spacing-lg);
      display: inline-block;
      animation: bounce 2s ease infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .step-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-md) 0;
    }

    .step-description {
      font-size: 16px;
      line-height: 1.6;
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-lg) 0;
    }

    .demo-option {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md);
      background: var(--color-bg);
      border-radius: var(--radius-md);
      display: inline-block;
    }

    .demo-checkbox {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      font-size: 14px;
      color: var(--color-text-primary);
    }

    .demo-checkbox input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .highlight-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-lg);
      padding: var(--spacing-sm) var(--spacing-md);
      background: rgba(34, 197, 94, 0.1);
      border-radius: var(--radius-md);
      font-size: 13px;
      color: var(--color-success);
      font-weight: 500;
    }

    .highlight-icon {
      font-size: 18px;
    }

    .onboarding-footer {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
    }

    .completion-badge {
      position: absolute;
      top: -20px;
      right: -20px;
      background: var(--color-primary);
      color: white;
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      box-shadow: var(--shadow-md);
      animation: scaleIn 0.3s ease;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    .badge-icon {
      font-size: 20px;
    }

    .badge-text {
      font-size: 14px;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .onboarding-content {
        padding: var(--spacing-lg);
      }

      .step-icon {
        font-size: 48px;
      }

      .step-title {
        font-size: 20px;
      }

      .step-description {
        font-size: 14px;
      }

      .onboarding-footer {
        flex-direction: column;
      }

      .onboarding-footer .btn {
        width: 100%;
      }
    }
  `]
})
export class OnboardingModalComponent {
  open = input(false);
  close = output<void>();
  complete = output<{ useDemo: boolean }>();

  currentStep = signal(0);
  useDemo = signal(false);
  showHighlight = signal(false);

  allSteps = () => ONBOARDING_STEPS;

  currentStepInfo = computed(() => {
    return ONBOARDING_STEPS[this.currentStep()];
  });

  isLastStep = () => this.currentStep() === ONBOARDING_STEPS.length - 1;

  next(): void {
    if (this.currentStep() < ONBOARDING_STEPS.length - 1) {
      this.currentStep.set(this.currentStep() + 1);
      this.updateHighlight();
    }
  }

  previous(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
      this.updateHighlight();
    }
  }

  skip(): void {
    this.complete.emit({ useDemo: this.useDemo() });
  }

  finish(): void {
    this.complete.emit({ useDemo: this.useDemo() });
  }

  toggleDemo(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.useDemo.set(checkbox.checked);
  }

  private updateHighlight(): void {
    // Show highlight indicator for certain steps
    this.showHighlight.set([1, 2].includes(this.currentStep()));
  }
}
