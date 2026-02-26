import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-state-icon">{{ icon() }}</div>
      <h3 class="empty-state-title">{{ title() }}</h3>
      <p class="empty-state-description">{{ description() }}</p>
      @if (actionText()) {
        <button class="btn btn-primary" (click)="action.emit()">
          {{ actionText() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
      text-align: center;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: var(--spacing-lg);
      opacity: 0.5;
    }

    .empty-state-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .empty-state-description {
      font-size: 14px;
      color: var(--color-text-secondary);
      max-width: 400px;
      margin: 0 0 var(--spacing-lg) 0;
    }

    .empty-state .btn {
      margin-top: var(--spacing-md);
    }
  `]
})
export class EmptyStateComponent {
  icon = input<string>('📭');
  title = input.required<string>();
  description = input.required<string>();
  actionText = input<string>('');
  action = output<void>();
}
