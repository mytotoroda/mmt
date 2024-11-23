// lib/mmt/services/swapService.ts

import { 
  Raydium,
  ApiV3PoolInfoStandardItem, 
  AmmV4Keys,
  ApiPoolInfo,
  ComputeBudgetConfig,
  AmmRpcData,
  ApiPoolInfoItem,
  AMM_V4,
  AMM_STABLE,
  DEVNET_PROGRAM_ID
} from '@raydium-io/raydium-sdk-v2';
import { Connection, PublicKey } from '@solana/web3.js';
import { TokenInfo } from '@/types/mmt/pool';
import { RaydiumService } from '../raydium';
import { NATIVE_MINT } from '@solana/spl-token';
import { RAYDIUM_POOLS, SUPPORTED_TOKENS } from '../constants/raydium';
import BN from 'bn.js';
import Decimal from 'decimal.js';

// 유효한 프로그램 ID 리스트
const VALID_PROGRAM_IDS = new Set([
  AMM_V4.toBase58(),
  AMM_STABLE.toBase58(),
  DEVNET_PROGRAM_ID.AmmV4.toBase58(),
  DEVNET_PROGRAM_ID.AmmStable.toBase58(),
]);

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  minAmountOut: string;
  priceImpact: number;
  executionPrice: string;
  fee?: string;
  route?: {
    poolId: string;
    tokenASymbol: string;
    tokenBSymbol: string;
  };
}

export interface SwapParams {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  slippage?: number;
  wallet?: string;
}

export interface SwapResult {
  txId: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: string;
}

export class SwapService {
  private raydium: RaydiumService;
  private isMainnet: boolean;

  constructor(raydium: RaydiumService) {
    this.raydium = raydium;
    this.isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet-beta';
  }

 async getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  try {
    const sdk = await this.raydium.initializeSdk();
    if (!sdk) throw new Error('SDK initialization failed');

    // 토큰 주소 정규화
    const tokenInAddress = this.normalizeTokenAddress(params.tokenIn.address);
    const tokenOutAddress = this.normalizeTokenAddress(params.tokenOut.address);

    // 풀 ID 찾기
    const poolId = this.findPoolId(params.tokenIn.symbol, params.tokenOut.symbol);
    if (!poolId) {
      throw new Error(`No pool found for ${params.tokenIn.symbol}-${params.tokenOut.symbol}`);
    }

    console.log('Using pool:', poolId);

    try {
      // 풀 정보 가져오기
      const poolInfos = await sdk.liquidity.getRpcPoolInfos([poolId]);
      if (!poolInfos || !poolInfos[poolId]) {
        throw new Error(`Failed to fetch pool info for ${poolId}`);
      }

      const rpcInfo = poolInfos[poolId];
      console.log('RPC Info:', {
        baseReserve: rpcInfo.baseReserve?.toString() || 'N/A',
        quoteReserve: rpcInfo.quoteReserve?.toString() || 'N/A',
        status: rpcInfo.status?.toString() || 'N/A'
      });

      // Null 체크
      if (!rpcInfo.baseReserve || !rpcInfo.quoteReserve || !rpcInfo.status) {
        throw new Error('Invalid pool state: missing reserve or status information');
      }

      // 풀 키 가져오기
      const poolKeys = await sdk.liquidity.getAmmPoolKeys(poolId);
      console.log('Pool Keys:', poolKeys);

      // 입력 금액 변환
      const amountInDecimal = new Decimal(params.amountIn);
      if (amountInDecimal.isNaN() || amountInDecimal.isZero()) {
        throw new Error('Invalid input amount');
      }

      const amountInBN = new BN(
        amountInDecimal
          .mul(new Decimal(10).pow(params.tokenIn.decimals))
          .toFixed(0)
      );

      // 풀 정보 구성
      const poolInfo = {
        id: poolId,
        baseMint: tokenInAddress,
        quoteMint: tokenOutAddress,
        baseReserve: rpcInfo.baseReserve,
        quoteReserve: rpcInfo.quoteReserve,
        status: rpcInfo.status.toNumber(),
        version: 4
      };

      console.log('Computing amount out with pool info:', {
        ...poolInfo,
        baseReserve: poolInfo.baseReserve.toString(),
        quoteReserve: poolInfo.quoteReserve.toString(),
        status: poolInfo.status
      });

      // 견적 계산
      const out = sdk.liquidity.computeAmountOut({
        poolInfo,
        amountIn: amountInBN,
        currencyIn: tokenInAddress,
        currencyOut: tokenOutAddress,
        slippage: params.slippage || 0.01
      });

      // 견적 결과 확인
      if (!out.amountOut || !out.minAmountOut) {
        throw new Error('Invalid computation result: missing output amounts');
      }

      console.log('Computation result:', {
        amountOut: out.amountOut.toString(),
        minAmountOut: out.minAmountOut.toString(),
        priceImpact: out.priceImpact
      });

      // 실행 가격 계산
      const amountOutDecimal = new Decimal(out.amountOut.toString())
        .div(new Decimal(10).pow(params.tokenOut.decimals));
      
      const executionPrice = this.calculateExecutionPrice(
        amountInDecimal,
        amountOutDecimal
      );

      return {
        amountIn: params.amountIn,
        amountOut: amountOutDecimal.toString(),
        minAmountOut: new Decimal(out.minAmountOut.toString())
          .div(new Decimal(10).pow(params.tokenOut.decimals))
          .toString(),
        priceImpact: out.priceImpact || 0,
        executionPrice,
        fee: out.fee?.toString() || '0',
        route: {
          poolId,
          tokenASymbol: params.tokenIn.symbol,
          tokenBSymbol: params.tokenOut.symbol
        }
      };

    } catch (error) {
      console.error('Error computing swap:', error);
      throw error;
    }

  } catch (error) {
    console.error('Swap quote error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get swap quote');
  }
}

