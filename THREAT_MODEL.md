# BlockSign Threat Model

## Overview

This document identifies potential security threats to the BlockSign system and provides mitigation strategies for each identified risk. The threat model follows the STRIDE methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

## System Assets

### Critical Assets
1. **User Private Keys** - Proves identity, must never be exposed
2. **Document Hashes** - Unique fingerprint, integrity critical
3. **Smart Contract State** - Source of truth, must be accurate
4. **Signature Records** - Legal evidence, must be immutable

### Secondary Assets
1. **Uploaded Documents** - Temporary storage, privacy concern
2. **User Wallet Addresses** - Public but linked to real identity
3. **Transaction Metadata** - Timing patterns could be sensitive
4. **Backend Infrastructure** - Availability impact

## Threat Analysis by Component

### 1. Frontend Threats (Angular Application)

#### 1.1 Phishing Attacks

**Threat:** Attacker creates fake BlockSign website to trick users into signing malicious documents or stealing private keys.

**Impact:** HIGH
- Users sign documents they didn't intend to sign
- Private keys compromised
- Loss of funds or legal liability

**Mitigation:**
- Display clear hash preview before signing
- Show domain/URL prominently
- Add "verify this is blocksign.com" warning
- Implement CSP headers to prevent XSS
- Use Subresource Integrity (SRI) for CDN resources
- Consider domain-bound certificates

**Implementation Priority:** P0 (Must have)

---

#### 1.2 Cross-Site Scripting (XSS)

**Threat:** Attacker injects malicious JavaScript to steal signed hashes or wallet credentials.

**Impact:** HIGH
- Signature theft
- Wallet drain
- Document tampering

**Mitigation:**
- Angular's built-in XSS sanitization
- Content Security Policy (CSP) headers
- Input sanitization on all user inputs
- HttpOnly cookies (if used)
- Regular dependency updates
- DOM-based XSS prevention (avoid `innerHTML`)

**Implementation Priority:** P0 (Must have)

---

#### 1.3 Malicious Browser Extensions

**Threat:** Browser extension monitors or modifies wallet transactions.

**Impact:** MEDIUM
- Transaction modification
- Signature theft
- Privacy leakage

**Mitigation:**
- Warn users about browser extensions
- Show transaction details before confirmation
- Recommend using dedicated browser for crypto
- Document best practices to users

**Implementation Priority:** P1 (Should have)

---

#### 1.4 Man-in-the-Middle (MITM)

**Threat:** Attacker intercepts communication between user and backend/blockchain.

**Impact:** MEDIUM
- Data exposure
- Transaction manipulation

**Mitigation:**
- HTTPS only (TLS 1.3)
- HSTS headers
- Certificate pinning (mobile app future)
- RPC endpoint authentication
- Verify smart contract address in code

**Implementation Priority:** P0 (Must have)

---

#### 1.5 Supply Chain Attacks

**Threat:** Malicious package in npm dependencies compromises frontend.

**Impact:** HIGH
- Complete compromise
- Wallet theft

**Mitigation:**
- Lock dependency versions
- Use `npm audit`
- Consider `pnpm` for better isolation
- Regular dependency updates
- Review security advisories
- Semantic versioning with care

**Implementation Priority:** P1 (Should have)

---

### 2. Backend Threats (Axum/Rust)

#### 2.1 File Upload Attacks

**Threat:** Attacker uploads malicious files to compromise server or consume resources.

**Impact:** HIGH
- Server compromise
- Denial of service
- Data breach

**Specific Attack Vectors:**
- Oversized files (disk space exhaustion)
- Malware-infected files
- Special filenames (path traversal)
- MIME type confusion
- Zip bombs (nested compression)

**Mitigation:**
- File size limit: 10MB maximum
- Allow list: Only PDF and common image formats
- Validate magic bytes, not just extension
- Sanitize filenames (remove paths, special chars)
- Store outside web root
- Scan for malware (ClamAV integration future)
- Delete files immediately after hashing
- Use `/tmp` with proper permissions
- Rate limit uploads per IP

**Implementation Priority:** P0 (Must have)

---

#### 2.2 Denial of Service (DoS)

**Threat:** Attacker overwhelms backend with requests, making service unavailable.

**Impact:** MEDIUM
- Service disruption
- Financial loss (if paid RPC)

**Attack Vectors:**
- Request flood
- Slow POST attacks
- Large file uploads
- Expensive hash computations

