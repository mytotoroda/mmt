// app/api/manage-wallet/[id]/route.ts
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

// GET 단일 지갑 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  logStep('Starting GET /api/manage-wallet/[id]', { id: params.id });
  const pool = getPool();
  let connection = null;

  try {
    connection = await pool.getConnection();
    logStep('Database connection established');

    const query = `
      SELECT 
        id, wallet_name, pool_name, pool_address, public_key,
        sol_balance, min_sol_balance, token_mint, token_ata,
        token_balance, token_symbol, token_decimals,
        last_balance_update, last_transaction_hash, 
        last_transaction_time, daily_transaction_count,
        total_transaction_count, status, risk_level,
        is_test_wallet, created_at, updated_at, created_by
      FROM wallets 
      WHERE id = ?
    `;

    logStep('Executing query', { query });

    const [wallets]: any = await connection.query(query, [params.id]);
    
    if (!wallets.length) {
      return NextResponse.json(
        { success: false, message: '지갑을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const formattedWallet = {
      ...wallets[0],
      sol_balance: Number(wallets[0].sol_balance),
      min_sol_balance: Number(wallets[0].min_sol_balance),
      token_balance: Number(wallets[0].token_balance),
      is_test_wallet: Boolean(wallets[0].is_test_wallet),
      last_balance_update: wallets[0].last_balance_update 
        ? Number(wallets[0].last_balance_update) 
        : null,
      last_transaction_time: wallets[0].last_transaction_time 
        ? Number(wallets[0].last_transaction_time) 
        : null
    };

    logStep('Formatted wallet data', formattedWallet);

    return NextResponse.json({
      success: true,
      wallet: formattedWallet
    });

  } catch (error) {
    console.error('\n--------------------');
    console.error(`[${new Date().toISOString()}] Error in GET /api/manage-wallet/[id]:`);
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

// PUT 지갑 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  logStep('Starting PUT /api/manage-wallet/[id]', { id: params.id });
  const pool = getPool();
  let connection = null;

  try {
    const data = await request.json();
    logStep('Received data', data);

    connection = await pool.getConnection();
    
    let updateFields = [
      'wallet_name = ?',
      'pool_name = ?',
      'pool_address = ?',
      'public_key = ?',
      'min_sol_balance = ?',
      'token_mint = ?',
      'token_symbol = ?',
      'token_decimals = ?',
      'status = ?',
      'risk_level = ?',
      'is_test_wallet = ?'
    ];

    let updateValues = [
      data.wallet_name,
      data.pool_name,
      data.pool_address,
      data.public_key,
      data.min_sol_balance,
      data.token_mint,
      data.token_symbol,
      data.token_decimals,
      data.status,
      data.risk_level,
      data.is_test_wallet
    ];

    // private key가 제공된 경우에만 업데이트
    if (data.private_key) {
      updateFields.push('private_key = ?');
      updateValues.push(await encrypt(data.private_key));
    }

    updateValues.push(params.id); // WHERE 조건을 위한 id

    const updateQuery = `
      UPDATE wallets 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    logStep('Executing update query', { updateFields });

    const [result]: any = await connection.query(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: '지갑을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    logStep('Update result', { affectedRows: result.affectedRows });

    return NextResponse.json({
      success: true,
      message: '지갑이 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('\n--------------------');
    console.error(`[${new Date().toISOString()}] Error in PUT /api/manage-wallet/[id]:`);
    console.error('Error details:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('--------------------\n');

    return NextResponse.json(
      { success: false, message: '지갑 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
      logStep('Database connection released');
    }
  }
}

// DELETE 지갑 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  logStep('Starting DELETE /api/manage-wallet/[id]', { id: params.id });
  const pool = getPool();
  let connection = null;

  try {
    connection = await pool.getConnection();
    
    const query = 'DELETE FROM wallets WHERE id = ?';
    logStep('Executing delete query', { query });

    const [result]: any = await connection.query(query, [params.id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: '지갑을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    logStep('Delete result', { affectedRows: result.affectedRows });

    return NextResponse.json({
      success: true,
      message: '지갑이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('\n--------------------');
    console.error(`[${new Date().toISOString()}] Error in DELETE /api/manage-wallet/[id]:`);
    console.error('Error details:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('--------------------\n');

    return NextResponse.json(
      { success: false, message: '지갑 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
      logStep('Database connection released');
    }
  }
}