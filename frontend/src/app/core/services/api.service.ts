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
import {
  DocumentsResponse,
  DocumentMetrics,
  DocumentResponse,
  DocumentsQueryParams,
  AuditLogsResponse,
  AuditStats,
  AuditQueryParams,
  AuditFilters,
  BlockchainStatsResponse,
  TransactionsResponse,
  TransactionQueryParams,
  ContractInfo
} from '../models/api.model';

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
   * Get document by hash (alias for getUploadByHash)
   */
  getDocumentByHash(hash: string): Observable<HashResponse[]> {
    return this.getUploadByHash(hash);
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

  // ========================================================================
  // Documents API Methods
  // ========================================================================

  /**
   * Get documents with pagination and filters
   */
  getDocuments(params?: DocumentsQueryParams): Observable<DocumentsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.wallet) httpParams = httpParams.set('wallet', params.wallet);
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
      if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);
    }

    return this.http.get<DocumentsResponse>(`${this.apiUrl}/api/documents`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error getting documents:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get document metrics
   */
  getDocumentMetrics(wallet?: string): Observable<DocumentMetrics> {
    let httpParams = new HttpParams();
    if (wallet) httpParams = httpParams.set('wallet', wallet);

    return this.http.get<DocumentMetrics>(`${this.apiUrl}/api/documents/metrics`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error getting document metrics:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get document by hash
   */
  getDocumentDetails(hash: string): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.apiUrl}/api/documents/${hash}`).pipe(
      catchError(error => {
        console.error('Error getting document details:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ========================================================================
  // Audit Trail API Methods
  // ========================================================================

  /**
   * Get audit logs with filters
   */
  getAuditLogs(params?: AuditQueryParams): Observable<AuditLogsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.event_type) httpParams = httpParams.set('event_type', params.event_type);
      if (params.wallet) httpParams = httpParams.set('wallet', params.wallet);
      if (params.document_hash) httpParams = httpParams.set('document_hash', params.document_hash);
      if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
      if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http.get<AuditLogsResponse>(`${this.apiUrl}/api/audit`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error getting audit logs:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get audit statistics
   */
  getAuditStats(filters?: AuditFilters): Observable<AuditStats> {
    let httpParams = new HttpParams();

    if (filters) {
      if (filters.wallet) httpParams = httpParams.set('wallet', filters.wallet);
      if (filters.event_type) httpParams = httpParams.set('event_type', filters.event_type);
      if (filters.start_date) httpParams = httpParams.set('start_date', filters.start_date);
      if (filters.end_date) httpParams = httpParams.set('end_date', filters.end_date);
    }

    return this.http.get<AuditStats>(`${this.apiUrl}/api/audit/stats`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error getting audit stats:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Export audit logs
   */
  exportAuditLogs(filters: AuditFilters, format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    const body = { filters, format };

    return this.http.post(`${this.apiUrl}/api/audit/export`, body, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': format === 'csv' ? 'text/csv' : 'application/json'
      })
    }).pipe(
      catchError(error => {
        console.error('Error exporting audit logs:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // ========================================================================
  // Blockchain API Methods
  // ========================================================================

  /**
   * Get blockchain statistics
   */
  getBlockchainStats(): Observable<BlockchainStatsResponse> {
    return this.http.get<BlockchainStatsResponse>(`${this.apiUrl}/api/blockchain/stats`).pipe(
      catchError(error => {
        console.error('Error getting blockchain stats:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get blockchain transactions
   */
  getTransactions(params?: TransactionQueryParams): Observable<TransactionsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.wallet) httpParams = httpParams.set('wallet', params.wallet);
      if (params.document_hash) httpParams = httpParams.set('document_hash', params.document_hash);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http.get<TransactionsResponse>(`${this.apiUrl}/api/blockchain/transactions`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error getting transactions:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Get contract information
   */
  getContractInfo(): Observable<ContractInfo> {
    return this.http.get<ContractInfo>(`${this.apiUrl}/api/blockchain/contract`).pipe(
      catchError(error => {
        console.error('Error getting contract info:', error);
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
