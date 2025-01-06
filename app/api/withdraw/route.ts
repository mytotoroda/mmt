import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: 출금 내역 조회
export async function GET(request: NextRequest) {
  const pool = getPool();
  let connection;

  try {
    connection = await pool.getConnection();

    const [withdrawals] = await connection.query(
  `SELECT * FROM withdrawals 
   ORDER BY created_at DESC
   LIMIT 20`
   );

    return NextResponse.json({ success: true, withdrawals });

  } catch (error: any) {
    console.error('Error in GET /api/withdraw:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST: 출금 기록 저장
export async function POST(request: NextRequest) {
  const pool = getPool();
  let connection;

  try {
    const user = (request as any).user;
    const body = await request.json();
    const { amount, destinationAddress, txSignature } = body;

    if (!amount || !destinationAddress || !txSignature) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 지갑 정보 조회
    const [wallets] = await connection.query(
      'SELECT * FROM wallets WHERE created_by = ? AND status = "ACTIVE" LIMIT 1',
      [user.email]
    );

    if (!wallets || wallets.length === 0) {
      throw new Error('No active wallet found');
    }

    const wallet = wallets[0];

    // 출금 기록 생성
    const [result] = await connection.query(
      `INSERT INTO withdrawals (
        wallet_id, amount, destination_address, tx_signature,
        status, created_by
      ) VALUES (?, ?, ?, ?, 'COMPLETED', ?)`,
      [wallet.id, amount, destinationAddress, txSignature, user.email]
    );

    // 지갑 잔액 업데이트
    await connection.query(
      `UPDATE wallets 
       SET sol_balance = sol_balance - ?,
           last_transaction_hash = ?,
           last_transaction_time = UNIX_TIMESTAMP(),
           daily_transaction_count = daily_transaction_count + 1,
           total_transaction_count = total_transaction_count + 1
       WHERE id = ?`,
      [amount, txSignature, wallet.id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Withdrawal recorded successfully',
      withdrawalId: result.insertId
    });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error in POST /api/withdraw:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}