import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  UploadResponse,
  HashResponse,
  TransactionHashRequest,
  VerificationResponse
} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.backendUrl;

  /**
   * Upload document and get hash
   */
  uploadDocument(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/api/upload`, formData).pipe(
      catchError(error => {
        console.error('Error uploading document:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get upload by ID
   */
  getUploadById(id: string): Observable<HashResponse> {
    return this.http.get<HashResponse>(`${this.apiUrl}/api/hash/${id}`).pipe(
      catchError(error => {
        console.error('Error getting upload by ID:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get uploads by document hash
   */
  getUploadByHash(hash: string): Observable<HashResponse[]> {
    return this.http.get<HashResponse[]>(`${this.apiUrl}/api/document/${hash}`).pipe(
      catchError(error => {
        console.error('Error getting upload by hash:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Store transaction hash for a document
   */
  storeTransaction(
    docHash: string,
    txHash: string,
    signer: string
  ): Observable<void> {
    const body: TransactionHashRequest = {
      tx_hash: txHash,
      signer
    };

    return this.http.post<void>(`${this.apiUrl}/api/tx/${docHash}`, body).pipe(
      catchError(error => {
        console.error('Error storing transaction:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Verify document on blockchain
   */
  verifyDocument(hash: string): Observable<VerificationResponse> {
    return this.http.get<any>(`${this.apiUrl}/api/verify/${hash}`).pipe(
      map(response => ({
        hash: response.hash,
        signatures: response.signatures || [],
        verified: response.verified || false
      })),
      catchError(error => {
        console.error('Error verifying document:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Health check
   */
  healthCheck(): Observable<{ status: string; service: string; version: string }> {
    return this.http.get<{ status: string; service: string; version: string }>(
      `${this.apiUrl}/health`
    ).pipe(
      catchError(error => {
        console.error('Health check failed:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Error {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 413:
          errorMessage = 'File too large';
          break;
        case 500:
          errorMessage = 'Server error';
          break;
        default:
          errorMessage = error.error?.message || `Error Code: ${error.status}`;
      }
    }

    return new Error(errorMessage);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file type is allowed
   */
  isFileTypeAllowed(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    return allowedTypes.includes(file.type);
  }

  /**
   * Check if file size is within limits
   */
  isFileSizeAllowed(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }
}
