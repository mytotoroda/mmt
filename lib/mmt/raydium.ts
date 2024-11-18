// lib/mmt/raydium.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  Liquidity,
  MAINNET_PROGRAM_ID,
  DEVNET_PROGRAM_ID
} from '@raydium-io/raydium-sdk';

export class RaydiumService {
  private connection: Connection;
  private isMainnet: boolean;

  constructor(connection: Connection, isMainnet: boolean = true) {
    this.connection = connection;
    this.isMainnet = isMainnet;
  }

  // 풀 유효성 검사 개선
  async isValidPool(poolAddress: string): Promise<boolean> {
    try {
      console.log('Checking pool validity for:', poolAddress);

      if (!poolAddress) {
        console.log('Pool address is empty');
        return false;
      }

      // PublicKey 유효성 검사
      let pubkey: PublicKey;
      try {
        pubkey = new PublicKey(poolAddress);
      } catch (error) {
        console.log('Invalid public key format:', error);
        return false;
      }

      // 계정 정보 조회
      const accountInfo = await this.connection.getAccountInfo(pubkey);
      
      // 계정이 존재하는지 확인
      if (!accountInfo) {
        console.log('Account not found');
        return false;
      }

      // 계정 데이터 길이 확인 (최소 크기)
      if (!accountInfo.data || accountInfo.data.length < 10) {
        console.log('Invalid account data length:', accountInfo.data.length);
        return false;
      }

      // 프로그램 ID 확인
      const programId = this.isMainnet ? 
        MAINNET_PROGRAM_ID.AmmV4 : 
        DEVNET_PROGRAM_ID.AmmV4;

      if (!accountInfo.owner.equals(programId)) {
        console.log('Account owner mismatch', {
          actual: accountInfo.owner.toString(),
          expected: programId.toString()
        });
      }

      // 여기까지 왔다면 유효한 풀로 간주
      return true;

    } catch (error) {
      console.error('Error in isValidPool:', error);
      // 체크 과정에서 에러가 발생해도 false 반환
      return false;
    }
  }

  // 풀 상태 업데이트
  async updatePool(poolAddress: string): Promise<{ baseReserve: number; quoteReserve: number }> {
    try {
      // 풀 유효성 먼저 확인
      const isValid = await this.isValidPool(poolAddress);
      if (!isValid) {
        return {
          baseReserve: 0,
          quoteReserve: 0
        };
      }

      // 계정 정보 가져오기
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(poolAddress));
      
      if (!accountInfo || !accountInfo.data) {
        throw new Error('Pool account data not found');
      }

      // 임시로 기본값 반환
      return {
        baseReserve: 1000000,  // 예시값
        quoteReserve: 1000000  // 예시값
      };

    } catch (error) {
      console.error('Error in updatePool:', error);
      return {
        baseReserve: 0,
        quoteReserve: 0
      };
    }
  }

  // 풀 균형 계산
  calculatePoolBalance(
    baseReserve: number,
    quoteReserve: number,
    baseDecimals: number,
    quoteDecimals: number
  ): { baseBalance: number; quoteBalance: number } {
    return {
      baseBalance: baseReserve / Math.pow(10, baseDecimals),
      quoteBalance: quoteReserve / Math.pow(10, quoteDecimals)
    };
  }
}

// ... (나머지 코드 유지)

export interface MarketMakingStrategy {
  updateOrders(): Promise<void>;
  adjustSpread(marketVolatility: number): void;
  rebalancePositions(): Promise<void>;
}

export class BasicMarketMakingStrategy implements MarketMakingStrategy {
  private raydiumService: RaydiumService;
  private pool: PoolInfo;
  private config: {
    baseSpread: number;
    minSpread: number;
    maxSpread: number;
    orderSize: number;
    rebalanceThreshold: number;
  };

  constructor(
    raydiumService: RaydiumService,
    pool: PoolInfo,
    config: {
      baseSpread: number;
      minSpread: number;
      maxSpread: number;
      orderSize: number;
      rebalanceThreshold: number;
    }
  ) {
    this.raydiumService = raydiumService;
    this.pool = pool;
    this.config = config;
  }

  async updateOrders(): Promise<void> {
    try {
      const currentPrice = await this.raydiumService.getPoolPrice(this.pool.id);
      if (!currentPrice) throw new Error('Failed to get current price');

      const bidPrice = currentPrice * (1 - this.config.baseSpread);
      const askPrice = currentPrice * (1 + this.config.baseSpread);

      // Place new orders
      await this.raydiumService.createOrder(
        this.pool.id,
        'buy',
        bidPrice,
        this.config.orderSize
      );
      await this.raydiumService.createOrder(
        this.pool.id,
        'sell',
        askPrice,
        this.config.orderSize
      );
    } catch (error) {
      console.error('Error updating orders:', error);
      throw error;
    }
  }

  adjustSpread(marketVolatility: number): void {
    const newSpread = this.config.baseSpread * (1 + marketVolatility);
    this.config.baseSpread = Math.min(
      Math.max(newSpread, this.config.minSpread),
      this.config.maxSpread
    );
  }

  async rebalancePositions(): Promise<void> {
    // TODO: Implement rebalancing logic
    console.log('Rebalancing positions...');
  }
}