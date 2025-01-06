// app/api/manage-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 로깅 유틸리티
const logStep = (step: string, data?: any) => {
  console.log('\n--------------------');
  console.log(`[${new Date().toISOString()}] ${step}`);
  if (data) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
  console.log('--------------------\n');
};

// GET 요청 처리 (목록 조회)
export async function GET(request: NextRequest) {
  logStep('Starting GET /api/manage-wallet');
  const pool = getPool();
  let connection = null;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    connection = await pool.getConnection();
    logStep('Database connection established');

    // 검색 조건 설정
    const searchCondition = search
      ? 'WHERE wallet_name LIKE ? OR pool_name LIKE ? OR public_key LIKE ? OR pool_address LIKE ?'
      : '';
    const searchValue = `%${search}%`;

    // 전체 개수 조회 쿼리
    const countQuery = `SELECT COUNT(*) as total FROM wallets ${searchCondition}`;
    logStep('Executing count query', { countQuery });

    // 데이터 조회 쿼리
    const dataQuery = `
      SELECT 
        id, wallet_name, pool_name, pool_address, public_key,
        sol_balance, min_sol_balance, token_mint, token_ata,
        token_balance, token_symbol, token_decimals,
        last_balance_update, last_transaction_hash, 
        last_transaction_time, daily_transaction_count,
        total_transaction_count, status, risk_level,
        is_test_wallet, created_at, updated_at, created_by
      FROM wallets 
      ${searchCondition}
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;

    logStep('Executing data query', { dataQuery });

    const [countResult]: any = await connection.query(
      countQuery,
      search ? [searchValue, searchValue, searchValue, searchValue] : []
    );

    const [wallets]: any = await connection.query(
      dataQuery,
      search 
        ? [searchValue, searchValue, searchValue, searchValue, limit, offset]
        : [limit, offset]
    );

    logStep('Query results', {
      totalCount: countResult[0].total,
      walletsCount: wallets.length
    });

    const formattedWallets = wallets.map((wallet: any) => ({
      ...wallet,
      sol_balance: Number(wallet.sol_balance),
      min_sol_balance: Number(wallet.min_sol_balance),
      token_balance: Number(wallet.token_balance),
      is_test_wallet: Boolean(wallet.is_test_wallet),
      last_balance_update: wallet.last_balance_update 
        ? Number(wallet.last_balance_update) 
        : null,
      last_transaction_time: wallet.last_transaction_time 
        ? Number(wallet.last_transaction_time) 
        : null
    }));

    return NextResponse.json({
      wallets: formattedWallets,
      total: countResult[0].total,
      page,
      limit
    });

  } catch (error) {
    console.error('\n--------------------');
    console.error(`[${new Date().toISOString()}] Error in GET /api/manage-wallet:`);
    console.error('Error details:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('--------------------\n');

    return NextResponse.json(
      { success: false, message: '지갑 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
      logStep('Database connection released');
    }
  }
}

// POST 요청 처리 (생성)
export async function POST(request: NextRequest) {
  logStep('Starting POST /api/manage-wallet');
  const pool = getPool();
  let connection = null;

  try {
    const data = await request.json();
    logStep('Received data', data);

    // private key 암호화
    const encryptedPrivateKey = await encrypt(data.private_key);
    connection = await pool.getConnection();
    
    const insertQuery = `
      INSERT INTO wallets (
        wallet_name, pool_name, pool_address, public_key, private_key,
        min_sol_balance, token_mint, token_symbol, token_decimals,
        status, risk_level, is_test_wallet, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    logStep('Executing insert query');

    const [result]: any = await connection.query(insertQuery, [
      data.wallet_name,
      data.pool_name,
      data.pool_address,
      data.public_key,
      encryptedPrivateKey,
      data.min_sol_balance,
      data.token_mint,
      data.token_symbol,
      data.token_decimals,
      data.status,
      data.risk_level,
      data.is_test_wallet,
      data.created_by || null
    ]);

    logStep('Insert result', { insertId: result.insertId });

    return NextResponse.json({
      success: true,
      message: '지갑이 성공적으로 생성되었습니다.',
      id: result.insertId
    });

  } catch (error) {
    console.error('\n--------------------');
    console.error(`[${new Date().toISOString()}] Error in POST /api/manage-wallet:`);
    console.error('Error details:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('--------------------\n');

    return NextResponse.json(
      { success: false, message: '지갑 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
      logStep('Database connection released');
    }
  }
}