// app/amm/page.tsx
'use client';

import { useTheme } from '@mui/material/styles';
import { Box, Paper, Typography, Alert } from '@mui/material';
import SwapInterface from '@/components/mmt/raydium/SwapInterface';
import { useWallet } from '@/contexts/WalletContext';
import dynamic from 'next/dynamic';

const PriceChart = dynamic(
  () => import('@/components/mmt/raydium/PriceChart'),
  { ssr: false }
);

export default function AmmPage() {
  const theme = useTheme();
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 네트워크 경고 배너 */}
      {process.env.NEXT_PUBLIC_NETWORK !== 'mainnet-beta' && (
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 0,
            justifyContent: 'center',
          }}
        >
          You are currently connected to Devnet. This is a test environment.
        </Alert>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <Typography variant="h4" className="text-center mb-2">
            Raydium Swap
          </Typography>
          <Typography 
            variant="body1" 
            color="textSecondary" 
            className="text-center"
          >
            Swap tokens instantly with the best rates
          </Typography>
        </div>

        {/* 메인 컨텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 왼쪽: 스왑 인터페이스 */}
          <div className="lg:col-span-7">
            <Box sx={{ 
              maxWidth: '100%',
              mx: 'auto'
            }}>
              <SwapInterface />
            </Box>
          </div>

          {/* 오른쪽: 차트 섹션 */}
          <div className="lg:col-span-5">
            <Paper 
              sx={{ 
                height: '400px',
                p: 2,
                bgcolor: theme.palette.background.paper,
                display: { xs: 'none', lg: 'block' }
              }}
            >
              <PriceChart />
            </Paper>
          </div>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* 거래 통계 */}
          <Paper 
            sx={{ 
              p: 3,
              bgcolor: theme.palette.background.paper
            }}
          >
            <Typography variant="h6" gutterBottom>
              Trading Statistics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <div className="flex justify-between mb-2">
                <Typography color="textSecondary">24h Volume</Typography>
                <Typography>$--,---,---</Typography>
              </div>
              <div className="flex justify-between mb-2">
                <Typography color="textSecondary">Total Pairs</Typography>
                <Typography>---</Typography>
              </div>
              <div className="flex justify-between">
                <Typography color="textSecondary">Total Trades</Typography>
                <Typography>--,---</Typography>
              </div>
            </Box>
          </Paper>

          {/* 유동성 정보 */}
          <Paper 
            sx={{ 
              p: 3,
              bgcolor: theme.palette.background.paper
            }}
          >
            <Typography variant="h6" gutterBottom>
              Liquidity Info
            </Typography>
            <Box sx={{ mt: 2 }}>
              <div className="flex justify-between mb-2">
                <Typography color="textSecondary">Total Value Locked</Typography>
                <Typography>$--,---,---</Typography>
              </div>
              <div className="flex justify-between mb-2">
                <Typography color="textSecondary">Number of Pools</Typography>
                <Typography>---</Typography>
              </div>
              <div className="flex justify-between">
                <Typography color="textSecondary">Active Pools</Typography>
                <Typography>---</Typography>
              </div>
            </Box>
          </Paper>

          {/* 사용자 정보 */}
          <Paper 
            sx={{ 
              p: 3,
              bgcolor: theme.palette.background.paper
            }}
          >
            <Typography variant="h6" gutterBottom>
              Your Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              {publicKey ? (
                <>
                  <div className="flex justify-between mb-2">
                    <Typography color="textSecondary">Wallet</Typography>
                    <Typography>{`${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`}</Typography>
                  </div>
                  <div className="flex justify-between mb-2">
                    <Typography color="textSecondary">Your Trades</Typography>
                    <Typography>--</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography color="textSecondary">Active Positions</Typography>
                    <Typography>--</Typography>
                  </div>
                </>
              ) : (
                <Typography color="textSecondary" align="center">
                  Connect wallet to view your information
                </Typography>
              )}
            </Box>
          </Paper>
        </div>
      </div>
    </div>
  );
}