# BlockSign Architecture

## Overview

BlockSign is a blockchain-based digital signature system that provides legal-grade, tamper-proof document notarization. The system leverages Polygon blockchain for immutable proof of document signatures while keeping documents themselves off-chain for privacy and efficiency.

## System Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser       │     │   Browser       │     │   Block Explorer│
│                 │     │                 │     │   (Polygonscan) │
│  ┌───────────┐  │     │  ┌───────────┐  │     │                 │
│  │  Angular  │  │     │  │  Angular  │  │     │                 │
│  │ Frontend  │  │     │  │  Verify   │  │     │                 │
│  │           │  │     │  │   Page    │  │     │                 │
│  └─────┬─────┘  │     │  └─────┬─────┘  │     └─────────────────┘
│        │        │     │        │        │               │
└────────┼────────┘     └────────┼────────┘               │
         │                       │                        │
         │ HTTPS                 │ HTTPS                  │ HTTP
         │                       │                        │
┌────────▼───────────────────────▼────────────────────────▼────────┐
│                                                                  │
│                     Axum Backend (Rust)                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Upload      │  │   Hash       │  │  Blockchain Query    │   │
│  │  Handler     │  │   Service    │  │  Service (ethers-rs) │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                     │                │
│         │                 │                     │                │
│  ┌──────▼───────┐  ┌──────▼───────┐    ┌───────▼───────┐       │
│  │  Temp File   │  │  SHA-256     │    │   RPC Cache   │       │
│  │  Storage     │  │  Computation │    │   (Redis)     │       │
│  └──────────────┘  └──────────────┘    └───────────────┘       │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ JSON-RPC
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                     Polygon RPC Provider                          │
│                     (Infura/Alchemy/Ankr)                        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ WebSocket/HTTP
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                  │
│                      Polygon Blockchain                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              BlockSign Smart Contract                   │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  - signDocument(bytes32 hash, bytes signature)   │  │    │
│  │  │  - verify(bytes32 hash, address signer)          │  │    │
│  │  │  - getSignatures(bytes32 hash)                   │  │    │
│  │  │  - DocumentSigned event                          │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│                    Immutable Ledger                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Angular v19 (Latest)
- **Language**: TypeScript
- **Blockchain Library**: ethers.js v6
- **Wallet Integration**: MetaMask, WalletConnect
- **Deployment**: Vercel/Netlify

### Backend
- **Language**: Rust
- **Framework**: Axum v0.7+
- **Runtime**: Tokio (async runtime)
- **Blockchain Library**: ethers-rs
- **File Upload**: Multipart form data support
- **Caching**: Redis (optional, for query optimization)
- **Database**: PostgreSQL (for metadata, optional in MVP)

### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Development Framework**: Foundry
- **Network**: Polygon (MATIC)
- **RPC Provider**: Infura, Alchemy, or public RPC

### Infrastructure
- **Frontend Hosting**: Vercel/Netlify
- **Backend Hosting**: Railway, Fly.io, or AWS
- **RPC Provider**: Infura or Alchemy
- **Blockchain Explorer**: Polygonscan

## Component Architecture

### 1. Frontend (Angular)

**Modules:**
- **Core Module**: Authentication, wallet connection, global services
- **Shared Module**: Reusable components, pipes, directives
- **Sign Module**: Document upload and signing flow
- **Verify Module**: Public document verification

**Key Services:**
- `WalletService`: MetaMask/WalletConnect integration
- `BlockchainService`: Smart contract interactions
- `HashService`: Client-side hash computation (backup)
- `DocumentService`: File upload and management

**Key Components:**
- `WalletConnectComponent`: Wallet connection UI
- `DocumentUploadComponent`: File upload interface
- `HashPreviewComponent`: Display document hash
- `SignTransactionComponent`: Signing transaction flow
- `VerifyDocumentComponent`: Verification interface

### 2. Backend (Axum/Rust)

**HTTP Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload document, compute hash | Optional |
| POST | `/api/hash` | Compute SHA-256 hash only | None |
| GET | `/api/document/:hash` | Get document metadata | None |
| GET | `/api/verify/:hash` | Verify signature on-chain | None |
| GET | `/api/health` | Health check | None |

**Services:**
- `UploadHandler`: Multipart file upload processing
- `HashService`: SHA-256 computation
- `BlockchainService`: RPC client wrapper
- `CacheService`: Redis integration (optional)

