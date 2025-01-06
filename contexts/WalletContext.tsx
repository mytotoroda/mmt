// contexts/WalletContext.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Connection, clusterApiUrl, Transaction } from '@solana/web3.js';
import { useWeb3Auth } from './Web3AuthContext';
import { SolanaWallet } from './Web3AuthContext';

// Network 타입 정의
export type NetworkType = 'mainnet-beta' | 'devnet';

// 컨텍스트 값 타입 정의
interface WalletContextValue {
  publicKey: string | null;
  network: NetworkType;
  connection: Connection;
  isConnected: boolean;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// 유틸리티 함수들
const getNetwork = (): NetworkType => {
  const network = process.env.NEXT_PUBLIC_NETWORK as NetworkType;
  return network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
};

const getEndpoint = (network: NetworkType): string => {
  if (network === 'mainnet-beta') {
    return process.env.NEXT_PUBLIC_MAINNET_RPC_URL || clusterApiUrl('mainnet-beta');
  }
  return process.env.NEXT_PUBLIC_DEVNET_RPC_URL || clusterApiUrl('devnet');
};

const createConnection = (network: NetworkType): Connection => {
  const endpoint = getEndpoint(network);
  return new Connection(endpoint, 'confirmed');
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, provider } = useWeb3Auth();
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const network = getNetwork();
  const [connection] = useState(() => createConnection(network));

  // provider가 변경될 때마다 wallet 인스턴스 업데이트
  useEffect(() => {
    if (provider) {
      const solanaWallet = new SolanaWallet(provider);
      setWallet(solanaWallet);
    } else {
      setWallet(null);
    }
  }, [provider]);

  // Transaction 타입을 명시적으로 사용하는 메서드들
const signAndSendTransaction = async (transaction: Transaction): Promise<string> => {
  if (!wallet || !provider) throw new Error('Wallet not initialized');

  try {
    // 1. 트랜잭션 직렬화
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    // 2. Web3Auth provider를 통해 트랜잭션 서명
    const signedTx = await provider.request({
      method: "signTransaction",
      params: {
        transaction: Buffer.from(serializedTransaction).toString('base64')
      }
    });

    // 3. 서명된 트랜잭션 전송
    const signature = await connection.sendRawTransaction(
      Buffer.from(signedTx as string, 'base64')
    );

    // 4. 트랜잭션 확인 대기
    await connection.confirmTransaction(signature);

    return signature;
  } catch (error) {
    console.error('Error in signAndSendTransaction:', error);
    throw error;
  }
};

///////////////////////////////////

  const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    if (!wallet) throw new Error('Wallet not initialized');
    return await wallet.signTransaction(transaction);
  };

  return (
    <WalletContext.Provider
      value={{
        publicKey: user?.wallet || null,
        network,
        connection,
        isConnected: Boolean(user?.wallet),
        signAndSendTransaction,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}