import { Component, input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tooltip-container">
      <ng-content />
      <div
        class="tooltip-content"
        [class.top]="position() === 'top'"
        [class.bottom]="position() === 'bottom'"
        [class.left]="position() === 'left'"
        [class.right]="position() === 'right'"
        [class.show]="show()"
      >
        <div class="tooltip-text">
          <strong class="tooltip-title">{{ title() }}</strong>
          @if (content()) {
            <p class="tooltip-content-text">{{ content() }}</p>
          }
        </div>
        <div class="tooltip-arrow"></div>
      </div>
    </div>
  `,
  styles: [`
    .tooltip-container {
      position: relative;
      display: inline-block;
    }

    .tooltip-content {
      position: absolute;
      z-index: 1000;
      background: #1E293B;
      color: white;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      line-height: 1.4;
      max-width: 280px;
      opacity: 0;
      visibility: hidden;
      transition: all var(--transition-base);
      pointer-events: none;
      box-shadow: var(--shadow-lg);
    }

    .tooltip-content.show {
      opacity: 1;
      visibility: visible;
    }

    .tooltip-content.top {
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(-4px);
    }

    .tooltip-content.top.show {
      transform: translateX(-50%) translateY(0);
    }

    .tooltip-content.bottom {
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
    }

    .tooltip-content.bottom.show {
      transform: translateX(-50%) translateY(0);
    }

    .tooltip-content.left {
      right: calc(100% + 8px);
      top: 50%;
      transform: translateY(-50%) translateX(-4px);
    }

    .tooltip-content.left.show {
      transform: translateY(-50%) translateX(0);
    }

    .tooltip-content.right {
      left: calc(100% + 8px);
      top: 50%;
      transform: translateY(-50%) translateX(4px);
    }

    .tooltip-content.right.show {
      transform: translateY(-50%) translateX(0);
    }

    .tooltip-text {
      position: relative;
      z-index: 1;
    }

    .tooltip-title {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .tooltip-content-text {
      margin: 0;
      color: #CBD5E1;
    }

    .tooltip-arrow {
      position: absolute;
      width: 0;
      height: 0;
      border: 6px solid transparent;
    }

    .tooltip-content.top .tooltip-arrow {
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      border-top-color: #1E293B;
    }

    .tooltip-content.bottom .tooltip-arrow {
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-color: #1E293B;
    }

    .tooltip-content.left .tooltip-arrow {
      right: -12px;
      top: 50%;
      transform: translateY(-50%);
      border-left-color: #1E293B;
    }

    .tooltip-content.right .tooltip-arrow {
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      border-right-color: #1E293B;
    }

    .tooltip-container:hover .tooltip-content {
      opacity: 1;
      visibility: visible;
    }

    .tooltip-container:hover .tooltip-content.top {
      transform: translateX(-50%) translateY(0);
    }

    .tooltip-container:hover .tooltip-content.bottom {
      transform: translateX(-50%) translateY(0);
    }

    .tooltip-container:hover .tooltip-content.left {
      transform: translateY(-50%) translateX(0);
    }

    .tooltip-container:hover .tooltip-content.right {
      transform: translateY(-50%) translateX(0);
    }
  `]
})
export class TooltipComponent {
  title = input.required<string>();
  content = input<string>('');
  position = input<'top' | 'bottom' | 'left' | 'right'>('top');
  show = input(false, { transform: booleanAttribute });
}
