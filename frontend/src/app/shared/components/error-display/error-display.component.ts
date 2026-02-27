import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-display">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="error-content">
        <h3 class="error-title">{{ title() }}</h3>
        <p class="error-message">{{ message() }}</p>
      </div>
      @if (showRetry()) {
        <button class="retry-button" (click)="retry.emit()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Retry
        </button>
      }
    </div>
  `,
  styles: [`
    .error-display {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #fee;
      border: 1px solid #f88;
      border-radius: 0.5rem;
      color: #c33;
    }

    .error-icon {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f88;
      border-radius: 50%;
    }

    .error-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #c33;
    }

    .error-message {
      margin: 0;
      font-size: 0.875rem;
      color: #966;
    }

    .retry-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #c33;
      color: white;
      border: none;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .retry-button:hover {
      background: #a22;
    }

    .retry-button svg {
      width: 1rem;
      height: 1rem;
    }
  `]
})
export class ErrorDisplayComponent {
  message = input.required<string>();
  title = input('Error Occurred');
  showRetry = input(true);
  retry = output<void>();
}