**Mitigation:**
- Rate limiting: 10 requests/minute per IP
- Request timeout: 30 seconds
- Connection limits
- CDN for static assets
- Autoscaling infrastructure
- Request queue management
- Monitoring and alerting
- DDoS protection (Cloudflare/AWS Shield)

**Implementation Priority:** P0 (Must have)

---

#### 2.3 SQL Injection / NoSQL Injection

**Threat:** If database is used, attacker manipulates queries to access unauthorized data.

**Impact:** HIGH
- Data breach
- Database compromise

**Mitigation:**
- Use parameterized queries (if using SQL)
- ORM with proper escaping (if using ORM)
- Input validation and sanitization
- Least-privilege database user
- Consider no database in MVP (blockchain only)

**Implementation Priority:** P0 (Must have if database used)

---

#### 2.4 Memory Safety Issues

**Threat:** Buffer overflows, use-after-free, or memory corruption vulnerabilities.

**Impact:** MEDIUM
- Server compromise
- Crash/DoS

**Mitigation:**
- **Rust provides memory safety by default**
- Avoid `unsafe` Rust
- Regular dependency audits (`cargo audit`)
- Keep dependencies updated
- Use fuzzing for critical code paths

**Implementation Priority:** P1 (Should have)

---

#### 2.5 Information Disclosure

**Threat:** Error messages or logs leak sensitive information.

**Impact:** LOW-MEDIUM
- Aids other attacks
- Privacy violation

**Mitigation:**
- Generic error messages to users
- Detailed errors only in logs
- No sensitive data in logs (no private keys, full hashes)
- Structured logging with proper levels
- Log aggregation with access control
- Sanitize stack traces

**Implementation Priority:** P1 (Should have)

---

#### 2.6 API Abuse

**Threat:** Attacker exploits API endpoints for unintended purposes.

**Impact:** MEDIUM
- Resource exhaustion
- Cost escalation

**Mitigation:**
- Rate limiting on all endpoints
- API keys for premium usage (future)
- Input validation
- Authentication for write operations
- CORS configuration
- Request size limits

**Implementation Priority:** P0 (Must have)

---

### 3. Smart Contract Threats (Solidity)

#### 3.1 Replay Attacks

**Threat:** Attacker resends a valid signature to sign a different document.

**Impact:** HIGH
- False signatures recorded
- Legal liability
- Trust compromise

**Mitigation:**
- Include document hash in signature message
- Use EIP-712 typed structured data
- Nonce or timestamp validation
- Unique signature verification per document
- Prevent same signer + same hash combinations

**Implementation Priority:** P0 (Must have)

---

#### 3.2 Signature Malleability

**Threat:** Attacker modifies signature slightly without changing its validity.

**Impact:** MEDIUM
- Confusion in signature tracking
- Potential bypass of checks

**Mitigation:**
- Use `ecrecover` for signature verification
- Normalize signature format (v, r, s)
- Reject high-s values (EIP-2)
- Use OpenZeppelin's ECDSA library

**Implementation Priority:** P0 (Must have)

---

#### 3.3 Front-Running (MEV)

**Threat:** Attacker sees pending transaction and submits their own first to profit or disrupt.

**Impact:** LOW
- User pays higher gas
- Stolen signatures (unlikely)

**Mitigation:**
- Signatures include signer intent
- No financial value to front-run
- Use commit-reveal scheme (if needed in future)
- Allow reasonable gas price variability

**Implementation Priority:** P2 (Nice to have - low impact)

---

#### 3.4 Reentrancy

**Threat:** Attacker recursively calls contract before state updates complete.

**Impact:** CRITICAL
- Contract drained
- Signature records corrupted

**Mitigation:**
- No external calls before state updates
- Use ReentrancyGuard (OpenZeppelin)
- Check-effects-interactions pattern
- Keep functions simple and stateless

**Implementation Priority:** P0 (Must have - though unlikely in simple contract)

---

#### 3.5 Integer Overflow/Underflow

**Threat:** Arithmetic operations exceed type bounds.

**Impact:** HIGH
- Incorrect behavior
- Logic bypass

**Mitigation:**
- Solidity 0.8.x has built-in overflow checks
- Avoid unchecked arithmetic
- Use SafeMath if using older Solidity (not needed)

**Implementation Priority:** P0 (Already handled by Solidity 0.8+)

---

#### 3.6 Access Control Issues

