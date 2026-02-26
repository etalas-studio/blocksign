import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { UploadResponse } from '../../../../core/models/document.model';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-upload">
      <div
        class="upload-zone"
        [class.drag-over]="isDragOver"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        @if (uploadState.uploading) {
          <div class="uploading">
            <div class="spinner"></div>
            <p>Uploading...</p>
          </div>
        } @else if (uploadState.file) {
          <div class="file-selected">
            <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>
            <div class="file-info">
              <p class="file-name">{{ uploadState.file.name }}</p>
              <p class="file-size">{{ apiService.formatFileSize(uploadState.file.size) }}</p>
            </div>
          </div>
        } @else {
          <div class="upload-prompt">
            <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Drag & drop your document here</p>
            <p class="hint">or click to browse</p>
          </div>
        }
        <input
          #fileInput
          type="file"
          [accept]="acceptTypes"
          (change)="onFileSelected($event)"
          style="display: none;" />
      </div>
      @if (uploadState.error) {
        <div class="error-message">
          {{ uploadState.error }}
        </div>
      }
    </div>
  `,
  styles: [`
    .file-upload {
      margin-bottom: 20px;
    }

    .upload-zone {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #f9fafb;
    }

    .upload-zone:hover {
      border-color: #667eea;
      background: #f3f4f6;
    }

    .upload-zone.drag-over {
      border-color: #667eea;
      background: #eef2ff;
    }

    .uploading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .file-selected {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .file-icon {
      width: 48px;
      height: 48px;
      color: #10b981;
    }

    .file-info {
      text-align: left;
    }

    .file-name {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .file-size {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }

    .upload-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .upload-icon {
      width: 48px;
      height: 48px;
      color: #9ca3af;
    }

    .upload-prompt p {
      margin: 0;
      font-size: 16px;
      color: #374151;
    }

    .hint {
      font-size: 14px;
      color: #9ca3af;
    }

    .error-message {
      margin-top: 12px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #991b1b;
      font-size: 14px;
    }
  `]
})
export class FileUploadComponent {
  apiService = inject(ApiService);

  @Output() uploadComplete = new EventEmitter<UploadResponse>();

  uploadState = {
    file: null as File | null,
    uploading: false,
    error: null as string | null
  };

  isDragOver = false;
  acceptTypes = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    this.uploadState.error = null;

    // Validate file type
    if (!this.apiService.isFileTypeAllowed(file)) {
      this.uploadState.error = 'File type not allowed. Please upload PDF, DOC, DOCX, TXT, PNG, or JPG.';
      return;
    }

    // Validate file size
    if (!this.apiService.isFileSizeAllowed(file)) {
      this.uploadState.error = 'File size exceeds 10MB limit.';
      return;
    }

    this.uploadState.file = file;
    this.uploadFile();
  }

  private uploadFile(): void {
    if (!this.uploadState.file) return;

    this.uploadState.uploading = true;

    this.apiService.uploadDocument(this.uploadState.file).subscribe({
      next: (response) => {
        this.uploadState.uploading = false;
        this.uploadComplete.emit(response);
      },
      error: (error) => {
        this.uploadState.uploading = false;
        this.uploadState.error = error.message;
      }
    });
  }

  reset(): void {
    this.uploadState = {
      file: null,
      uploading: false,
      error: null
    };
  }
}
