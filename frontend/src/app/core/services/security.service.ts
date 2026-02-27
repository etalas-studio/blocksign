import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Security service for managing security-related state and operations
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  /** Whether security modal has been shown */
  private securityModalShown = signal<boolean>(false);

  /** Current security warnings */
  private warnings = signal<string[]>([]);

  private apiUrl = environment.backendUrl;

  constructor(private http: HttpClient) {
    this.checkSecurityModalShown();
  }

  /**
   * Check if security modal should be shown
   */
  private checkSecurityModalShown(): void {
    const shown = localStorage.getItem('blocksign_security_modal_shown');
    this.securityModalShown.set(shown === 'true');
  }

  /**
   * Mark security modal as shown
   */
  markSecurityModalShown(): void {
    localStorage.setItem('blocksign_security_modal_shown', 'true');
    this.securityModalShown.set(true);
  }

  /**
   * Check if security modal should be displayed
   */
  shouldShowSecurityModal(): boolean {
    return !this.securityModalShown();
  }

  /**
   * Add a security warning
   */
  addWarning(warning: string): void {
    this.warnings.update(warnings => [...warnings, warning]);
  }

  /**
   * Clear all warnings
   */
  clearWarnings(): void {
    this.warnings.set([]);
  }

  /**
   * Get current warnings
   */
  getWarnings(): string[] {
    return this.warnings();
  }

  /**
   * Format signature message for signing
   */
  formatSignatureMessage(data: {
    filename: string;
    hash: string;
    timestamp: string;
    nonce: string;
  }): string {
    return `
IMPORTANT: Only sign if you initiated this request on BlockSign!

Document: ${data.filename}
Hash: ${data.hash}
Timestamp: ${data.timestamp}
Nonce: ${data.nonce}

I confirm I want to sign this document on BlockSign.
    `.trim();
  }

  /**
   * Generate nonce for signing
   */
  async generateNonce(walletAddress: string, documentHash?: string): Promise<string> {
    try {
      const response$ = this.http.post<{ nonce: string }>(`${this.apiUrl}/api/nonce`, {
        wallet: walletAddress,
        documentHash
      });
      const response = await firstValueFrom(response$);
      return response.nonce;
    } catch (error) {
      console.error('Failed to generate nonce:', error);
      throw new Error('Failed to generate security nonce. Please try again.');
    }
  }

  /**
   * Validate nonce before use
   */
  async validateNonce(nonce: string): Promise<boolean> {
    try {
      const response$ = this.http.post<{ valid: boolean }>(`${this.apiUrl}/api/nonce/validate`, { nonce });
      const response = await firstValueFrom(response$);
      return response.valid;
    } catch (error) {
      console.error('Failed to validate nonce:', error);
      return false;
    }
  }

  /**
   * Check for phishing indicators
   */
  checkPhishingIndicators(): string[] {
    const indicators: string[] = [];

    // Check if running in a suspicious iframe
    if (window.self !== window.top) {
      indicators.push('WARNING: App is running in an iframe. This could be a phishing attempt.');
    }

    // Check for suspicious URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('wallet') || urlParams.has('private_key')) {
      indicators.push('WARNING: Suspicious URL parameters detected. Never share your private key.');
    }

    // Check if on correct domain (for production)
    if (window.location.hostname !== 'localhost' && !window.location.hostname.endsWith('.blocksign.dev')) {
      indicators.push('WARNING: You may not be on the official BlockSign website.');
    }

    return indicators;
  }

  /**
   * Verify file is safe to upload
   */
  validateFileUpload(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` };
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type "${file.type}" is not allowed. Allowed types: PDF, DOC, DOCX, TXT, PNG, JPEG` };
    }

    return { valid: true };
  }

  /**
   * Get transaction security tips
   */
  getTransactionSecurityTips(): string[] {
    return [
      'Only sign transactions you initiated yourself',
      'Never share your private key or seed phrase',
      'Verify the contract address before signing',
      'Check the transaction fee (gas) is reasonable',
      'BlockSign will never ask for your private key',
      'Always verify the document hash matches what you expect to sign'
    ];
  }
}
