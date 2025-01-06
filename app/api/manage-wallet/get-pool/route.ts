// app/manage-wallet/get-pool/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const pool = getPool();

  try {
    const [pools] = await pool.query(`
      SELECT 
        id,
        pool_address,
        token_a_address,
        token_a_symbol,
        token_a_decimals,
        token_b_address,
        token_b_symbol,
        token_b_decimals,
        fee_rate,
        status,
        last_price,
        liquidity_usd
      FROM mmt_pools
      LIMIT 1
    `);

    if (!Array.isArray(pools) || pools.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No active pool found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      pool: pools[0]
    });

  } catch (error) {
    console.error('Error fetching pool:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pool data' },
      { status: 500 }
    );
  }
}