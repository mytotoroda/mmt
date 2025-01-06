'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';
import { useRouter } from 'next/navigation';
import { AES, enc } from 'crypto-js';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  LinearProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Upload as UploadIcon } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useTheme as useNextTheme } from 'next-themes';

interface WalletData {
  wallet_address: string;
  amount: number;
  user_id: number;
  privateKey: string;
}

interface PoolData {
  id: number;
  pool_address: string;
  token_a_address: string;
  token_a_symbol: string;
  token_a_decimals: number;
  token_b_address: string;
  token_b_symbol: string;
  token_b_decimals: number;
  fee_rate: number;
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  last_price: number;
  liquidity_usd: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function WalletInsertPage() {
  const router = useRouter();
  const { provider, web3auth, isAuthenticated } = useWeb3Auth();
  const { theme: themeMode } = useNextTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const theme = createTheme({
    palette: {
      mode: themeMode === 'dark' ? 'dark' : 'light',
      primary: {
        main: themeMode === 'dark' ? '#90caf9' : '#1976d2'
      },
      background: {
        default: themeMode === 'dark' ? '#121212' : '#f5f5f5',
        paper: themeMode === 'dark' ? '#1e1e1e' : '#ffffff'
      }
    }
  });

  // Debug useEffect
  useEffect(() => {
    console.log('Web3Auth State:', {
      isAuthenticated,
      hasProvider: !!provider,
      hasWeb3Auth: !!web3auth,
      web3authState: web3auth?.status,
    });
  }, [isAuthenticated, provider, web3auth]);

  useEffect(() => {
    fetchPoolData();
  }, []);

  const fetchPoolData = async () => {
    try {
      setIsLoadingPool(true);
      const response = await fetch('/api/manage-wallet/get-pool');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pool data');
      }

      const data = await response.json();
      if (data.success && data.pool) {
        setPoolData(data.pool);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error loading pool data: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setIsLoadingPool(false);
    }
  };

  const encryptPrivateKey = async (privateKey: string): Promise<string> => {
    try {
      console.log('Starting encryption with state:', {
        isAuthenticated,
        hasProvider: !!provider,
        hasWeb3Auth: !!web3auth,
      });

      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      if (!web3auth) {
        throw new Error('Web3Auth instance not available');
      }

      let userInfo;
      try {
        userInfo = await web3auth.getUserInfo();
        console.log('User info received:', { 
          hasEmail: !!userInfo?.email,
          verifier: userInfo?.verifier,
          typeOfLogin: userInfo?.typeOfLogin
        });
      } catch (error) {
        console.error('Error getting user info:', error);
        throw new Error('Failed to get user information');
      }

      if (!userInfo?.email) {
        throw new Error('User email not available');
      }

      const encryptionKey = userInfo.email;
      return AES.encrypt(privateKey, encryptionKey).toString();

    } catch (error) {
      console.error('Encryption error details:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const parsedWallets = JSON.parse(fileContent);
      
      if (!Array.isArray(parsedWallets)) {
        throw new Error('Invalid file format: Expected an array of wallets');
      }

      setSelectedFile(file);
      setWallets(parsedWallets);
      setSnackbar({
        open: true,
        message: `Successfully loaded ${parsedWallets.length} wallets`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error loading file: ' + (error as Error).message,
        severity: 'error'
      });
    }
  };

  const handleSaveWallets = async () => {
    console.log('Save attempt with state:', {
      isAuthenticated,
      hasProvider: !!provider,
      hasWeb3Auth: !!web3auth,
      hasPoolData: !!poolData,
    });

    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please connect your wallet and try again.',
        severity: 'error'
      });
      return;
    }

    if (!web3auth || !provider) {
      setSnackbar({
        open: true,
        message: 'Web3Auth initialization incomplete. Please refresh the page.',
        severity: 'error'
      });
      return;
    }

    if (!poolData) {
      setSnackbar({
        open: true,
        message: 'Pool data not available',
        severity: 'error'
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Check user info before processing
      const userInfo = await web3auth.getUserInfo();
      console.log('User info before processing:', {
        hasEmail: !!userInfo?.email,
        verifier: userInfo?.verifier
      });

      const walletsToSave = await Promise.all(
        wallets.map(async (wallet, index) => {
          const encryptedPrivateKey = await encryptPrivateKey(wallet.privateKey);
          console.log(`Encrypted wallet ${index + 1}`);

          return {
            wallet_name: `${poolData.token_a_symbol}/${poolData.token_b_symbol} Wallet ${index + 1}`,
            pool_name: `${poolData.token_a_symbol}/${poolData.token_b_symbol}`,
            pool_address: poolData.pool_address,
            public_key: wallet.wallet_address,
            private_key: encryptedPrivateKey,
            token_mint: poolData.token_a_address,
            token_symbol: poolData.token_a_symbol,
            token_decimals: poolData.token_a_decimals,
            status: 'ACTIVE',
            risk_level: 'LOW',
            is_test_wallet: false,
            created_by: `Wallet Import - ${new Date().toISOString()}`
          };
        })
      );

      console.log('All wallets encrypted, saving to database...');

      const response = await fetch('/api/manage-wallet/insert-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallets: walletsToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save wallets');
      }

      const result = await response.json();
      console.log('Save result:', result);

      setSnackbar({
        open: true,
        message: `Successfully saved ${walletsToSave.length} wallets`,
        severity: 'success'
      });
      
      setTimeout(() => {
        router.push('/manage-wallet');
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save wallets: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        bgcolor: theme.palette.background.default,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease-in-out'
      }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={0} sx={{
            p: 4,
            borderRadius: 2,
            mb: 4,
            boxShadow: theme.shadows[6]
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/manage-wallet')}
                sx={{ mr: 2 }}
              >
                Back to List
              </Button>
              <Typography variant="h4" fontWeight={600} color="primary">
                Import Wallets
              </Typography>
              <Box sx={{ width: 40 }} />
            </Box>

            {isLoadingPool ? (
              <Box sx={{ width: '100%', mt: 4 }}>
                <LinearProgress />
              </Box>
            ) : poolData ? (
              <>
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">
                          {poolData.token_a_symbol}/{poolData.token_b_symbol} Pool
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pool Address: {poolData.pool_address}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1">
                          Liquidity: {formatUSD(poolData.liquidity_usd)}
                        </Typography>
                        <Chip
                          label={poolData.status}
                          color={poolData.status === 'ACTIVE' ? 'success' : 'error'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color={isAuthenticated ? 'success.main' : 'error.main'}>
                    Wallet Status: {isAuthenticated ? 'Connected' : 'Not Connected'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Provider: {provider ? 'Available' : 'Not Available'} | 
                    Web3Auth: {web3auth ? 'Initialized' : 'Not Initialized'}
                  </Typography>
                </Box>
              </>
            ) : (
              <Alert severity="error" sx={{ mb: 4 }}>
                Failed to load pool data
              </Alert>
            )}

            <Box sx={{ 
              mt: 4, 
              p: 4, 
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="wallet-file-upload"
              />
              <label htmlFor="wallet-file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={isProcessing || !poolData || !isAuthenticated}
                >
                  Upload Wallet JSON
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
            </Box>

            {wallets.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Loaded Wallets: {wallets.length}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveWallets}
                  disabled={!poolData || isProcessing || !isAuthenticated}
                  sx={{ mt: 2 }}
                >
                  {isProcessing ? 'Saving...' : 'Save Wallets'}
                </Button>
              </Box>
            )}

            {isProcessing && (
              <Box sx={{ width: '100%', mt: 4 }}>
                <LinearProgress />
              </Box>
            )}
          </Paper>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}