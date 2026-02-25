import { Injectable, DestroyRef, inject } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WalletState, initialWalletState, NETWORKS } from '../models/wallet.model';

declare global {
  interface Window {
    ethereum?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private destroyRef = inject(DestroyRef);

  private walletState = new BehaviorSubject<WalletState>(initialWalletState);
  public walletState$ = this.walletState.asObservable();

  private provider: any = null;
  private readonly REQUIRED_CHAIN_ID = 80002; // Polygon Amoy

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize provider from window.ethereum
   */
  private initializeProvider(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = window.ethereum;
      this.setupEventListeners();
      this.checkExistingConnection();
    }
  }

  /**
   * Set up event listeners for wallet events
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    // Account change event
    fromEvent(this.provider, 'accountsChanged')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((accounts: any) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.updateWalletAccounts(accounts);
        }
      });

    // Chain change event
    fromEvent(this.provider, 'chainChanged')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        window.location.reload();
      });

    // Disconnect event
    fromEvent(this.provider, 'disconnect')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.disconnectWallet();
      });
  }

  /**
   * Check if wallet is already connected
   */
  private async checkExistingConnection(): Promise<void> {
    try {
      const accounts = await this.provider.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await this.updateWalletAccounts(accounts);
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }

  /**
   * Update wallet state with account information
   */
  private async updateWalletAccounts(accounts: string[]): Promise<void> {
    try {
      const address = accounts[0];
      const chainId = await this.getChainId();
      const balance = await this.getBalance(address);

      this.walletState.next({
        connected: true,
        address,
        chainId,
        balance,
        error: null
      });
    } catch (error) {
      console.error('Error updating wallet accounts:', error);
    }
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.walletState.value.connected;
  }

  /**
   * Get current wallet state
   */
  getWalletState(): WalletState {
    return this.walletState.value;
  }

  /**
   * Connect wallet
   */
  async connectWallet(): Promise<void> {
    if (!this.isMetaMaskInstalled()) {
      this.walletState.next({
        ...initialWalletState,
        error: 'Please install MetaMask to continue'
      });
      throw new Error('MetaMask not installed');
    }

    try {
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      await this.updateWalletAccounts(accounts);
    } catch (error: any) {
      let errorMessage = 'Failed to connect wallet';

      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Please check your MetaMask for pending connection request';
      }

      this.walletState.next({
        ...initialWalletState,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(): void {
    this.walletState.next(initialWalletState);
  }

  /**
   * Get current chain ID
   */
  async getChainId(): Promise<number | null> {
    try {
      const chainId = await this.provider.request({ method: 'eth_chainId' });
      return parseInt(chainId, 16);
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  }

  /**
   * Check if on correct network
   */
  isCorrectNetwork(): boolean {
    return this.walletState.value.chainId === this.REQUIRED_CHAIN_ID;
  }

  /**
   * Switch to Polygon Amoy network
   */
  async switchNetwork(): Promise<void> {
    if (!this.provider) return;

    const targetNetwork = NETWORKS[this.REQUIRED_CHAIN_ID];

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.REQUIRED_CHAIN_ID.toString(16)}` }]
      });
    } catch (error: any) {
      // Network not added to MetaMask, add it
      if (error.code === 4902) {
        try {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${this.REQUIRED_CHAIN_ID.toString(16)}`,
              chainName: targetNetwork.name,
              nativeCurrency: targetNetwork.nativeCurrency,
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.blockExplorer]
            }]
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching network:', error);
        throw error;
      }
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      return (parseInt(balance, 16) / 1e18).toFixed(4);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  /**
   * Get provider for ethers
   */
  getProvider(): any {
    return this.provider;
  }

  /**
   * Get network name for current chain
   */
  getNetworkName(): string {
    const chainId = this.walletState.value.chainId;
    return NETWORKS[chainId || 1]?.name || 'Unknown Network';
  }
}
