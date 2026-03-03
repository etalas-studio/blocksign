# Requirements — ONE Digital Signature (Teken Aja)

> **Source:** RFP Pengadaan ONE Digital Signature (Teken Aja) — JHL Group  
> **Doc Ref:** 003/INT/IT-KA/XII/2026 | v1.2 | Feb 19, 2026  
> **Client:** PT Kontek AJA (JHL Group)  
> **Integration Target:** ONE App Ecosystem + Google Workspace (Drive)

---

## Background

JHL Group wants an end-to-end digital signature platform to replace their current manual print → sign → scan workflow. The system must integrate with their internal "ONE" app ecosystem and support Google Workspace (Drive).

---

## Module Requirements

### Module 1 — TTE Tersertifikasi (PSrE)
Legally-binding, certificate-based electronic signature compliant with Indonesian e-signature law.

- Integration with a PSrE-certified Certificate Authority (CA) — e.g., Privy, PeruriSign, BSSN-approved
- Digital certificates issued per signer identity
- Signatures must be legally equivalent to wet signatures under UU ITE and PP No. 71/2019
- Certificate lifecycle management (issuance, renewal, revocation)
- Signature embedded in document with certificate chain

### Module 2 — Non-TTE Approval
Internal electronic approval for lower-risk documents where full PSrE certification is not required.

- OTP-based approval via email or SMS
- Approval linked to user account (not certificate)
- Audit trail of approval action (who, when, IP)
- Configurable per document type or workflow

### Module 3 — Document Rule Engine
Automatic classification of documents into the appropriate signing tier.

- Rules engine to classify documents as: TTE Tersertifikasi / Non-TTE / e-Meterai
- Classification criteria: document type, nominal value, legal requirement, risk level
- Rule configuration UI for admins
- Override mechanism with audit log
- Integration with document metadata from Module 5

### Module 4 — eKYC / Signer Registration
Identity verification flow required before a PSrE certificate can be issued to a signer.

- OCR scanning of Indonesian e-KTP (electronic national ID)
- Liveness check (face verification against e-KTP photo)
- Integration with DUKCAPIL or PSrE provider's KYC pipeline
- Registration status tracking per user
- Re-verification triggers (e.g., after suspicious activity)

### Module 5 — Document Management
Full document lifecycle management from upload to post-signing archival.

- Document upload (PDF primary, common formats supported)
- SHA-256 hash computation and integrity verification
- Version control and document history
- Document status tracking: Draft → In Review → Signing → Completed → Archived
- Metadata storage: author, creation date, signers, status, hash
- Soft delete with retention policy
- Search and filter by metadata

### Module 6 — Signature Placement
UI and backend support for placing signature fields on documents.

- Visual drag-and-drop signature placement editor
- Coordinate-based field positioning (page, x, y, width, height)
- Multi-page document support
- Multi-signer field assignment (each signer gets their own field(s))
- Field types: signature, initials, date, name, text
- Placement data persisted and validated before workflow launch

### Module 7 — Signing Workflow
Orchestration of the signing process across multiple signers.

- Sequential signing (ordered by defined sequence)
- Parallel signing (all signers notified simultaneously)
- Delegation — signer can assign to another authorized person
- Deadline configuration with automatic reminders
- Escalation on deadline breach
- Signing status per participant: Pending / Notified / Signed / Declined / Expired
- Cancellation with reason and audit log

### Module 8 — OTP / Authentication
Multi-channel identity verification during signing events.

- OTP delivery via: Email, SMS, WhatsApp
- OTP tied to specific signing session (not reusable)
- Configurable OTP expiry (default: 5 minutes)
- Rate limiting and brute-force protection
- Fallback channel support
- Integration with Module 4 for high-assurance flows

### Module 9 — Webhook / Callback
Real-time event notifications to integrate with the ONE system.

- Webhook registration per document or global
- Events emitted: DocumentCreated, SigningStarted, SignerCompleted, DocumentCompleted, DocumentDeclined, DocumentExpired
- Payload: document ID, event type, timestamp, signer info, hash
- Retry logic with exponential backoff (3 attempts)
- Webhook delivery log and status dashboard
- HMAC signature on payload for authenticity verification

### Module 10 — Document Verification
Allow any party to verify the authenticity and integrity of a signed document.

- QR code embedded in signed document linking to verification page
- Certificate validation (chain of trust, revocation check)
- Timestamp verification (signing time anchored to blockchain or TSA)
- Hash re-computation and comparison to stored hash
- Verification result: Valid / Tampered / Certificate Revoked / Expired
- Public verification endpoint (no authentication required)

### Module 11 — Risk Engine
Fraud prevention and anomaly detection layer for high-risk signing events.

- Face check re-trigger for documents above configurable value threshold
- Impersonation prevention via liveness detection
- Anomaly flags: unusual signing time, new device, location mismatch, rapid multiple signings
- Risk score per signing event
- High-risk events queued for manual review
- Risk event log with admin dashboard

---

## Compliance Requirements

| Requirement | Standard |
|---|---|
| Legally-binding e-signature | UU ITE No. 11/2008, PP No. 71/2019 |
| PSrE-certified CA | BSSN-approved Certificate Authority |
| e-Meterai support | PP No. 86/2021 (Materai Elektronik) |
| Full audit trail | Who / When / Where / What for every action |
| Data residency | Documents stored within Indonesian jurisdiction |
| PDPA compliance | Perlindungan Data Pribadi — UU No. 27/2022 |

---

## Integration Requirements

### ONE App Ecosystem
- SSO/authentication passthrough (SAML or OAuth 2.0)
- Document trigger from ONE (create signing request via API)
- Status sync back to ONE via webhook (Module 9)

### Google Workspace (Drive)
- Import documents from Google Drive for signing
- Export/save signed documents back to Google Drive
- OAuth 2.0 authorization per user
- Folder structure and metadata preservation

---

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Availability | 99.9% uptime SLA |
| Response Time | API < 500ms p95; document signing < 3s |
| File Size | Max 25MB per document |
| Concurrency | Support 100+ simultaneous signing sessions |
| Security | TLS 1.2+, encrypted storage at rest |
| Audit Log | Tamper-evident, retained 7 years |
| Scalability | Horizontal scaling support |

---

## Out of Scope (v1)

- Bulk document signing (batch)
- Mobile native app (web-responsive only)
- Integration with non-Google cloud storage (OneDrive, Dropbox)
- Cross-border / international PSrE recognition

---

*Added: 2026-03-03 | Source: RFP 003/INT/IT-KA/XII/2026 v1.2*
