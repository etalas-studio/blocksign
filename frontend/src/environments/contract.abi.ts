// Minimal ABI for BlockSign contract
export const BLOCKSIGN_ABI = [
  // Read functions
  {
    inputs: [
      { internalType: 'bytes32', name: 'docHash', type: 'bytes32' },
      { internalType: 'address', name: 'signer', type: 'address' }
    ],
    name: 'verify',
    outputs: [{ internalType: 'bool', name: 'exists', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'docHash', type: 'bytes32' }],
    name: 'getSignatures',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'signer', type: 'address' },
          { internalType: 'bytes32', name: 'docHash', type: 'bytes32' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bytes', name: 'signature', type: 'bytes' }
        ],
        internalType: 'struct BlockSign.Signature[]',
        name: 'sigs',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'docHash', type: 'bytes32' }],
    name: 'getSignatureCount',
    outputs: [{ internalType: 'uint256', name: 'count', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Write functions
  {
    inputs: [
      { internalType: 'bytes32', name: 'docHash', type: 'bytes32' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' }
    ],
    name: 'signDocument',
    outputs: [{ internalType: 'uint256', name: 'sigIndex', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'signer', type: 'address' },
      { indexed: true, internalType: 'bytes32', name: 'docHash', type: 'bytes32' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' }
    ],
    name: 'DocumentSigned',
    type: 'event'
  }
];