**Threat:** Unauthorized users access admin functions.

**Impact:** HIGH
- Contract compromise
- Paused service

**Mitigation:**
- Only owner can call admin functions (if any)
- Consider no admin functions (simpler)
- Use OpenZeppelin AccessControl
- Zero address checks
- Multi-sig for critical changes

**Implementation Priority:** P0 (Must have if admin functions exist)

---

#### 3.7 Gas Griefing

**Threat:** Attacker forces contract to consume excessive gas.

**Impact:** MEDIUM
- High fees for users
- DOS of contract functions

**Mitigation:**
- Bound loops and iterations
- No unbounded arrays in storage
- Gas limits on view functions
- Efficient data structures (mappings)

**Implementation Priority:** P0 (Must have)

---

### 4. Blockchain Network Threats

#### 4.1 Chain Reorganizations

**Threat:** Blockchain reorganizes, changing confirmed transactions.

**Impact:** LOW-MEDIUM
- Temporary inconsistency
- Confusion about finality

**Mitigation:**
- Wait for 256 block confirmations (~10 min on Polygon)
- Show "confirming" status to users
- Update UI on reorg
- Document finality expectations

**Implementation Priority:** P1 (Should have)

---

#### 4.2 RPC Endpoint Failure

**Threat:** Infura/Alchemy/RPC provider goes down or returns incorrect data.

**Impact:** MEDIUM
- Service disruption
- Incorrect display (if data is wrong)

**Mitigation:**
- Use multiple RPC providers with fallback
- Cache blockchain queries
- Verify data from multiple sources
- Handle errors gracefully
- Show RPC status to users

**Implementation Priority:** P0 (Must have)

---

#### 4.3 Network Congestion

**Threat:** Network is congested, causing high fees and slow confirmations.

**Impact:** MEDIUM
- Poor UX
- High costs

**Mitigation:**
- Polygon has low congestion by design
- Dynamic gas estimation
- Show estimated fee to user
- Allow user to set gas limit
- Queue transactions when needed

**Implementation Priority:** P1 (Should have)

---

### 5. User-Centric Threats

#### 5.1 Private Key Compromise

**Threat:** User's wallet private key is stolen.

**Impact:** CRITICAL
- Identity theft
- Unauthorized signatures
- Fund theft

**Mitigation:**
- User education (never share private key)
- Hardware wallet recommendation
- Warn about suspicious activity
- Allow signature revocation (future feature)
- Document best practices

**Implementation Priority:** P1 (Education/documentation)

---

#### 5.2 Lost Private Keys

**Threat:** User loses access to their wallet.

**Impact:** MEDIUM (for user)
- Cannot sign new documents
- Cannot prove previous signatures

**Mitigation:**
- User education on backup
- Clear warning during setup
- Recommend seed phrase storage
- Social recovery (future feature)

**Implementation Priority:** P2 (Nice to have)

---

#### 5.3 Signing Wrong Document

**Threat:** User accidentally signs the wrong document.

**Impact:** HIGH
- Legal liability
- Unwanted binding commitment

**Mitigation:**
- Show hash prominently before signing
- Require explicit confirmation
- Display file preview if possible
- Clear "Are you sure?" confirmation
- Cancel option with timeout

**Implementation Priority:** P0 (Must have)

---

#### 5.4 Social Engineering

**Threat:** Attacker manipulates user into signing malicious document.

**Impact:** HIGH
- Unwanted signatures
- Legal/financial loss

**Mitigation:**
- Hash display prevents PDF spoofing
- Clear UI about what is being signed
- Warning about verifying hash independently
- Documentation on security best practices
- Phishing awareness

**Implementation Priority:** P1 (Should have)

---

## Security Controls Summary

### P0 - Critical (Must Implement)

1. **Frontend**
   - Content Security Policy (CSP)
   - HTTPS enforcement
   - Hash preview before signing
   - Input sanitization

2. **Backend**
   - File size limits (10MB max)
   - File type validation
   - Rate limiting
   - HTTPS only
   - Request timeout

3. **Smart Contract**
   - Signature replay protection
   - Signature malleability protection
   - Access control (if admin functions)
   - Reentrancy guards
   - Overflow protection (Solidity 0.8+)

4. **Infrastructure**
   - Multiple RPC providers
   - Monitoring and alerting
   - Error handling

### P1 - High Priority (Should Implement)

