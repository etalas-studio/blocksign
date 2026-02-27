import { Injectable, inject } from '@angular/core';
import { VerificationService, VerificationResult, SignatureRecord } from './verification.service';
import { ContractService } from './contract.service';

declare const jspdf: any;
declare const QRCode: any;

export interface ProofDownloadOptions {
  includeWatermark?: boolean;
  includeQrCode?: boolean;
  format?: 'json' | 'pdf' | 'text';
}

@Injectable({
  providedIn: 'root'
})
export class ProofDownloadService {
  private verificationService = inject(VerificationService);
  private contractService = inject(ContractService);

  /**
   * Download proof in specified format
   */
  async downloadProof(
    result: VerificationResult,
    options: ProofDownloadOptions = {}
  ): Promise<void> {
    const format = options.format || 'json';

    switch (format) {
      case 'json':
        await this.downloadJsonProof(result);
        break;
      case 'pdf':
        await this.downloadPdfProof(result, options);
        break;
      case 'text':
        await this.downloadTextProof(result);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Download JSON proof
   */
  async downloadJsonProof(result: VerificationResult): Promise<void> {
    const jsonContent = this.verificationService.exportToJson(result);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    this.downloadBlob(blob, this.generateFileName(result, 'json'));
  }

  /**
   * Download text proof
   */
  async downloadTextProof(result: VerificationResult): Promise<void> {
    const textContent = this.verificationService.exportToText(result);
    const blob = new Blob([textContent], { type: 'text/plain' });
    this.downloadBlob(blob, this.generateFileName(result, 'txt'));
  }

  /**
   * Download PDF certificate
   */
  async downloadPdfProof(
    result: VerificationResult,
    options: ProofDownloadOptions = {}
  ): Promise<void> {
    try {
      // Dynamic import of jspdf
      const jsPDFModule = await import('jspdf');
      const { default: jsPDF } = jsPDFModule;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add content
      await this.addPdfContent(doc, result, options);

      // Save the PDF
      doc.save(this.generateFileName(result, 'pdf'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF certificate. Please ensure jspdf is installed.');
    }
  }

  /**
   * Add content to PDF document
   */
  private async addPdfContent(doc: any, result: VerificationResult, options: ProofDownloadOptions): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Colors
    const primaryColor = { r: 34, g: 197, b: 94 }; // Green
    const textColor = { r: 51, g: 51, b: 51 };
    const mutedColor = { r: 128, g: 128, b: 128 };

    // Helper function to set text color
    const setTextColor = (r: number, g: number, b: number) => {
      doc.setTextColor(r, g, b);
    };

    // Header section with gradient-like background
    this.drawPdfHeader(doc, margin, yPosition, pageWidth, primaryColor);
    yPosition += 30;

    // Title
    setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BLOCKSIGN VERIFICATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('CERTIFICATE OF AUTHENTICITY', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Reset to normal text color
    setTextColor(textColor.r, textColor.g, textColor.b);

    // Document Information Section
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Information', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Document hash
    this.drawPdfLabelValue(
      doc, 'Document Hash:',
      this.verificationService['hasherService'].truncateHash(result.documentHash, 10, 8),
      margin, yPosition
    );
    yPosition += 7;

    // Full hash in monospace style
    doc.setFontSize(9);
    doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
    doc.setFont('courier', 'normal');
    const hashLines = doc.splitTextToSize(result.documentHash, maxWidth - 10);
    doc.text(hashLines, margin + 5, yPosition);
    yPosition += hashLines.length * 4 + 5;

    // Document name and size
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(textColor.r, textColor.g, textColor.b);

    if (result.documentName) {
      this.drawPdfLabelValue(doc, 'Document Name:', result.documentName, margin, yPosition);
      yPosition += 7;
    }

    if (result.fileSize) {
      const fileSize = this.formatFileSize(result.fileSize);
      this.drawPdfLabelValue(doc, 'File Size:', fileSize, margin, yPosition);
      yPosition += 7;
    }

    // Verification date
    const verificationDate = result.verificationDate.toLocaleString();
    this.drawPdfLabelValue(doc, 'Verification Date:', verificationDate, margin, yPosition);
    yPosition += 7;

    // Verified status
    const statusText = result.verified ? 'Verified ✓' : 'Not Verified';
    const statusColor = result.verified ? primaryColor : { r: 239, g: 68, b: 68 };
    this.drawPdfLabelValue(doc, 'Status:', statusText, margin, yPosition, statusColor);
    yPosition += 15;

    // Signatures Section
    if (result.verified && result.signatures.length > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor.r, textColor.g, textColor.b);
      doc.text(`Blockchain Signatures (${result.totalSignatures})`, margin, yPosition);
      yPosition += 10;

      // Draw each signature
      result.signatures.forEach((sig, index) => {
        const sigYStart = yPosition;

        // Signature box
        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(margin, yPosition, maxWidth, 35, 3, 3, 'FD');

        yPosition += 7;

        // Signature index and signer
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.text(`Signature ${index + 1}`, margin + 5, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor.r, textColor.g, textColor.b);

        // Signer address
        const signerShort = this.truncateAddress(sig.signer);
        doc.text(`Signer: ${signerShort}`, margin + 5, yPosition);
        yPosition += 5;

        // Date and time
        const date = new Date(sig.timestamp * 1000);
        const dateStr = date.toLocaleString();
        doc.setFontSize(9);
        doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
        doc.text(`Signed: ${dateStr}`, margin + 5, yPosition);
        yPosition += 5;

        // Transaction and block info
        if (sig.txHash) {
          const txShort = this.truncateHash(sig.txHash);
          doc.text(`TX: ${txShort}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (sig.blockNumber) {
          doc.text(`Block: #${sig.blockNumber}`, margin + 5, yPosition);
          yPosition += 5;
        }

        // Network
        doc.text(`Network: ${sig.network}`, margin + 5, yPosition);

        yPosition = sigYStart + 35 + 8;
      });

      yPosition += 5;
    }

    // QR Code section (if enabled)
    if (options.includeQrCode) {
      yPosition = await this.addPdfQrCode(doc, result, margin, yPosition, pageWidth);
    }

    // Legal Disclaimer
    yPosition += 10;
    const disclaimerY = pageHeight - 40;

    if (yPosition < disclaimerY) {
      yPosition = disclaimerY;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);

    const disclaimerLines = [
      'Legal Disclaimer: This certificate is based on data from the Polygon Amoy blockchain, a public,',
      'distributed ledger. The information presented here represents cryptographically verifiable proof',
      'that the document with the above hash was signed by the listed wallet addresses at the specified times.',
      'Blockchain records are immutable and independently verifiable by anyone.'
    ];

    disclaimerLines.forEach(line => {
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      doc.text(wrappedLines, margin, yPosition);
      yPosition += wrappedLines.length * 4 + 2;
    });

    // Footer with verification URL
    yPosition = pageHeight - 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    const verificationUrl = this.verificationService.generateVerificationUrl(result.documentHash);
    doc.text(`Verify Online: ${verificationUrl}`, margin, yPosition);
  }

  /**
   * Draw PDF header with colored background
   */
  private drawPdfHeader(
    doc: any,
    x: number,
    y: number,
    width: number,
    color: { r: number; g: number; b: number }
  ): void {
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(x, y, width, 40, 'F');

    // Add shield icon (simplified as geometric shapes)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.circle(25, y + 20, 8); // Simple circle for icon
  }

  /**
   * Draw label-value pair in PDF
   */
  private drawPdfLabelValue(
    doc: any,
    label: string,
    value: string,
    x: number,
    y: number,
    valueColor?: { r: number; g: number; b: number }
  ): void {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(128, 128, 128);
    doc.text(label, x, y);

    const labelWidth = doc.getTextWidth(label);

    doc.setFont('helvetica', 'normal');
    if (valueColor) {
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
    } else {
      doc.setTextColor(51, 51, 51);
    }
    doc.text(value, x + labelWidth, y);
  }

  /**
   * Add QR code to PDF
   */
  private async addPdfQrCode(
    doc: any,
    result: VerificationResult,
    x: number,
    y: number,
    pageWidth: number
  ): Promise<number> {
    try {
      // Dynamic import of qrcode
      const QRCode = await import('qrcode');

      const verificationUrl = this.verificationService.generateVerificationUrl(result.documentHash);

      // Create canvas for QR code
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, verificationUrl, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Add QR code to PDF (centered)
      const qrSize = 40;
      const qrX = (pageWidth - qrSize) / 2;
      const qrDataUrl = canvas.toDataURL('image/png');

      doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
      y += qrSize + 5;

      // QR code label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text('Scan to verify online', pageWidth / 2, y, { align: 'center' });

      return y + 15;
    } catch (error) {
      console.error('Error generating QR code for PDF:', error);
      return y;
    }
  }

  /**
   * Generate filename for proof download
   */
  private generateFileName(result: VerificationResult, extension: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const hashPrefix = result.documentHash.slice(2, 10);

    if (result.documentName) {
      const nameWithoutExt = result.documentName.replace(/\.[^/.]+$/, '');
      return `blocksign-proof-${nameWithoutExt}-${timestamp}.${extension}`;
    }

    return `blocksign-proof-${hashPrefix}-${timestamp}.${extension}`;
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Truncate Ethereum address
   */
  private truncateAddress(address: string, startChars = 6, endChars = 4): string {
    const normalized = address.toLowerCase();
    if (normalized.startsWith('0x')) {
      return `0x${normalized.slice(2, 2 + startChars)}...${normalized.slice(-endChars)}`;
    }
    return `${normalized.slice(0, startChars)}...${normalized.slice(-endChars)}`;
  }

  /**
   * Truncate hash
   */
  private truncateHash(hash: string, startChars = 8, endChars = 8): string {
    if (hash.startsWith('0x')) {
      return `0x${hash.slice(2, 2 + startChars)}...${hash.slice(-endChars)}`;
    }
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  }

  /**
   * Copy verification link to clipboard
   */
  async copyVerificationLink(result: VerificationResult): Promise<void> {
    const url = this.verificationService.generateVerificationUrl(result.documentHash);
    await navigator.clipboard.writeText(url);
  }

  /**
   * Share verification (Web Share API)
   */
  async shareVerification(result: VerificationResult): Promise<void> {
    const url = this.verificationService.generateVerificationUrl(result.documentHash);
    const title = 'BlockSign Document Verification';
    const text = `Verify this document on BlockSign: ${result.documentName || 'Document'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
      } catch (error) {
        // User cancelled share
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await this.copyVerificationLink(result);
    }
  }
}
