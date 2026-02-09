# BlockSign Smart Contracts

## Setup

### Prerequisites

Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies

```bash
# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts --no-git
```

## Build

```bash
forge build
```

## Test

```bash
forge test
```

## Deployment

### Polygon Amoy Testnet

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
export ETHERSCAN_API_KEY=your_polygonscan_key

# Deploy and verify
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Current Deployment

| Network | Contract Address |
|---------|-----------------|
| Polygon Amoy Testnet | `0xE2c0286069D642577deeBEb5b7bDe8F0fe0FfEf7` |

## Contract Functions

- `signDocument(bytes32 docHash, bytes signature)` - Record a document signature
- `verify(bytes32 docHash, address signer)` - Check if document was signed
- `getSignatures(bytes32 docHash)` - Get all signatures for a document
- `getSignatureCount(bytes32 docHash)` - Get signature count
- `pause()` / `unpause()` - Emergency controls (owner only)

## Polygonscan

- [Contract on Polygonscan](https://amoy.polygonscan.com/address/0xe2c0286069d642577deebeb5b7bde8f0fe0ffef7)
