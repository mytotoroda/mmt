// app/pool/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { useFormatBalance } from '@/hooks/useFormatBalance';

interface PoolData {
  id: number;
  pool_address: string;
  token_a_address: string;
  token_a_symbol: string;
  token_a_decimals: number;
  token_a_reserve: number;
  token_b_address: string;
  token_b_symbol: string;
  token_b_decimals: number;
  token_b_reserve: number;
  fee_rate: number;
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  creator_wallet: string;
  last_price: number | null;
  volume_24h: number;
  liquidity_usd: number;
  created_at: string;
  updated_at: string;
  pool_type: 'AMM';
  liquidity: number;
  rebalance_needed: boolean;
  last_rebalance_at: string | null;
}

export default function PoolPage() {
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const formatBalance = useFormatBalance();

  useEffect(() => {
    fetchPoolData();
  }, []);

  const fetchPoolData = async () => {
    try {
      const response = await fetch('/api/pool');
      const data = await response.json();
      setPoolData(data);
      setError(null);
    } catch (error) {
      setError('Failed to load pool data');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = async (field: keyof PoolData, value: any) => {
    if (!poolData) return;

    try {
      const updatedData = { ...poolData, [field]: value };
      setPoolData(updatedData);

      const response = await fetch('/api/pool', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Failed to update');
      setSuccessMessage(`Updated ${field} successfully`);
    } catch (error) {
      setError(`Failed to update ${field}`);
    }
  };

  if (loading) return <Box p={3}>Loading...</Box>;
  if (!poolData) return <Box p={3}>No pool data found</Box>;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Pool Management</Typography>

      {/* Pool Identification */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Pool Identification</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pool Address"
                value={poolData.pool_address}
                onChange={(e) => handleFieldChange('pool_address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Creator Wallet"
                value={poolData.creator_wallet}
                onChange={(e) => handleFieldChange('creator_wallet', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={poolData.status}
                  label="Status"
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  {['ACTIVE', 'PAUSED', 'INACTIVE'].map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Pool Type</InputLabel>
                <Select
                  value={poolData.pool_type}
                  label="Pool Type"
                  onChange={(e) => handleFieldChange('pool_type', e.target.value)}
                >
                  <MenuItem value="AMM">AMM</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fee Rate"
                type="number"
                value={poolData.fee_rate}
                onChange={(e) => handleFieldChange('fee_rate', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Token A Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Token A Information</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token A Address"
                value={poolData.token_a_address}
                onChange={(e) => handleFieldChange('token_a_address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token A Symbol"
                value={poolData.token_a_symbol}
                onChange={(e) => handleFieldChange('token_a_symbol', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token A Decimals"
                type="number"
                value={poolData.token_a_decimals}
                onChange={(e) => handleFieldChange('token_a_decimals', Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token A Reserve"
                value={poolData.token_a_reserve}
                onChange={(e) => handleFieldChange('token_a_reserve', Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Token B Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Token B Information</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token B Address"
                value={poolData.token_b_address}
                onChange={(e) => handleFieldChange('token_b_address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token B Symbol"
                value={poolData.token_b_symbol}
                onChange={(e) => handleFieldChange('token_b_symbol', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token B Decimals"
                type="number"
                value={poolData.token_b_decimals}
                onChange={(e) => handleFieldChange('token_b_decimals', Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token B Reserve"
                value={poolData.token_b_reserve}
                onChange={(e) => handleFieldChange('token_b_reserve', Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pool Metrics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Pool Metrics</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Last Price"
                value={poolData.last_price || ''}
                onChange={(e) => handleFieldChange('last_price', Number(e.target.value))}
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="24h Volume"
                value={poolData.volume_24h}
                onChange={(e) => handleFieldChange('volume_24h', Number(e.target.value))}
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Liquidity (USD)"
                value={poolData.liquidity_usd}
                onChange={(e) => handleFieldChange('liquidity_usd', Number(e.target.value))}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Liquidity"
                value={poolData.liquidity}
                onChange={(e) => handleFieldChange('liquidity', Number(e.target.value))}
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={poolData.rebalance_needed}
                    onChange={(e) => handleFieldChange('rebalance_needed', e.target.checked)}
                  />
                }
                label="Rebalance Needed"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Timestamps</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Created At"
                value={new Date(poolData.created_at).toLocaleString()}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Updated At"
                value={new Date(poolData.updated_at).toLocaleString()}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Last Rebalance At"
                value={poolData.last_rebalance_at ? new Date(poolData.last_rebalance_at).toLocaleString() : 'Never'}
                disabled
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}