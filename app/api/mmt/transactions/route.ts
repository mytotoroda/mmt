// app/api/mmt/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const pool = getPool();
  let connection = null;

  try {
    // URL 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const direction = searchParams.get('direction') || '';
    const actionType = searchParams.get('action_type') || '';

    // 오프셋 계산
    const offset = (page - 1) * limit;

    // 검색 조건 구성
    const whereConditions = [];
    const queryParams = [];

    if (search) {
      whereConditions.push('tx.tx_signature LIKE ?');
      queryParams.push(`%${search}%`);
    }

    if (status) {
      whereConditions.push('tx.status = ?');
      queryParams.push(status);
    }

    if (direction) {
      whereConditions.push('tx.direction = ?');
      queryParams.push(direction);
    }

    if (actionType) {
      whereConditions.push('tx.action_type = ?');
      queryParams.push(actionType);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    connection = await pool.getConnection();

    // 전체 레코드 수 조회
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total 
       FROM mmt_transactions tx
       ${whereClause}`,
      queryParams
    );

    // 트랜잭션 데이터 조회
    const [transactions] = await connection.query(
      `SELECT 
        tx.id,
        tx.created_at,
        tx.action_type,
        tx.direction,
        tx.amount,
        tx.price,
        tx.gas_used,
        tx.status,
        tx.tx_signature,
        p.token_a_symbol,
        p.token_b_symbol
       FROM mmt_transactions tx
       LEFT JOIN mmt_pools p ON tx.pool_id = p.id
       ${whereClause}
       ORDER BY tx.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return NextResponse.json({
      success: true,
      transactions,
      total: countResult[0].total,
      page,
      limit
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '트랜잭션 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );

  } finally {
    if (connection) {
      connection.release();
    }
  }
}