// components/mmt/pools/EditPoolDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Typography,
  Divider,
  Tooltip,
  IconButton,
  Slider,
  useTheme
} from '@mui/material';
import { Settings2, HelpCircle, Info } from 'lucide-react';

// Pool 타입 정의
interface Pool {
  id: number;
  pool_address: string;
  token_a_symbol: string;
  token_b_symbol: string;
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  pool_type: 'AMM' | 'CL';
  current_price: number | null;
  liquidity_usd: number | null;
}

// 전략 설정 타입 정의
interface StrategyConfig {
  baseSpread: number;
  bidAdjustment: number;
  askAdjustment: number;
  checkInterval: number;
  minTradeSize: number;
  maxTradeSize: number;
  tradeSizePercentage: number;
  targetRatio: number;
  rebalanceThreshold: number;
  maxPositionSize: number;
  maxSlippage: number;
  stopLossPercentage: number;
  emergencyStop: boolean;
  enabled: boolean;
}

interface EditPoolDialogProps {
  open: boolean;
  pool: Pool;
  onClose: () => void;
  onSuccess: () => void;
}

interface TooltipLabelProps {
  label: string;
  tooltip: string;
}

const TooltipLabel = ({ label, tooltip }: TooltipLabelProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Typography variant="subtitle2">{label}</Typography>
    <Tooltip title={tooltip} arrow placement="top">
      <IconButton size="small" sx={{ p: 0.5 }}>
        <HelpCircle size={16} />
      </IconButton>
    </Tooltip>
  </Box>
);

