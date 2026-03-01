# BlockSign

A blockchain-based digital signature system that provides tamper-proof document notarization using the Polygon blockchain. BlockSign creates cryptographic proofs of document signatures that are verifiable by anyone, anywhere.

## What is BlockSign?

BlockSign enables you to sign documents with your crypto wallet and store immutable proof of the signature on the blockchain. Unlike traditional digital signature services, BlockSign leverages blockchain technology to create a permanent, publicly verifiable record of document signatures that cannot be altered or repudiated.

### Key Features

- **Document Signing**: Upload documents and sign them using your crypto wallet (MetaMask, WalletConnect)
- **Blockchain Notarization**: Store cryptographic proof of signatures on the Polygon blockchain
- **Public Verification**: Anyone can verify document authenticity by uploading a file
- **Tamper-Proof Evidence**: Blockchain records provide immutable proof of signing time and identity
- **Privacy First**: Document content never touches the blockchain - only cryptographic hashes
- **Audit Trail**: Complete history of all signing and verification events

### Use Cases

- Legal contracts requiring non-repudiation
- Academic credential verification
- Business agreement signing
- Proof of document existence at a specific time
- Public record notarization

## Architecture Overview

BlockSign follows a clean architecture with clear separation of concerns:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Frontend   │────▶│   Backend   │────▶│  Smart Contract  │
│  (Angular)  │     │    (Rust)   │     │   (Solidity)     │
└─────────────┘     └─────────────┘     └──────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Database   │
                     │  (SQLite)   │
                     └─────────────┘
```

**How it works:**

1. **Upload**: User uploads a document through the web interface
2. **Hash**: Backend computes the SHA-256 hash of the document
3. **Sign**: User signs the hash with their crypto wallet
4. **Store**: Signature data is recorded on the Polygon blockchain
5. **Verify**: Anyone can verify a document by checking the blockchain record

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Tech Stack

### Frontend
- **Framework**: Angular v21 with TypeScript
- **Blockchain**: ethers.js v6 for wallet integration
- **Features**: MetaMask and WalletConnect support, QR code generation, PDF export

### Backend
- **Language**: Rust with Axum web framework
- **Runtime**: Tokio async runtime
- **Database**: SQLite with SQLx for persistence
- **Cryptography**: SHA-256 hashing with the `sha2` crate

### Smart Contracts
- **Platform**: Solidity ^0.8.20
- **Framework**: Foundry for testing and deployment
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Contract**: 0xE2c0286069D642577deeBEb5b7bDe8F0fe0FfEf7

## Project Structure

```
blocksign/
├── frontend/               # Angular web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/      # Core services (wallet, blockchain API)
│   │   │   ├── features/  # Feature modules (sign, verify, dashboard)
│   │   │   └── shared/    # Shared components and pipes
│   │   └── environments/
│   └── package.json
├── backend/               # Rust backend server
│   ├── src/
│   │   ├── handlers/     # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── db/          # Database models and queries
│   │   └── utils/       # Utility functions
│   └── Cargo.toml
└── contracts/            # Solidity smart contracts
    ├── src/
    ├── test/
    └── foundry.toml
```

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20 or higher ([Download](https://nodejs.org/))
- **Rust** v1.75 or higher ([Install](https://rustup.rs/))
- **Foundry** ([Install](https://getfoundry.sh/))
- **Angular CLI** (`npm install -g @angular/cli`)
- **MetaMask** browser extension or compatible wallet

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/xkillx/blocksign.git
cd blocksign
```

2. **Install frontend dependencies**

```bash
cd frontend
npm install
```

3. **Build the backend**

```bash
cd ../backend
cargo build
```

4. **Build the smart contracts**

```bash
cd ../contracts
forge install
forge build
```

### Configuration

1. **Backend Configuration**

```bash
cd backend
cp .env.example .env
```

Edit `.env` and configure:

