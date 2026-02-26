import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'app-tooltip-icon',
  standalone: true,
  imports: [CommonModule, TooltipComponent],
  template: `
    <app-tooltip [title]="title()" [content]="content()" [position]="position()">
      <span class="help-icon">?</span>
    </app-tooltip>
  `,
  styles: [`
    .help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: var(--color-info);
      color: white;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 600;
      cursor: help;
      margin-left: 4px;
      transition: all var(--transition-fast);
    }

    .help-icon:hover {
      background: var(--color-trust-blue);
      transform: scale(1.1);
    }
  `]
})
export class TooltipIconComponent {
  title = input.required<string>();
  content = input<string>('');
  position = input<'top' | 'bottom' | 'left' | 'right'>('top');
}
