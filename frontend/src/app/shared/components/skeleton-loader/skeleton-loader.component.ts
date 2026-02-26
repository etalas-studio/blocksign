import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton"
      [class.skeleton-text]="type() === 'text'"
      [class.skeleton-circle]="type() === 'circle'"
      [class.skeleton-card]="type() === 'card'"
      [class.skeleton-row]="type() === 'row'"
      [class.skeleton-table]="type() === 'table'"
      [style.width]="width()"
      [style.height]="height()"
    ></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-border-light) 0%,
        #F1F5F9 50%,
        var(--color-border-light) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-md);
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .skeleton-text {
      height: 14px;
      border-radius: 4px;
    }

    .skeleton-circle {
      border-radius: 50%;
    }

    .skeleton-card {
      min-height: 100px;
      padding: var(--spacing-lg);
    }

    .skeleton-row {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .skeleton-row::before,
    .skeleton-row::after {
      content: '';
      background: inherit;
      border-radius: var(--radius-sm);
    }

    .skeleton-row::before {
      flex: 1;
      height: 14px;
    }

    .skeleton-row::after {
      width: 60px;
      height: 14px;
    }

    .skeleton-table {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .skeleton-table::before {
      content: '';
      display: block;
      height: 40px;
      background: inherit;
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-sm);
    }
  `]
})
export class SkeletonLoaderComponent {
  type = input<'text' | 'circle' | 'card' | 'row' | 'table'>('text');
  width = input<string>('100%');
  height = input<string>('auto');
}