private findPoolId(tokenASymbol: string, tokenBSymbol: string): string {
  const pairKey = `${tokenASymbol}-${tokenBSymbol}`;
  const reversePairKey = `${tokenBSymbol}-${tokenASymbol}`;
  
  console.log('Looking for pool:', { pairKey, reversePairKey });
  console.log('Available pools:', RAYDIUM_POOLS);

  const pool = RAYDIUM_POOLS[pairKey] || RAYDIUM_POOLS[reversePairKey];
  
  if (!pool) {
    console.error('No pool found for pair:', { pairKey, reversePairKey });
    throw new Error(`No pool found for pair ${pairKey}`);
  }

  console.log('Found pool:', pool);
  return pool.id;
}

private calculateExecutionPrice(amountIn: Decimal, amountOut: Decimal): string {
  if (!amountIn || amountIn.isZero()) return '0';
  if (!amountOut) return '0';
  
  try {
    return amountOut.div(amountIn).toString();
  } catch (error) {
    console.error('Error calculating execution price:', error);
    return '0';
  }
}

  async executeSwap(params: SwapParams, quote: SwapQuote): Promise<SwapResult> {
    try {
      if (!params.wallet) {
        throw new Error('Wallet address is required');
      }

      const sdk = await this.raydium.initializeSdk();
      if (!sdk) throw new Error('SDK initialization failed');

      if (!quote.route?.poolId) {
        throw new Error('Pool information is missing');
      }

      // 풀 정보 가져오기
      const poolInfos = await sdk.liquidity.getRpcPoolInfos([quote.route.poolId]);
      const rpcInfo = poolInfos[quote.route.poolId];

      if (!rpcInfo) {
        throw new Error('Pool information not found');
      }

      const poolKeys = await sdk.liquidity.getAmmPoolKeys(quote.route.poolId);

      // 스왑 실행
      const { execute } = await sdk.liquidity.swap({
        poolInfo: {
          id: quote.route.poolId,
          baseMint: this.normalizeTokenAddress(params.tokenIn.address),
          quoteMint: this.normalizeTokenAddress(params.tokenOut.address),
          baseReserve: rpcInfo.baseReserve,
          quoteReserve: rpcInfo.quoteReserve,
          status: rpcInfo.status.toNumber(),
          version: 4
        },
        poolKeys,
        amountIn: new BN(new Decimal(params.amountIn)
          .mul(new Decimal(10).pow(params.tokenIn.decimals))
          .toFixed(0)),
        amountOut: new BN(new Decimal(quote.minAmountOut)
          .mul(new Decimal(10).pow(params.tokenOut.decimals))
          .toFixed(0)),
        fixedSide: 'in',
        inputMint: this.normalizeTokenAddress(params.tokenIn.address),
        txVersion: this.raydium.getTxVersion(),
        computeBudgetConfig: {
          units: 600000,
          microLamports: 50000
        }
      });

      const { txId } = await execute({ sendAndConfirm: true });

      return {
        txId,
        amountIn: params.amountIn,
        amountOut: quote.minAmountOut,
        priceImpact: quote.priceImpact,
        fee: quote.fee || '0'
      };

    } catch (error) {
      console.error('Swap execution error:', error);
      if (error instanceof Error) {
        throw new Error(`Swap execution failed: ${error.message}`);
      }
      throw new Error('Failed to execute swap');
    }
  }

  private findPoolId(tokenASymbol: string, tokenBSymbol: string): string {
    const pairKey = `${tokenASymbol}-${tokenBSymbol}`;
    const reversePairKey = `${tokenBSymbol}-${tokenASymbol}`;
    
    const pool = RAYDIUM_POOLS[pairKey] || RAYDIUM_POOLS[reversePairKey];
    
    if (!pool) {
      throw new Error(`No pool found for pair ${pairKey}`);
    }

    return pool.id;
  }

  private normalizeTokenAddress(address: string): string {
    return address === 'SOL' ? NATIVE_MINT.toString() : address;
  }

  private calculateExecutionPrice(amountIn: Decimal, amountOut: Decimal): string {
    if (amountIn.isZero()) return '0';
    return amountOut.div(amountIn).toString();
  }

  public getSupportedTokens(): TokenInfo[] {
    return Object.values(SUPPORTED_TOKENS);
  }
}

// Singleton instance
export const swapService = new SwapService(new RaydiumService());
