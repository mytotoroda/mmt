// app/api/manage-wallet/update-ata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const pool = getPool();
  let connection = null;

  try {
    const { walletAddress, ataAddress } = await request.json();
    
    if (!walletAddress || !ataAddress) {
      return NextResponse.json(
        { error: 'Wallet address and ATA address are required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // 지갑 정보 조회 및 업데이트
    const [wallet] = await connection.query(
      'SELECT id FROM wallets WHERE public_key = ?',
      [walletAddress]
    );

    if (!wallet || !wallet[0]) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // ATA 주소 업데이트
    await connection.query(
      'UPDATE wallets SET token_ata = ? WHERE id = ?',
      [ataAddress, wallet[0].id]
    );

    return NextResponse.json({
      success: true,
      data: {
        walletAddress,
        ataAddress
      }
    });

  } catch (error) {
    console.error('Error updating ATA:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update ATA', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}