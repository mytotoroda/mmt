// app/api/manage-wallet/insert-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const pool = getPool();
  
  try {
    const { wallets } = await request.json();

    // 배치 삽입을 위한 values 문자열 생성
    const values = wallets.map((wallet: any) => [
      wallet.wallet_name,
      wallet.pool_name,
      wallet.pool_address,
      wallet.public_key,
      wallet.private_key,
      wallet.sol_balance || 0,
      wallet.min_sol_balance || 1,
      wallet.token_mint,
      wallet.token_ata || null,
      wallet.token_balance || 0,
      wallet.token_symbol,
      wallet.token_decimals,
      wallet.last_balance_update || null,
      wallet.last_transaction_hash || null,
      wallet.last_transaction_time || null,
      wallet.daily_transaction_count || 0,
      wallet.total_transaction_count || 0,
      wallet.status,
      wallet.risk_level,
      wallet.is_test_wallet ? 1 : 0,
      wallet.created_by
    ]);

    const placeholders = values.map(() => 
      '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).join(',');

    const flatValues = values.flat();

    const query = `
      INSERT INTO wallets (
        wallet_name, pool_name, pool_address, public_key, private_key,
        sol_balance, min_sol_balance, token_mint, token_ata, token_balance,
        token_symbol, token_decimals, last_balance_update, last_transaction_hash,
        last_transaction_time, daily_transaction_count, total_transaction_count,
        status, risk_level, is_test_wallet, created_by
      ) VALUES ${placeholders}
    `;

    await pool.execute(query, flatValues);

    return NextResponse.json({ 
      success: true, 
      message: 'Wallets saved successfully',
      count: wallets.length
    });

  } catch (error) {
    console.error('Error in wallet insertion:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to save wallets',
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}