- `RPC_URL`: Polygon RPC endpoint (get a free one from [Infura](https://infura.io) or [Alchemy](https://alchemy.com))
- `CONTRACT_ADDRESS`: Deployed BlockSign contract address
- `CHAIN_ID`: 80002 for Polygon Amoy testnet
- `DATABASE_URL`: SQLite database path
- `UPLOAD_DIR`: Directory for temporary file storage

2. **Smart Contract Configuration** (if deploying your own)

```bash
cd contracts
cp .env.example .env
```

Edit `.env` and add:

- `PRIVATE_KEY`: Your wallet private key (use a testnet wallet only)
- `RPC_URL`: Polygon Amoy RPC URL
- `ETHERSCAN_API_KEY`: Polygonscan API key for contract verification

### Running the Application

**Development Mode (run all three components):**

Terminal 1 - Backend:
```bash
cd backend
cargo run
```

Terminal 2 - Frontend:
```bash
cd frontend
ng serve
```

The application will be available at `http://localhost:4200`

**Smart Contract Deployment** (if deploying your own):

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### Testing

**Smart Contract Tests:**
```bash
cd contracts
forge test
```

**Backend Tests:**
```bash
cd backend
cargo test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## Usage

### Signing a Document

1. Navigate to the Sign page
2. Upload your document (PDF, images, or any file type)
3. Connect your crypto wallet (MetaMask)
4. Ensure you're on the Polygon Amoy testnet
5. Click "Sign Document" and confirm the transaction in your wallet
6. Download the signed document with blockchain verification details

### Verifying a Document

1. Navigate to the Verify page
2. Upload the document you want to verify
3. The system will:
   - Compute the document hash
   - Query the blockchain for signature records
   - Display signature details including signer address and timestamp
   - Provide a link to view the transaction on Polygonscan

### Admin Dashboard

The dashboard provides:
- Document statistics and metrics
- Blockchain transaction history
- Audit log of all operations
- Signature records management

## Security Considerations

### For Users

- **Private Keys**: Never share your private key or seed phrase
- **Testnet Only**: Current deployment uses Polygon Amoy testnet - do not use mainnet funds
- **Document Privacy**: Only document hashes are stored on-chain, not the actual content
- **Verification**: Always verify documents through the official interface

### Security Features

- **Smart Contract Security**: ReentrancyGuard, replay attack protection, emergency pause
- **Network Security**: HTTPS enforcement, CORS protection, rate limiting
- **Input Validation**: File type and size validation, hash computation verification
- **Audit Logging**: Comprehensive security event tracking

For a detailed security analysis, see [THREAT_MODEL.md](THREAT_MODEL.md).

## Deployed Contract Information

- **Network**: Polygon Amoy Testnet
- **Chain ID**: 80002
- **Contract Address**: [0xE2c0286069D642577deeBEb5b7bDe8F0fe0FfEf7](https://amoy.polygonscan.com/address/0xE2c0286069D642577deeBEb5b7bDe8F0fe0FfEf7)
- **Explorer**: [Polygonscan](https://amoy.polygonscan.com/)

## FAQ

**What happens to my document after I upload it?**
The document is hashed using SHA-256, and the hash is signed and recorded on the blockchain. The actual file is temporarily stored on the server and automatically deleted after 24 hours.

**Can I sign any type of document?**
Yes, BlockSign works with any file type since it operates on the cryptographic hash of the file.

**Is my document content stored on the blockchain?**
No, only the SHA-256 hash and signature metadata are stored on-chain. Your document content remains private.

**Do I need to pay gas fees?**
Yes, blockchain transactions require gas fees. On the Polygon Amoy testnet, you can get free test tokens from a faucet.

**Can I use this on mainnet?**
The current deployment is on testnet. For mainnet use, you would need to deploy a new contract and configure the RPC endpoints.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Polygon](https://polygon.technology/) for blockchain infrastructure
- [Foundry](https://getfoundry.sh/) for the Solidity development framework
- [Angular](https://angular.dev/) for the frontend framework