1. **Frontend**
   - Supply chain security (npm audit)
   - Phishing warnings
   - Dependency updates

2. **Backend**
   - Request ID tracking
   - Structured logging
   - Dependency audits (cargo audit)
   - DDoS protection

3. **Smart Contract**
   - Comprehensive testing
   - External audit before mainnet
   - Pause mechanism

4. **User**
   - Security documentation
   - Best practices guide

### P2 - Medium Priority (Nice to Have)

1. Bug bounty program
2. Professional security audit
3. Insurance/smart contract cover
4. Advanced monitoring
5. Incident response plan

## Risk Assessment Matrix

| Threat | Likelihood | Impact | Risk Level | Priority |
|--------|------------|--------|------------|----------|
| File upload attacks | High | High | **Critical** | P0 |
| Replay attacks | Medium | Critical | **High** | P0 |
| Phishing | High | High | **High** | P0 |
| XSS | Medium | Critical | **High** | P0 |
| DoS | High | Medium | **High** | P0 |
| RPC failure | Medium | Medium | **Medium** | P0 |
| Signature malleability | Low | High | **Medium** | P0 |
| Key compromise | Low | Critical | **Medium** | P1 |
| Reentrancy | Very Low | Critical | **Low** | P0 |
| Front-running | Low | Low | **Low** | P2 |

## Security Best Practices

### Development
1. Never commit private keys or sensitive data
2. Use environment variables for secrets
3. Regular dependency updates
4. Code reviews for all changes
5. Security testing in CI/CD

### Deployment
1. Enable security headers (CSP, HSTS)
2. Use HTTPS everywhere
3. Implement rate limiting
4. Set up monitoring and alerting
5. Have rollback plan ready

### Operations
1. Regular security audits
2. Incident response plan
3. Security awareness training
4. Keep dependencies updated
5. Monitor for vulnerabilities

## Compliance & Legal Considerations

### Data Privacy
- GDPR compliance (EU users)
- CCPA compliance (California users)
- Data minimization (only store what's necessary)
- Right to deletion (off-chain data only)

### Legal Validity
- Blockchain signatures legal in many jurisdictions
- ESIGN Act (US)
- eIDAS (EU)
- Document legal framework

### Audit Trail
- All transactions immutable on blockchain
- Timestamps from block time
- Publicly verifiable
- Court-admissible evidence

## Testing Security

### Smart Contract Testing
- Unit tests for all functions
- Integration tests
- Fuzz testing (Foundry)
- Gas optimization tests
- Reentrancy tests
- Edge case coverage

### Backend Testing
- Unit tests for all handlers
- Integration tests for API
- Load testing
- Security testing (fuzzing)
- Dependency scanning

### Frontend Testing
- Component tests
- E2E tests (Playwright)
- Security testing (XSS attempts)
- Dependency scanning

## Incident Response Plan

### Detection
1. Monitoring alerts
2. User reports
3. Automated security scanning

### Containment
1. Pause smart contract (if possible)
2. Take backend offline
3. Disable frontend

### Investigation
1. Analyze logs
2. Identify attack vector
3. Assess impact

### Recovery
1. Patch vulnerability
2. Restore from backup (if needed)
3. Resume service

### Post-Incident
1. Post-mortem analysis
2. Update threat model
3. Improve defenses

## Security Checklist

### Before Mainnet Deployment

- [ ] Smart contract audited by professional firm
- [ ] 100% test coverage on smart contract
- [ ] Frontend security headers configured
- [ ] Backend rate limiting enabled
- [ ] Multiple RPC providers configured
- [ ] HTTPS enforced everywhere
- [ ] CSP headers implemented
- [ ] File upload validation tested
- [ ] Dependencies audited and updated
- [ ] Error handling tested
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Legal review completed

## Ongoing Security

### Regular Tasks
- Weekly dependency updates
- Monthly security audits
- Quarterly penetration testing
- Continuous monitoring
- User security awareness

### When to Update
- New vulnerability in dependencies
- Security incident in similar projects
- New best practices emerge
- Regulatory changes

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity Security](https://docs.soliditylang.org/en/v0.8.20/security-considerations.html)
- [Web3 Security](https://github.com/web3security/web3security.org)
- [Ethereum Smart Contract Security](https://ethereum.org/en/developers/docs/smart-contracts/security/)

---

*Last Updated: 2025-02-06*
*Version: 1.0*
*Next Review: Before mainnet deployment*
