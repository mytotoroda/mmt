// components/mmt/raydium/SwapInterface.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  SUPPORTED_TOKENS, 
  RAYDIUM_POOLS 
} from '@/lib/mmt/constants/raydium';
import { 
  Box, 
  Card, 
  IconButton, 
  TextField, 
  Button, 
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Link
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowDownUp, Settings, Info, ExternalLink } from 'lucide-react';
import TokenSelector from './TokenSelector';
import { TokenInfo } from '@/types/mmt/pool';
import { useWallet } from '@/contexts/WalletContext';
import { SwapService } from '@/lib/mmt/services/swapService';
import { raydiumService } from '@/lib/mmt/raydium';
import { PublicKey } from '@solana/web3.js';

interface SwapInterfaceProps {
  className?: string;
}

export default function SwapInterface({ className }: SwapInterfaceProps) {
  const theme = useTheme();
  const { wallet, publicKey, connectWallet } = useWallet();
  
  // 토큰 선택 상태
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  
  // 금액 입력 상태
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('');
  
  // UI 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [slippage, setSlippage] = useState<number>(1.0); // 기본 1%
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // 견적 및 가격 정보
  const [quote, setQuote] = useState<{
    minimumAmountOut?: string;
    fee?: string;
    route?: {
      poolAddress: string;
      tokenASymbol: string;
      tokenBSymbol: string;
    };
  } | null>(null);

  // 견적 계산
  const getQuote = async (inputAmount: string) => {
    if (!inputAmount || !tokenA || !tokenB) return;

    try {
      setLoading(true);
      setError(null);

      const swapService = new SwapService(raydiumService);
      const quoteResult = await swapService.getSwapQuote({
        tokenIn: tokenA,
        tokenOut: tokenB,
        amountIn: inputAmount,
        slippage: slippage / 100
      });

      setQuote(quoteResult);
      setAmountOut(quoteResult.amountOut);
      setPriceImpact(quoteResult.priceImpact);

    } catch (err) {
      console.error('Quote error:', err);
      setError('Failed to get swap quote');
      setAmountOut('');
      setPriceImpact(null);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounced amount input handler
  const handleAmountInChange = useCallback(async (value: string) => {
    setAmountIn(value);
    if (!value || !tokenA || !tokenB) {
      setAmountOut('');
      setPriceImpact(null);
      setQuote(null);
      return;
    }

    await getQuote(value);
  }, [tokenA, tokenB, slippage]);

  // 토큰 위치 변경
  const handleSwitchTokens = useCallback(() => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountIn('');
    setAmountOut('');
    setPriceImpact(null);
    setQuote(null);
  }, [tokenA, tokenB]);

  // 스왑 실행
  const handleSwap = async () => {
    if (!wallet || !publicKey) {
      await connectWallet();
      return;
    }

    if (!tokenA || !tokenB || !amountIn || !quote?.minimumAmountOut) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const swapService = new SwapService(raydiumService);
      const signature = await swapService.executeSwap({
        tokenIn: tokenA,
        tokenOut: tokenB,
        amountIn,
        wallet: new PublicKey(publicKey),
        minimumAmountOut: quote.minimumAmountOut,
        slippage: slippage / 100
      });

      setTxSignature(signature);
      
      // Reset form
      setAmountIn('');
      setAmountOut('');
      setPriceImpact(null);
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
    if (!priceImpact) return null;
    if (priceImpact < 1) return 'info';
    if (priceImpact < 3) return 'warning';
    return 'error';
  }, [priceImpact]);

  // Settings Dialog
  const renderSettingsDialog = () => (
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
  );

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
            sx={{ 
	      width: '80%',
	    }}
            type="number"
            value={amountIn}
            onChange={(e) => handleAmountInChange(e.target.value)}
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
            sx={{ 
	      width: '80%',
	    }}
            type="number"
            value={amountOut}
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
          />
        </Box>
      </Box>

      {/* 스왑 정보 표시 */}
      {quote && (
        <Box sx={{ mb: 3 }}>
          {/* 가격 영향 */}
          {priceImpact !== null && (
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
                {priceImpact.toFixed(2)}%
              </Typography>
            </Box>
          )}

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
              {quote.minimumAmountOut} {tokenB?.symbol}
            </Typography>
          </Box>

          {/* 수수료 */}
          {quote.fee && (
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1
            }}>
              <Typography variant="body2" color="textSecondary">
                Fee
              </Typography>
              <Typography variant="body2">
                {quote.fee}
              </Typography>
            </Box>
          )}
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
              href={`https://solscan.io/tx/${txSignature}`}
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
        disabled={loading || !tokenA || !tokenB || !amountIn || !amountOut}
        onClick={handleSwap}
        sx={{ 
          height: 48,
          position: 'relative'
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : !wallet ? (
          'Connect Wallet'
        ) : !tokenA || !tokenB ? (
          'Select Tokens'
        ) : !amountIn || !amountOut ? (
          'Enter Amount'
        ) : (
          'Swap'
        )}
      </Button>

      {/* Settings Dialog */}
      {renderSettingsDialog()}
    </Card>
  );
}