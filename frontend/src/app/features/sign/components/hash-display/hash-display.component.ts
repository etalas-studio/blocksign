import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadResponse } from '../../../../core/models/document.model';

@Component({
  selector: 'app-hash-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hash-display" *ngIf="uploadData">
      <div class="hash-card">
        <div class="hash-header">
          <h3>Document Hash</h3>
          <button
            class="copy-btn"
            (click)="copyHash()"
            [title]="copied ? 'Copied!' : 'Copy to clipboard'">
            @if (copied) {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            }
          </button>
        </div>
        <div class="hash-value">
          {{ truncatedHash }}
        </div>
        <div class="hash-details">
          <div class="detail-row">
            <span class="label">Filename:</span>
            <span class="value">{{ uploadData.filename }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Size:</span>
            <span class="value">{{ formattedSize }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Uploaded:</span>
            <span class="value">{{ formattedDate }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hash-display {
      margin-bottom: 20px;
    }

    .hash-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
    }

    .hash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .hash-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .copy-btn {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: #6b7280;
      transition: color 0.2s;
    }

    .copy-btn:hover {
      color: #667eea;
    }

    .copy-btn svg {
      width: 20px;
      height: 20px;
    }

    .hash-value {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #1f2937;
      word-break: break-all;
      margin-bottom: 16px;
      text-align: center;
    }

    .hash-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }

    .label {
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      color: #1f2937;
      font-weight: 600;
    }
  `]
})
export class HashDisplayComponent {
  uploadData: UploadResponse | null = null;
  copied = false;

  setUploadData(data: UploadResponse): void {
    this.uploadData = data;
  }

  get truncatedHash(): string {
    if (!this.uploadData?.hash) return '';
    const hash = this.uploadData.hash;
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 12)}`;
  }

  get formattedSize(): string {
    if (!this.uploadData?.size) return '';
    return this.formatFileSize(this.uploadData.size);
  }

  get formattedDate(): string {
    if (!this.uploadData?.uploaded_at) return '';
    return new Date(this.uploadData.uploaded_at).toLocaleString();
  }

  copyHash(): void {
    if (this.uploadData?.hash) {
      navigator.clipboard.writeText(this.uploadData.hash);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
