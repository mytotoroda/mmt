// /lib/wallet-encryption.ts
import { SafeEventEmitterProvider } from '@web3auth/base';
import { AES, enc } from 'crypto-js';

interface WalletEncryption {
  encryptPrivateKey: (privateKey: string, provider: SafeEventEmitterProvider) => Promise<string>;
  decryptPrivateKey: (encryptedKey: string, provider: SafeEventEmitterProvider) => Promise<string>;
}

export const walletEncryption: WalletEncryption = {
  encryptPrivateKey: async (privateKey: string, provider: SafeEventEmitterProvider) => {
    try {
      // Web3Auth의 고유 ID를 암호화 키로 사용
      const userInfo = await provider.request<{
        verifierId: string;
        typeOfLogin: string;
      }>({ method: 'eth_accounts' });
      
      const encryptionKey = userInfo.verifierId;
      const encrypted = AES.encrypt(privateKey, encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting private key:', error);
      throw new Error('Failed to encrypt private key');
    }
  },

  decryptPrivateKey: async (encryptedKey: string, provider: SafeEventEmitterProvider) => {
    try {
      const userInfo = await provider.request<{
        verifierId: string;
        typeOfLogin: string;
      }>({ method: 'eth_accounts' });
      
      const encryptionKey = userInfo.verifierId;
      const decrypted = AES.decrypt(encryptedKey, encryptionKey).toString(enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('Error decrypting private key:', error);
      throw new Error('Failed to decrypt private key');
    }
  }
};