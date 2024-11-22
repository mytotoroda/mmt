// lib/mmt/raydium.ts
import { 
  Connection, 
  Keypair, 
  PublicKey
} from '@solana/web3.js';
import { 
  Raydium,
  TxVersion,
  parseTokenAccountResp
} from '@raydium-io/raydium-sdk-v2';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

export class RaydiumService {
  private connection: Connection;
  private sdk: Raydium | undefined;
  private isMainnet: boolean;
  private owner: Keypair | null = null;
  
  constructor() {
    this.isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet-beta';
    const rpcUrl = this.isMainnet 
      ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL 
      : process.env.NEXT_PUBLIC_DEVNET_RPC_URL;
      
    if (!rpcUrl) {
      throw new Error('RPC URL not configured');
    }

    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async initializeSdk(secretKey?: string) {
    try {
      if (secretKey) {
        this.owner = Keypair.fromSecretKey(bs58.decode(secretKey));
      }

      if (this.sdk) return this.sdk;

      this.sdk = await Raydium.load({
        connection: this.connection,
        owner: this.owner || undefined,
        cluster: this.isMainnet ? 'mainnet' : 'devnet',
        disableFeatureCheck: true,
        blockhashCommitment: 'finalized',
      });

      return this.sdk;
    } catch (error) {
      console.error('Failed to initialize Raydium SDK:', error);
      throw error;
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  getTxVersion(): TxVersion {
    return TxVersion.V0;
  }
}

// Singleton instance
export const raydiumService = new RaydiumService();