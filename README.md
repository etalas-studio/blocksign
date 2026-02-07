# BlockSign

> Trust is no longer social — it is mathematical.

BlockSign is a blockchain-based digital signature system that provides legal-grade, tamper-proof document notarization using Polygon blockchain.

## Overview

BlockSign enables users to:
- Upload documents and compute cryptographic hashes
- Sign documents with their crypto wallet (MetaMask, WalletConnect)
- Store immutable proof of signature on Polygon blockchain
- Verify any document's authenticity publicly

## Tech Stack

- **Frontend**: Angular v19, TypeScript, ethers.js
- **Backend**: Rust, Axum, Tokio, ethers-rs
- **Smart Contracts**: Solidity, Foundry
- **Blockchain**: Polygon (MATIC)

## Architecture

```
Frontend (Angular) → Backend (Axum) → Hash Computation → Wallet Sign → Polygon Blockchain → Immutable Proof
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.

## Security

See [THREAT_MODEL.md](THREAT_MODEL.md) for comprehensive security analysis and threat mitigation strategies.

## Installation

### Prerequisites
- Node.js 20+
- Rust 1.75+
- Foundry
- Angular CLI

### Setup

```bash
# Clone repository
git clone <repo-url>
cd blocksign

# Install frontend dependencies
cd frontend
npm install

# Setup backend (Rust)
cd ../backend
cargo build

# Setup smart contracts
cd ../contracts
forge install
forge build
```

## Development

### Smart Contracts (Foundry)
```bash
cd contracts
forge build
forge test
```

### Backend (Rust)
```bash
cd backend
cargo run
```

### Frontend (Angular)
```bash
cd frontend
ng serve
```

## Documentation

- [Architecture](ARCHITECTURE.md) - System design and data flow
- [Threat Model](THREAT_MODEL.md) - Security analysis

## License

MIT

---

*Built with ❤️ for verifiable truth*