**Middleware:**
- CORS handling
- Request size limits (max 10MB per file)
- Rate limiting
- Request ID tracking
- Logging

### 3. Smart Contract (Solidity)

**Storage Structure:**
```solidity
struct Signature {
    address signer;
    bytes32 docHash;
    uint256 timestamp;
    bytes signature;
}

mapping(bytes32 => Signature[]) public signatures;
```

**Core Functions:**
- `signDocument(bytes32 docHash, bytes signature)`: Record a signature
- `verify(bytes32 docHash, address signer)`: Check if document was signed
- `getSignatures(bytes32 docHash)`: Retrieve all signatures for a document

**Events:**
- `DocumentSigned(address indexed signer, bytes32 indexed docHash, uint256 timestamp)`

## Data Flow

### Signing Flow

```
1. USER uploads document
   ↓
2. FRONTEND sends file to backend via POST /api/upload
   ↓
3. BACKEND (Axum)
   - Validates file (size, type)
   - Computes SHA-256 hash
   - Stores file temporarily
   - Returns hash to frontend
   ↓
4. FRONTEND displays hash preview to user
   ↓
5. USER connects wallet (MetaMask)
   - Frontend requests accounts
   - User approves connection
   ↓
6. USER clicks "Sign Document"
   - Frontend requests signature for hash
   - MetaMask prompts user to sign
   - User approves signature
   ↓
7. FRONTEND sends transaction to Polygon
   - Calls BlockSign.signDocument(hash, signature)
   - Pays gas fee
   ↓
8. SMART CONTRACT validates and stores
   - Verifies signature format
   - Stores (signer, hash, timestamp, signature)
   - Emits DocumentSigned event
   ↓
9. BLOCKCHAIN produces transaction receipt
   ↓
10. FRONTEND displays success
   - Shows transaction hash
   - Links to Polygonscan
   ↓
11. BACKEND cleans up temporary file
```

### Verification Flow

```
1. VERIFIER uploads document to verify page
   ↓
2. FRONTEND sends file to backend via POST /api/hash
   ↓
3. BACKEND computes SHA-256 hash
   ↓
4. FRONTEND queries smart contract
   - Calls BlockSign.getSignatures(hash)
   ↓
5. SMART CONTRACT returns signature records
   - Signer address
   - Timestamp
   - Signature data
   ↓
6. FRONTEND displays verification result
   - Document was signed by: 0x123...
   - Date: 2024-01-15 10:41:23 UTC
   - Transaction link: [Polygonscan]
   ↓
   OR
7. FRONTEND displays "No signatures found"
   - Document not found on blockchain
   - May be unsigned or tampered
```

## On-Chain vs Off-Chain Data

### Stored On-Chain (Immutable, Public)
- Document SHA-256 hash
- Signer wallet address
- Signature timestamp (block time)
- Signature data
- Transaction hash (proof)

### Stored Off-Chain (Private, Flexible)
- Original document files
- User personal information
- Upload metadata (IP, user agent)
- Application state
- Cached blockchain queries
- Temporary files during signing

### Why This Design?

**On-Chain:**
- **Hash**: Unique document fingerprint - proves what was signed
- **Signer**: Cryptographic identity - proves who signed
- **Timestamp**: Block time - proves when it was signed
- **Signature**: Cryptographic proof - prevents repudiation

**Off-Chain:**
- **Document**: Privacy - don't expose sensitive content
- **Metadata**: Flexibility - can change without affecting truth
- **Cache**: Performance - reduce blockchain queries

## Trust Model

### Source of Truth

**The blockchain is the single source of truth.**

If backend database says "Document X was signed by 0x123" but blockchain says "No signature for Document X" - the blockchain is correct.

### Trust Assumptions

| Component | Trust Level | Reason |
|-----------|-------------|--------|
| Polygon Blockchain | 100% | Immutable, decentralized, mathematically verified |
| Smart Contract Code | 100% | Verified on deployment, immutable logic |
| Wallet Private Key | 100% | User controls, proves identity |
| Backend Server | 0% | Convenience only, not required for truth |
| Frontend Code | 0% | User can verify directly on blockchain |

### Failure Scenarios

**Backend goes down:**
- Users can still sign documents (hash locally)
- Verification still works (query blockchain directly)
- No data loss (truth is on-chain)

**Frontend compromised:**
- Attacker can't fake signatures (requires private key)
- Users can verify on Polygonscan directly
- No impact on blockchain state