export default function EditPoolDialog({ 
  open, 
  pool, 
  onClose, 
  onSuccess 
}: EditPoolDialogProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 전략 설정 상태
  const [config, setConfig] = useState<StrategyConfig>({
    baseSpread: 0.1,
    bidAdjustment: -0.05,
    askAdjustment: 0.05,
    checkInterval: 30,
    minTradeSize: 100,
    maxTradeSize: 10000,
    tradeSizePercentage: 5,
    targetRatio: 0.5,
    rebalanceThreshold: 5.0,
    maxPositionSize: 50000,
    maxSlippage: 1.0,
    stopLossPercentage: 5.0,
    emergencyStop: false,
    enabled: false
  });

  // 풀의 현재 설정 로드
  useEffect(() => {
    const loadPoolConfig = async () => {
      try {
        const response = await fetch(`/api/mmt/strategy/config?poolId=${pool.id}`);
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        }
      } catch (error) {
        console.error('Error loading pool config:', error);
        setError('설정을 불러오는데 실패했습니다.');
      }
    };

    if (pool.id) {
      loadPoolConfig();
    }
  }, [pool.id]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/mmt/strategy/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolId: pool.id,
          ...config
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '설정 업데이트에 실패했습니다.');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating pool config:', error);
      setError(error instanceof Error ? error.message : '설정 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings2 size={24} color={theme.palette.primary.main} />
          <Typography variant="h6">전략 설정 수정</Typography>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 풀 정보 헤더 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {pool.token_a_symbol}/{pool.token_b_symbol} Pool
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                color: theme.palette.text.secondary
              }}
            >
              {pool.pool_address}
            </Typography>
            {pool.current_price && (
              <Typography variant="body2" color="text.secondary">
                현재 가격: ${pool.current_price.toFixed(4)}
              </Typography>
            )}
          </Box>

          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError('')}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* 기본 스프레드 설정 */}
          <Box>
            <TooltipLabel 
              label="기본 스프레드" 
              tooltip="기준이 되는 스프레드 비율" 
            />
            <Slider
              value={config.baseSpread}
              onChange={(_, value) => setConfig(prev => ({
                ...prev,
                baseSpread: value as number
              }))}
              min={0.1}
              max={5}
              step={0.1}
              marks={[
                { value: 0.1, label: '0.1%' },
                { value: 5, label: '5%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={v => `${v}%`}
              sx={{ mt: 2 }}
            />
          </Box>

          {/* 스프레드 조정 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TooltipLabel 
                label="매수 스프레드 조정" 
                tooltip="기본 스프레드에서 매수 가격 조정" 
              />
              <TextField
                size="small"
                type="number"
                value={config.bidAdjustment}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  bidAdjustment: parseFloat(e.target.value)
                }))}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>,
                  inputProps: { step: 0.01 }
                }}
                fullWidth
                sx={{ mt: 1 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TooltipLabel 
                label="매도 스프레드 조정" 
                tooltip="기본 스프레드에서 매도 가격 조정" 
              />
              <TextField
                size="small"
                type="number"
                value={config.askAdjustment}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  askAdjustment: parseFloat(e.target.value)
                }))}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>,
                  inputProps: { step: 0.01 }
                }}
                fullWidth
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          {/* 거래 크기 설정 */}
          <Box>
            <TooltipLabel 
              label="거래 크기 설정" 
              tooltip="개별 거래의 최소/최대 크기와 비율 설정" 
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 1 }}>
              <TextField
                size="small"
                label="최소 크기"
                type="number"
                value={config.minTradeSize}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  minTradeSize: parseFloat(e.target.value)
                }))}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                size="small"
                label="최대 크기"
                type="number"
                value={config.maxTradeSize}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  maxTradeSize: parseFloat(e.target.value)
                }))}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                size="small"
                label="거래 비율"
                type="number"
                value={config.tradeSizePercentage}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  tradeSizePercentage: parseFloat(e.target.value)
                }))}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>,
                  inputProps: { min: 0, max: 100, step: 0.1 }
                }}
              />
            </Box>
          </Box>

          {/* 포지션 관리 설정 */}
          <Box>
            <TooltipLabel 
              label="포지션 관리" 
              tooltip="포지션 비율 및 재조정 설정" 
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
              <TextField
                size="small"
                label="목표 비율"
                type="number"
                value={config.targetRatio * 100}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  targetRatio: parseFloat(e.target.value) / 100
                }))}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>,
                  inputProps: { min: 0, max: 100, step: 1 }
                }}
              />
              <TextField
                size="small"
                label="재조정 임계값"
                type="number"
                value={config.rebalanceThreshold}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  rebalanceThreshold: parseFloat(e.target.value)
                }))}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>,
                  inputProps: { min: 0, step: 0.1 }
                }}
              />
            </Box>
          </Box>

          {/* 위험 관리 설정 */}
          <Box>
            <TooltipLabel 
              label="위험 관리" 
              tooltip="슬리피지 및 손실 제한 설정" 
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
              <TextField
                size="small"
                label="최대 슬리피지"
                type="number"
                value={config.maxSlippage}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  maxSlippage: parseFloat(e.target.value)
                }))}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>,
                  inputProps: { min: 0, step: 0.1 }
                }}
              />
              <TextField
                size="small"
                label="손절 기준"
                type="number"
                value={config.stopLossPercentage}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  stopLossPercentage: parseFloat(e.target.value)
                }))}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>,
                  inputProps: { min: 0, step: 0.1 }
                }}
              />
            </Box>
          </Box>

          {/* 전략 활성화 설정 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: theme.palette.action.hover,
            borderRadius: 1,
            p: 2,
            mt: 2
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    enabled: e.target.checked
                  }))}
                  color="success"
                />
              }
              label={
                <Typography variant="subtitle1" fontWeight="medium">
                  전략 활성화
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.emergencyStop}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    emergencyStop: e.target.checked,
                    enabled: e.target.checked ? false : prev.enabled
                  }))}
                  color="error"
                />
              }
              label={
                <Typography variant="subtitle1" fontWeight="medium" color="error">
                  긴급 중지
                </Typography>
              }
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          취소
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? '저장 중...' : '설정 저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}