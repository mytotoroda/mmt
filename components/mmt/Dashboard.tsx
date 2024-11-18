import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography,
  Container,
  useMediaQuery
} from '@mui/material';
import { useWallet } from '@/contexts/WalletContext';
import { useAppTheme } from '@/hooks/useAppTheme';

import ConfigPanel from './ConfigPanel';
import OrderBook from './OrderBook';
import PositionTable from './PositionTable';
import MarketStats from './MarketStats';
import TradingChart from './TradingChart';
import AlertPanel from './AlertPanel';
import TokenPairSelect from './TokenPairSelect';

export default function Dashboard() {
  const theme = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { publicKey, network } = useWallet();
  const [selectedPair, setSelectedPair] = useState('');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!publicKey) {
      setAlerts(prev => [...prev, {
        type: 'warning',
        message: 'Please connect your wallet to start trading'
      }]);
    }
  }, [publicKey]);

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Network Banner */}
          {network === 'mainnet-beta' && (
            <Paper 
              elevation={0}
              sx={{
                p: 2,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'error.dark'
                  : 'error.light',
                borderColor: theme.palette.mode === 'dark'
                  ? 'error.dark'
                  : 'error.light',
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="error"
              >
                You are connected to Mainnet. Real funds will be used for transactions.
              </Typography>
            </Paper>
          )}

          {/* Alert Panel */}
          <AlertPanel alerts={alerts} onDismiss={(index) => {
            setAlerts(alerts.filter((_, i) => i !== index));
          }} />

          {/* Token Pair Selection */}
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <TokenPairSelect
              value={selectedPair}
              onChange={(pair) => setSelectedPair(pair)}
            />
          </Paper>

          {/* Main Grid Layout */}
          <Grid container spacing={3}>
            {/* Trading Chart */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ 
                p: 2, 
                height: 500,
                bgcolor: 'background.paper'
              }}>
                <TradingChart tokenPair={selectedPair} />
              </Paper>
            </Grid>

            {/* Market Stats */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ 
                p: 2, 
                height: 500,
                bgcolor: 'background.paper'
              }}>
                <MarketStats tokenPair={selectedPair} />
              </Paper>
            </Grid>

            {/* Config Panel */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2,
                bgcolor: 'background.paper'
              }}>
                <ConfigPanel tokenPair={selectedPair} />
              </Paper>
            </Grid>

            {/* Order Book */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2,
                bgcolor: 'background.paper'
              }}>
                <OrderBook tokenPair={selectedPair} />
              </Paper>
            </Grid>

            {/* Position Table */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 2,
                bgcolor: 'background.paper'
              }}>
                <PositionTable tokenPair={selectedPair} />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}