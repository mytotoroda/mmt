// /lib/wallet-storage.ts
import { SafeEventEmitterProvider } from '@web3auth/base';
import { walletEncryption } from './wallet-encryption';
import { AMMPool } from '@/components/mmt/TokenPairSelect';

interface WalletStorageInput {
  wallet_address: string;
  amount: number;
  user_id: number;
  privateKey: string;
}

interface WalletStorageService {
  saveWallets: (
    wallets: WalletStorageInput[], 
    pool: AMMPool,
    provider: SafeEventEmitterProvider
  ) => Promise<void>;
}

export const walletStorage: WalletStorageService = {
  saveWallets: async (wallets: WalletStorageInput[], pool: AMMPool, provider: SafeEventEmitterProvider) => {
    try {
      // 각 지갑에 대해 개인키 암호화 및 저장 진행
      const walletsToSave = await Promise.all(
        wallets.map(async (wallet) => {
          const encryptedPrivateKey = await walletEncryption.encryptPrivateKey(
            wallet.privateKey,
            provider
          );

          return {
            wallet_name: `${pool.tokenA.symbol}/${pool.tokenB.symbol} Wallet ${wallet.user_id}`,
            pool_name: `${pool.tokenA.symbol}/${pool.tokenB.symbol}`,
            pool_address: pool.poolAddress,
            public_key: wallet.wallet_address,
            private_key: encryptedPrivateKey,
            token_mint: pool.tokenA.address,
            token_symbol: pool.tokenA.symbol,
            token_decimals: pool.tokenA.decimals,
            status: 'ACTIVE' as const,
            risk_level: 'LOW' as const,
            is_test_wallet: false,
            created_by: 'Wallet Generator'
          };
        })
      );

      // 데이터베이스에 저장
      const response = await fetch('/api/manage-wallet/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallets: walletsToSave }),
      });

      if (!response.ok) {
        throw new Error('Failed to save wallets');
      }
    } catch (error) {
      console.error('Error saving wallets:', error);
      throw error;
    }
  }
};