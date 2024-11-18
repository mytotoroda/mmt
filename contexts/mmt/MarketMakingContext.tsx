// contexts/mmt/MarketMakingContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { RaydiumService } from '@/lib/mmt/raydium';

// 전략 설정 타입 정의
interface MarketMakingStrategy {
  baseSpread: number;
  bidAdjustment: number;
  askAdjustment: number;
  checkInterval: number;
  minTradeSize: number;
  maxTradeSize: number;
  tradeSizePercentage: number;
  targetRatio: number;
  rebalanceThreshold: number;
  maxPositionSize: number;
  maxSlippage: number;
  stopLossPercentage: number;
  emergencyStop: boolean;
  enabled: boolean;
}

// 풀 정보 타입 정의
interface Pool {
  id: number;
  pool_address: string;
  token_a_symbol: string;
  token_a_address: string;
  token_a_decimals: number;
  token_b_symbol: string;
  token_b_address: string;
  token_b_decimals: number;
  pool_type: 'AMM' | 'CL';
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  current_price: number | null;
  liquidity_usd: number | null;
}

// 거래 통계 타입 정의
interface TradingStats {
  tokenABalance: number;
  tokenBBalance: number;
  lastPrice: number;
  volume24h: number;
  trades24h: number;
  profitLoss: number;
  totalFees: number;
  successRate: number;
}

interface MarketMakingContextType {
  // 풀 관리
  selectedPool: Pool | null;
  setSelectedPool: (pool: Pool | null) => void;
  
  // 전략 설정
  strategy: MarketMakingStrategy;
  updateStrategy: (newStrategy: Partial<MarketMakingStrategy>) => void;
  saveStrategy: () => Promise<void>;
  
  // 거래 상태
  isTrading: boolean;
  startTrading: () => Promise<void>;
  stopTrading: () => Promise<void>;
  emergencyStop: () => Promise<void>;
  
  // 통계 정보
  stats: TradingStats | null;
  
  // 서비스
  raydiumService: RaydiumService | null;
  loading: boolean;
  error: string | null;
}

const MarketMakingContext = createContext<MarketMakingContextType | null>(null);

export const useMarketMaking = () => {
  const context = useContext(MarketMakingContext);
  if (!context) {
    throw new Error('useMarketMaking must be used within a MarketMakingProvider');
  }
  return context;
};

export const MarketMakingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection, publicKey, network } = useWallet();
  const [raydiumService, setRaydiumService] = useState<RaydiumService | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  
  // 전략 설정 상태
  const [strategy, setStrategy] = useState<MarketMakingStrategy>({
    baseSpread: 0.1,
    bidAdjustment: -0.05,
    askAdjustment: 0.05,
    checkInterval: 30,
    minTradeSize: 100,
    maxTradeSize: 10000,
    tradeSizePercentage: 5,
    targetRatio: 0.5,
    rebalanceThreshold: 5.0,
    maxPositionSize: 50000,
    maxSlippage: 1.0,
    stopLossPercentage: 5.0,
    emergencyStop: false,
    enabled: false
  });

  // 거래 통계 상태
  const [stats, setStats] = useState<TradingStats | null>(null);

  // Raydium 서비스 초기화
  useEffect(() => {
    if (connection) {
      const isMainnet = network === 'mainnet-beta';
      const service = new RaydiumService(connection, isMainnet);
      setRaydiumService(service);
    }
  }, [connection, network]);

  // 거래 실행 루프
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const executeTrading = async () => {
      if (!isTrading || !selectedPool || !raydiumService || !strategy.enabled) return;
      
      try {
        // 현재 시장 상태 체크
        const marketState = await checkMarketState();
        
        // 포지션 체크 및 재조정
        if (needsRebalancing()) {
          await rebalancePosition();
        }
        
        // 거래 실행
        if (shouldExecuteTrade(marketState)) {
          await executeTrade();
        }
        
        // 통계 업데이트
        await updateStats();
      } catch (error) {
        console.error('Trading error:', error);
        setError(error instanceof Error ? error.message : '거래 중 오류가 발생했습니다');
        await stopTrading();
      }
    };

    if (isTrading && strategy.enabled) {
      intervalId = setInterval(executeTrading, strategy.checkInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTrading, selectedPool, raydiumService, strategy]);

  // 전략 설정 업데이트
  const updateStrategy = async (newStrategy: Partial<MarketMakingStrategy>) => {
    setStrategy(prev => ({ ...prev, ...newStrategy }));
  };

  // 전략 설정 저장
  const saveStrategy = async () => {
    if (!selectedPool || !publicKey) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/mmt/strategy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool.id,
          walletAddress: publicKey,
          ...strategy
        }),
      });

      if (!response.ok) throw new Error('Failed to save strategy');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '전략 저장 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 거래 시작
  const startTrading = async () => {
    if (!selectedPool || !raydiumService) return;
    setIsTrading(true);
  };

  // 거래 중지
  const stopTrading = async () => {
    setIsTrading(false);
  };

  // 긴급 중지
  const emergencyStop = async () => {
    await stopTrading();
    await updateStrategy({ emergencyStop: true, enabled: false });
    await saveStrategy();
  };

  const value = {
    selectedPool,
    setSelectedPool,
    strategy,
    updateStrategy,
    saveStrategy,
    isTrading,
    startTrading,
    stopTrading,
    emergencyStop,
    stats,
    raydiumService,
    loading,
    error
  };

  return (
    <MarketMakingContext.Provider value={value}>
      {children}
    </MarketMakingContext.Provider>
  );
};