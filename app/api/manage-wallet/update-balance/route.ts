// app/api/manage-wallet/update-balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { Connection, PublicKey } from '@solana/web3.js';

// RPC URL 설정
const getRpcUrl = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta';
  return network === 'mainnet-beta' 
    ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL
    : process.env.NEXT_PUBLIC_DEVNET_RPC_URL;
};

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

// SOL 잔액 조회
async function getSolanaBalance(connection: Connection, address: string): Promise<number> {
  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey, {
      commitment: 'confirmed'
    });
    return balance / 1e9; // lamports to SOL
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    throw error;
  }
}

// 토큰 잔액 조회
async function getTokenBalance(
  connection: Connection, 
  tokenAta: string,
  decimals: number
): Promise<number> {
  try {
    const ataPublicKey = new PublicKey(tokenAta);
    const tokenAccount = await connection.getTokenAccountBalance(ataPublicKey, 'confirmed');
    return Number(tokenAccount.value.amount) / Math.pow(10, decimals);
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const pool = getPool();
  let connection = null;

  try {
    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    logStep('Starting balance update for wallet', { walletAddress });

    // DB 연결
    connection = await pool.getConnection();

    // 지갑 정보 조회
    const [walletInfo] = await connection.query(
      'SELECT token_ata, token_decimals FROM wallets WHERE public_key = ?',
      [walletAddress]
    );

    if (!walletInfo || !walletInfo[0]) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Solana connection 설정
    const rpcUrl = getRpcUrl();
    const solanaConnection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: undefined // websocket 연결 비활성화
    });

    logStep('Using RPC URL', { rpcUrl });

    // SOL 잔액 조회
    const solBalance = await getSolanaBalance(solanaConnection, walletAddress);
    logStep('SOL balance fetched', { solBalance });

    // 업데이트 쿼리 파라미터
    let updateParams = [solBalance];
    let tokenBalance = null;

    // token_ata가 있는 경우에만 토큰 잔액 조회
    if (walletInfo[0].token_ata) {
      tokenBalance = await getTokenBalance(
        solanaConnection,
        walletInfo[0].token_ata,
        walletInfo[0].token_decimals
      );
      updateParams.push(tokenBalance);
      logStep('Token balance fetched', { tokenBalance });
    }

    // 쿼리 구성
    const updateQuery = walletInfo[0].token_ata
      ? `UPDATE wallets 
         SET sol_balance = ?,
             token_balance = ?,
             last_balance_update = UNIX_TIMESTAMP()
         WHERE public_key = ?`
      : `UPDATE wallets 
         SET sol_balance = ?,
             last_balance_update = UNIX_TIMESTAMP()
         WHERE public_key = ?`;

    updateParams.push(walletAddress);

    // 잔액 업데이트
    await connection.query(updateQuery, updateParams);

    logStep('Balance update completed', {
      solBalance,
      tokenBalance,
      walletAddress
    });

    return NextResponse.json({
      success: true,
      data: {
        solBalance,
        tokenBalance,
        lastUpdate: Math.floor(Date.now() / 1000)
      }
    });

  } catch (error) {
    logStep('Error in balance update', error);
    return NextResponse.json(
      { 
        error: 'Failed to update balance', 
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