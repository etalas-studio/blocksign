import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface HashProgress {
  bytesProcessed: number;
  totalBytes: number;
  percentage: number;
  estimatedTimeRemaining?: number;
}

export interface HashResult {
  hash: string;
  fileName: string;
  fileSize: number;
  computationTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentHasherService {
  private apiService = inject(ApiService);
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks for large files

  /**
   * Compute SHA-256 hash of a file entirely in the browser
   * Uses Web Crypto API for performance and security
   */
  async computeHash(
    file: File,
    progressCallback?: (progress: HashProgress) => void
  ): Promise<HashResult> {
    const startTime = Date.now();
    const fileSize = file.size;
    let bytesProcessed = 0;

    try {
      // For small files (< 10MB), read all at once
      if (fileSize < 10 * 1024 * 1024) {
        const hash = await this.hashFile(file);
        return {
          hash,
          fileName: file.name,
          fileSize: file.size,
          computationTime: Date.now() - startTime
        };
      }

      // For large files, process in chunks with progress reporting
      const hash = await this.hashFileInChunks(file, (chunkProgress) => {
        bytesProcessed = chunkProgress.bytesProcessed;
        const percentage = Math.round((bytesProcessed / fileSize) * 100);

        // Estimate time remaining
        const elapsed = Date.now() - startTime;
        const bytesPerMs = bytesProcessed / elapsed;
        const remainingBytes = fileSize - bytesProcessed;
        const estimatedTimeRemaining = bytesPerMs > 0
          ? Math.round(remainingBytes / bytesPerMs)
          : undefined;

        progressCallback?.({
          bytesProcessed,
          totalBytes: fileSize,
          percentage,
          estimatedTimeRemaining
        });
      });

      return {
        hash,
        fileName: file.name,
        fileSize: file.size,
        computationTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error computing hash:', error);
      throw new Error('Failed to compute document hash. Please try again.');
    }
  }

  /**
   * Hash a small file entirely in memory
   */
  private async hashFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Hash a large file in chunks with progress reporting
   * This prevents browser hangs for large files
   */
  private async hashFileInChunks(
    file: File,
    progressCallback?: (progress: { bytesProcessed: number }) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const chunks: ArrayBuffer[] = [];
      let offset = 0;

      const readNextChunk = () => {
        const chunk = file.slice(offset, offset + this.CHUNK_SIZE);

        reader.onload = async () => {
          try {
            chunks.push(reader.result as ArrayBuffer);
            offset += chunk.size;

            progressCallback?.({ bytesProcessed: offset });

            if (offset < file.size) {
              // Continue reading next chunk
              readNextChunk();
            } else {
              // All chunks read, compute hash
              const combinedBuffer = this.combineArrayBuffers(chunks);
              const hashBuffer = await crypto.subtle.digest('SHA-256', combinedBuffer);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              resolve(hashHex);
            }
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file chunk'));
        };

        reader.readAsArrayBuffer(chunk);
      };

      readNextChunk();
    });
  }

  /**
   * Combine multiple ArrayBuffers into a single buffer
   */
  private combineArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
      combined.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    return combined.buffer;
  }

  /**
   * Validate hash format
   */
  isValidHash(hash: string): boolean {
    // Check for 0x prefix followed by 64 hex characters
    const hashPattern = /^0x[a-fA-F0-9]{64}$/;
    return hashPattern.test(hash);
  }

  /**
   * Normalize hash (ensure 0x prefix, lowercase)
   */
  normalizeHash(hash: string): string {
    let normalized = hash.trim();
    if (!normalized.startsWith('0x')) {
      normalized = '0x' + normalized;
    }
    return normalized.toLowerCase();
  }

  /**
   * Compare two hashes (case-insensitive, with or without 0x prefix)
   */
  compareHashes(hash1: string, hash2: string): boolean {
    const normalized1 = this.normalizeHash(hash1);
    const normalized2 = this.normalizeHash(hash2);
    return normalized1 === normalized2;
  }

  /**
   * Truncate hash for display
   */
  truncateHash(hash: string, startChars = 6, endChars = 4): string {
    const normalized = this.normalizeHash(hash);
    if (normalized.length <= startChars + endChars) {
      return normalized;
    }
    return `${normalized.slice(0, startChars)}...${normalized.slice(-endChars)}`;
  }

  /**
   * Check if file type is supported for hashing
   */
  isFileTypeSupported(file: File): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/octet-stream'
    ];

    return supportedTypes.includes(file.type) || file.size > 0;
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('text')) return '📃';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  }

  /**
   * Format computation time for display
   */
  formatComputationTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Cancel ongoing hash computation (for future use with Web Workers)
   */
  cancelComputation(): void {
    // Implementation for Web Worker cancellation
    // To be implemented when moving to Web Workers
  }
}
