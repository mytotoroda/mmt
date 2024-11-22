// lib/mmt/services/swapService.ts
import { TokenInfo } from '@/types/mmt/pool';
import { RaydiumService } from '../raydium';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { NATIVE_MINT } from '@solana/spl-token';
import { 
  ApiV3PoolInfoStandardItem, 
  AmmV4Keys,
  ApiPoolInfo,
  RpcPoolInfo
} from '@raydium-io/raydium-sdk-v2';

// Known Pool IDs
const KNOWN_POOLS = {
  'RAY-SOL': 'AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA',
  'RAY-USDC': '6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg',
  'SOL-USDC': '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'
};

export interface SwapQuote {
  amountOut: string;
  minAmountOut: string;
  priceImpact: number;
  poolPrice?: string;
  fee?: string;
  route?: {
    poolId: string;
    tokenASymbol: string;
    tokenBSymbol: string;
  };
}

export class SwapService {
  private raydium: RaydiumService;

  constructor(raydium: RaydiumService) {
    this.raydium = raydium;
  }

  async getSwapQuote(params: {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    amountIn: string;
    slippage?: number;
  }): Promise<SwapQuote> {
    try {
      const sdk = await this.raydium.initializeSdk();
      if (!sdk) throw new Error('Failed to initialize Raydium SDK');

      // SOL 주소 정규화
      const tokenInAddress = params.tokenIn.address === 'SOL' ? NATIVE_MINT.toString() : params.tokenIn.address;
      const tokenOutAddress = params.tokenOut.address === 'SOL' ? NATIVE_MINT.toString() : params.tokenOut.address;

      // 풀 ID 찾기
      const poolId = await this.findPoolId(params.tokenIn.symbol, params.tokenOut.symbol);
      if (!poolId) {
        throw new Error(`No liquidity pool found for ${params.tokenIn.symbol}/${params.tokenOut.symbol}`);
      }

      console.log('Using pool:', poolId);

      // RPC를 통해 풀 정보 가져오기
      const poolInfos = await sdk.liquidity.getRpcPoolInfos([poolId]);
      const poolInfo = poolInfos[poolId];

      if (!poolInfo) {
        throw new Error('Failed to fetch pool information from RPC');
      }

      console.log('Pool price:', poolInfo.poolPrice);

      // 입력 금액을 적절한 데시멀로 변환
      const amountInBN = new BN(
        new Decimal(params.amountIn)
          .mul(new Decimal(10).pow(params.tokenIn.decimals))
          .toFixed(0)
      );

      // 스왑 계산
      const out = sdk.liquidity.computeAmountOut({
        poolInfo: {
          id: poolId,
          baseMint: tokenInAddress,
          quoteMint: tokenOutAddress,
          baseReserve: poolInfo.baseReserve,
          quoteReserve: poolInfo.quoteReserve,
          status: poolInfo.status.toNumber(),
          version: 4
        },
        amountIn: amountInBN,
        currencyIn: tokenInAddress,
        currencyOut: tokenOutAddress,
        slippage: params.slippage || 0.01
      });

      return {
        amountOut: new Decimal(out.amountOut.toString())
          .div(new Decimal(10).pow(params.tokenOut.decimals))
          .toString(),
        minAmountOut: new Decimal(out.minAmountOut.toString())
          .div(new Decimal(10).pow(params.tokenOut.decimals))
          .toString(),
        priceImpact: parseFloat(out.priceImpact.toString()),
        poolPrice: poolInfo.poolPrice.toString(),
        route: {
          poolId,
          tokenASymbol: params.tokenIn.symbol,
          tokenBSymbol: params.tokenOut.symbol
        }
      };

    } catch (error) {
      console.error('Swap quote error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get swap quote');
    }
  }

  private async findPoolId(tokenASymbol: string, tokenBSymbol: string): Promise<string | null> {
    // 먼저 알려진 풀에서 검색
    const poolKey = `${tokenASymbol}-${tokenBSymbol}`;
    const reversePoolKey = `${tokenBSymbol}-${tokenASymbol}`;
    
    if (KNOWN_POOLS[poolKey]) return KNOWN_POOLS[poolKey];
    if (KNOWN_POOLS[reversePoolKey]) return KNOWN_POOLS[reversePoolKey];

    try {
      // 알려진 풀에 없다면 API에서 검색
      const response = await fetch('https://api.raydium.io/v2/main/pairs');
      if (!response.ok) {
        throw new Error('Failed to fetch pools from API');
      }

      const pairs = await response.json();
      const pair = pairs.find((p: any) => 
        (p.name === poolKey || p.name === reversePoolKey)
      );

      return pair ? pair.ammId : null;

    } catch (error) {
      console.error('Error finding pool:', error);
      return null;
    }
  }
}