// app/api/pool/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const pool = getPool();
  let connection = null;

  try {
    connection = await pool.getConnection();
    const [pools] = await connection.query('SELECT * FROM mmt_pools LIMIT 1');
    return NextResponse.json(pools[0]);
  } catch (error) {
    console.error('Error fetching pool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pool data' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest) {
  const pool = getPool();
  let connection = null;

  try {
    const data = await request.json();
    connection = await pool.getConnection();
    
    // 수정 가능한 모든 필드 정의
    const updateFields = [
      'pool_address',
      'token_a_address',
      'token_a_symbol',
      'token_a_decimals',
      'token_a_reserve',
      'token_b_address',
      'token_b_symbol',
      'token_b_decimals',
      'token_b_reserve',
      'fee_rate',
      'status',
      'creator_wallet',
      'last_price',
      'volume_24h',
      'liquidity_usd',
      'liquidity',
      'rebalance_needed',
      'pool_type'
    ];

    const updateQuery = `
      UPDATE mmt_pools 
      SET ${updateFields.map(field => `${field} = ?`).join(', ')}
      WHERE id = ?
    `;

    const updateValues = [...updateFields.map(field => data[field]), data.id];
    await connection.query(updateQuery, updateValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pool:', error);
    return NextResponse.json(
      { error: 'Failed to update pool data' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}