# BlockSign Contract Deployment

## Polygon Amoy Testnet Deployment

### Deployment Details

| Property | Value |
|----------|-------|
| **Contract Address** | `0xE2c0286069D642577deeBEb5b7bDe8F0fe0FfEf7` |
| **Network** | Polygon Amoy Testnet |
| **Chain ID** | 80002 |
| **Owner Address** | `0xD74E410eeed007C076c759089f3c66aAB879DBe1` |
| **Solidity Version** | 0.8.20 |
| **Compiler Optimization** | Yes (200 runs) |
| **Verification Status** | ✅ Verified |

### Links

- **Polygonscan**: https://amoy.polygonscan.com/address/0xe2c0286069d642577deebeb5b7bde8f0fe0ffef7
- **Write Contract**: https://amoy.polygonscan.com/address/0xe2c0286069d642577deebeb5b7bde8f0fe0ffef7#writeContract
- **Read Contract**: https://amoy.polygonscan.com/address/0xe2c0286069d642577deebeb5b7bde8f0fe0ffef7#readContract

### Contract Functions

#### Write Functions
- `signDocument(bytes32 docHash, bytes signature)` - Record a document signature
- `pause()` - Emergency pause (owner only)
- `unpause()` - Resume operations (owner only)

#### Read Functions
- `verify(bytes32 docHash, address signer)` - Check if signer signed document
- `getSignatures(bytes32 docHash)` - Get all signatures for a document
- `getSignatureCount(bytes32 docHash)` - Get signature count
- `isPaused()` - Check pause status
- `totalSignatures()` - Total signatures recorded
- `owner()` - Contract owner
- `hasSigned(bytes32 docHash, address signer)` - Check if signer signed

### Events

- `DocumentSigned(address indexed signer, bytes32 indexed docHash, uint256 timestamp, bytes signature)`
- `ContractPaused(bool paused)`

### Files

- **ABI**: `out/BlockSign.abi.json`
- **Bytecode**: `out/BlockSign.sol/BlockSign.json`
- **Deployment Broadcast**: `broadcast/Deploy.s.sol/80002/run-latest.json`

### Environment Variables

```bash
# Contract Configuration
CONTRACT_ADDRESS=0xE2c0286069D642577deeBEb5b7bDe8F0fe0FfEf7
CHAIN_ID=80002
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/klmvKTSdbgISgneMq82WQ
```

### Next Steps

1. ✅ Day 2: Smart Contract Core - COMPLETE
2. ⏳ Day 3: Smart Contract Tests
3. ⏳ Day 4: Backend Hashing Service
4. ⏳ Day 5: Wallet Integration
5. ⏳ Day 6: Frontend Upload & Sign

### Testing the Contract

You can test the contract on Polygonscan:

1. Go to: https://amoy.polygonscan.com/address/0xe2c0286069d642577deebeb5b7bde8f0fe0ffef7#writeContract
2. Connect your wallet (switch to Polygon Amoy testnet)
3. Try calling `signDocument` with a document hash and signature

### Security Notes

- Contract includes reentrancy protection (ReentrancyGuard)
- Replay attack prevention (unique signer+document combinations)
- Emergency pause mechanism
- Owner can pause/unpause in case of issues
- No admin backdoors for signature modification
- Historical signatures are immutable

---

**Deployment Date**: 2025-02-09
**Deployer**: 0xD74E410eeed007C076c759089f3c66aAB879DBe1
**Transaction Hash**: (Available in broadcast/Deploy.s.sol/80002/run-latest.json)
