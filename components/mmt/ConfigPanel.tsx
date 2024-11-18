import React, { useState, useEffect } from 'react';
import { 
  Box,
  TextField,
  Button,
  Typography,
  Slider,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import { Settings2, Save, RefreshCw } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

const ConfigPanel = ({ tokenPair }) => {
  const theme = useTheme();
  const { publicKey, network } = useWallet();
  const [config, setConfig] = useState({
    bidSpread: 0.1,
    askSpread: 0.1,
    orderSize: 100,
    minOrderInterval: 30,
    maxExposure: 1000,
    rebalanceThreshold: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tokenPair && publicKey) {
      loadConfig();
    }
  }, [tokenPair, publicKey]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mmt/config?tokenPair=${tokenPair}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (err) {
      setError('Failed to load configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!tokenPair) {
      setError('Please select a token pair first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/mmt/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenPair,
          ...config
        })
      });

      if (!response.ok) throw new Error('Failed to save configuration');
      
      // 성공 메시지를 error state를 사용해 표시 (녹색으로)
      setError('success:Configuration saved successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = error.startsWith('success:');
  const errorMessage = isSuccess ? error.substring(8) : error;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          color: 'text.primary'
        }}>
          <Settings2 size={20} />
          Market Making Configuration
        </Typography>
        <Button
          variant="outlined"
          onClick={loadConfig}
          disabled={loading}
          startIcon={<RefreshCw size={18} />}
          sx={{ color: 'primary.main' }}
        >
          Refresh
        </Button>
      </Box>

      <Divider />

      {error && (
        <Alert 
          severity={isSuccess ? "success" : "error"}
          onClose={() => setError('')}
          sx={{ 
            bgcolor: isSuccess 
              ? theme.palette.success.light 
              : theme.palette.error.light
          }}
        >
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 2 
        }}>
          <TextField
            label="Bid Spread (%)"
            type="number"
            value={config.bidSpread}
            onChange={(e) => setConfig({
              ...config,
              bidSpread: parseFloat(e.target.value) || 0
            })}
            InputProps={{ 
              inputProps: { min: 0, step: 0.1 },
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                color: 'text.primary',
                '& fieldset': {
                  borderColor: 'divider'
                }
              }
            }}
            fullWidth
          />

          <TextField
            label="Ask Spread (%)"
            type="number"
            value={config.askSpread}
            onChange={(e) => setConfig({
              ...config,
              askSpread: parseFloat(e.target.value) || 0
            })}
            InputProps={{ 
              inputProps: { min: 0, step: 0.1 }
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                color: 'text.primary',
                '& fieldset': {
                  borderColor: 'divider'
                }
              }
            }}
            fullWidth
          />
        </Box>

        <TextField
          label="Order Size"
          type="number"
          value={config.orderSize}
          onChange={(e) => setConfig({
            ...config,
            orderSize: parseFloat(e.target.value) || 0
          })}
          InputProps={{ 
            inputProps: { min: 0 }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              color: 'text.primary',
              '& fieldset': {
                borderColor: 'divider'
              }
            }
          }}
          fullWidth
        />

        <Box sx={{ width: '100%' }}>
          <Typography gutterBottom color="text.primary">
            Min Order Interval (seconds): {config.minOrderInterval}
          </Typography>
          <Slider
            value={config.minOrderInterval}
            onChange={(_, value) => setConfig({
              ...config,
              minOrderInterval: value as number
            })}
            min={1}
            max={300}
            valueLabelDisplay="auto"
            sx={{
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                bgcolor: 'primary.main'
              },
              '& .MuiSlider-track': {
                bgcolor: 'primary.main'
              },
              '& .MuiSlider-rail': {
                bgcolor: 'primary.light'
              }
            }}
          />
        </Box>

        <TextField
          label="Max Exposure"
          type="number"
          value={config.maxExposure}
          onChange={(e) => setConfig({
            ...config,
            maxExposure: parseFloat(e.target.value) || 0
          })}
          InputProps={{ 
            inputProps: { min: 0 }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              color: 'text.primary',
              '& fieldset': {
                borderColor: 'divider'
              }
            }
          }}
          fullWidth
        />

        <TextField
          label="Rebalance Threshold (%)"
          type="number"
          value={config.rebalanceThreshold}
          onChange={(e) => setConfig({
            ...config,
            rebalanceThreshold: parseFloat(e.target.value) || 0
          })}
          InputProps={{ 
            inputProps: { min: 0, step: 0.1 }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              color: 'text.primary',
              '& fieldset': {
                borderColor: 'divider'
              }
            }
          }}
          fullWidth
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          onClick={saveConfig}
          disabled={loading || !publicKey}
          startIcon={<Save size={18} />}
          sx={{ 
            width: { xs: '100%', md: 'auto' },
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          Save Configuration
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigPanel;