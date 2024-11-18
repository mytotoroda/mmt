// app/api/mmt/pools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const pool = getPool();
  let connection = null;

  try {
    connection = await pool.getConnection();
    
    const [pools] = await connection.query(`
      SELECT 
        p.*,
        CAST(p.current_price AS DECIMAL(65,9)) as current_price,
        CAST(p.liquidity_usd AS DECIMAL(20,2)) as liquidity_usd,
        c.base_spread,
        c.bid_adjustment,
        c.ask_adjustment,
        c.check_interval,
        c.min_trade_size,
        c.max_trade_size,
        c.trade_size_percentage,
        c.target_ratio,
        c.rebalance_threshold,
        c.max_position_size,
        c.max_slippage,
        c.stop_loss_percentage,
        c.emergency_stop,
        c.enabled as strategy_enabled
      FROM mmt_pools p
      LEFT JOIN mmt_pool_configs c ON p.id = c.pool_id
      WHERE p.status != 'INACTIVE'
      ORDER BY p.created_at DESC
    `);

    // 데이터 구조 변환
    const formattedPools = (pools as any[]).map(pool => ({
      id: pool.id,
      pool_address: pool.pool_address,
      token_a_symbol: pool.token_a_symbol,
      token_a_address: pool.token_a_address,
      token_a_decimals: pool.token_a_decimals,
      token_b_symbol: pool.token_b_symbol,
      token_b_address: pool.token_b_address,
      token_b_decimals: pool.token_b_decimals,
      pool_type: pool.pool_type,
      status: pool.status,
      creator_wallet: pool.creator_wallet,
      current_price: pool.current_price ? Number(pool.current_price) : null,
      liquidity_usd: pool.liquidity_usd ? Number(pool.liquidity_usd) : null,
      
      // 전략 설정
      config: {
        baseSpread: pool.base_spread ? Number(pool.base_spread) * 100 : 0.1, // % 단위로 변환
        bidAdjustment: pool.bid_adjustment ? Number(pool.bid_adjustment) * 100 : -0.05,
        askAdjustment: pool.ask_adjustment ? Number(pool.ask_adjustment) * 100 : 0.05,
        checkInterval: pool.check_interval || 30,
        minTradeSize: pool.min_trade_size || 100,
        maxTradeSize: pool.max_trade_size || 10000,
        tradeSizePercentage: pool.trade_size_percentage ? Number(pool.trade_size_percentage) * 100 : 5,
        targetRatio: pool.target_ratio || 0.5,
        rebalanceThreshold: pool.rebalance_threshold ? Number(pool.rebalance_threshold) * 100 : 5,
        maxPositionSize: pool.max_position_size || 50000,
        maxSlippage: pool.max_slippage ? Number(pool.max_slippage) * 100 : 1,
        stopLossPercentage: pool.stop_loss_percentage ? Number(pool.stop_loss_percentage) * 100 : 5,
        emergencyStop: Boolean(pool.emergency_stop),
        enabled: Boolean(pool.strategy_enabled)
      },

      // 풀 통계 정보 (필요한 경우)
      fee_rate: Number(pool.fee_rate),
      volume_24h: pool.volume_24h ? Number(pool.volume_24h) : 0,
      created_at: pool.created_at,
      updated_at: pool.updated_at
    }));

    return NextResponse.json({ 
      success: true, 
      pools: formattedPools 
    });

  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json(
      { success: false, message: '풀 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}