//ts 완료
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Phantom 지갑 타입 정의
interface PhantomWallet {
  connect: (args?: { onlyIfTrusted: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args?: any) => void) => void;
  removeAllListeners: (event: string) => void;
  publicKey?: { toString: () => string };
}

// Window 타입 확장
declare global {
  interface Window {
    solana?: PhantomWallet;
  }
}

// 컨텍스트 값 타입 정의
interface WalletContextValue {
  wallet: PhantomWallet | null;
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

// Provider Props 타입 정의
interface WalletProviderProps {
  children: ReactNode;
}

// 컨텍스트 생성
const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<PhantomWallet | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  // Phantom 지갑 이벤트 리스너 설정
  useEffect(() => {
    const { solana } = window;
    if (solana) {
      setWallet(solana);
      solana.on('connect', () => {
        console.log("Wallet connected");
        if (solana.publicKey) {
          const publicKeyString = solana.publicKey.toString();
          setPublicKey(publicKeyString);
          localStorage.setItem('walletConnected', 'true');
        }
      });

      solana.on('disconnect', () => {
        console.log("Wallet disconnected");
        setPublicKey(null);
        localStorage.removeItem('walletConnected');
      });

      solana.on('accountChanged', (publicKey: { toString: () => string } | null) => {
        if (publicKey) {
          console.log("Account changed:", publicKey.toString());
          setPublicKey(publicKey.toString());
          localStorage.setItem('walletConnected', 'true');
        } else {
          setPublicKey(null);
          localStorage.removeItem('walletConnected');
        }
      });
    }

    return () => {
      if (solana) {
        solana.removeAllListeners('connect');
        solana.removeAllListeners('disconnect');
        solana.removeAllListeners('accountChanged');
      }
    };
  }, []);

  // 초기 자동 연결
  useEffect(() => {
    const autoConnect = async (): Promise<void> => {
      const { solana } = window;
      if (solana && localStorage.getItem('walletConnected') === 'true') {
        try {
          const response = await solana.connect({ onlyIfTrusted: true });
          setPublicKey(response.publicKey.toString());
        } catch (error) {
          console.error("자동 연결 실패:", error);
          localStorage.removeItem('walletConnected');
        }
      }
    };

    autoConnect();
  }, []);

  const connectWallet = async (): Promise<void> => {
    try {
      if (wallet) {
        const response = await wallet.connect();
        setPublicKey(response.publicKey.toString());
        localStorage.setItem('walletConnected', 'true');
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error("지갑 연결 실패:", error);
      localStorage.removeItem('walletConnected');
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    try {
      if (wallet) {
        await wallet.disconnect();
        setPublicKey(null);
        localStorage.removeItem('walletConnected');
      }
    } catch (error) {
      console.error("지갑 연결 해제 실패:", error);
    }
  };

  return (
    <WalletContext.Provider 
      value={{ 
        wallet, 
        publicKey, 
        connectWallet, 
        disconnectWallet 
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