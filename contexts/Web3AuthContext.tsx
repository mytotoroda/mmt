//contexts/Web3AuthContext.tsx
'use client';

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from '@web3auth/base';
import { SolanaPrivateKeyProvider, SolanaWallet as BaseSolanaWallet } from '@web3auth/solana-provider';

// BaseSolanaWallet을 확장하여 필요한 메서드 추가
export class SolanaWallet {
  private provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  async getAccounts(): Promise<string[]> {
    try {
      const accounts = await this.provider.request<string[]>({ method: "getAccounts" });
      return accounts || [];
    } catch (error) {
      console.error("Error getting accounts:", error);
      return [];
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const signedTx = await this.provider.request({
        method: "signTransaction",
        params: { transaction: transaction.serialize() },
      });
      return Transaction.from(signedTx as Buffer);
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }

  // 기존 메서드를 Transaction 타입으로 수정
  async signAndSendTransaction(transaction: Transaction): Promise<string> {
    try {
      const signedTx = await this.provider.request({
        method: "signAndSendTransaction",
        params: { transaction: transaction.serialize() },
      });
      return signedTx as string;
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }
}

interface Web3AuthUser {
  email: string;
  name: string;
  profileImage: string;
  wallet: string;
}

interface Web3AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Web3AuthUser | null;
  login: () => Promise<void>;
  disconnect: () => Promise<void>;
  provider: SafeEventEmitterProvider | null;
  web3auth: Web3Auth | null;  // 추가
  initWeb3Auth: () => Promise<void>;  // 추가
}

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

const getWeb3AuthConfig = () => {
  const rpcUrl = 'https://api.devnet.solana.com';
  
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    chainId: '0x2',
    rpcTarget: rpcUrl,
    displayName: 'Solana Devnet',
    blockExplorer: 'https://explorer.solana.com/?cluster=devnet',
    ticker: 'SOL',
    tickerName: 'Solana',
  };

  const privateKeyProvider = new SolanaPrivateKeyProvider({
    config: { chainConfig }
  });

  return {
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
    web3AuthNetwork: 'sapphire_devnet',
    chainConfig,
    privateKeyProvider,
    uiConfig: {
      appName: "Solana DEX",
      appLogo: "/logo.png",
      theme: "dark",
      loginMethodsOrder: ["google"],
      defaultLanguage: "en",
      mode: "dark",
    },
  };
};

export function Web3AuthProvider({ children }: { children: ReactNode }) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Web3AuthUser | null>(null);

  // 초기화 함수를 별도로 분리
  const initWeb3Auth = async () => {
    try {
      console.log("Initializing Web3Auth...");
      const config = getWeb3AuthConfig();
      console.log("Web3Auth Config:", JSON.stringify(config, null, 2));

      const web3authInstance = new Web3Auth({
        clientId: config.clientId,
        web3AuthNetwork: config.web3AuthNetwork,
        chainConfig: config.chainConfig,
        uiConfig: config.uiConfig,
        privateKeyProvider: config.privateKeyProvider,
      });

      await web3authInstance.initModal();
      console.log("Web3Auth initialized successfully");
      
      setWeb3auth(web3authInstance);

      if (web3authInstance.connected) {
        setProvider(web3authInstance.provider);
        const userInfo = await web3authInstance.getUserInfo();
        const solanaWallet = new SolanaWallet(web3authInstance.provider!);
        const accounts = await solanaWallet.getAccounts();
        
        setUser({
          email: userInfo.email || '',
          name: userInfo.name || '',
          profileImage: userInfo.profileImage || '',
          wallet: accounts[0] || '',
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to initialize Web3Auth:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initWeb3Auth();
  }, []);


////////////////////////////////////////////////
const login = async () => {
  if (!web3auth) {
    console.error("Web3Auth not initialized");
    return;
  }

  try {
    setIsLoading(true);
    console.log("Attempting to connect...");
    
    const web3authProvider = await web3auth.connect();
    const userInfo = await web3auth.getUserInfo();
    
    // 서버에 이메일 확인 요청
    const verifyResponse = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userInfo.email }),
    });
    
    const { isAuthorized } = await verifyResponse.json();
    
    if (!isAuthorized) {
      await web3auth.logout();
      throw new Error('Unauthorized email address');
    }
    
    // JWT 토큰 발급 요청
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        profileImage: userInfo.profileImage
      }),
    });

    const { token } = await loginResponse.json();
    
    if (!token) {
      throw new Error('Failed to get authentication token');
    }

    // user-session 쿠키에 JWT 토큰 저장
    document.cookie = `user-session=${token}; path=/; max-age=86400; secure; samesite=strict`;
    
    setProvider(web3authProvider);
    
    if (web3authProvider) {
      const solanaWallet = new SolanaWallet(web3authProvider);
      const accounts = await solanaWallet.getAccounts();
      
      const userData = {
        email: userInfo.email || '',
        name: userInfo.name || '',
        profileImage: userInfo.profileImage || '',
        wallet: accounts[0] || '',
      };
      
      setUser(userData);
      setIsAuthenticated(true);
    }
  } catch (error) {
    console.error("Login error:", error);
    if (web3auth.connected) {
      await web3auth.logout();
    }
    // 에러 시 쿠키 제거
    document.cookie = 'user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsAuthenticated(false);
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

//////////////////////////////

const disconnect = async () => {
  if (!web3auth) {
    console.error("Web3Auth not initialized");
    return;
  }

  try {
    setIsLoading(true);
    await web3auth.logout();
    // user-session 쿠키 제거
    document.cookie = 'user-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setProvider(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log("Disconnected successfully");
  } catch (error) {
    console.error("Disconnect error:", error);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Web3AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        login,
        disconnect,
        provider,
	web3auth,        // 추가
        initWeb3Auth,    // 추가
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
}