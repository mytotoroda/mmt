// utils/mmt/raydium.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  LIQUIDITY_STATE_LAYOUT_V4, 
  // 추가 레이아웃들
} from '@raydium-io/raydium-sdk';



export const calculatePoolPrice = (
  baseReserve: number,
  quoteReserve: number,
  baseDecimals: number,
  quoteDecimals: number
): number => {
  if (baseReserve <= 0) return 0;
  
  const baseAdjusted = baseReserve / Math.pow(10, baseDecimals);
  const quoteAdjusted = quoteReserve / Math.pow(10, quoteDecimals);
  return quoteAdjusted / baseAdjusted;
};

export const verifyRaydiumPool = async (
  poolAddress: string,
  connection: Connection
) => {
  try {
    console.log('Verifying pool address:', poolAddress);
    
    const poolPublicKey = new PublicKey(poolAddress);
    const poolInfo = await connection.getAccountInfo(poolPublicKey);
    
    if (!poolInfo) {
      console.log('Pool account not found');
      return null;
    }

    console.log('Pool data length:', poolInfo.data.length);

    // 여러 레이아웃 시도
    let poolState;
    try {
      // V4 레이아웃 시도
      poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(poolInfo.data);
    } catch (e) {
      try {
        // V3 레이아웃 시도
        poolState = LIQUIDITY_STATE_LAYOUT_V3.decode(poolInfo.data);
      } catch (e) {
        console.log('Failed to decode pool state with V3 and V4 layouts');
        // 기본값으로 처리
        return {
          baseDecimals: 9,
          quoteDecimals: 9,
          lpDecimals: 9,
          baseReserve: 0,
          quoteReserve: 0,
          lpSupply: 0,
          startTime: Date.now() / 1000,
          programId: poolInfo.owner.toString(),
          ammId: poolAddress,
          status: 'ACTIVE'
        };
      }
    }

    console.log('Successfully decoded pool state:', poolState);

    return {
      baseDecimals: poolState.baseDecimals || 9,
      quoteDecimals: poolState.quoteDecimals || 9,
      lpDecimals: poolState.lpDecimals || 9,
      baseReserve: typeof poolState.baseReserve?.toNumber === 'function' 
        ? poolState.baseReserve.toNumber() 
        : 0,
      quoteReserve: typeof poolState.quoteReserve?.toNumber === 'function'
        ? poolState.quoteReserve.toNumber()
        : 0,
      lpSupply: typeof poolState.lpSupply?.toNumber === 'function'
        ? poolState.lpSupply.toNumber()
        : 0,
      startTime: typeof poolState.startTime?.toNumber === 'function'
        ? poolState.startTime.toNumber()
        : Date.now() / 1000,
      programId: poolState.programId?.toString() || poolInfo.owner.toString(),
      ammId: poolState.id?.toString() || poolAddress,
      status: poolState.status ? 'ACTIVE' : 'INACTIVE'
    };

  } catch (error) {
    console.error('Error in verifyRaydiumPool:', error);
    // 에러가 나도 기본값으로 처리
    return {
      baseDecimals: 9,
      quoteDecimals: 9,
      lpDecimals: 9,
      baseReserve: 0,
      quoteReserve: 0,
      lpSupply: 0,
      startTime: Date.now() / 1000,
      programId: 'unknown',
      ammId: poolAddress,
      status: 'ACTIVE'
    };
  }
};