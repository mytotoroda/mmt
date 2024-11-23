// components/mmt/raydium/SwapInterface.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Box, 
  Card, 
  IconButton, 
  TextField, 
  Button, 
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Link,
  useTheme
} from '@mui/material';
import { ArrowDownUp, Settings, ExternalLink } from 'lucide-react';
import TokenSelector from './TokenSelector';
import { TokenInfo } from '@/types/mmt/pool';
import { useWallet } from '@/contexts/WalletContext';
import { SwapQuote, swapService } from '@/lib/mmt/services/swapService';
import { getNetworkConstants } from '@/lib/mmt/constants';

interface SwapInterfaceProps {
  className?: string;
}

export default function SwapInterface({ className }: SwapInterfaceProps) {
  const theme = useTheme();
  const { publicKey, connectWallet } = useWallet();
  const networkConstants = getNetworkConstants();
  
  // 토큰 선택 상태
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  
  // 금액 입력 상태
  const [amountIn, setAmountIn] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  
  // UI 상태
  const [slippage, setSlippage] = useState<number>(1.0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // 견적 계산
  const getQuote = useCallback(async (value: string) => {
    if (!value || !tokenA || !tokenB || isNaN(Number(value)) || Number(value) <= 0) {
      setQuote(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const quoteResult = await swapService.getSwapQuote({
        tokenIn: tokenA,
        tokenOut: tokenB,
        amountIn: value,
        slippage: slippage / 100
      });

      setQuote(quoteResult);
    } catch (err) {
      console.error('Quote error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [tokenA, tokenB, slippage]);

  // Debounced 견적 요청
  useEffect(() => {
    const timer = setTimeout(() => {
      getQuote(amountIn);
    }, 500);
    return () => clearTimeout(timer);
  }, [amountIn, getQuote]);

  // 토큰 위치 변경
  const handleSwitchTokens = useCallback(() => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountIn('');
    setQuote(null);
  }, [tokenA, tokenB]);

  // 스왑 실행
  const handleSwap = async () => {
    if (!publicKey) {
      await connectWallet();
      return;
    }

    if (!tokenA || !tokenB || !amountIn || !quote) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await swapService.executeSwap(
        {
          tokenIn: tokenA,
          tokenOut: tokenB,
          amountIn,
          slippage: slippage / 100,
          wallet: publicKey
        },
        quote
      );

      setTxSignature(result.txId);
      
      // Reset form
      setAmountIn('');
      setQuote(null);

    } catch (err) {
      console.error('Swap error:', err);
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  // 가격 임팩트에 따른 경고 레벨
  const priceImpactSeverity = useMemo(() => {
    if (!quote?.priceImpact) return null;
    if (quote.priceImpact < 1) return 'info';
    if (quote.priceImpact < 3) return 'warning';
    return 'error';
  }, [quote?.priceImpact]);

  // Explorer URL
  const explorerBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_NETWORK === 'mainnet-beta'
      ? 'https://solscan.io'
      : 'https://solscan.io/tx';
  }, []);

  return (
    <Card 
      className={className}
      sx={{ 
        p: 3,
        width: '100%',
        background: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[3],
      }}
    >
      {/* 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h6">Swap</Typography>
        <IconButton onClick={() => setSettingsOpen(true)}>
          <Settings size={20} />
        </IconButton>
      </Box>

      {/* From 토큰 입력 */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
          From
        </Typography>
        <Box sx={{ 
          display: 'flex',
          gap: 1,
          alignItems: 'stretch'
        }}>
          <TextField
            sx={{ width: '80%' }}
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.00"
            disabled={loading}
            InputProps={{
              inputProps: { 
                min: 0,
                step: "any"
              }
            }}
          />
          <TokenSelector
            selectedToken={tokenA}
            otherToken={tokenB}
            onSelect={setTokenA}
            tokens={Object.values(networkConstants.TOKENS)}
          />
        </Box>
      </Box>

      {/* 토큰 스위치 버튼 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        my: 2
      }}>
        <IconButton
          onClick={handleSwitchTokens}
          disabled={loading}
          sx={{ 
            border: 1,
            borderColor: theme.palette.divider,
            p: 1
          }}
        >
          <ArrowDownUp size={20} />
        </IconButton>
      </Box>

      {/* To 토큰 입력 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
          To
        </Typography>
        <Box sx={{ 
          display: 'flex',
          gap: 1,
          alignItems: 'stretch'
        }}>
          <TextField
            sx={{ width: '80%' }}
            type="number"
            value={quote?.amountOut || ''}
            placeholder="0.00"
            disabled
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
          <TokenSelector
            selectedToken={tokenB}
            otherToken={tokenA}
            onSelect={setTokenB}
            tokens={Object.values(networkConstants.TOKENS)}
          />
        </Box>
      </Box>

      {/* 스왑 정보 표시 */}
      {quote && (
        <Box sx={{ mb: 3 }}>
          {/* 가격 영향 */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Typography variant="body2" color="textSecondary">
              Price Impact
            </Typography>
            <Typography 
              variant="body2"
              color={
                priceImpactSeverity === 'error' ? 'error' :
                priceImpactSeverity === 'warning' ? 'warning.main' :
                'textSecondary'
              }
            >
              {quote.priceImpact.toFixed(2)}%
            </Typography>
          </Box>

          {/* 최소 수령 금액 */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Typography variant="body2" color="textSecondary">
              Minimum Received
            </Typography>
            <Typography variant="body2">
              {quote.minAmountOut} {tokenB?.symbol}
            </Typography>
          </Box>

          {/* 예상 실행 가격 */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Typography variant="body2" color="textSecondary">
              Execution Price
            </Typography>
            <Typography variant="body2">
              1 {tokenA?.symbol} = {quote.executionPrice} {tokenB?.symbol}
            </Typography>
          </Box>
        </Box>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 트랜잭션 성공 메시지 */}
      {txSignature && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <Link 
              href={`${explorerBaseUrl}/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <ExternalLink size={16} />
            </Link>
          }
        >
          Swap successful!
        </Alert>
      )}

      {/* 스왑 버튼 */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={loading || !tokenA || !tokenB || !amountIn || !quote}
        onClick={handleSwap}
        sx={{ 
          height: 48,
          position: 'relative'
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : !publicKey ? (
          'Connect Wallet'
        ) : !tokenA || !tokenB ? (
          'Select Tokens'
        ) : !amountIn || !quote ? (
          'Enter Amount'
        ) : (
          'Swap'
        )}
      </Button>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Swap Settings</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Slippage Tolerance</Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={slippage}
              onChange={(_, value) => setSlippage(value as number)}
              min={0.1}
              max={5}
              step={0.1}
              marks={[
                { value: 0.1, label: '0.1%' },
                { value: 1, label: '1%' },
                { value: 5, label: '5%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}