**Smart contract hacked:**
- Read-only functions (verify) remain safe
- Worst case: pause new signatures
- Historical signatures remain valid

**Polygon network congested:**
- Higher gas fees
- Slower confirmations
- No impact on already-signed documents

**Database lost/deleted:**
- Zero impact on verification
- Smart contract has all data
- Can rebuild cache from blockchain

## Network Topology

### Polygon (MATIC) Configuration

**Why Polygon?**
- Low transaction fees (~$0.001)
- Fast block times (~2 seconds)
- Ethereum-compatible (EVM)
- Good tooling and explorer support
- Growing adoption

**Network Details:**
- Chain ID: 137 (mainnet), 80001 (Amoy testnet)
- Block time: ~2 seconds
- Finality: ~5 minutes (256 blocks)
- Gas token: MATIC

**RPC Providers:**
1. Infura - Reliable, free tier available
2. Alchemy - Enhanced APIs, good free tier
3. Ankr - Public RPC (backup)

**Deployment Strategy:**
1. **Development**: Local Anvil node (Foundry)
2. **Testing**: Amoy testnet (free MATIC from faucet)
3. **Production**: Polygon mainnet

## Security Layers

### 1. Network Security
- HTTPS only for all API calls
- CORS properly configured
- Rate limiting per IP

### 2. Application Security
- File size limits (10MB max)
- File type validation (PDF, images only)
- Input sanitization
- No sensitive data in logs

### 3. Blockchain Security
- Signature validation in smart contract
- Replay attack protection
- Gas griefing prevention
- No admin backdoors

### 4. Wallet Security
- User always controls private key
- Signature displayed before approval
- Transaction simulation (when possible)

## Scalability Considerations

### Current MVP Design
- Single smart contract
- Direct blockchain queries
- File storage on backend disk

### Future Scaling Options

**File Storage:**
- IPFS for decentralized storage
- S3/R2 for scalable object storage
- CDN for faster downloads

**Query Optimization:**
- Redis cache for frequent queries
- The Graph for indexed blockchain data
- Separate read replicas

**Smart Contract:**
- Gas optimization (batch operations)
- Layer 2 scaling (already using Polygon)
- Proxy pattern for upgradability

## Development Environment

### Repository Structure
```
blocksign/
├── contracts/          # Solidity smart contracts
│   ├── src/
│   ├── test/
│   └── foundry.toml
├── backend/            # Axum backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── handlers/
│   │   ├── services/
│   │   └── models/
│   └── Cargo.toml
├── frontend/           # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   └── ...
│   └── package.json
├── ARCHITECTURE.md
└── THREAT_MODEL.md
```

### Environment Variables

**Backend (.env):**
```
RUST_LOG=info
SERVER_PORT=3000
CORS_ORIGINS=http://localhost:4200
POLYGON_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x...
REDIS_URL=redis://localhost:6379
MAX_FILE_SIZE=10485760
```

**Frontend:**
```
POLYGON_CHAIN_ID=137
CONTRACT_ADDRESS=0x...
POLYGON_RPC_URL=https://polygon-rpc.com
```

## Deployment Architecture

### Frontend Deployment
1. Build Angular application (`ng build --prod`)
2. Deploy static assets to Vercel/Netlify
3. Configure environment variables
4. Enable HTTPS

### Backend Deployment
1. Build Rust release binary (`cargo build --release`)
2. Deploy to Railway/Fly.io
3. Configure environment variables
4. Set up reverse proxy (nginx/Caddy)
5. Enable HTTPS

### Smart Contract Deployment
1. Compile with Foundry (`forge build`)
2. Deploy to Polygon (`forge script`)
3. Verify on Polygonscan (`forge verify-contract`)
4. Save deployment artifacts

## Monitoring & Observability

### Metrics to Track
- Request latency (API)
- Transaction success rate
- Gas usage statistics
- Error rates
- Active users

### Logging Strategy
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- No sensitive data in logs
- Centralized log aggregation (future)

## Next Steps

After architecture is finalized:

1. **Day 2**: Develop smart contract with Foundry
2. **Day 3**: Write comprehensive smart contract tests
3. **Day 4**: Build Axum backend with hashing service
4. **Day 5**: Implement wallet integration
5. **Day 6**: Build Angular signing interface
6. **Day 7**: Create public verification page

---

*Last Updated: 2025-02-06*
*Version: 1.0*
