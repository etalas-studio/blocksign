/**
 * Wallet state interface representing the current wallet connection status
 */
export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  error: string | null;
}

/**
 * Initial wallet state when not connected
 */
export const initialWalletState: WalletState = {
  connected: false,
  address: null,
  chainId: null,
  balance: null,
  error: null
};

/**
 * Network information for known chains
 */
export interface NetworkInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Known networks configuration
 */
export const NETWORKS: Record<number, NetworkInfo> = {
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://polygon-amoy.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://amoy.polygonscan.com',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18
    }
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18
    }
  },
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEPETH',
      decimals: 18
    }
  }
};
